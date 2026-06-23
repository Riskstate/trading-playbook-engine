# riskstate-trading-playbook (Python)

Python client for the **RiskState Trading Playbook Engine** (the *strategist* —
*is there a setup I trade?*). One of three composable RiskState engines.
**Public, no key.**

Full project docs, examples, and the TypeScript client:
https://github.com/likidodefi/trading-playbook-engine ·
https://riskstate.ai/docs/playbook-engine

```python
from riskstate_trading_playbook import PlaybookClient

client = PlaybookClient()           # no key needed
data = client.get()
print(data["count"], "playbooks (source:", data["source"], ")")

for f in client.firing_now(data, "BTC"):
    print(f["playbook_id"], "→ nav", f["structure_gate"]["vote"], "gate", f["gate_status"])
```

License: MIT
