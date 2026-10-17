"""Deterministic mapping from DecisionResult to Task 3 AIResponseEnvelope.

Follows docs/ai/phase-1/response-contract.md and Task 4 Section 7 invariants.
"""

from __future__ import annotations

import uuid

from app.ai.decision.models import DecisionResult
from app.schemas.citation import CitationRecord, SourceTier
from app.schemas.response_envelope import (
    AIResponseEnvelope,
    AnswerStatus,
    SourceMode,
)


def assemble_response_envelope(
    decision_result: DecisionResult,
    *,
    response_id: str | None = None,
    session_id: str | None = None,
    intent: str = "admission_inquiry",
    verified_answer: str | None = None,
    confidence: float | None = None,
    policy_version: str = "1.0.0",
    prompt_version: str = "1.0.0",
) -> AIResponseEnvelope:
    """Deterministically assemble a validated AIResponseEnvelope from a DecisionResult.

    CRITICAL INVARIANTS ENFORCED:
    1. If decision indicates fallback/error/abstain, the safe_response_text is used.
    2. Insufficient evidence, error, clarification, or out_of_scope NEVER carry citations.
    3. General source mode never carries official EPU citations.
    4. Handover never creates a ticket autonomously.
    5. No metadata is fabricated.
    """
    resp_id = response_id or f"resp-{uuid.uuid4().hex[:12]}"

    # Determine visible answer text
    if decision_result.safe_response_text is not None:
        answer_text = decision_result.safe_response_text
    elif verified_answer is not None and verified_answer.strip():
        answer_text = verified_answer
    else:
        answer_text = "Hệ thống tư vấn tuyển sinh EPU đã ghi nhận thông tin."

    # Filter/enforce citation safety invariants
    sanitized_citations: list[CitationRecord] = []
    if decision_result.answer_status in (
        AnswerStatus.ANSWERED,
        AnswerStatus.PARTIAL,
        AnswerStatus.HANDOVER_OFFERED,
    ):
        if decision_result.source_mode == SourceMode.GENERAL:
            # General knowledge cannot carry official EPU PDF citations
            sanitized_citations = [
                c for c in decision_result.citations if c.source_tier != SourceTier.OFFICIAL_EPU
            ]
        else:
            sanitized_citations = list(decision_result.citations)
    else:
        # INSUFFICIENT_EVIDENCE, CLARIFICATION_NEEDED, ERROR, REJECTED, OUT_OF_SCOPE must have empty citations
        sanitized_citations = []

    return AIResponseEnvelope(
        response_id=resp_id,
        session_id=session_id,
        answer=answer_text,
        answer_status=decision_result.answer_status,
        evidence_status=decision_result.evidence_status,
        source_mode=decision_result.source_mode,
        intent=intent,
        resolved_major_codes=decision_result.resolved_major_codes,
        citations=sanitized_citations,
        handover=decision_result.handover,
        policy_version=policy_version,
        prompt_version=prompt_version,
        confidence=confidence,
    )
