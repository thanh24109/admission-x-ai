"""Unit tests for Vietnamese safe fallback library (Task 4).

Follows docs/ai/phase-1/decision-matrix.md and Task 4 Section 6.
"""

from app.ai.decision.fallback import (
    FALLBACK_TEMPLATES,
    FallbackReasonCode,
    get_safe_fallback_text,
)


def test_all_reason_codes_have_deterministic_templates():
    """Every reason code defined in FallbackReasonCode must have an explicit template."""
    for code in FallbackReasonCode:
        template = FALLBACK_TEMPLATES.get(code)
        assert template is not None, f"Missing template for {code}"
        assert len(template.strip()) > 10, f"Template for {code} is too short"
        assert "EPU" in template or "Trường Đại học Điện lực" in template or "Hệ thống" in template


def test_fallback_contains_no_hallucinated_commitments():
    """Fallback templates must never assert fake tuition values, cutoff scores, or guarantees."""
    forbidden_terms = [
        "450.000",
        "550.000",
        "21 - 24.5",
        "chắc chắn đỗ",
        "cam kết trúng tuyển",
        "học bổng 100%",
        "hạn chót ngày 30",
    ]
    for code, text in FALLBACK_TEMPLATES.items():
        for term in forbidden_terms:
            assert term not in text, f"Forbidden hallucinated term '{term}' found in {code}"


def test_fallback_contains_no_raw_pii_interpolation():
    """Fallback templates must be static strings, free of format interpolation placeholders."""
    for code, text in FALLBACK_TEMPLATES.items():
        assert "{" not in text and "}" not in text, f"Unescaped template brace in {code}"


def test_get_safe_fallback_text_with_string_and_enum():
    """get_safe_fallback_text handles both enum instances and valid string representations."""
    t1 = get_safe_fallback_text(FallbackReasonCode.BACKEND_UNAVAILABLE)
    t2 = get_safe_fallback_text("BACKEND_UNAVAILABLE")
    assert t1 == t2
    assert "chưa thể kết nối tới cơ sở dữ liệu" in t1


def test_get_safe_fallback_text_unknown_string_fails_to_internal_error():
    """Unknown reason codes gracefully fall back to INTERNAL_ERROR template."""
    text = get_safe_fallback_text("UNKNOWN_REASON_CODE_XYZ")
    assert text == FALLBACK_TEMPLATES[FallbackReasonCode.INTERNAL_ERROR]
    assert "chưa thể xử lý yêu cầu" in text


def test_get_safe_fallback_text_custom_detail_only_for_ambiguity():
    """Custom detail hint is strictly sanitized and attached only for PROGRAM_AMBIGUOUS."""
    t_ambiguous = get_safe_fallback_text(
        FallbackReasonCode.PROGRAM_AMBIGUOUS,
        custom_detail="Ngành CNTT (7480201) hoặc Kỹ thuật phần mềm (7480103)",
    )
    assert "Gợi ý: Ngành CNTT" in t_ambiguous

    t_backend = get_safe_fallback_text(
        FallbackReasonCode.BACKEND_UNAVAILABLE,
        custom_detail="Should not be appended",
    )
    assert "Should not be appended" not in t_backend
