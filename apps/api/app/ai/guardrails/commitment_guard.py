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

# Negation prefix pattern: words like "không", "chưa", "không thể", "tuyệt đối không" preceding guarantee
_NEGATION_PREFIX_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"\b(không|chưa|chưa\s+thể|không\s+thể|không\s+bao\s+giờ|không\s+có\s+chuyện|khó\s+có\s+thể|không\s+dám|tuyệt\s+đối\s+không|hoàn\s+toàn\s+không)(\s+[^\W\d_]+){0,3}\s*$",
    re.IGNORECASE,
)

# Contrastive conjunctions breaking negation scope across clauses
_CONTRAST_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"\b(nhưng|tuy\s+nhiên|song|thế\s+nhưng)\b", re.IGNORECASE
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
    Scans all matches across the text so that a negated guarantee in one sentence
    or clause does not mask a positive guarantee elsewhere in the same text.

    Args:
        text: Input draft answer or statement to inspect.

    Returns:
        CommitmentCheckResult with violation status and match metadata.
    """
    if not text or not text.strip():
        return CommitmentCheckResult(has_violation=False)

    raw_matches: list[tuple[int, int, str]] = []
    for pattern in _GUARANTEE_PATTERNS:
        for match in pattern.finditer(text):
            raw_matches.append((match.start(), match.end(), match.group(0)))

    if not raw_matches:
        return CommitmentCheckResult(has_violation=False)

    # Sort matches by start position
    raw_matches.sort(key=lambda x: x[0])

    # De-duplicate overlapping matches (keep earliest)
    filtered_matches: list[tuple[int, int, str]] = []
    current_end = -1
    for start, end, phrase in raw_matches:
        if start >= current_end:
            filtered_matches.append((start, end, phrase))
            current_end = end

    negated_matches: list[tuple[str, str]] = []

    for start, _end, matched_phrase in filtered_matches:
        # Determine clause boundary to ensure negation prefix does not span across sentences
        last_boundary = max(
            text.rfind(".", 0, start),
            text.rfind("!", 0, start),
            text.rfind("?", 0, start),
            text.rfind(";", 0, start),
            text.rfind("\n", 0, start),
        )
        clause_start = 0 if last_boundary == -1 else last_boundary + 1
        raw_prefix = text[clause_start:start]

        # Contrastive words break prior negation scope
        contrast_matches = list(_CONTRAST_PATTERN.finditer(raw_prefix))
        if contrast_matches:
            raw_prefix = raw_prefix[contrast_matches[-1].end() :]

        clause_prefix = raw_prefix[-40:].strip()

        if _NEGATION_PREFIX_PATTERN.search(clause_prefix):
            negated_matches.append((matched_phrase, clause_prefix))
        else:
            # Positive forbidden commitment detected
            return CommitmentCheckResult(
                has_violation=True,
                matched_phrase=matched_phrase,
                is_negated=False,
                reason=f"Forbidden admission guarantee detected: '{matched_phrase}'",
            )

    # All matched guarantee expressions were explicitly negated
    if negated_matches:
        first_phrase, first_prefix = negated_matches[0]
        return CommitmentCheckResult(
            has_violation=False,
            matched_phrase=first_phrase,
            is_negated=True,
            reason=f"Negated guarantee expression: '{first_prefix} {first_phrase}'",
        )

    return CommitmentCheckResult(has_violation=False)


def contains_forbidden_commitment(text: str) -> bool:
    """Public convenience function to check whether text violates RB-09.

    Maintains backward compatibility with existing tests and call sites.
    """
    return check_commitment(text).has_violation
