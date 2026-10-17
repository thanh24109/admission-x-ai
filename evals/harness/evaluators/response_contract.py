"""Response envelope contract evaluator for Admission X AI.

Follows Phase 1 Task 5 Section 8.6.
Checks schema validity, enum consistency, and envelope invariants.
"""

from __future__ import annotations

from app.schemas.response_envelope import (
    AIResponseEnvelope,
    AnswerStatus,
)


def evaluate_response_contract_compliance(
    envelope: AIResponseEnvelope,
) -> list[str]:
    """Verify that an AIResponseEnvelope conforms to contract invariants.

    Returns:
        List of failure reasons (empty if compliant).
    """
    failures: list[str] = []

    # Invariant 1: AnswerStatus.ANSWERED requires non-empty answer text
    if envelope.answer_status == AnswerStatus.ANSWERED and not envelope.answer.strip():
        failures.append("Envelope has answer_status=ANSWERED but empty answer content")

    # Invariant 2: Ticket ID must remain None in Phase 1
    if envelope.handover.ticket_id is not None:
        failures.append("Envelope handover ticket_id is populated in Phase 1")

    return failures
