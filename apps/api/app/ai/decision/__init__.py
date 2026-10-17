"""Deterministic decision layer and safe fallback module for Admission X AI.

Follows docs/ai/phase-1/decision-matrix.md, docs/ai/phase-1/response-contract.md,
and docs/ai/phase-1/agent-state-execution-policy.md.
"""

from app.ai.decision.engine import DecisionEngine
from app.ai.decision.fallback import FallbackReasonCode, get_safe_fallback_text
from app.ai.decision.mappings import assemble_response_envelope
from app.ai.decision.models import DecisionAction, DecisionResult

__all__ = [
    "DecisionAction",
    "DecisionEngine",
    "DecisionResult",
    "FallbackReasonCode",
    "assemble_response_envelope",
    "get_safe_fallback_text",
]
