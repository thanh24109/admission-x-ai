"""Unit tests for Commitment Guardrail (RB-09).

Validates detection of positive admission promises, paraphrases, and
avoidance of false positives on negated or cautionary statements.
"""

from app.ai.guardrails.commitment_guard import (
    CommitmentCheckResult,
    check_commitment,
    contains_forbidden_commitment,
)


def test_positive_forbidden_commitments_detected() -> None:
    """Verify that explicit guarantee phrases are flagged as violations."""
    positive_cases = [
        "Em yên tâm, 24 điểm là chắc chắn đỗ ngành CNTT.",
        "Nhà trường đảm bảo trúng tuyển cho các bạn nộp hồ sơ sớm.",
        "Chúng tôi cam kết trúng tuyển 100% cho thí sinh xét học bạ.",
        "Nộp hồ sơ đợt này là bao đậu luôn em nhé.",
        "Với số điểm này thì em chắc suất vào trường rồi.",
        "Em yên tâm sẽ đỗ vào ngành Kỹ thuật điện.",
        "Tỷ lệ 100% đỗ cho tất cả học sinh trường chuyên.",
        "Đăng ký là auto đỗ không cần lo lắng.",
        "Thầy khẳng định sẽ đỗ ngành Quản trị kinh doanh.",
        "Trường cam kết việc làm 100% sau khi tốt nghiệp với lương cao.",
    ]
    for case in positive_cases:
        res = check_commitment(case)
        assert res.has_violation is True, f"Failed to detect violation in: '{case}'"
        assert res.matched_phrase is not None
        assert contains_forbidden_commitment(case) is True


def test_negated_and_cautionary_statements_not_flagged() -> None:
    """Verify that negated sentences do not trigger false positive violations."""
    negated_cases = [
        "Nhà trường không đảm bảo trúng tuyển khi chưa có kết quả thi chính thức.",
        "Điểm học bạ cao nhưng chưa chắc chắn đỗ, em cần chờ điểm chuẩn.",
        "Hội đồng tuyển sinh không cam kết trúng tuyển đối với bất kỳ thí sinh nào.",
        "Trường Đại học Điện lực không bao giờ cam kết trúng tuyển trước kỳ thi.",
        "Điểm chuẩn chưa được công bố nên khó có thể chắc chắn đỗ.",
        "Không thể khẳng định 100% trúng tuyển vào thời điểm này.",
        "Nhà trường không có chuyện bao đậu hay ưu tiên ngoài quy chế.",
    ]
    for case in negated_cases:
        res = check_commitment(case)
        assert res.has_violation is False, f"False positive detected in negated case: '{case}'"
        assert res.is_negated is True or res.matched_phrase is None
        assert contains_forbidden_commitment(case) is False


def test_benign_admissions_information_clean() -> None:
    """Verify that standard factual statements pass cleanly."""
    clean_cases = [
        "Trường Đại học Điện lực tuyển sinh 38 ngành đào tạo đại học chính quy.",
        "Thông tin tuyển sinh năm 2026 sẽ được cập nhật trên cổng thông tin chính thức.",
        "Thí sinh cần nộp hồ sơ đăng ký xét tuyển theo đúng thời gian quy định.",
        "Chỉ tiêu ngành Công nghệ thông tin năm trước là 450 sinh viên.",
        "",
        "   ",
    ]
    for case in clean_cases:
        res = check_commitment(case)
        assert res.has_violation is False
        assert contains_forbidden_commitment(case) is False


def test_check_commitment_result_structure() -> None:
    """Verify structured output fields of check_commitment."""
    text = "Em chắc chắn đỗ rồi nhé!"
    res = check_commitment(text)
    assert isinstance(res, CommitmentCheckResult)
    assert res.has_violation is True
    assert "chắc chắn đỗ" in res.matched_phrase.lower()
    assert res.is_negated is False
    assert "Forbidden admission guarantee detected" in res.reason


def test_mixed_negated_and_positive_guarantees() -> None:
    """Regression test: Negated guarantee early in text must NOT mask subsequent positive guarantee.

    Verifies different phrase orderings and clause boundary isolation.
    """
    mixed_violation_cases = [
        # Negated first, positive second (the exact review finding case)
        "Nhà trường không cam kết trúng tuyển. Nhưng em chắc chắn đỗ.",
        # Positive first, negated second
        "Em chắc chắn đỗ. Nhưng nhà trường không cam kết trúng tuyển.",
        # Negated first, positive second in contrastive comma clause
        "Nhà trường không cam kết trúng tuyển, nhưng em chắc chắn đỗ.",
        # Positive first, negated second in contrastive clause
        "Em chắc chắn đỗ, tuy nhiên nhà trường không cam kết trúng tuyển.",
        # Complex multi-clause sentence
        "Mặc dù trường không cam kết trúng tuyển, bạn nộp hồ sơ sớm là bao đậu.",
        # Multiple clauses with positive guarantee after newline
        "Hội đồng tuyển sinh không cam kết trúng tuyển.\nEm yên tâm sẽ đỗ vào ngành Kỹ thuật điện.",
    ]
    for case in mixed_violation_cases:
        res = check_commitment(case)
        assert res.has_violation is True, f"Failed to detect positive guarantee in mixed text: '{case}'"
        assert contains_forbidden_commitment(case) is True

    # Multi-match text where ALL occurrences are properly negated
    all_negated_cases = [
        "Nhà trường không cam kết trúng tuyển và không bao giờ khẳng định sẽ đỗ.",
        "Điểm chuẩn chưa công bố nên không thể chắc chắn đỗ và cũng không đảm bảo trúng tuyển.",
        "Trường tuyệt đối không cam kết trúng tuyển và hoàn toàn không bao đậu.",
    ]
    for case in all_negated_cases:
        res = check_commitment(case)
        assert res.has_violation is False, f"False positive in all-negated multi-match: '{case}'"
        assert res.is_negated is True
        assert contains_forbidden_commitment(case) is False
