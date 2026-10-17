"""Evaluation adapter base protocol for Admission X AI evaluation harness.

Follows Phase 1 Task 5 Section 6.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from evals.harness.models import EvaluationResult, GoldenCase


@runtime_checkable
class EvaluationAdapter(Protocol):
    """Protocol for evaluation adapters measuring system behavior."""

    @property
    def name(self) -> str:
        """Name of the adapter."""
        ...

    def supports_case(self, case: GoldenCase) -> bool:
        """Return True if this adapter can evaluate the case."""
        ...

    def evaluate(self, case: GoldenCase) -> EvaluationResult:
        """Execute evaluation of the case and return an EvaluationResult."""
        ...
