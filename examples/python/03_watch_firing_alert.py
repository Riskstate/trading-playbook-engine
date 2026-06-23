"""Alert when a setup STARTS actively firing.

Polls the feed and prints an alert the moment a playbook transitions into the
actively-firing set for an asset (would_fire and not suppressed/blocked). Wire
`alert()` to Telegram / Slack / a webhook in your own system.

    python examples/python/03_watch_firing_alert.py BTC

Docs: https://riskstate.ai/docs/playbook-engine
"""

from __future__ import annotations

import sys
import time
from datetime import datetime, timezone

from riskstate_trading_playbook import PlaybookClient, PlaybookError

asset = (sys.argv[1] if len(sys.argv) > 1 else "BTC").upper()
POLL_S = 90
client = PlaybookClient()


def alert(msg: str) -> None:
    print(f"🔔 {datetime.now(timezone.utc).isoformat()}  {msg}")


firing: set[str] = set()

print(f"Watching {asset} playbooks every {POLL_S}s…")
while True:
    try:
        data = client.get()
        if data["source"] == "live":
            now = client.firing_now(data, asset)
            by_id = {p["id"]: p for p in data["playbooks"]}
            for f in now:
                if f["playbook_id"] not in firing:
                    pb = by_id.get(f["playbook_id"], {})
                    alert(
                        f"{asset} setup firing: {pb.get('name', f['playbook_id'])} "
                        f"({pb.get('side', '?')}) — nav {f['structure_gate']['vote']}, gate {f['gate_status']}"
                    )
            firing = {f["playbook_id"] for f in now}
    except PlaybookError as exc:
        print(f"fetch failed: {exc} (status {exc.status})")
    time.sleep(POLL_S)
