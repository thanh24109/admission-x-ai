"""PII (Personally Identifiable Information) Guardrail for Admission X AI.

Enforces rule RB-10: Collect only strictly necessary candidate information;
prohibit storing or exposing sensitive personal identifiers (CCCD, Phone, Email).
Follows docs/ai/phase-1/rulebase-v1.yaml.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Final

# Whitelisted candidate profile fields for admissions assistant context
ALLOWED_PROFILE_FIELDS: Final[set[str]] = {"interested_programs", "study_preferences"}


class PIIType(str, Enum):
    """Categorization of detected personal identifiers."""

    PHONE = "PHONE"
    EMAIL = "EMAIL"
    CCCD = "CCCD"


@dataclass(frozen=True)
class PIIMatch:
    """Descriptor for a detected PII occurrence without exposing raw values in strings."""

    pii_type: PIIType
    start: int
    end: int
    placeholder: str


# Vietnamese phone numbers: mobile numbers (03x, 05x, 07x, 08x, 09x) with optional separators or +84
_PHONE_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"(?<!\d)(?:(?:\+84|84|0)(?:[\s.-]?[35789])(?:[\s.-]?\d){8})(?!\d)"
)

# Standard email address
_EMAIL_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
)

# Vietnamese Citizen Identification Card (CCCD: 12 digits) and legacy CMND (9 digits preceded by label)
_CCCD_PATTERN: Final[re.Pattern[str]] = re.compile(r"(?<!\d)\d{12}(?!\d)")
_CMND_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"\b(?:cmnd|cccd|căn\s+cước|chứng\s+minh|cmnd/cccd|số\s+định\s+danh)[\s:]*(\d{9})\b",
    re.IGNORECASE,
)


def detect_pii(text: str) -> list[PIIMatch]:
    """Detect presence and spans of personal identifiers in text.

    Args:
        text: Text to inspect.

    Returns:
        List of PIIMatch objects sorted by starting offset.
    """
    if not text or not text.strip():
        return []

    matches: list[PIIMatch] = []

    # 1. Emails
    for m in _EMAIL_PATTERN.finditer(text):
        matches.append(
            PIIMatch(
                pii_type=PIIType.EMAIL,
                start=m.start(),
                end=m.end(),
                placeholder="[REDACTED_EMAIL]",
            )
        )

    # 2. Phones
    for m in _PHONE_PATTERN.finditer(text):
        matches.append(
            PIIMatch(
                pii_type=PIIType.PHONE,
                start=m.start(),
                end=m.end(),
                placeholder="[REDACTED_PHONE]",
            )
        )

    # 3. CCCD (12 digits)
    for m in _CCCD_PATTERN.finditer(text):
        matches.append(
            PIIMatch(
                pii_type=PIIType.CCCD,
                start=m.start(),
                end=m.end(),
                placeholder="[REDACTED_CCCD]",
            )
        )

    # 4. CMND (9 digits preceded by identifier label)
    for m in _CMND_PATTERN.finditer(text):
        matches.append(
            PIIMatch(
                pii_type=PIIType.CCCD,
                start=m.start(1),
                end=m.end(1),
                placeholder="[REDACTED_CCCD]",
            )
        )

    # Sort matches by start position and resolve overlaps
    matches.sort(key=lambda x: x.start)
    non_overlapping: list[PIIMatch] = []
    current_end = -1
    for match in matches:
        if match.start >= current_end:
            non_overlapping.append(match)
            current_end = match.end

    return non_overlapping


def mask_pii(text: str) -> str:
    """Mask all detected sensitive PII in text using deterministic placeholders.

    Args:
        text: Raw text potentially containing personal identifiers.

    Returns:
        Clean text with PII safely replaced by typed placeholders.
    """
    matches = detect_pii(text)
    if not matches:
        return text

    # Replace from right to left so offsets remain valid
    result = text
    for match in reversed(matches):
        result = result[: match.start] + match.placeholder + result[match.end :]
    return result


def contains_pii(text: str) -> bool:
    """Return True if any sensitive personal identifier is found in text."""
    return len(detect_pii(text)) > 0
