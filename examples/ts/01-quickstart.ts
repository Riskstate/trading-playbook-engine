// Quickstart: pull the playbook feed and print the registry size and the setups
// actively firing for an asset. No API key needed.
//
//   npx tsx examples/ts/01-quickstart.ts BTC
//
// Docs: https://riskstate.ai/docs/playbook-engine

import { PlaybookClient } from "@riskstate/trading-playbook-engine";

const asset = (process.argv[2] ?? "BTC").toUpperCase() as "BTC" | "ETH";
const client = new PlaybookClient();

const data = await client.get();
if (data.source !== "live") {
  console.log("Feed unavailable right now — try again shortly.");
  process.exit(0);
}

console.log(`${data.count} playbooks in the registry.\n`);

const firing = client.firingNow(data, asset);
if (firing.length === 0) {
  console.log(`No setup actively firing on ${asset} — the strategist is idle.`);
} else {
  console.log(`Firing now on ${asset}:`);
  for (const f of firing) {
    const pb = data.playbooks.find((p) => p.id === f.playbook_id);
    const conv = f.size_pct_nav == null ? "—" : `${f.size_pct_nav}% NAV`;
    console.log(
      `  • ${pb?.name ?? f.playbook_id} (${pb?.side ?? "?"}) — nav ${f.structure_gate.vote}, gate ${f.gate_status}, conviction ${conv}`,
    );
  }
}
