"""Dataset integrity validator for Admission X AI evaluation framework.

Enforces Phase 1 Task 5 validation rules, category distribution checks,
and trust-boundary constraints.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

from evals.harness.loader import load_golden_dataset
from evals.harness.models import CaseCategory, GoldenCase, GroundTruthStatus

EXPECTED_V1_DISTRIBUTION: dict[str, int] = {
    CaseCategory.MAJOR.value: 15,
    CaseCategory.CURRICULUM.value: 20,
    CaseCategory.COMPARISON.value: 10,
    CaseCategory.MISSING.value: 15,
    CaseCategory.AMBIGUITY.value: 10,
    CaseCategory.SAFETY.value: 10,
}

EXPECTED_CATEGORY_COUNTS = EXPECTED_V1_DISTRIBUTION

APPROVED_BEHAVIORS: set[str] = {
    "official_lookup_or_not_found",
    "grounded_answer_or_abstain",
    "grounded_comparison_or_partial",
    "abstain_without_guess",
    "clarify_if_unresolved",
    "enforce_policy_without_fabrication",
    # Legacy compatibility
    "grounded_answer_or_handover",
    "handover_no_guess",
}

APPROVED_SOURCE_MODES: set[str] = {
    "official",
    "restricted",
    "undetermined",
    "none",
    "general",
    "mixed",
    "out_of_scope",
}

APPROVED_GROUND_TRUTH_STATUSES: set[str] = {
    GroundTruthStatus.PENDING_PDF_VERIFICATION.value,
    GroundTruthStatus.POLICY_ONLY.value,
    GroundTruthStatus.VERIFIED.value,
    GroundTruthStatus.SYNTHETIC.value,
}


@dataclass
class DatasetValidationReport:
    """Report detailing dataset integrity findings."""

    is_valid: bool
    total_cases: int
    category_counts: dict[str, int] = field(default_factory=dict)
    tier_counts: dict[str, int] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def summary(self) -> str:
        status_str = "VALID" if self.is_valid else "INVALID"
        lines = [
            f"Dataset Validation: {status_str}",
            f"Total Cases: {self.total_cases}",
            f"Categories: {dict(self.category_counts)}",
            f"Tiers: {dict(self.tier_counts)}",
        ]
        if self.errors:
            lines.append(f"Errors ({len(self.errors)}):")
            for err in self.errors[:10]:
                lines.append(f"  - {err}")
            if len(self.errors) > 10:
                lines.append(f"  ... and {len(self.errors) - 10} more errors")
        if self.warnings:
            lines.append(f"Warnings ({len(self.warnings)}):")
            for w in self.warnings[:5]:
                lines.append(f"  - {w}")
        return "\n".join(lines)


def validate_golden_cases(
    cases: list[GoldenCase],
    *,
    check_v1_distribution: bool = True,
) -> DatasetValidationReport:
    """Validate a collection of GoldenCase objects against data integrity rules.

    Args:
        cases: List of golden cases.
        check_v1_distribution: Whether to verify exact 80-case Phase 1 category distribution.

    Returns:
        DatasetValidationReport with validation findings.
    """
    errors: list[str] = []
    warnings: list[str] = []

    # 1. Check duplicate IDs
    seen_ids: dict[str, int] = {}
    for idx, case in enumerate(cases):
        if not case.id or not case.id.strip():
            errors.append(f"Case at index {idx} has missing or empty id")
            continue
        if case.id in seen_ids:
            errors.append(f"Duplicate case id '{case.id}' at index {idx} (previously seen at {seen_ids[case.id]})")
        else:
            seen_ids[case.id] = idx

    # 2. Category counts and distributions
    cat_counts = Counter(c.category for c in cases)
    tier_counts = Counter(c.tier.value for c in cases)

    if check_v1_distribution:
        if len(cases) != 80:
            errors.append(f"Expected 80 golden scenario cases for v1, found {len(cases)}")

        for expected_cat, expected_count in EXPECTED_V1_DISTRIBUTION.items():
            actual = cat_counts.get(expected_cat, 0)
            if actual != expected_count:
                errors.append(
                    f"Category '{expected_cat}' expected {expected_count} cases, but found {actual}"
                )

    # 3. Validate individual case invariants
    for case in cases:
        # Category
        if case.category not in EXPECTED_V1_DISTRIBUTION:
            errors.append(
                f"Case '{case.id}': Unknown category '{case.category}'. "
                f"Must be one of {sorted(EXPECTED_V1_DISTRIBUTION.keys())}"
            )

        # Expected behavior
        if case.expected_behavior not in APPROVED_BEHAVIORS:
            errors.append(
                f"Case '{case.id}': Unknown expected_behavior '{case.expected_behavior}'. "
                f"Must be one of {sorted(APPROVED_BEHAVIORS)}"
            )

        # Source mode
        if case.expected_source_mode and case.expected_source_mode not in APPROVED_SOURCE_MODES:
            errors.append(
                f"Case '{case.id}': Unknown expected_source_mode '{case.expected_source_mode}'. "
                f"Must be one of {sorted(APPROVED_SOURCE_MODES)}"
            )

        # Ground truth status
        if case.ground_truth_status not in APPROVED_GROUND_TRUTH_STATUSES:
            errors.append(
                f"Case '{case.id}': Unsupported ground_truth_status '{case.ground_truth_status}'. "
                f"Must be one of {sorted(APPROVED_GROUND_TRUTH_STATUSES)}"
            )

        # Trust Boundary: synthetic fixtures MUST NOT be marked verified
        if case.fixture_type == "synthetic" and case.ground_truth_status == GroundTruthStatus.VERIFIED.value:
            errors.append(
                f"Case '{case.id}': Synthetic fixture cannot have ground_truth_status='verified'"
            )

        # Trust Boundary: verified ground truth requires authoritative provenance
        if case.ground_truth_status == GroundTruthStatus.VERIFIED.value:
            has_provenance = bool(case.reviewer_reference or case.source_document_id or case.verified_passage_id)
            if not has_provenance:
                errors.append(
                    f"Case '{case.id}': Status is 'verified' but missing reviewer reference or source evidence provenance"
                )

        # Invariant: pending_pdf_verification cases must not fabricate verified metadata
        if (
            case.ground_truth_status == GroundTruthStatus.PENDING_PDF_VERIFICATION.value
            and (case.verified_passage_id or case.reviewer_reference)
        ):
            warnings.append(
                f"Case '{case.id}': Marked 'pending_pdf_verification' but has reviewer/passage metadata attached"
            )

        # Evidence requirements consistency
        if (
            case.category in {"major", "curriculum", "comparison", "missing"}
            and not case.requires_official_evidence
        ):
            warnings.append(
                f"Case '{case.id}': Admissions category '{case.category}' typically requires official evidence"
            )

    is_valid = len(errors) == 0
    return DatasetValidationReport(
        is_valid=is_valid,
        total_cases=len(cases),
        category_counts=dict(cat_counts),
        tier_counts=dict(tier_counts),
        errors=errors,
        warnings=warnings,
    )


def validate_dataset_file(
    path: str | Path,
    *,
    check_v1_distribution: bool = True,
) -> DatasetValidationReport:
    """Load and validate a dataset file from disk."""
    try:
        cases = load_golden_dataset(path)
    except Exception as exc:  # noqa: BLE001
        return DatasetValidationReport(
            is_valid=False,
            total_cases=0,
            errors=[f"Failed to load dataset: {exc}"],
        )

    return validate_golden_cases(cases, check_v1_distribution=check_v1_distribution)
