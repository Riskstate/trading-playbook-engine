// Render the full strategy registry — thesis, side, horizon, and the sizing /
// exit rules for every locked playbook. No API key needed.
//
//   npx tsx examples/ts/02-render-registry.ts
//
// Docs: https://riskstate.ai/docs/playbook-engine

import { PlaybookClient, type Exits, type Sizing } from "@riskstate/trading-playbook-engine";

const client = new PlaybookClient();
const data = await client.get();

function sizingLine(s?: Sizing): string {
  if (!s) return "—";
  const parts: string[] = [];
  if (s.fraction_of_api_max != null)
    parts.push(`${Math.round(s.fraction_of_api_max * 100)}% of RiskState max`);
  if (s.scale_in?.tranches)
    parts.push(`scale-in ${s.scale_in.tranches}×` + (s.scale_in.spacing_pct ? ` @ ${s.scale_in.spacing_pct.join("/")}%` : ""));
  return parts.join(" · ") || "—";
}

function exitsLine(x?: Exits): string {
  if (!x) return "—";
  const parts: string[] = [];
  if (x.type) parts.push(x.type);
  if (x.stop) parts.push(`stop ${x.stop.structural?.ref ?? ""}${x.stop.fallback_pct != null ? ` (fallback ${x.stop.fallback_pct}%)` : ""}`.trim());
  if (x.targets?.length)
    parts.push("targets " + x.targets.map((t) => t.structural?.ref ?? t.label ?? (t.fallback_rr != null ? `RR${t.fallback_rr}` : "?")).join(" → "));
  return parts.join(" · ") || "—";
}

console.log(`Strategy registry — ${data.count} playbooks\n`);
for (const p of data.playbooks) {
  console.log(`${p.name ?? p.id}  [${p.side ?? "?"} · ${p.asset ?? "?"} · ${p.class ?? "?"}]`);
  if (p.thesis) console.log(`  ${p.thesis}`);
  console.log(`  priority ${p.priority ?? "—"} · horizon ${p.horizon_days ?? "—"}d · cooldown ${p.cooldown_hours ?? "—"}h`);
  console.log(`  sizing: ${sizingLine(p.sizing)}`);
  console.log(`  exits:  ${exitsLine(p.exits)}\n`);
}
