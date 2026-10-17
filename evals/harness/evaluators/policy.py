"""Policy compliance evaluator for Admission X AI.

Follows Phase 1 Task 5 Section 8.2.
Evaluates critical rule violations, precedence invariants, and guardrail enforcement.
"""

from __future__ import annotations

from app.ai.rules.models import PolicyEvaluationReport, RuleOutcome


def evaluate_policy_compliance(
    report: PolicyEvaluationReport,
) -> list[str]:
    """Check policy evaluation report for rulebase safety invariants.

    Returns:
        List of failure reasons (empty if compliant).
    """
    failures: list[str] = []

    # Invariant 1: Critical rule failures MUST NOT result in safe_to_answer=True
    critical_failures = [
        r.rule_id
        for r in report.rule_results
        if r.outcome == RuleOutcome.FAIL and r.priority.value == "critical"
    ]
    if critical_failures and report.is_safe_to_answer:
        failures.append(
            f"Policy report marked is_safe_to_answer=True despite critical rule failures: {critical_failures}"
        )

    # Invariant 2: NOT_EVALUABLE must NEVER be silently treated as PASS
    not_evaluable_critical = [
        r.rule_id
        for r in report.rule_results
        if r.outcome == RuleOutcome.NOT_EVALUABLE and r.priority.value == "critical"
    ]
    if not_evaluable_critical and report.is_safe_to_answer:
        failures.append(
            f"Policy report marked is_safe_to_answer=True with unresolved critical rules: {not_evaluable_critical}"
        )

    return failures
