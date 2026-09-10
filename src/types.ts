// Type definitions for the RiskState Trading Playbook Engine response.
// GET https://api.riskstate.ai/api/playbook-data  (public, no auth)
//
// The engine runs server-side; these types mirror the live response. The feed
// exposes strategy IP only — no positions, NAV, or dollar amounts.

export type Asset = "BTC" | "ETH";
/** Setup direction. LONG/SHORT open exposure; TRIM is a defensive reduce; DCA a
 *  phased accumulate. (The API returns these upper-cased.) */
export type Side = "LONG" | "SHORT" | "TRIM" | "DCA";

/** Lifecycle status. Only `draft`/`live` specs are evaluated and returned;
 *  `paused`/`retired` are excluded. The public viewer shows `draft` as "tracked". */
export type PlaybookStatus = "draft" | "live" | "paused" | "retired";

/** Navigator (Structure Engine) vote on a firing setup. */
export type StructureVote = "ALIGN" | "NEUTRAL" | "CONFLICT";

/** RiskState risk-gate verdict on a firing setup. */
export type GateStatus = "ALLOW" | "RESIZE" | "BLOCK" | "INDETERMINATE";

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
  status?: PlaybookStatus;
  thesis?: string;
  priority?: number;
  horizon_days?: number;
  cooldown_hours?: number;
  sizing?: Sizing;
  exits?: Exits;
}

/** A live evaluation of one playbook for one asset (money fields stripped). */
/** Why a matching setup did not fire this tick. `null` = it fires. */
export type FireBlocker = "cooldown" | "predicate";

/**
 * The ENGINE's alert cadence — not a position. A setup whose predicate still
 * matches can be locked because the alert already went out.
 */
export interface CooldownState {
  locked: boolean;
  /** Unix epoch SECONDS of the last alert. */
  last_fire_ts: number | null;
  /** Unix epoch SECONDS at which the lock lifts. */
  locked_until_ts: number | null;
  seconds_remaining: number | null;
}

/** A condition that does NOT match right now. Actuals are public market readings. */
export interface FailedPredicate {
  field: string | null;
  op: string | null;
  expected: string | number | boolean | Array<string | number> | null;
  actual: string | number | boolean | Array<string | number> | null;
}

/**
 * The SHAPE of the trade intent — never prices or sizes in currency.
 * `levels_source` says whether exits came from real structure or the
 * geometric fallback.
 */
export interface IntentShape {
  action: string | null;
  exits_type: string | null;
  levels_source: string | null;
}

export interface FiringResult {
  playbook_id: string;
  /** The playbook's own conditions match the live data. */
  would_fire: boolean;
  /** The navigator (Structure Engine) vetoed it. */
  structure_blocked: boolean;
  /** Suppressed by resolution (e.g. a higher-priority setup won). */
  suppressed: boolean;
  /** Which playbook won instead. Present since schema playbook_view_v2. */
  suppressed_by?: string | null;
  /**
   * Why a matching setup is not firing. `null` means it fires this tick.
   * Present since playbook_view_v2 — without it, a setup whose predicate still
   * matches but that already alerted reads as if it were actionable.
   */
  fire_blocked_by?: FireBlocker | null;
  /** Alert-cadence state. Present since playbook_view_v2. */
  cooldown?: CooldownState | null;
  /** Up to 3 conditions that do not match. Present since playbook_view_v2. */
  failed_predicates?: FailedPredicate[];
  /** Intent shape only. Present since playbook_view_v2. */
  intent?: IntentShape | null;
  structure_gate: { vote: StructureVote | null; reason: string | null };
  /** Risk-gate verdict. null if not evaluated. A setup can be firing yet gate-blocked —
   *  performance is tracked both with and without the gate. */
  gate_status: GateStatus | null;
  /** Proposed conviction as a % of NAV — relative only, never a dollar figure. */
  size_pct_nav: number | null;
}

export interface PlaybookResponse {
  ok: boolean;
  schema: "playbook_view_v2";
  source: "live" | "unavailable";
  /** Number of ACTIVE playbooks (paused/retired excluded). */
  count: number;
  /** Epoch ms at which THIS feed was built (proxy cache stamp). */
  generated_at?: number;
  /** ISO timestamp of the upstream daemon evaluation — shared with the cockpit feed so
   *  the two surfaces stay in sync. Present on a live response. */
  evaluated_at?: string;
  playbooks: PlaybookDefinition[];
  firing: { BTC: FiringResult[]; ETH: FiringResult[] };
}
