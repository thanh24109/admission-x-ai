"""Deterministic Decision Engine for Admission X AI.

Follows docs/ai/phase-1/decision-matrix.md, docs/ai/phase-1/response-contract.md,
and docs/ai/phase-1/agent-state-execution-policy.md.

PURE, DETERMINISTIC COMPONENT:
- No LLM inference
- No Supabase / vector database access
- No dynamic tool execution
- No automatic ticket creation
- No runtime dependency on running LangGraph graphs
"""

from __future__ import annotations

from typing import Any

from app.ai.decision.fallback import FallbackReasonCode, get_safe_fallback_text
from app.ai.decision.models import DecisionAction, DecisionResult
from app.ai.rules.engine import RulebaseEngine
from app.ai.rules.models import (
    PolicyEvaluationContext,
    PolicyEvaluationReport,
    RecommendedAction,
    RuleOutcome,
)
from app.schemas.citation import CitationRecord
from app.schemas.response_envelope import (
    AnswerStatus,
    EvidenceStatus,
    HandoverInfo,
    SourceMode,
)


class DecisionEngine:
    """Deterministic orchestrator translating policy evaluation and evidence state into safe actions."""

    def __init__(self, rulebase_engine: RulebaseEngine | None = None) -> None:
        self._rulebase_engine = rulebase_engine or RulebaseEngine()

    def evaluate_decision(
        self,
        context: PolicyEvaluationContext,
        policy_report: PolicyEvaluationReport | None = None,
        *,
        citations: list[CitationRecord] | None = None,
    ) -> DecisionResult:
        """Evaluate context and policy report deterministically according to Phase 1 Decision Matrix.

        Evaluation order (per decision-matrix.md):
        1. Backend & Tool availability
        2. Input safety & privacy (RB-11, RB-10)
        3. Ambiguity resolution (RB-03, RB-02)
        4. Source classification & verified evidence assessment (RB-08, RB-05, RB-01, RB-04, RB-07)
        5. Output policy validation (RB-09, RB-06)
        6. Optional human advisor handover (RB-12)
        """
        # Execute rulebase evaluation if not pre-computed
        report = policy_report or self._rulebase_engine.evaluate(context)
        citations_list = citations or []
        resolved_codes = context.resolved_major_codes or []

        # Base trace metadata
        trace_meta: dict[str, Any] = {
            "overall_outcome": report.overall_outcome.value,
            "recommended_action": report.recommended_action.value,
            "is_safe_to_proceed": report.is_safe_to_proceed,
            "violations_count": len(report.violations),
            "unverified_count": len(report.unverified_rules),
        }

        # -------------------------------------------------------------
        # 1. Backend and Tool Availability (Scenario J / RB-13)
        # -------------------------------------------------------------
        if not context.backend_available:
            return DecisionResult(
                decision=DecisionAction.SAFE_FALLBACK,
                answer_status=AnswerStatus.ERROR,
                evidence_status=EvidenceStatus.NOT_APPLICABLE,
                source_mode=SourceMode.NONE,
                reason_code=FallbackReasonCode.BACKEND_UNAVAILABLE.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=[],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.BACKEND_UNAVAILABLE),
                handover=HandoverInfo(offered=False, requested=context.handover_requested),
                resolved_major_codes=resolved_codes,
                citations=[],
                trace_metadata=trace_meta,
            )

        # -------------------------------------------------------------
        # 2. Input Safety & Privacy (Scenarios H & I / RB-11, RB-10)
        # -------------------------------------------------------------
        # RB-11: Prompt Injection Guard
        rb11_res = report.get_result("RB-11")
        if rb11_res and rb11_res.outcome == RuleOutcome.FAIL:
            return DecisionResult(
                decision=DecisionAction.BLOCK,
                answer_status=AnswerStatus.REJECTED,
                evidence_status=EvidenceStatus.NOT_APPLICABLE,
                source_mode=SourceMode.NONE,
                reason_code=FallbackReasonCode.PROMPT_INJECTION_DETECTED.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=["RB-11"],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.PROMPT_INJECTION_DETECTED),
                handover=HandoverInfo(offered=False, requested=False),
                resolved_major_codes=[],
                citations=[],
                trace_metadata=trace_meta,
            )

        # RB-10: PII Protection
        rb10_res = report.get_result("RB-10")
        if rb10_res and rb10_res.outcome == RuleOutcome.FAIL:
            return DecisionResult(
                decision=DecisionAction.BLOCK,
                answer_status=AnswerStatus.REJECTED,
                evidence_status=EvidenceStatus.NOT_APPLICABLE,
                source_mode=SourceMode.NONE,
                reason_code=FallbackReasonCode.PRIVACY_VIOLATION.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=["RB-10"],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.PRIVACY_VIOLATION),
                handover=HandoverInfo(offered=False, requested=False),
                resolved_major_codes=[],
                citations=[],
                trace_metadata=trace_meta,
            )

        # RB-09: Admission Guarantees and Commitment Guard (Evaluated BEFORE authorizing any answer)
        rb09_res = report.get_result("RB-09")
        if rb09_res and rb09_res.outcome == RuleOutcome.FAIL:
            return DecisionResult(
                decision=DecisionAction.BLOCK,
                answer_status=AnswerStatus.REJECTED,
                evidence_status=EvidenceStatus.NOT_APPLICABLE,
                source_mode=self._resolve_source_mode(context.source_mode),
                reason_code=FallbackReasonCode.OUTPUT_VALIDATION_FAILED.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=["RB-09"],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.OUTPUT_VALIDATION_FAILED),
                handover=HandoverInfo(offered=False, requested=context.handover_requested),
                resolved_major_codes=resolved_codes,
                citations=[],
                trace_metadata=trace_meta,
            )

        # Out-of-scope query check
        if context.source_mode == "out_of_scope" or context.intent == "out_of_scope":
            return DecisionResult(
                decision=DecisionAction.SAFE_FALLBACK,
                answer_status=AnswerStatus.OUT_OF_SCOPE,
                evidence_status=EvidenceStatus.NOT_APPLICABLE,
                source_mode=SourceMode.OUT_OF_SCOPE,
                reason_code="OUT_OF_SCOPE_QUERY",
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=[],
                safe_response_text="Tôi là Trợ lý Tuyển sinh của Trường Đại học Điện lực (EPU). Câu hỏi của bạn nằm ngoài phạm vi tư vấn tuyển sinh và đào tạo của Nhà trường.",
                handover=HandoverInfo(offered=False, requested=context.handover_requested),
                resolved_major_codes=[],
                citations=[],
                trace_metadata=trace_meta,
            )

        # -------------------------------------------------------------
        # 3. Ambiguity Resolution (Scenario E / RB-03, RB-02)
        # -------------------------------------------------------------
        # RB-03: Ambiguous Program / Intent
        rb03_res = report.get_result("RB-03")
        is_ambiguous = (
            context.program_resolver_status == "ambiguous"
            or context.intent == "ambiguous"
            or (rb03_res and rb03_res.outcome == RuleOutcome.FAIL and rb03_res.recommended_action == RecommendedAction.CLARIFICATION_NEEDED)
        )
        if is_ambiguous:
            return DecisionResult(
                decision=DecisionAction.CLARIFY,
                answer_status=AnswerStatus.CLARIFICATION_NEEDED,
                evidence_status=EvidenceStatus.NOT_APPLICABLE,
                source_mode=self._resolve_source_mode(context.source_mode),
                reason_code=FallbackReasonCode.PROGRAM_AMBIGUOUS.value,
                is_safe_to_answer=False,
                requires_clarification=True,
                requires_handover_confirmation=False,
                policy_violations=["RB-03"] if rb03_res and rb03_res.outcome == RuleOutcome.FAIL else [],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.PROGRAM_AMBIGUOUS),
                handover=HandoverInfo(offered=False, requested=context.handover_requested),
                resolved_major_codes=resolved_codes,
                citations=[],
                trace_metadata=trace_meta,
            )

        # RB-02: Program Not Found
        rb02_res = report.get_result("RB-02")
        if (
            context.program_resolver_status == "not_found"
            or (rb02_res and rb02_res.outcome == RuleOutcome.FAIL and rb02_res.reason_code == "PROGRAM_NOT_FOUND")
        ):
            return DecisionResult(
                decision=DecisionAction.SAFE_FALLBACK,
                answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                evidence_status=EvidenceStatus.UNSUPPORTED,
                source_mode=self._resolve_source_mode(context.source_mode),
                reason_code=FallbackReasonCode.PROGRAM_NOT_FOUND.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=["RB-02"] if rb02_res and rb02_res.outcome == RuleOutcome.FAIL else [],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.PROGRAM_NOT_FOUND),
                handover=HandoverInfo(offered=False, requested=context.handover_requested),
                resolved_major_codes=[],
                citations=[],
                trace_metadata=trace_meta,
            )

        # -------------------------------------------------------------
        # 4. Source Classification & Evidence Assessment
        # -------------------------------------------------------------
        raw_source_mode = (context.source_mode or "official_epu").lower().strip()
        is_general_knowledge = raw_source_mode == "general"
        is_mixed_mode = raw_source_mode == "mixed"

        # Scenario B: Pure General Knowledge Question (RB-08)
        if is_general_knowledge:
            rb08_res = report.get_result("RB-08")
            has_rb08_fail = rb08_res is not None and rb08_res.outcome == RuleOutcome.FAIL
            has_rb08_pending = rb08_res is not None and rb08_res.outcome == RuleOutcome.NOT_EVALUABLE

            if has_rb08_fail or has_rb08_pending or context.attribution_verified is False:
                return DecisionResult(
                    decision=DecisionAction.SAFE_FALLBACK,
                    answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                    evidence_status=EvidenceStatus.NOT_APPLICABLE,
                    source_mode=SourceMode.GENERAL,
                    reason_code=FallbackReasonCode.UNVERIFIED_CLAIM.value,
                    is_safe_to_answer=False,
                    requires_clarification=False,
                    requires_handover_confirmation=False,
                    policy_violations=["RB-08"] if has_rb08_fail else [],
                    safe_response_text=get_safe_fallback_text(FallbackReasonCode.UNVERIFIED_CLAIM),
                    handover=HandoverInfo(offered=False, requested=context.handover_requested),
                    resolved_major_codes=[],
                    citations=[],
                    trace_metadata=trace_meta,
                )

            # Invariant: is_safe_to_answer must strictly align with report.is_safe_to_proceed
            if not report.is_safe_to_proceed or report.overall_outcome != RuleOutcome.PASS:
                return DecisionResult(
                    decision=DecisionAction.SAFE_FALLBACK,
                    answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                    evidence_status=EvidenceStatus.NOT_APPLICABLE,
                    source_mode=SourceMode.GENERAL,
                    reason_code=FallbackReasonCode.UNVERIFIED_CLAIM.value,
                    is_safe_to_answer=False,
                    requires_clarification=False,
                    requires_handover_confirmation=False,
                    policy_violations=[r.rule_id for r in report.violations],
                    safe_response_text=get_safe_fallback_text(FallbackReasonCode.UNVERIFIED_CLAIM),
                    handover=HandoverInfo(offered=False, requested=context.handover_requested),
                    resolved_major_codes=[],
                    citations=[],
                    trace_metadata=trace_meta,
                )

            return DecisionResult(
                decision=DecisionAction.ANSWER,
                answer_status=AnswerStatus.ANSWERED,
                evidence_status=EvidenceStatus.NOT_APPLICABLE,
                source_mode=SourceMode.GENERAL,
                reason_code="GENERAL_KNOWLEDGE_PERMITTED",
                is_safe_to_answer=True,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=[],
                safe_response_text=None,
                handover=HandoverInfo(offered=False, requested=context.handover_requested),
                resolved_major_codes=[],
                citations=[],  # Invariant: No official citations for general knowledge
                trace_metadata=trace_meta,
            )

        # Official / Mixed Evidence Assessment
        norm_evidence_status = (context.evidence_status or "none").lower().strip()

        # Scenario G: Conflicting Evidence
        if norm_evidence_status == "conflicting":
            return DecisionResult(
                decision=DecisionAction.ABSTAIN,
                answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                evidence_status=EvidenceStatus.CONFLICTING,
                source_mode=self._resolve_source_mode(context.source_mode),
                reason_code=FallbackReasonCode.CONFLICTING_EVIDENCE.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=[],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.CONFLICTING_EVIDENCE),
                handover=HandoverInfo(offered=True, requested=context.handover_requested, reason_code="conflicting_evidence"),
                resolved_major_codes=resolved_codes,
                citations=[],
                trace_metadata=trace_meta,
            )

        # Scenario G: Outdated / Stale Admissions Evidence (RB-05)
        rb05_res = report.get_result("RB-05")
        if (
            (rb05_res and rb05_res.outcome in (RuleOutcome.FAIL, RuleOutcome.NOT_EVALUABLE))
            or (context.requested_admissions_year is not None and context.extra_context.get("evidence_year") and context.extra_context.get("evidence_year") != context.requested_admissions_year)
        ):
            return DecisionResult(
                decision=DecisionAction.ABSTAIN,
                answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                evidence_status=EvidenceStatus.UNSUPPORTED,
                source_mode=self._resolve_source_mode(context.source_mode),
                reason_code=FallbackReasonCode.OUTDATED_EVIDENCE.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=["RB-05"] if rb05_res and rb05_res.outcome == RuleOutcome.FAIL else [],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.OUTDATED_EVIDENCE),
                handover=HandoverInfo(offered=True, requested=context.handover_requested, reason_code="outdated_evidence"),
                resolved_major_codes=resolved_codes,
                citations=[],
                trace_metadata=trace_meta,
            )

        # RB-04: Restricted Claims Check (Numerical tuition, cutoff, quota assertions)
        rb04_res = report.get_result("RB-04")
        if rb04_res and rb04_res.outcome in (RuleOutcome.FAIL, RuleOutcome.NOT_EVALUABLE):
            return DecisionResult(
                decision=DecisionAction.SAFE_FALLBACK,
                answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                evidence_status=EvidenceStatus.UNSUPPORTED,
                source_mode=self._resolve_source_mode(context.source_mode),
                reason_code=FallbackReasonCode.UNVERIFIED_CLAIM.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=["RB-04"] if rb04_res.outcome == RuleOutcome.FAIL else [],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.UNVERIFIED_CLAIM),
                handover=HandoverInfo(offered=False, requested=context.handover_requested),
                resolved_major_codes=resolved_codes,
                citations=[],
                trace_metadata=trace_meta,
            )

        # Scenario F: Missing / Unsupported Evidence (RB-01)
        if (
            norm_evidence_status in ("missing", "unsupported", "none")
            or not context.evidence_items
        ) and context.intent != "counselor_request":
            rb01_fail = report.get_result("RB-01") and report.get_result("RB-01").outcome == RuleOutcome.FAIL
            return DecisionResult(
                decision=DecisionAction.ABSTAIN,
                answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                evidence_status=EvidenceStatus.UNSUPPORTED,
                source_mode=self._resolve_source_mode(context.source_mode),
                reason_code=FallbackReasonCode.INSUFFICIENT_OFFICIAL_EVIDENCE.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=["RB-01"] if rb01_fail else [],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.INSUFFICIENT_OFFICIAL_EVIDENCE),
                handover=HandoverInfo(offered=True, requested=context.handover_requested, reason_code="missing_evidence"),
                resolved_major_codes=resolved_codes,
                citations=[],
                trace_metadata=trace_meta,
            )

        # RB-06: Citation Validity Check
        rb06_res = report.get_result("RB-06")
        if (
            (rb06_res and rb06_res.outcome in (RuleOutcome.FAIL, RuleOutcome.NOT_EVALUABLE))
            or context.citation_verification_status in ("failed", "pending")
        ):
            is_cite_fail = (rb06_res and rb06_res.outcome == RuleOutcome.FAIL) or context.citation_verification_status == "failed"
            return DecisionResult(
                decision=DecisionAction.SAFE_FALLBACK,
                answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                evidence_status=EvidenceStatus.UNSUPPORTED,
                source_mode=self._resolve_source_mode(context.source_mode),
                reason_code=FallbackReasonCode.CITATION_VERIFICATION_PENDING.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=["RB-06"] if is_cite_fail else [],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.CITATION_VERIFICATION_PENDING),
                handover=HandoverInfo(offered=False, requested=context.handover_requested),
                resolved_major_codes=resolved_codes,
                citations=[],
                trace_metadata=trace_meta,
            )

        # Scenario D: Partial Evidence (RB-07)
        if norm_evidence_status == "partial":
            # Safety gate: Partial evidence requires verified claim grounding for supported portion,
            # valid citations if any, and safe policy clearance.
            claim_is_verified = context.claim_verification_status == "verified"
            report_safe = report.is_safe_to_proceed and report.overall_outcome == RuleOutcome.PASS
            rb01_ok = not (report.get_result("RB-01") and report.get_result("RB-01").outcome in (RuleOutcome.FAIL, RuleOutcome.NOT_EVALUABLE))

            if not claim_is_verified or not report_safe or not rb01_ok:
                return DecisionResult(
                    decision=DecisionAction.SAFE_FALLBACK,
                    answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                    evidence_status=EvidenceStatus.PARTIALLY_SUPPORTED,
                    source_mode=self._resolve_source_mode(context.source_mode),
                    reason_code=FallbackReasonCode.UNVERIFIED_CLAIM.value,
                    is_safe_to_answer=False,
                    requires_clarification=False,
                    requires_handover_confirmation=False,
                    policy_violations=[r.rule_id for r in report.violations],
                    safe_response_text=get_safe_fallback_text(FallbackReasonCode.UNVERIFIED_CLAIM),
                    handover=HandoverInfo(offered=False, requested=context.handover_requested),
                    resolved_major_codes=resolved_codes,
                    citations=[],
                    trace_metadata=trace_meta,
                )

            # Legitimate verified partial answer: Extract upstream missing aspects without fabrication
            raw_missing = context.extra_context.get("missing_aspects")
            missing_aspects = [str(x) for x in raw_missing if x] if isinstance(raw_missing, list) else []

            return DecisionResult(
                decision=DecisionAction.PARTIAL_ANSWER,
                answer_status=AnswerStatus.PARTIAL,
                evidence_status=EvidenceStatus.PARTIALLY_SUPPORTED,
                source_mode=SourceMode.MIXED if is_mixed_mode else SourceMode.OFFICIAL_EPU,
                reason_code="PARTIAL_EVIDENCE_VERIFIED",
                is_safe_to_answer=True,
                requires_clarification=False,
                requires_handover_confirmation=False,
                missing_aspects=missing_aspects,
                policy_violations=[],
                safe_response_text=None,
                handover=HandoverInfo(offered=False, requested=context.handover_requested),
                resolved_major_codes=resolved_codes,
                citations=citations_list,
                trace_metadata=trace_meta,
            )

        # -------------------------------------------------------------
        # 5. Handover Evaluation (Scenario K / RB-12)
        # -------------------------------------------------------------
        if context.handover_requested or context.intent == "counselor_request":
            return DecisionResult(
                decision=DecisionAction.OFFER_HANDOVER,
                answer_status=AnswerStatus.HANDOVER_OFFERED,
                evidence_status=EvidenceStatus.NOT_APPLICABLE,
                source_mode=self._resolve_source_mode(context.source_mode),
                reason_code="HANDOVER_OFFERED_BY_USER_REQUEST",
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=not context.handover_consent_verified,
                policy_violations=[],
                safe_response_text="Bạn có muốn kết nối với cán bộ tuyển sinh Trường Đại học Điện lực (EPU) để được hỗ trợ trực tiếp không?",
                handover=HandoverInfo(
                    offered=True,
                    requested=True,
                    consent_verified=context.handover_consent_verified,
                    ticket_id=None,  # Handover offer never creates ticket
                    reason_code="staff_requested",
                ),
                resolved_major_codes=resolved_codes,
                citations=[],
                trace_metadata=trace_meta,
            )

        # -------------------------------------------------------------
        # 6. Official Evidence Claim-level Grounding Gate (RB-01) & Full Answer
        # -------------------------------------------------------------
        # Even if evidence_status is verified, claim_verification_status MUST be "verified",
        # and policy report must confirm safety to proceed without critical violations.
        if (
            context.claim_verification_status != "verified"
            or not report.is_safe_to_proceed
            or report.overall_outcome != RuleOutcome.PASS
        ):
            return DecisionResult(
                decision=DecisionAction.SAFE_FALLBACK,
                answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                evidence_status=EvidenceStatus.UNSUPPORTED,
                source_mode=self._resolve_source_mode(context.source_mode),
                reason_code=FallbackReasonCode.UNVERIFIED_CLAIM.value,
                is_safe_to_answer=False,
                requires_clarification=False,
                requires_handover_confirmation=False,
                policy_violations=[r.rule_id for r in report.violations],
                safe_response_text=get_safe_fallback_text(FallbackReasonCode.UNVERIFIED_CLAIM),
                handover=HandoverInfo(offered=False, requested=context.handover_requested),
                resolved_major_codes=resolved_codes,
                citations=[],
                trace_metadata=trace_meta,
            )

        # Full Verified Official / Mixed Answer (Scenario A & C)
        return DecisionResult(
            decision=DecisionAction.ANSWER,
            answer_status=AnswerStatus.ANSWERED,
            evidence_status=EvidenceStatus.SUPPORTED,
            source_mode=SourceMode.MIXED if is_mixed_mode else SourceMode.OFFICIAL_EPU,
            reason_code="OFFICIAL_EVIDENCE_VERIFIED",
            is_safe_to_answer=True,
            requires_clarification=False,
            requires_handover_confirmation=False,
            policy_violations=[],
            safe_response_text=None,
            handover=HandoverInfo(offered=False, requested=False),
            resolved_major_codes=resolved_codes,
            citations=citations_list,
            trace_metadata=trace_meta,
        )

    @staticmethod
    def _resolve_source_mode(raw: str | None) -> SourceMode:
        if not raw:
            return SourceMode.OFFICIAL_EPU
        norm = raw.lower().strip()
        if norm in ("official", "official_epu"):
            return SourceMode.OFFICIAL_EPU
        if norm == "general":
            return SourceMode.GENERAL
        if norm == "mixed":
            return SourceMode.MIXED
        if norm == "out_of_scope":
            return SourceMode.OUT_OF_SCOPE
        return SourceMode.NONE
