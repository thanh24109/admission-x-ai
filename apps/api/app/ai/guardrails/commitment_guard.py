"""Commitment Guardrail for Admission X AI.

Enforces rule RB-09: Prohibits admission guarantees and deterministic acceptance predictions.
Distinguishes forbidden promises from negated explanatory statements.
Follows docs/ai/phase-1/rulebase-v1.yaml and docs/ai/phase-1/scope-and-source-policy.md.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Final

# Legacy tuple preserved for backward compatibility
FORBIDDEN_COMMITMENTS: Final[tuple[str, ...]] = (
    "chắc chắn đỗ",
    "100% trúng tuyển",
    "đảm bảo trúng tuyển",
    "bao đậu",
    "chắc suất",
)

# Core regex patterns for forbidden guarantee phrases
_GUARANTEE_PATTERNS: Final[tuple[re.Pattern[str], ...]] = (
    re.compile(r"\bchắc\s+chắn\s+(đỗ|trúng\s+tuyển|đậu|được\s+nhận|vào\s+được)\b", re.IGNORECASE),
    re.compile(r"\bđảm\s+bảo\s+(trúng\s+tuyển|đỗ|đậu|được\s+nhận|chỉ\s+tiêu)\b", re.IGNORECASE),
    re.compile(
        r"\bcam\s+kết\s+(trúng\s+tuyển|đỗ|đậu|(có\s+)?việc\s+làm(\s*100%)?|100%\s+có\s+việc\s+làm)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\bbao\s+(đậu|đỗ|trúng\s+tuyển)\b", re.IGNORECASE),
    re.compile(r"\bchắc\s+suất(\s+(trúng\s+tuyển|vào\s+trường|đỗ|đậu))?\b", re.IGNORECASE),
    re.compile(r"\byên\s+tâm\s+(sẽ\s+|là\s+)?(đỗ|trúng\s+tuyển|đậu)\b", re.IGNORECASE),
    re.compile(
        r"\b(khả\s+năng|tỷ\s+lệ|xác\s+suất)?\s*100%\s*(trúng\s+tuyển|đỗ|đậu)\b", re.IGNORECASE
    ),
    re.compile(r"\bauto\s+(đỗ|trúng\s+tuyển|đậu)\b", re.IGNORECASE),
    re.compile(r"\bkhẳng\s+định\s+(sẽ\s+)?(đỗ|trúng\s+tuyển|đậu)\b", re.IGNORECASE),
)

# Negation prefix pattern: words like "không", "chưa", "không thể", "không thể khẳng định" preceding guarantee
_NEGATION_PREFIX_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"\b(không|chưa|chưa\s+thể|không\s+thể|không\s+bao\s+giờ|không\s+có\s+chuyện|khó\s+có\s+thể|không\s+dám)(\s+[^\W\d_]+){0,3}\s*$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class CommitmentCheckResult:
    """Detailed result of admission guarantee inspection."""

    has_violation: bool
    matched_phrase: str | None = None
    is_negated: bool = False
    reason: str | None = None


def check_commitment(text: str) -> CommitmentCheckResult:
    """Inspect text for forbidden admission commitment claims.

    Identifies positive promises while avoiding false positives on negated or
    cautionary statements (e.g. 'nhà trường không cam kết trúng tuyển').

    Args:
        text: Input draft answer or statement to inspect.

    Returns:
        CommitmentCheckResult with violation status and match metadata.
    """
    if not text or not text.strip():
        return CommitmentCheckResult(has_violation=False)

    for pattern in _GUARANTEE_PATTERNS:
        for match in pattern.finditer(text):
            start = match.start()
            prefix = text[max(0, start - 30) : start].strip()

            if _NEGATION_PREFIX_PATTERN.search(prefix):
                # Matched phrase is explicitly negated
                return CommitmentCheckResult(
                    has_violation=False,
                    matched_phrase=match.group(0),
                    is_negated=True,
                    reason=f"Negated guarantee expression: '{prefix} {match.group(0)}'",
                )

            # Positive forbidden commitment detected
            matched_phrase = match.group(0)
            return CommitmentCheckResult(
                has_violation=True,
                matched_phrase=matched_phrase,
                is_negated=False,
                reason=f"Forbidden admission guarantee detected: '{matched_phrase}'",
            )

    return CommitmentCheckResult(has_violation=False)


def contains_forbidden_commitment(text: str) -> bool:
    """Public convenience function to check whether text violates RB-09.

    Maintains backward compatibility with existing tests and call sites.
    """
    return check_commitment(text).has_violation
