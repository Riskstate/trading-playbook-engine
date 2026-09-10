# Trading Playbook Engine

**Is there a setup worth trading right now?** A read-only HTTP engine that holds a
registry of **pre-defined, locked playbooks** and tells you which are **firing now**
for BTC/USD and ETH/USD — each annotated with the navigator's structural vote
(`ALIGN` / `NEUTRAL` / `CONFLICT`) and the risk gate's verdict.

This repository is the open **integration kit**: a typed client (TypeScript +
Python), the full response types, runnable examples, and a sample fixture. The
engine runs server-side; it exposes **strategy and relative conviction only** —
**no positions, NAV, or dollar amounts**.

> **Part of [RiskState](https://riskstate.ai)** — composable, pre-trade
> infrastructure for crypto (BTC/USD, ETH/USD). RiskState is **three independent
> engines**, each usable on its own:
>
> | Engine | Role | Answers | Repo |
> |---|---|---|---|
> | Risk Engine | Governor | *how much is allowed?* | [docs](https://riskstate.ai/docs/api) · [MCP](https://github.com/Riskstate/mcp) |
> | Market Structure Engine | Navigator | *are we near an inflection?* | [market-structure-engine](https://github.com/Riskstate/market-structure-engine) |
> | **▸ Trading Playbook Engine** *(this repo)* | **Strategist** | ***is there a setup I trade?*** | you are here |
>
> Compose them and you get a complete pre-trade question — *what is the setup, is
> the terrain right, and how much is permitted* — but each stands alone.

**Live viewer:** https://api.riskstate.ai/playbook · **Docs:** https://riskstate.ai/docs/playbook-engine

---

## No key required

Unlike the other two engines, `/api/playbook-data` is **public and read-only** —
you can hit it right now, from anywhere, with no signup:

```bash
curl https://api.riskstate.ai/api/playbook-data
```

It returns the strategy registry plus what is firing per asset. There is **no
money in it by design** — it is the strategist surface, not a fund dashboard.

## What it gives you

- **Strategy registry** — every locked playbook with its `thesis`, `side`, `asset`,
  `class`, `priority`, `horizon`, `cooldown`, and its **sizing and exit rules**
  (as rules, never dollar amounts).
- **Firing now** — per asset, which setups currently fire, each with:
  - `would_fire` — the playbook's own conditions match the live data,
  - `structure_gate` — the navigator's vote (`ALIGN` / `NEUTRAL` / `CONFLICT`),
  - `gate_status` — the risk gate's verdict (e.g. `ALLOW` / `RESIZE`),
  - `size_pct_nav` — proposed conviction as a % of NAV (relative only),
  - `fire_blocked_by` — `"cooldown"`, `"predicate"`, or `null` when it fires,
  - `cooldown` — alert-cadence state (`locked`, `seconds_remaining`, …),
  - `failed_predicates` — up to 3 conditions that do not match, with actuals,
  - `intent` — the trade-intent SHAPE (action, bracket type, level provenance).

A setup is **actionable** when `would_fire` is true, it is neither `suppressed`
nor `structure_blocked`, **and** `fire_blocked_by` is `null`.

That last condition matters more than it looks. A setup whose conditions still
match can already have alerted, and it then sits in cooldown: firing by
predicate, but not something to act on again. `firingNow()` / `firing_now()`
apply all four checks. Before 0.2.0 they applied only the first three and
returned cooldown-locked setups as if they were actionable.

## Install

```bash
# TypeScript / Node
npm install @riskstate/trading-playbook-engine

# Python
pip install riskstate-trading-playbook
```

## Quickstart — TypeScript

```ts
import { PlaybookClient } from "@riskstate/trading-playbook-engine";

const client = new PlaybookClient(); // no key needed

const data = await client.get();
console.log(`${data.count} playbooks in the registry (source: ${data.source})`);

for (const f of client.firingNow(data, "BTC")) {
  console.log(`firing: ${f.playbook_id} — nav ${f.structure_gate.vote}, gate ${f.gate_status}`);
}
```

## Quickstart — Python

```python
from riskstate_trading_playbook import PlaybookClient

client = PlaybookClient()  # no key needed
data = client.get()
print(f"{data['count']} playbooks (source: {data['source']})")

for f in client.firing_now(data, "BTC"):
    print(f"firing: {f['playbook_id']} — nav {f['structure_gate']['vote']}, gate {f['gate_status']}")
```

## Develop offline (no network)

`fixtures/sample.json` is a complete, illustrative response you can load directly
to build your rendering / alerting before going live:

```ts
import sample from "@riskstate/trading-playbook-engine/fixtures/sample.json";
```

## Examples

| Example | What it shows |
|---|---|
| `examples/ts/01-quickstart.ts` / `python/01_quickstart.py` | Pull the feed, print registry size + firing setups |
| `examples/ts/02-render-registry.ts` / `python/02_render_registry.py` | Print the full strategy registry (thesis, side, sizing/exit rules) |
| `examples/ts/03-watch-firing-alert.ts` / `python/03_watch_firing_alert.py` | Poll and alert when a setup *starts* actively firing |

## Response shape (summary)

```jsonc
{
  "ok": true,
  "schema": "playbook_view_v1",
  "source": "live",                 // "live" | "unavailable"
  "count": 3,
  "playbooks": [ /* PlaybookDefinition[] — see src/types.ts */ ],
  "firing": {
    "BTC": [ /* FiringResult[] */ ],
    "ETH": [ /* FiringResult[] */ ]
  }
}
```

Full, exact types in [`src/types.ts`](src/types.ts).

## Notes & limits

- **Degrades gracefully.** If the upstream feed is unreachable the endpoint returns
  `source: "unavailable"` with empty arrays (a clean empty state) — check it before
  rendering. Responses are cached ~90s.
- **Strategy only.** No positions, NAV, or dollar amounts are ever returned —
  sizing is expressed as rules and relative conviction (% of NAV).
- **Browser use.** CORS is restricted to RiskState origins; from your own web app,
  proxy the call through your backend (server-to-server has no Origin restriction).
- **Not advice.** This is strategy information, USD-denominated. You own the trade.

## License

[MIT](LICENSE) — the client and examples are free to use and modify. The engine
(playbook registry, firing logic, track record) runs server-side and is not
included.
