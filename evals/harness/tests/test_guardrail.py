from ai.guardrails.commitment_guard import contains_forbidden_commitment

def test_forbidden_commitment_detection() -> None:
    assert contains_forbidden_commitment("Em chắc chắn đỗ")
    assert not contains_forbidden_commitment("Điểm chuẩn chưa được công bố")
