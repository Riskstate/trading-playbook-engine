"""Render the full strategy registry — thesis, side, horizon, and the sizing /
exit rules for every locked playbook. No API key needed.

    python examples/python/02_render_registry.py

Docs: https://riskstate.ai/docs/playbook-engine
"""

from __future__ import annotations

from riskstate_trading_playbook import PlaybookClient


def sizing_line(s: dict | None) -> str:
    if not s:
        return "—"
    parts = []
    if s.get("fraction_of_api_max") is not None:
        parts.append(f"{round(s['fraction_of_api_max'] * 100)}% of RiskState max")
    si = s.get("scale_in")
    if si and si.get("tranches"):
        spacing = si.get("spacing_pct")
        parts.append(f"scale-in {si['tranches']}×" + (f" @ {'/'.join(map(str, spacing))}%" if spacing else ""))
    return " · ".join(parts) or "—"


def exits_line(x: dict | None) -> str:
    if not x:
        return "—"
    parts = []
    if x.get("type"):
        parts.append(x["type"])
    stop = x.get("stop")
    if stop:
        ref = (stop.get("structural") or {}).get("ref", "")
        fb = f" (fallback {stop['fallback_pct']}%)" if stop.get("fallback_pct") is not None else ""
        parts.append(f"stop {ref}{fb}".strip())
    targets = x.get("targets") or []
    if targets:
        labels = [
            (t.get("structural") or {}).get("ref") or t.get("label") or (f"RR{t['fallback_rr']}" if t.get("fallback_rr") is not None else "?")
            for t in targets
        ]
        parts.append("targets " + " → ".join(labels))
    return " · ".join(parts) or "—"


client = PlaybookClient()
data = client.get()

print(f"Strategy registry — {data['count']} playbooks\n")
for p in data["playbooks"]:
    print(f"{p.get('name', p['id'])}  [{p.get('side', '?')} · {p.get('asset', '?')} · {p.get('class', '?')}]")
    if p.get("thesis"):
        print(f"  {p['thesis']}")
    print(f"  priority {p.get('priority', '—')} · horizon {p.get('horizon_days', '—')}d · cooldown {p.get('cooldown_hours', '—')}h")
    print(f"  sizing: {sizing_line(p.get('sizing'))}")
    print(f"  exits:  {exits_line(p.get('exits'))}\n")
