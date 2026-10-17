"""Unit tests for PII Guardrail (RB-10).

Validates detection and deterministic redaction of Vietnamese phone numbers,
emails, and Citizen Identification (CCCD/CMND) numbers.
"""

from app.ai.guardrails.pii import (
    ALLOWED_PROFILE_FIELDS,
    PIIType,
    contains_pii,
    detect_pii,
    mask_pii,
)


def test_allowed_profile_fields_preserved() -> None:
    """Verify legacy allowlist set is preserved."""
    assert "interested_programs" in ALLOWED_PROFILE_FIELDS
    assert "study_preferences" in ALLOWED_PROFILE_FIELDS


def test_detect_phone_numbers() -> None:
    """Verify Vietnamese phone formats are detected and categorized."""
    cases = [
        "Số điện thoại của em là 0912345678 ạ",
        "Liên hệ qua số +84987654321",
        "Gọi cho em theo số 038.123.4567 nhé",
        "Hotline: 0912 345 678",
    ]
    for text in cases:
        matches = detect_pii(text)
        assert len(matches) >= 1
        assert any(m.pii_type == PIIType.PHONE for m in matches)
        assert contains_pii(text) is True


def test_detect_email_addresses() -> None:
    """Verify email patterns are detected and categorized."""
    text = "Vui lòng gửi đề án vào email thi.sinh.epu@gmail.com hoặc contact@epu.edu.vn."
    matches = detect_pii(text)
    assert len(matches) == 2
    assert all(m.pii_type == PIIType.EMAIL for m in matches)


def test_detect_cccd_and_cmnd() -> None:
    """Verify 12-digit CCCD and labeled 9-digit CMND numbers."""
    text_cccd = "Số CCCD của em là 001202012345, em muốn hỏi hồ sơ xét tuyển."
    matches_cccd = detect_pii(text_cccd)
    assert len(matches_cccd) == 1
    assert matches_cccd[0].pii_type == PIIType.CCCD

    text_cmnd = "Số CMND: 123456789 của thí sinh Nguyễn Văn A."
    matches_cmnd = detect_pii(text_cmnd)
    assert len(matches_cmnd) == 1
    assert matches_cmnd[0].pii_type == PIIType.CCCD


def test_mask_pii_multiple_types_preserves_surroundings() -> None:
    """Verify deterministic redaction with multiple PII occurrences."""
    text = (
        "Chào thầy, em tên Tuấn, SĐT 0912345678, email tuan2006@gmail.com, "
        "CCCD 001202012345, em muốn hỏi về ngành CNTT."
    )
    masked = mask_pii(text)

    # All sensitive values redacted
    assert "0912345678" not in masked
    assert "tuan2006@gmail.com" not in masked
    assert "001202012345" not in masked

    # Placeholders injected
    assert "[REDACTED_PHONE]" in masked
    assert "[REDACTED_EMAIL]" in masked
    assert "[REDACTED_CCCD]" in masked

    # Surrounding context preserved
    assert "Chào thầy, em tên Tuấn" in masked
    assert "em muốn hỏi về ngành CNTT" in masked


def test_clean_text_remains_unchanged() -> None:
    """Verify benign text without PII is not altered."""
    clean_text = "Học phí ngành Kỹ thuật điện năm 2026 là bao nhiêu tín chỉ?"
    assert detect_pii(clean_text) == []
    assert contains_pii(clean_text) is False
    assert mask_pii(clean_text) == clean_text
