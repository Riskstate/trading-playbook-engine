// Type definitions for the RiskState Trading Playbook Engine response.
// GET https://api.riskstate.ai/api/playbook-data  (public, no auth)
//
// The engine runs server-side; these types mirror the live response. The feed
// exposes strategy IP only — no positions, NAV, or dollar amounts.

export type Asset = "BTC" | "ETH";
export type Side = "long" | "short";

/** Navigator (Structure Engine) vote on a firing setup. */
export type StructureVote = "ALIGN" | "NEUTRAL" | "CONFLICT";

export interface ScaleIn {
  tranches: number;
  /** % spacing of each tranche from the trigger (e.g. [0, 8, 15]). */
  spacing_pct?: number[];
}

/** Sizing expressed as RULES only — a fraction of the RiskState governed max,
 *  never a dollar amount. */
export interface Sizing {
  fraction_of_api_max?: number;
  scale_in?: ScaleIn;
}

export interface StructuralRef {
  ref: string;
}

export interface StopRule {
  structural?: StructuralRef;
  fallback_pct?: number;
}

export interface TargetRule {
  structural?: StructuralRef;
  fallback_rr?: number;
  exit_pct?: number;
  label?: string;
}

export interface Exits {
  type?: string;
  stop?: StopRule;
  targets?: TargetRule[];
}

/** A locked, pre-defined playbook in the registry. */
export interface PlaybookDefinition {
  id: string;
  name?: string;
  version?: string;
  class?: string;
  side?: Side;
  asset?: Asset;
  status?: string;
  thesis?: string;
  priority?: number;
  horizon_days?: number;
  cooldown_hours?: number;
  sizing?: Sizing;
  exits?: Exits;
}

/** A live evaluation of one playbook for one asset (money fields stripped). */
export interface FiringResult {
  playbook_id: string;
  /** The playbook's own conditions match the live data. */
  would_fire: boolean;
  /** The navigator (Structure Engine) vetoed it. */
  structure_blocked: boolean;
  /** Suppressed by resolution (e.g. a higher-priority setup won). */
  suppressed: boolean;
  structure_gate: { vote: StructureVote | null; reason: string | null };
  /** Risk-gate verdict, e.g. "ALLOW" | "RESIZE". null if not evaluated. */
  gate_status: string | null;
  /** Proposed conviction as a % of NAV — relative only, never a dollar figure. */
  size_pct_nav: number | null;
}

export interface PlaybookResponse {
  ok: boolean;
  schema: "playbook_view_v1";
  source: "live" | "unavailable";
  count: number;
  playbooks: PlaybookDefinition[];
  firing: { BTC: FiringResult[]; ETH: FiringResult[] };
}
