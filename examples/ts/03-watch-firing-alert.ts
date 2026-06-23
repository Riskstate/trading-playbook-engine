// Alert when a setup STARTS actively firing.
//
// Polls the feed and prints an alert the moment a playbook transitions into the
// actively-firing set for an asset (would_fire and not suppressed/blocked). Wire
// `alert()` to Telegram / Slack / a webhook in your own system.
//
//   npx tsx examples/ts/03-watch-firing-alert.ts BTC
//
// Docs: https://riskstate.ai/docs/playbook-engine

import { PlaybookClient } from "@riskstate/trading-playbook-engine";

const asset = (process.argv[2] ?? "BTC").toUpperCase() as "BTC" | "ETH";
const POLL_MS = 90_000;
const client = new PlaybookClient();

function alert(msg: string) {
  console.log(`🔔 ${new Date().toISOString()}  ${msg}`);
}

let firing = new Set<string>();

console.log(`Watching ${asset} playbooks every ${POLL_MS / 1000}s…`);
while (true) {
  try {
    const data = await client.get();
    if (data.source === "live") {
      const now = client.firingNow(data, asset);
      const ids = new Set(now.map((f) => f.playbook_id));
      for (const f of now) {
        if (!firing.has(f.playbook_id)) {
          const pb = data.playbooks.find((p) => p.id === f.playbook_id);
          alert(`${asset} setup firing: ${pb?.name ?? f.playbook_id} (${pb?.side ?? "?"}) — nav ${f.structure_gate.vote}, gate ${f.gate_status}`);
        }
      }
      firing = ids;
    }
  } catch (e) {
    console.error("fetch failed:", (e as Error).message);
  }
  await new Promise((r) => setTimeout(r, POLL_MS));
}
