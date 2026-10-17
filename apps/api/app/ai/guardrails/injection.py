"""Prompt Injection Guardrail for Admission X AI.

Enforces rule RB-11: Detect instruction override patterns in untrusted input
and retrieved context text. Defense-in-depth against prompt hijacking.
Follows docs/ai/phase-1/rulebase-v1.yaml.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Final

# High-confidence injection and instruction-override regex patterns
_INJECTION_PATTERNS: Final[tuple[re.Pattern[str], ...]] = (
    # English override patterns
    re.compile(r"\bignore\s+(all\s+)?(previous|prior)\s+instructions\b", re.IGNORECASE),
    re.compile(r"\bdisregard\s+(all\s+)?(previous|prior)\s+instructions\b", re.IGNORECASE),
    re.compile(
        r"\b(override\s+(the\s+)?(system|core)\s+(rules|policy|instructions|prompt)|system\s+prompt\s+override|unfiltered\s+bot)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\breveal\s+(the\s+|your\s+)?system\s+prompt\b", re.IGNORECASE),
    re.compile(r"\b(act|behave)\s+as\s+DAN\b", re.IGNORECASE),
    re.compile(r"\bjailbreak\b", re.IGNORECASE),
    # Vietnamese override patterns
    re.compile(
        r"\bbỏ\s+qua\s+(tất\s+cả\s+|mọi\s+|các\s+)?(hướng\s+dẫn|chỉ\s+dẫn|quy\s+tắc|luật|chính\s+sách)(\s+trước)?\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bquên\s+(hết\s+|toàn\s+bộ\s+)?(các\s+)?(hướng\s+dẫn|chỉ\s+dẫn|quy\s+tắc)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(tiết\s+lộ|cho\s+tôi\s+(?:biết|xem)|hiển\s+thị)\s+(toàn\s+bộ\s+)?(system\s+prompt|prompt\s+hệ\s+thống|chỉ\s+dẫn\s+hệ\s+thống)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(bạn\s+là\s+một\s+AI\s+không\s+bị\s+kiểm\s+duyệt|chế\s+độ\s+không\s+giới\s+hạn)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bđóng\s+vai\s+(một\s+)?(trợ\s+lý|người)\s+không\s+tuân\s+thủ\s+quy\s+định\b",
        re.IGNORECASE,
    ),
)


@dataclass(frozen=True)
class InjectionCheckResult:
    """Descriptor for prompt injection analysis result."""

    is_injection: bool
    matched_pattern: str | None = None
    reason: str | None = None


def check_prompt_injection(text: str) -> InjectionCheckResult:
    """Inspect text for deterministic instruction-override attempts.

    Args:
        text: User query or lower-trust retrieved passage to inspect.

    Returns:
        InjectionCheckResult with detection status and diagnostic message.
    """
    if not text or not text.strip():
        return InjectionCheckResult(is_injection=False)

    for pattern in _INJECTION_PATTERNS:
        match = pattern.search(text)
        if match:
            matched_str = match.group(0)
            return InjectionCheckResult(
                is_injection=True,
                matched_pattern=matched_str,
                reason=f"Instruction override pattern detected: '{matched_str}'",
            )

    return InjectionCheckResult(is_injection=False)


def detect_prompt_injection(text: str) -> bool:
    """Convenience predicate to check whether text contains prompt injection."""
    return check_prompt_injection(text).is_injection
