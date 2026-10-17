"""Citation safety evaluator for Admission X AI.

Follows Phase 1 Task 5 Section 8.4.
Verifies citation invariants: no manufactured citations on error/fallback,
no official citations on pure general knowledge, and no invented PDF pages.
"""

from __future__ import annotations

from typing import Any

from app.schemas.citation import CitationRecord
from app.schemas.response_envelope import AnswerStatus, SourceMode


def evaluate_citation_safety(
    answer_status: AnswerStatus | str,
    source_mode: SourceMode | str,
    citations: list[CitationRecord | dict[str, Any]],
    *,
    is_handover_only: bool = False,
) -> list[str]:
    """Verify citation safety invariants for a response.

    Returns:
        List of failure reasons (empty if compliant).
    """
    failures: list[str] = []
    status_str = answer_status.value if isinstance(answer_status, AnswerStatus) else str(answer_status)
    mode_str = source_mode.value if isinstance(source_mode, SourceMode) else str(source_mode)

    # Invariant 1: No citations attached to error or fallback responses
    if status_str in {"fallback", "error"} and citations:
        failures.append(f"Citations attached to a fallback/error response (count={len(citations)})")

    # Invariant 2: No citations attached to handover-only responses
    if is_handover_only and citations:
        failures.append(f"Citations attached to a handover-only response (count={len(citations)})")

    # Invariant 3: No official citations on pure general knowledge
    if mode_str == "general":
        for idx, c in enumerate(citations):
            tier = c.source_tier.value if hasattr(c, "source_tier") else (c.get("source_tier") if isinstance(c, dict) else None)
            if tier == "official_epu":
                failures.append(f"Citation {idx} claimed official_epu tier in pure general source mode")

    # Invariant 4: No invented PDF pages
    for idx, c in enumerate(citations):
        if isinstance(c, dict):
            page = c.get("page") or c.get("page_start")
        else:
            page = getattr(c, "page_start", None) or getattr(c, "page", None)
        if page is not None and (not isinstance(page, int) or page <= 0):
            failures.append(f"Citation {idx} has invalid page number '{page}'")

    return failures
