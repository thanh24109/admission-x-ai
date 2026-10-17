"""Golden dataset loader for Admission X AI evaluation framework.

Conforms to Phase 1 Task 5 dataset schema and supports offline reproducible loading.
"""

from __future__ import annotations

import json
from collections.abc import Iterator
from pathlib import Path

from pydantic import ValidationError

from evals.harness.models import GoldenCase


def iter_golden_dataset(
    path: str | Path,
    *,
    category: str | None = None,
) -> Iterator[GoldenCase]:
    """Iterate over golden dataset cases lazily from a JSONL file.

    Args:
        path: Path to the JSONL dataset file.
        category: Optional category filter.

    Yields:
        Validated GoldenCase instances.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If JSON is malformed or schema validation fails.
    """
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {file_path}")

    with file_path.open("r", encoding="utf-8") as f:
        for line_no, raw_line in enumerate(f, start=1):
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue

            try:
                data = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"Malformed JSON on line {line_no} of {file_path.name}: {exc}"
                ) from exc

            if not isinstance(data, dict):
                raise TypeError(
                    f"Line {line_no} of {file_path.name} must be a JSON object, got {type(data).__name__}"
                )

            try:
                case = GoldenCase.model_validate(data)
            except ValidationError as exc:
                raise ValueError(
                    f"Schema validation error on line {line_no} ({data.get('id', 'unknown')}): {exc}"
                ) from exc

            if category and category.lower() != "all" and case.category != category:
                continue

            yield case


def load_golden_dataset(
    path: str | Path,
    *,
    category: str | None = None,
) -> list[GoldenCase]:
    """Load and validate all golden dataset cases from a JSONL file.

    Args:
        path: Path to the JSONL dataset file.
        category: Optional category filter.

    Returns:
        List of validated GoldenCase instances.
    """
    return list(iter_golden_dataset(path, category=category))
