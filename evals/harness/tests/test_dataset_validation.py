"""Unit tests for Golden Dataset validation and schema integrity.

Follows Phase 1 Task 5 Section 3 & Section 15.
Tests schema compliance, category distribution, duplicate detection, enum checks,
and provenance boundaries.
"""

from __future__ import annotations

from pathlib import Path

from evals.harness.loader import load_golden_dataset
from evals.harness.models import (
    CaseCategory,
    DatasetTier,
    GoldenCase,
    GroundTruthStatus,
)
from evals.harness.validator import (
    EXPECTED_CATEGORY_COUNTS,
    validate_dataset_file,
    validate_golden_cases,
)

GOLDEN_V1_PATH = Path("evals/datasets/golden_admission_v1.jsonl")


def test_golden_v1_dataset_integrity() -> None:
    """Verify that golden_admission_v1.jsonl passes all validation checks."""
    assert GOLDEN_V1_PATH.exists(), f"Golden dataset not found at {GOLDEN_V1_PATH}"
    report = validate_dataset_file(GOLDEN_V1_PATH)

    assert report.is_valid, f"Dataset validation failed: {report.errors}"
    assert report.total_cases == 80
    assert len(report.errors) == 0


def test_golden_v1_category_distribution() -> None:
    """Verify that the 80 scenarios match the exact approved category distribution."""
    cases = load_golden_dataset(GOLDEN_V1_PATH)
    assert len(cases) == 80

    counts: dict[str, int] = {}
    for c in cases:
        counts[c.category] = counts.get(c.category, 0) + 1

    assert counts == EXPECTED_CATEGORY_COUNTS
    assert counts[CaseCategory.MAJOR.value] == 15
    assert counts[CaseCategory.CURRICULUM.value] == 20
    assert counts[CaseCategory.COMPARISON.value] == 10
    assert counts[CaseCategory.MISSING.value] == 15
    assert counts[CaseCategory.AMBIGUITY.value] == 10
    assert counts[CaseCategory.SAFETY.value] == 10


def test_golden_v1_tiers_separation() -> None:
    """Verify that Tier A (policy_only) and Tier B (pending_pdf) are accurately partitioned."""
    cases = load_golden_dataset(GOLDEN_V1_PATH)

    tier_a_cases = [c for c in cases if c.tier == DatasetTier.TIER_A_POLICY]
    tier_b_cases = [c for c in cases if c.tier == DatasetTier.TIER_B_PENDING_FACTUAL]

    # 45 factual search cases (major=15, curriculum=20, comparison=10) are pending PDF verification
    assert len(tier_b_cases) == 45
    # 35 deterministic cases (missing=15, ambiguity=10, safety=10) are policy_only
    assert len(tier_a_cases) == 35


def test_reject_duplicate_ids(tmp_path: Path) -> None:
    """Verify that duplicate case IDs are detected and rejected."""
    bad_data = [
        {"id": "dup-01", "category": "missing", "question": "Q1", "expected_behavior": "abstain_without_guess"},
        {"id": "dup-01", "category": "safety", "question": "Q2", "expected_behavior": "enforce_policy_without_fabrication"},
    ]
    cases = [GoldenCase.model_validate(d) for d in bad_data]
    report = validate_golden_cases(cases, check_v1_distribution=False)

    assert not report.is_valid
    assert any("Duplicate case id 'dup-01'" in err for err in report.errors)


def test_reject_invalid_category() -> None:
    """Verify that unsupported category strings are rejected by validator."""
    case = GoldenCase(
        id="bad-cat",
        category="sports",  # Invalid
        question="Ai vô địch bóng đá?",
        expected_behavior="abstain_without_guess",
    )
    report = validate_golden_cases([case], check_v1_distribution=False)
    assert not report.is_valid
    assert any("Unknown category 'sports'" in err for err in report.errors)


def test_reject_invalid_behavior() -> None:
    """Verify that unsupported behavior strings are rejected by validator."""
    case = GoldenCase(
        id="bad-beh",
        category="missing",
        question="Học phí 2026?",
        expected_behavior="guess_wildly",  # Invalid
    )
    report = validate_golden_cases([case], check_v1_distribution=False)
    assert not report.is_valid
    assert any("Unknown expected_behavior 'guess_wildly'" in err for err in report.errors)


def test_reject_synthetic_case_marked_verified() -> None:
    """Verify that synthetic test fixtures cannot claim official verified ground truth."""
    case = GoldenCase(
        id="synth-01",
        category="safety",
        question="Synthetic injection test",
        expected_behavior="enforce_policy_without_fabrication",
        fixture_type="synthetic",
        ground_truth_status=GroundTruthStatus.VERIFIED.value,
    )
    report = validate_golden_cases([case], check_v1_distribution=False)
    assert not report.is_valid
    assert any("Synthetic fixture cannot have ground_truth_status" in err for err in report.errors)


def test_reject_verified_factual_without_complete_provenance() -> None:
    """Task 5.1 P2 requirement: Do not allow verified status based on single self-asserted metadata."""
    # 1. Totally missing provenance
    case_empty = GoldenCase(
        id="fact-01",
        category="curriculum",
        question="Số tín chỉ ngành CNTT?",
        expected_behavior="grounded_answer_or_abstain",
        ground_truth_status=GroundTruthStatus.VERIFIED.value,
    )
    report_empty = validate_golden_cases([case_empty], check_v1_distribution=False)
    assert not report_empty.is_valid
    assert any("missing required authoritative provenance and review fields" in err for err in report_empty.errors)

    # 2. Only single self-asserted metadata field (e.g., only source_document_id)
    case_single_field = GoldenCase(
        id="fact-02",
        category="curriculum",
        question="Số tín chỉ ngành CNTT?",
        expected_behavior="grounded_answer_or_abstain",
        ground_truth_status=GroundTruthStatus.VERIFIED.value,
        source_document_id="doc-epu-01",
        # Missing source_hash, verified_passage_id, reviewer_reference, reviewed_at
    )
    report_single = validate_golden_cases([case_single_field], check_v1_distribution=False)
    assert not report_single.is_valid
    assert any("missing required authoritative provenance and review fields" in err for err in report_single.errors)


def test_verified_factual_with_full_authoritative_provenance_passes() -> None:
    """Verify that a case with complete 5-field authoritative provenance passes validation."""
    case_valid = GoldenCase(
        id="fact-verified-01",
        category="curriculum",
        question="Số tín chỉ ngành CNTT?",
        expected_behavior="grounded_answer_or_abstain",
        ground_truth_status=GroundTruthStatus.VERIFIED.value,
        source_document_id="doc-epu-ctdt-cntt-2025",
        source_hash="sha256:abc123def456789012345678901234567890123456789012345678901234abcd",
        verified_passage_id="pass-cntt-credits-01",
        reviewer_reference="rev-epu-admissions-dean-001",
        reviewed_at="2026-10-17T12:00:00Z",
    )
    report = validate_golden_cases([case_valid], check_v1_distribution=False)
    assert report.is_valid
    assert len(report.errors) == 0


def test_reject_malformed_jsonl(tmp_path: Path) -> None:
    """Verify that malformed JSONL files are reported with specific syntax errors."""
    bad_file = tmp_path / "malformed.jsonl"
    bad_file.write_text('{"id": "ok-01", "question": "Q?", "expected_behavior": "abstain_without_guess"}\n{not valid json\n', encoding="utf-8")

    report = validate_dataset_file(bad_file)
    assert not report.is_valid
    assert any("Malformed JSON on line 2" in err for err in report.errors)


def test_legacy_dataset_compatibility() -> None:
    """Verify that legacy golden_admission.jsonl loads and is parseable."""
    legacy_path = Path("evals/datasets/golden_admission.jsonl")
    if legacy_path.exists():
        cases = load_golden_dataset(legacy_path)
        assert len(cases) > 0
        for c in cases:
            assert isinstance(c, GoldenCase)
