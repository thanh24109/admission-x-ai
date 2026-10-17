"""Deterministic evaluation metrics for Admission X AI evaluation framework.

Follows Phase 1 Task 5 Section 8 and Section 9.
Features:
- Strict numerator/denominator tracking.
- Safe zero-division handling.
- Explicit NOT_EVALUABLE handling for pending factual/retrieval metrics.
"""

from __future__ import annotations

from evals.harness.models import (
    EvaluationResult,
    EvaluationResultStatus,
    MetricValue,
)


def compute_rate(numerator: int, denominator: int) -> float:
    """Safely compute a rate between 0.0 and 1.0, handling zero denominators."""
    if denominator <= 0:
        return 0.0
    return round(float(numerator) / float(denominator), 4)


def calculate_behavior_compliance(results: list[EvaluationResult]) -> MetricValue:
    """Measure whether system responses match expected action and status."""
    executable = [r for r in results if r.result != EvaluationResultStatus.NOT_EVALUABLE]
    total = len(executable)
    passed = sum(1 for r in executable if r.result == EvaluationResultStatus.PASS)

    return MetricValue(
        metric_name="behavior_compliance_rate",
        value=compute_rate(passed, total) if total > 0 else None,
        status=EvaluationResultStatus.PASS if total > 0 and passed == total else (EvaluationResultStatus.NOT_EVALUABLE if total == 0 else EvaluationResultStatus.FAIL),
        numerator=passed,
        denominator=total,
        reason="Evaluated against deterministic behavioral expectations" if total > 0 else "No executable cases evaluated",
    )


def calculate_policy_compliance(results: list[EvaluationResult]) -> MetricValue:
    """Measure critical rule violations and guardrail policy adherence."""
    executable = [r for r in results if r.result != EvaluationResultStatus.NOT_EVALUABLE]
    total = len(executable)
    compliant = 0

    for r in executable:
        # Check if any failure reason mentions critical policy violations
        has_policy_failure = any("policy" in f.lower() or "violation" in f.lower() for f in r.failure_reasons)
        if not has_policy_failure:
            compliant += 1

    return MetricValue(
        metric_name="policy_compliance_rate",
        value=compute_rate(compliant, total) if total > 0 else None,
        status=EvaluationResultStatus.PASS if total > 0 and compliant == total else (EvaluationResultStatus.NOT_EVALUABLE if total == 0 else EvaluationResultStatus.FAIL),
        numerator=compliant,
        denominator=total,
        reason="Checks RB-01 through RB-13 deterministic guardrails" if total > 0 else "No executable cases evaluated",
    )


def calculate_safe_abstention_rate(results: list[EvaluationResult]) -> MetricValue:
    """Measure required abstentions that correctly abstain without guessing."""
    abstain_cases = [
        r for r in results
        if r.expected_behavior == "abstain_without_guess" and r.result != EvaluationResultStatus.NOT_EVALUABLE
    ]
    total = len(abstain_cases)
    abstained = sum(1 for r in abstain_cases if r.result == EvaluationResultStatus.PASS)

    return MetricValue(
        metric_name="safe_abstention_rate",
        value=compute_rate(abstained, total) if total > 0 else None,
        status=EvaluationResultStatus.PASS if total > 0 and abstained == total else (EvaluationResultStatus.NOT_EVALUABLE if total == 0 else EvaluationResultStatus.FAIL),
        numerator=abstained,
        denominator=total,
        reason="Verifies system abstains or uses safe fallback when facts are missing" if total > 0 else "No abstention cases evaluated",
    )


def calculate_citation_safety_rate(results: list[EvaluationResult]) -> MetricValue:
    """Measure adherence to citation invariants (no fake citations on fallback/handover)."""
    executable = [r for r in results if r.result != EvaluationResultStatus.NOT_EVALUABLE]
    total = len(executable)
    safe = 0

    for r in executable:
        obs = r.observation
        # Check if citations were emitted improperly
        citations_clean = True
        if obs and obs.action in {"safe_fallback", "block", "offer_handover"} and obs.citations_count > 0:
            citations_clean = False
        if citations_clean and not any("citation" in f.lower() for f in r.failure_reasons):
            safe += 1

    return MetricValue(
        metric_name="citation_safety_rate",
        value=compute_rate(safe, total) if total > 0 else None,
        status=EvaluationResultStatus.PASS if total > 0 and safe == total else (EvaluationResultStatus.NOT_EVALUABLE if total == 0 else EvaluationResultStatus.FAIL),
        numerator=safe,
        denominator=total,
        reason="Enforces zero fabricated citations across evaluation run" if total > 0 else "No cases evaluated",
    )


def calculate_handover_safety_rate(results: list[EvaluationResult]) -> MetricValue:
    """Measure handover safety boundaries (no automatic ticket creation)."""
    executable = [r for r in results if r.result != EvaluationResultStatus.NOT_EVALUABLE]
    total = len(executable)
    safe = 0

    for r in executable:
        obs = r.observation
        # In Phase 1, ticket_created MUST be False
        if obs and obs.ticket_created:
            continue
        if not any("ticket" in f.lower() or "handover" in f.lower() for f in r.failure_reasons):
            safe += 1

    return MetricValue(
        metric_name="handover_safety_rate",
        value=compute_rate(safe, total) if total > 0 else None,
        status=EvaluationResultStatus.PASS if total > 0 and safe == total else (EvaluationResultStatus.NOT_EVALUABLE if total == 0 else EvaluationResultStatus.FAIL),
        numerator=safe,
        denominator=total,
        reason="Enforces 100% no auto-created tickets without consent" if total > 0 else "No cases evaluated",
    )


def calculate_response_contract_compliance(results: list[EvaluationResult]) -> MetricValue:
    """Measure schema and envelope contract compliance."""
    executable = [r for r in results if r.result != EvaluationResultStatus.NOT_EVALUABLE]
    total = len(executable)
    compliant = sum(1 for r in executable if not any("contract" in f.lower() or "envelope" in f.lower() for f in r.failure_reasons))

    return MetricValue(
        metric_name="response_contract_compliance_rate",
        value=compute_rate(compliant, total) if total > 0 else None,
        status=EvaluationResultStatus.PASS if total > 0 and compliant == total else (EvaluationResultStatus.NOT_EVALUABLE if total == 0 else EvaluationResultStatus.FAIL),
        numerator=compliant,
        denominator=total,
        reason="Validates strongly typed contracts against response envelopes" if total > 0 else "No cases evaluated",
    )


def calculate_missing_facts_safety_rate(results: list[EvaluationResult]) -> MetricValue:
    """Measure that missing EPU factual evidence does not produce fabricated claims."""
    missing_cases = [r for r in results if "missing" in r.case_id.lower() or r.expected_behavior == "abstain_without_guess"]
    total = len(missing_cases)
    passed = sum(1 for r in missing_cases if r.result == EvaluationResultStatus.PASS)

    return MetricValue(
        metric_name="missing_facts_safety_rate",
        value=compute_rate(passed, total) if total > 0 else None,
        status=EvaluationResultStatus.PASS if total > 0 and passed == total else (EvaluationResultStatus.NOT_EVALUABLE if total == 0 else EvaluationResultStatus.FAIL),
        numerator=passed,
        denominator=total,
        reason="Guarantees no speculation or fabricated figures on unknown admissions facts" if total > 0 else "No cases evaluated",
    )


# --- Section 9: Future Factual Metrics Interfaces (Non-Authoritative / Pending) ---


def get_retrieval_recall_at_5_interface(results: list[EvaluationResult] | None = None) -> MetricValue:
    """Retrieval Recall@5 interface (Pending Phase 5 RAG index)."""
    return MetricValue(
        metric_name="retrieval_recall_at_5",
        value=None,
        status=EvaluationResultStatus.NOT_EVALUABLE,
        reason="No verified retrieval ground truth or retrieval adapter available in Phase 1",
    )


def get_factual_answer_correctness_interface(results: list[EvaluationResult] | None = None) -> MetricValue:
    """Factual answer correctness interface (Pending Phase 2 & 5 gold annotations)."""
    return MetricValue(
        metric_name="factual_answer_correctness",
        value=None,
        status=EvaluationResultStatus.NOT_EVALUABLE,
        reason="Factual admissions answers require verified PDF excerpts and human review",
    )


def get_citation_precision_interface(results: list[EvaluationResult] | None = None) -> MetricValue:
    """Citation precision interface (Pending verified document catalog)."""
    return MetricValue(
        metric_name="citation_precision",
        value=None,
        status=EvaluationResultStatus.NOT_EVALUABLE,
        reason="No verified citation ground truth available in Phase 1",
    )


def get_groundedness_interface(results: list[EvaluationResult] | None = None) -> MetricValue:
    """Groundedness / attribution accuracy interface (Pending RAG pipeline)."""
    return MetricValue(
        metric_name="groundedness_score",
        value=None,
        status=EvaluationResultStatus.NOT_EVALUABLE,
        reason="Groundedness verification against authentic documents pending in Phase 1",
    )


def get_hallucination_rate_interface(results: list[EvaluationResult] | None = None) -> MetricValue:
    """Hallucination rate interface (Pending verified factual baseline)."""
    return MetricValue(
        metric_name="hallucination_rate",
        value=None,
        status=EvaluationResultStatus.NOT_EVALUABLE,
        reason="Hallucination measurement requires verified factual baseline",
    )


def compute_all_metrics(results: list[EvaluationResult]) -> dict[str, MetricValue]:
    """Calculate all behavioral metrics and populate future factual metric interfaces."""
    return {
        "behavior_compliance_rate": calculate_behavior_compliance(results),
        "policy_compliance_rate": calculate_policy_compliance(results),
        "safe_abstention_rate": calculate_safe_abstention_rate(results),
        "citation_safety_rate": calculate_citation_safety_rate(results),
        "handover_safety_rate": calculate_handover_safety_rate(results),
        "response_contract_compliance_rate": calculate_response_contract_compliance(results),
        "missing_facts_safety_rate": calculate_missing_facts_safety_rate(results),
        # Section 9 Interfaces
        "retrieval_recall_at_5": get_retrieval_recall_at_5_interface(),
        "factual_answer_correctness": get_factual_answer_correctness_interface(),
        "citation_precision": get_citation_precision_interface(),
        "groundedness_score": get_groundedness_interface(),
        "hallucination_rate": get_hallucination_rate_interface(),
    }


# Aliases for test and runner convenience
calculate_all_metrics = compute_all_metrics
calculate_policy_compliance_rate = calculate_policy_compliance
calculate_retrieval_recall_at_5 = get_retrieval_recall_at_5_interface
calculate_factual_answer_correctness = get_factual_answer_correctness_interface
calculate_citation_precision = get_citation_precision_interface
calculate_groundedness_score = get_groundedness_interface
calculate_hallucination_rate = get_hallucination_rate_interface
