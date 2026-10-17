"""Individual rule evaluators for RB-01 through RB-13.

Deterministic evaluations adhering strictly to docs/ai/phase-1/rulebase-v1.yaml
and docs/ai/phase-1/decision-matrix.md.
"""

from __future__ import annotations

import re
from typing import Any

from app.ai.config.policy_config import RulePriority
from app.ai.guardrails.commitment_guard import check_commitment
from app.ai.guardrails.injection import check_prompt_injection
from app.ai.guardrails.pii import detect_pii
from app.ai.rules.models import (
    PolicyEvaluationContext,
    RecommendedAction,
    RuleEvaluationResult,
    RuleOutcome,
)

# Regex to detect ungrounded numerical tuition, cutoff or quota assertions in draft answers
_RESTRICTED_NUMERICAL_ASSERTION = re.compile(
    r"(?:"
    r"\b\d{1,3}(?:\.\d{3})+\s*(?:đ|vnđ|đồng|nghìn|triệu)\b"
    r"|\b\d{2,3}(?:\.\d+)?\s*(?:nghìn|triệu)\b"
    r"|\bđiểm\s+chuẩn\s*(?:khoảng|từ|là|dao\s+động)?\s*\d{2}(?:\.\d+)?\b"
    r"|\bchỉ\s+tiêu\s*(?:là|khoảng)?\s*\d{2,4}\b"
    r")",
    re.IGNORECASE,
)


def evaluate_rb01_official_evidence(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-01: Require validated Tier 1 evidence for each material EPU claim."""
    is_epu_claim = context.source_mode == "official_epu" or context.intent in (
        "curriculum",
        "program_query",
        "admission_policy",
    )

    if not is_epu_claim:
        return RuleEvaluationResult(
            rule_id="RB-01",
            outcome=RuleOutcome.PASS,
            reason_code="NON_EPU_CLAIM",
            message="Rule RB-01 satisfied: Request is not an EPU-specific factual claim.",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.DIRECT_ANSWER,
        )

    if context.evidence_status == "verified" and context.evidence_items:
        return RuleEvaluationResult(
            rule_id="RB-01",
            outcome=RuleOutcome.PASS,
            reason_code="OFFICIAL_EVIDENCE_VERIFIED",
            message="Rule RB-01 satisfied: Verified Tier 1 evidence present for EPU claims.",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.DIRECT_ANSWER,
        )

    if context.evidence_status in ("missing", "none") or (
        context.evidence_items is not None and len(context.evidence_items) == 0
    ):
        return RuleEvaluationResult(
            rule_id="RB-01",
            outcome=RuleOutcome.FAIL,
            reason_code="OFFICIAL_EVIDENCE_MISSING",
            message="Rule RB-01 violation: Official EPU factual claim requested but verified evidence is missing.",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.SAFE_FALLBACK,
        )

    # When claim-level verification is pending or dependency not available
    return RuleEvaluationResult(
        rule_id="RB-01",
        outcome=RuleOutcome.NOT_EVALUABLE,
        reason_code="CLAIM_VERIFICATION_UNAVAILABLE",
        message="Rule RB-01 pending: Claim-level evidence verifier is not yet available; claim cannot be verified as official EPU evidence.",
        severity=RulePriority.CRITICAL,
        recommended_action=RecommendedAction.SAFE_FALLBACK,
    )


def evaluate_rb02_program_resolution(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-02: Resolve program identifiers against canonical records."""
    if context.resolved_major_codes is not None:
        if len(context.resolved_major_codes) == 1:
            return RuleEvaluationResult(
                rule_id="RB-02",
                outcome=RuleOutcome.PASS,
                reason_code="PROGRAM_RESOLVED",
                message=f"Rule RB-02 satisfied: Program resolved to canonical code '{context.resolved_major_codes[0]}'.",
                severity=RulePriority.HIGH,
                recommended_action=RecommendedAction.DIRECT_ANSWER,
            )
        if len(context.resolved_major_codes) == 0:
            return RuleEvaluationResult(
                rule_id="RB-02",
                outcome=RuleOutcome.FAIL,
                reason_code="PROGRAM_NOT_FOUND",
                message="Rule RB-02 violation: Requested program could not be resolved in canonical records.",
                severity=RulePriority.HIGH,
                recommended_action=RecommendedAction.CLARIFICATION_NEEDED,
            )

    return RuleEvaluationResult(
        rule_id="RB-02",
        outcome=RuleOutcome.NOT_EVALUABLE,
        reason_code="RESOLVER_NOT_RUN",
        message="Rule RB-02 pending: Program resolver dependency has not been executed.",
        severity=RulePriority.HIGH,
        recommended_action=RecommendedAction.SAFE_FALLBACK,
    )


def evaluate_rb03_ambiguous_program(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-03: Ask focused clarification when multiple programs match."""
    if context.resolved_major_codes is not None and len(context.resolved_major_codes) > 1:
        return RuleEvaluationResult(
            rule_id="RB-03",
            outcome=RuleOutcome.FAIL,
            reason_code="AMBIGUOUS_PROGRAM_MATCHES",
            message=f"Rule RB-03 violation: Ambiguous program query matched {len(context.resolved_major_codes)} programs.",
            severity=RulePriority.HIGH,
            recommended_action=RecommendedAction.CLARIFICATION_NEEDED,
        )

    return RuleEvaluationResult(
        rule_id="RB-03",
        outcome=RuleOutcome.PASS,
        reason_code="PROGRAM_UNAMBIGUOUS",
        message="Rule RB-03 satisfied: Query does not exhibit unhandled program ambiguity.",
        severity=RulePriority.HIGH,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )


def evaluate_rb04_restricted_claims(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-04: Prohibit unsupported assertions of tuition, cutoff, quota, deadline, scholarships."""
    if not context.draft_answer:
        return RuleEvaluationResult(
            rule_id="RB-04",
            outcome=RuleOutcome.PASS,
            reason_code="NO_DRAFT_ANSWER",
            message="Rule RB-04 satisfied: No draft answer asserting restricted claims.",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.DIRECT_ANSWER,
        )

    # Check if draft answer asserts specific figures without verified evidence
    has_numerical_claim = bool(_RESTRICTED_NUMERICAL_ASSERTION.search(context.draft_answer))
    if has_numerical_claim and context.evidence_status != "verified":
        return RuleEvaluationResult(
            rule_id="RB-04",
            outcome=RuleOutcome.FAIL,
            reason_code="UNSUPPORTED_RESTRICTED_CLAIM",
            message="Rule RB-04 violation: Draft answer asserts specific numerical tuition/cutoff figures without verified policy evidence.",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.SAFE_FALLBACK,
        )

    return RuleEvaluationResult(
        rule_id="RB-04",
        outcome=RuleOutcome.PASS,
        reason_code="RESTRICTED_CLAIMS_COMPLIANT",
        message="Rule RB-04 satisfied: No unsupported restricted admissions claims asserted.",
        severity=RulePriority.CRITICAL,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )


def evaluate_rb05_temporal_validity(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-05: Validate temporal applicability when claim depends on year/cohort."""
    if context.requested_admissions_year is None:
        return RuleEvaluationResult(
            rule_id="RB-05",
            outcome=RuleOutcome.PASS,
            reason_code="NO_YEAR_DEPENDENCY",
            message="Rule RB-05 satisfied: No specific temporal admissions year requested.",
            severity=RulePriority.HIGH,
            recommended_action=RecommendedAction.DIRECT_ANSWER,
        )

    evidence_year = context.extra_context.get("evidence_year")
    if evidence_year is None:
        return RuleEvaluationResult(
            rule_id="RB-05",
            outcome=RuleOutcome.NOT_EVALUABLE,
            reason_code="EVIDENCE_YEAR_UNKNOWN",
            message=f"Rule RB-05 pending: Requested year {context.requested_admissions_year} cannot be verified against source metadata.",
            severity=RulePriority.HIGH,
            recommended_action=RecommendedAction.SAFE_FALLBACK,
        )

    if evidence_year != context.requested_admissions_year:
        return RuleEvaluationResult(
            rule_id="RB-05",
            outcome=RuleOutcome.FAIL,
            reason_code="TEMPORAL_MISMATCH",
            message=f"Rule RB-05 violation: Evidence year ({evidence_year}) does not match requested year ({context.requested_admissions_year}).",
            severity=RulePriority.HIGH,
            recommended_action=RecommendedAction.SAFE_FALLBACK,
        )

    return RuleEvaluationResult(
        rule_id="RB-05",
        outcome=RuleOutcome.PASS,
        reason_code="TEMPORAL_VALIDITY_CONFIRMED",
        message=f"Rule RB-05 satisfied: Temporal alignment confirmed for year {context.requested_admissions_year}.",
        severity=RulePriority.HIGH,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )


def evaluate_rb06_citation_validity(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-06: Validate document identity, allowed source, chunk ID and page span."""
    if context.citation_items:
        for idx, cite in enumerate(context.citation_items):
            doc_id: Any = (
                cite.get("document_id")
                if isinstance(cite, dict)
                else getattr(cite, "document_id", None)
            )
            page_start: Any = (
                cite.get("page_start")
                if isinstance(cite, dict)
                else getattr(cite, "page_start", None)
            )

            # Detect synthetic citations without valid document identity or page
            if not doc_id or (page_start is not None and page_start < 1):
                return RuleEvaluationResult(
                    rule_id="RB-06",
                    outcome=RuleOutcome.FAIL,
                    reason_code="SYNTHETIC_CITATION_DETECTED",
                    message=f"Rule RB-06 violation: Citation at index {idx} lacks valid document_id or has invalid page_start.",
                    severity=RulePriority.CRITICAL,
                    recommended_action=RecommendedAction.SAFE_FALLBACK,
                )

        if not context.extra_context.get("citations_verified"):
            return RuleEvaluationResult(
                rule_id="RB-06",
                outcome=RuleOutcome.NOT_EVALUABLE,
                reason_code="CITATION_VERIFIER_PENDING",
                message="Rule RB-06 pending: Official citations emitted but full claim-level verifier is not configured.",
                severity=RulePriority.CRITICAL,
                recommended_action=RecommendedAction.SAFE_FALLBACK,
            )

        return RuleEvaluationResult(
            rule_id="RB-06",
            outcome=RuleOutcome.PASS,
            reason_code="CITATIONS_VALIDATED",
            message="Rule RB-06 satisfied: Emitted citations verified against allowed catalog.",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.DIRECT_ANSWER,
        )

    # If official claims are asserted in draft answer, citations are required
    if context.source_mode == "official_epu" and context.draft_answer:
        return RuleEvaluationResult(
            rule_id="RB-06",
            outcome=RuleOutcome.FAIL,
            reason_code="MISSING_MANDATORY_CITATION",
            message="Rule RB-06 violation: Official EPU answer asserted without supporting citations.",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.SAFE_FALLBACK,
        )

    return RuleEvaluationResult(
        rule_id="RB-06",
        outcome=RuleOutcome.PASS,
        reason_code="NO_CITATIONS_REQUIRED",
        message="Rule RB-06 satisfied: No citations required for non-official response.",
        severity=RulePriority.CRITICAL,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )


def evaluate_rb07_partial_evidence(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-07: Answer supported part and identify missing part when evidence is partial."""
    if context.evidence_status == "partial":
        return RuleEvaluationResult(
            rule_id="RB-07",
            outcome=RuleOutcome.PASS,
            reason_code="PARTIAL_EVIDENCE_RECOGNIZED",
            message="Rule RB-07 satisfied: Partial evidence recognized; partial answer required.",
            severity=RulePriority.HIGH,
            recommended_action=RecommendedAction.PARTIAL_ANSWER,
        )

    return RuleEvaluationResult(
        rule_id="RB-07",
        outcome=RuleOutcome.PASS,
        reason_code="EVIDENCE_STATUS_NOT_PARTIAL",
        message="Rule RB-07 satisfied: Request does not exhibit partial evidence state.",
        severity=RulePriority.HIGH,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )


def evaluate_rb08_general_knowledge(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-08: Label general knowledge, avoid EPU attribution and fabricated citations."""
    if context.source_mode == "general":
        if context.citation_items:
            return RuleEvaluationResult(
                rule_id="RB-08",
                outcome=RuleOutcome.FAIL,
                reason_code="FABRICATED_OFFICIAL_CITATION_FOR_GENERAL_KNOWLEDGE",
                message="Rule RB-08 violation: Official EPU citations attached to general knowledge response.",
                severity=RulePriority.HIGH,
                recommended_action=RecommendedAction.SAFE_FALLBACK,
            )
        return RuleEvaluationResult(
            rule_id="RB-08",
            outcome=RuleOutcome.PASS,
            reason_code="GENERAL_KNOWLEDGE_COMPLIANT",
            message="Rule RB-08 satisfied: General knowledge correctly categorized without false official attribution.",
            severity=RulePriority.HIGH,
            recommended_action=RecommendedAction.DIRECT_ANSWER,
        )

    return RuleEvaluationResult(
        rule_id="RB-08",
        outcome=RuleOutcome.PASS,
        reason_code="SOURCE_MODE_NOT_GENERAL",
        message="Rule RB-08 satisfied: Source mode is not general knowledge.",
        severity=RulePriority.HIGH,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )


def evaluate_rb09_admission_guarantees(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-09: Reject admission guarantees and deterministic acceptance predictions."""
    target_text = context.draft_answer or context.user_message
    check_result = check_commitment(target_text)

    if check_result.has_violation:
        return RuleEvaluationResult(
            rule_id="RB-09",
            outcome=RuleOutcome.FAIL,
            reason_code="FORBIDDEN_COMMITMENT_DETECTED",
            message=f"Rule RB-09 violation: {check_result.reason}",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.BLOCK_RESPONSE,
        )

    return RuleEvaluationResult(
        rule_id="RB-09",
        outcome=RuleOutcome.PASS,
        reason_code="NO_GUARANTEES_DETECTED",
        message="Rule RB-09 satisfied: No forbidden admission guarantees detected.",
        severity=RulePriority.CRITICAL,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )


def evaluate_rb10_privacy(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-10: Collect only strictly necessary fields, avoid leaking personal data."""
    pii_matches = detect_pii(context.user_message)
    if pii_matches:
        types_found = {m.pii_type.value for m in pii_matches}
        return RuleEvaluationResult(
            rule_id="RB-10",
            outcome=RuleOutcome.FAIL,
            reason_code="SENSITIVE_PII_PRESENT",
            message=f"Rule RB-10 violation: User message contains sensitive personal identifiers ({', '.join(sorted(types_found))}). Masking required.",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.SAFE_FALLBACK,
        )

    return RuleEvaluationResult(
        rule_id="RB-10",
        outcome=RuleOutcome.PASS,
        reason_code="NO_PII_DETECTED",
        message="Rule RB-10 satisfied: No unmasked sensitive personal identifiers present in query.",
        severity=RulePriority.CRITICAL,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )


def evaluate_rb11_prompt_injection(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-11: Treat untrusted content as data; ignore instruction injection."""
    injection_result = check_prompt_injection(context.user_message)
    if injection_result.is_injection:
        return RuleEvaluationResult(
            rule_id="RB-11",
            outcome=RuleOutcome.FAIL,
            reason_code="PROMPT_INJECTION_DETECTED",
            message=f"Rule RB-11 violation: {injection_result.reason}",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.BLOCK_RESPONSE,
        )

    return RuleEvaluationResult(
        rule_id="RB-11",
        outcome=RuleOutcome.PASS,
        reason_code="NO_INJECTION_DETECTED",
        message="Rule RB-11 satisfied: No instruction-override patterns detected.",
        severity=RulePriority.CRITICAL,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )


def evaluate_rb12_handover_policy(context: PolicyEvaluationContext) -> RuleEvaluationResult:
    """RB-12: Distinguish abstain from optional handover; require confirmation before tickets."""
    if context.handover_requested:
        if context.handover_consent_verified:
            return RuleEvaluationResult(
                rule_id="RB-12",
                outcome=RuleOutcome.PASS,
                reason_code="HANDOVER_CONSENT_VERIFIED",
                message="Rule RB-12 satisfied: Handover requested and user consent verified.",
                severity=RulePriority.HIGH,
                recommended_action=RecommendedAction.HANDOVER_SUGGESTED,
            )
        return RuleEvaluationResult(
            rule_id="RB-12",
            outcome=RuleOutcome.PASS,
            reason_code="HANDOVER_CONSENT_PENDING",
            message="Rule RB-12 satisfied: Handover offered; user confirmation required before ticket creation.",
            severity=RulePriority.HIGH,
            recommended_action=RecommendedAction.HANDOVER_SUGGESTED,
        )

    # Invariant: Missing evidence must NEVER automatically trigger handover
    return RuleEvaluationResult(
        rule_id="RB-12",
        outcome=RuleOutcome.PASS,
        reason_code="HANDOVER_NOT_REQUESTED",
        message="Rule RB-12 satisfied: Handover not requested; missing evidence routes to safe fallback.",
        severity=RulePriority.HIGH,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )


def evaluate_rb13_frontend_fallback_safety(
    context: PolicyEvaluationContext,
) -> RuleEvaluationResult:
    """RB-13: Prohibit unverified frontend-generated official responses or synthetic citations."""
    if not context.backend_available:
        return RuleEvaluationResult(
            rule_id="RB-13",
            outcome=RuleOutcome.FAIL,
            reason_code="BACKEND_UNAVAILABLE",
            message="Rule RB-13 violation: Backend is unavailable. Fabricated admissions claims or synthetic citations prohibited.",
            severity=RulePriority.CRITICAL,
            recommended_action=RecommendedAction.SAFE_FALLBACK,
        )

    return RuleEvaluationResult(
        rule_id="RB-13",
        outcome=RuleOutcome.PASS,
        reason_code="BACKEND_ONLINE",
        message="Rule RB-13 satisfied: Backend services are available.",
        severity=RulePriority.CRITICAL,
        recommended_action=RecommendedAction.DIRECT_ANSWER,
    )
