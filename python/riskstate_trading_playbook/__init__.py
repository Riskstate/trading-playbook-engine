"""RiskState Trading Playbook Engine — Python client.

A thin, dependency-free client for GET /api/playbook-data (public, no auth). The
engine runs server-side; this wraps the HTTP call and returns the parsed JSON.

    from riskstate_trading_playbook import PlaybookClient
    client = PlaybookClient()
    data = client.get()
    for f in client.firing_now(data, "BTC"):
        print(f["playbook_id"], f["structure_gate"]["vote"], f["gate_status"])

Docs: https://riskstate.ai/docs/playbook-engine
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Dict, List

__all__ = ["PlaybookClient", "PlaybookError"]
__version__ = "0.1.0"

DEFAULT_BASE_URL = "https://api.riskstate.ai"


class PlaybookError(Exception):
    def __init__(self, message: str, status: int) -> None:
        super().__init__(message)
        self.status = status


class PlaybookClient:
    def __init__(self, base_url: str = DEFAULT_BASE_URL, timeout: float = 15.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def get(self) -> Dict[str, Any]:
        """Fetch the registry + firing state. No key required."""
        req = urllib.request.Request(
            f"{self.base_url}/api/playbook-data",
            method="GET",
            headers={"Accept": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raise PlaybookError(f"HTTP {exc.code}", exc.code) from None
        except urllib.error.URLError as exc:
            raise PlaybookError(str(exc.reason), 0) from None

    @staticmethod
    def firing_now(data: Dict[str, Any], asset: str) -> List[Dict[str, Any]]:
        """The setups ACTUALLY actionable for an asset: the conditions match,
        no engine vetoed it, and it is not sitting in alert cooldown.

        The cooldown check landed in 0.2.0. Before that this returned setups
        whose predicate still matched but whose alert had already gone out --
        they read as actionable when they were not. On a pre-playbook_view_v2
        response ``fire_blocked_by`` is absent and this degrades to the old
        behaviour.
        """
        results = (data.get("firing") or {}).get(asset, [])
        return [
            f
            for f in results
            if f.get("would_fire")
            and not f.get("suppressed")
            and not f.get("structure_blocked")
            and not f.get("fire_blocked_by")
        ]
