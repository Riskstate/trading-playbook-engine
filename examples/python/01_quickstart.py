"""Quickstart: pull the playbook feed and print the registry size and the setups
actively firing for an asset. No API key needed.

    python examples/python/01_quickstart.py BTC

Docs: https://riskstate.ai/docs/playbook-engine
"""

import sys

from riskstate_trading_playbook import PlaybookClient

asset = (sys.argv[1] if len(sys.argv) > 1 else "BTC").upper()
client = PlaybookClient()

data = client.get()
if data["source"] != "live":
    print("Feed unavailable right now — try again shortly.")
    raise SystemExit(0)

print(f"{data['count']} playbooks in the registry.\n")

firing = client.firing_now(data, asset)
if not firing:
    print(f"No setup actively firing on {asset} — the strategist is idle.")
else:
    by_id = {p["id"]: p for p in data["playbooks"]}
    print(f"Firing now on {asset}:")
    for f in firing:
        pb = by_id.get(f["playbook_id"], {})
        conv = "—" if f["size_pct_nav"] is None else f"{f['size_pct_nav']}% NAV"
        print(
            f"  • {pb.get('name', f['playbook_id'])} ({pb.get('side', '?')}) — "
            f"nav {f['structure_gate']['vote']}, gate {f['gate_status']}, conviction {conv}"
        )
