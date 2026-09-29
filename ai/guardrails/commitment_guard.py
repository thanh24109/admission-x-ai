FORBIDDEN_COMMITMENTS = (
    "chắc chắn đỗ",
    "100% trúng tuyển",
    "đảm bảo trúng tuyển",
)

def contains_forbidden_commitment(text: str) -> bool:
    lower = text.lower()
    return any(x in lower for x in FORBIDDEN_COMMITMENTS)
