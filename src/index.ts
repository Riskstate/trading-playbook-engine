// @riskstate/trading-playbook-engine — typed client for the RiskState
// Trading Playbook Engine (GET /api/playbook-data).
//
// Public, no auth. Dependency-free fetch wrapper (Node 18+, Bun, Deno; for
// browsers, proxy through your backend — CORS is restricted to RiskState origins).

import type { Asset, FiringResult, PlaybookResponse } from "./types.js";

export * from "./types.js";

export interface PlaybookClientOptions {
  /** Override the base URL. Defaults to https://api.riskstate.ai */
  baseUrl?: string;
  /** Per-request timeout in ms. Default 15000. */
  timeoutMs?: number;
}

export class PlaybookError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "PlaybookError";
  }
}

export class PlaybookClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opts: PlaybookClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? "https://api.riskstate.ai").replace(/\/$/, "");
    this.timeoutMs = opts.timeoutMs ?? 15000;
  }

  /** Fetch the registry + firing state. */
  async get(): Promise<PlaybookResponse> {
    const res = await fetch(`${this.baseUrl}/api/playbook-data`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) throw new PlaybookError(`HTTP ${res.status}`, res.status);
    return (await res.json()) as PlaybookResponse;
  }

  /** The setups ACTIVELY firing for an asset: would_fire and neither suppressed
   *  nor structure-blocked (i.e. all three engines agree). */
  firingNow(data: PlaybookResponse, asset: Asset): FiringResult[] {
    return (data.firing?.[asset] ?? []).filter(
      (f) => f.would_fire && !f.suppressed && !f.structure_blocked,
    );
  }
}
