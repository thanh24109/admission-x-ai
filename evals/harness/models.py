"""Typed models and evaluation result structures for the Admission X AI evaluation harness.

Conforms to Phase 1 Task 5 requirements, docs/ai/phase-1/evaluation-plan.md,
and backend contracts from Tasks 2, 3, and 4.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class GroundTruthStatus(str, Enum):
    """Ground truth readiness status for evaluation cases.

    CRITICAL INVARIANT:
    'pending_pdf_verification' cases MUST NOT be scored as factually correct
    prior to independent subject-matter verification and document annotation.
    """

    PENDING_PDF_VERIFICATION = "pending_pdf_verification"
    POLICY_ONLY = "policy_only"
    VERIFIED = "verified"
    SYNTHETIC = "synthetic"


class DatasetTier(str, Enum):
    """Clear tier separation for evaluation dataset cases."""

    TIER_A_POLICY = "tier_a_policy"
    TIER_B_PENDING_FACTUAL = "tier_b_pending_factual"
    TIER_C_SYNTHETIC = "tier_c_synthetic"


class CaseCategory(str, Enum):
    """Approved scenario categories from evaluation-plan.md."""

    MAJOR = "major"
    CURRICULUM = "curriculum"
    COMPARISON = "comparison"
    MISSING = "missing"
    AMBIGUITY = "ambiguity"
    SAFETY = "safety"
    CONTRACT = "contract"


class EvaluationResultStatus(str, Enum):
    """Deterministic evaluation outcome for an individual case or metric.

    CRITICAL INVARIANT:
    NOT_EVALUABLE must NEVER be silently treated as PASS.
    """

    PASS = "PASS"
    FAIL = "FAIL"
    NOT_EVALUABLE = "NOT_EVALUABLE"
    ERROR = "ERROR"


class GoldenCase(BaseModel):
    """Strongly typed golden evaluation scenario case.

    Supports both legacy schema (golden_admission.jsonl) and comprehensive v1 schema
    (golden_admission_v1.jsonl), along with optional provenance and execution fields.
    """

    model_config = ConfigDict(frozen=True)

    id: str = Field(..., description="Unique case identifier, e.g. 'major-01'.")
    category: str = Field(
        default="general",
        description="Scenario category (major, curriculum, comparison, missing, ambiguity, safety).",
    )
    question: str = Field(..., description="Natural language question or user query.")
    expected_behavior: str = Field(
        ...,
        description="Expected behavioral action or scenario label.",
    )
    expected_source_mode: str | None = Field(
        default=None,
        description="Expected source mode: official, restricted, undetermined, none, general.",
    )
    requires_official_evidence: bool = Field(
        default=True,
        description="Whether answering this case factually requires official verified evidence.",
    )
    ground_truth_status: str = Field(
        default=GroundTruthStatus.PENDING_PDF_VERIFICATION.value,
        description="Readiness status: pending_pdf_verification, policy_only, verified, synthetic.",
    )
    notes: str | None = Field(
        default=None,
        description="Evaluation guidelines, caveats or references.",
    )

    # Optional versioning and provenance fields
    dataset_version: str = Field(default="v1", description="Dataset release version.")
    scenario_type: str | None = Field(default=None, description="Detailed scenario type.")
    expected_answer_status: str | None = Field(
        default=None,
        description="Expected AnswerStatus (e.g. answered, abstained, partial, fallback).",
    )
    expected_decision: str | None = Field(
        default=None,
        description="Expected DecisionAction (e.g. answer, abstain, clarify, block, safe_fallback).",
    )
    expected_policy_outcomes: dict[str, str] | None = Field(
        default=None,
        description="Map of rule IDs to expected outcomes, e.g. {'RB-01': 'FAIL'}.",
    )
    expected_reason_code: str | None = Field(
        default=None,
        description="Expected DecisionResult reason_code.",
    )
    source_document_id: str | None = Field(
        default=None,
        description="Authoritative document ID if verified.",
    )
    source_hash: str | None = Field(
        default=None,
        description="SHA-256 digest of verified document.",
    )
    verified_passage_id: str | None = Field(
        default=None,
        description="Verified passage ID in official document.",
    )
    verified_page: int | None = Field(
        default=None,
        description="Page number in official document.",
    )
    admissions_year: int | None = Field(
        default=None,
        description="Target admissions year, e.g. 2025.",
    )
    academic_cohort: str | None = Field(
        default=None,
        description="Academic cohort, e.g. 'D19'.",
    )
    review_status: str | None = Field(
        default=None,
        description="Human reviewer status: unreviewed, reviewed, verified.",
    )
    reviewer_reference: str | None = Field(
        default=None,
        description="Reviewer identifier or review ticket reference.",
    )
    reviewed_at: str | None = Field(
        default=None,
        description="Timestamp of review.",
    )
    fixture_type: str | None = Field(
        default=None,
        description="Type of fixture: 'golden', 'synthetic', 'regression'.",
    )
    controlled_context: dict[str, Any] | None = Field(
        default=None,
        description="Explicit independently defined context for controlled policy/decision evaluation.",
    )

    @property
    def tier(self) -> DatasetTier:
        """Categorize case into Tier A, Tier B, or Tier C."""
        if self.fixture_type == "synthetic" or self.ground_truth_status == GroundTruthStatus.SYNTHETIC.value:
            return DatasetTier.TIER_C_SYNTHETIC
        if self.ground_truth_status == GroundTruthStatus.POLICY_ONLY.value:
            return DatasetTier.TIER_A_POLICY
        return DatasetTier.TIER_B_PENDING_FACTUAL


class EvaluationObservation(BaseModel):
    """Captured runtime observation from system-under-test components."""

    model_config = ConfigDict(frozen=True)

    action: str | None = None
    answer_status: str | None = None
    evidence_status: str | None = None
    source_mode: str | None = None
    reason_code: str | None = None
    citations_count: int = 0
    handover_offered: bool = False
    ticket_created: bool = False
    policy_violations: list[str] = Field(default_factory=list)
    raw_output: dict[str, Any] = Field(default_factory=dict)


class EvaluationResult(BaseModel):
    """Evaluation result for an individual scenario case."""

    model_config = ConfigDict(frozen=True)

    case_id: str
    dataset_version: str = "v1"
    adapter_name: str
    evaluation_type: str  # "policy", "decision", "contract", "synthetic"
    result: EvaluationResultStatus
    expected_behavior: str
    observed_behavior: str | None = None
    failure_reasons: list[str] = Field(default_factory=list)
    skipped_reasons: list[str] = Field(default_factory=list)
    ground_truth_status: str
    policy_version: str = "1.0.0"
    prompt_version: str = "1.0.0"
    execution_time_ms: float = 0.0
    observation: EvaluationObservation | None = None
    is_controlled_fixture: bool = False
    notes: str | None = None


class MetricValue(BaseModel):
    """Typed evaluation metric value with explicit denominator disclosure."""

    model_config = ConfigDict(frozen=True)

    metric_name: str
    value: float | None = None  # None when NOT_EVALUABLE
    status: EvaluationResultStatus = EvaluationResultStatus.PASS
    numerator: int | None = None
    denominator: int | None = None
    reason: str | None = None


class AdapterSummary(BaseModel):
    """Breakdown of evaluation results for a specific adapter."""

    model_config = ConfigDict(frozen=True)

    total_evaluations: int = 0
    passed: int = 0
    failed: int = 0
    not_evaluable: int = 0
    error: int = 0


class ScenarioSummary(BaseModel):
    """Scenario-level outcome accounting (deduplicated across adapters)."""

    model_config = ConfigDict(frozen=True)

    total_scenarios: int = 0
    passed_scenarios: int = 0
    failed_scenarios: int = 0
    not_evaluable_scenarios: int = 0
    error_scenarios: int = 0
    unsupported_scenarios: int = 0
    partial_coverage_scenarios: int = 0


class TierCoverage(BaseModel):
    """Dataset tier coverage breakdown."""

    model_config = ConfigDict(frozen=True)

    total_cases: int = 0
    tier_a_policy_only: int = 0
    tier_b_pending_factual: int = 0
    tier_c_synthetic: int = 0


class EvaluationSuiteResult(BaseModel):
    """Aggregate result of an entire evaluation execution run."""

    model_config = ConfigDict(frozen=True)

    dataset_version: str

    # Scenario-level accounting (unique scenario count)
    total_scenarios: int
    scenario_summary: ScenarioSummary

    # Adapter-level accounting (evaluations count)
    total_adapter_evaluations: int
    adapter_breakdown: dict[str, AdapterSummary]

    # Tier coverage
    tier_coverage: TierCoverage

    # Unsupported scenario IDs (no matching adapter)
    unsupported_case_ids: list[str] = Field(default_factory=list)

    # Backward compatibility fields (evaluations-level)
    total_cases: int
    evaluated_cases: int
    passed_cases: int
    failed_cases: int
    not_evaluable_cases: int
    error_cases: int

    metrics: dict[str, MetricValue]
    category_breakdown: dict[str, dict[str, int]]
    results: list[EvaluationResult]
    execution_metadata: dict[str, Any]

