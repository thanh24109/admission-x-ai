"""Reusable Vietnamese fallback library for safe, deterministic responses.

Follows docs/ai/phase-1/decision-matrix.md and Task 4 Section 6 requirements.
All responses are polite, deterministic, factual, and free of hallucinations or PII.
"""

from __future__ import annotations

from enum import Enum


class FallbackReasonCode(str, Enum):
    """Standardized machine-readable reason codes for fallbacks and abstentions."""

    BACKEND_UNAVAILABLE = "BACKEND_UNAVAILABLE"
    TOOL_UNAVAILABLE = "TOOL_UNAVAILABLE"
    INSUFFICIENT_OFFICIAL_EVIDENCE = "INSUFFICIENT_OFFICIAL_EVIDENCE"
    UNVERIFIED_CLAIM = "UNVERIFIED_CLAIM"
    CITATION_VERIFICATION_PENDING = "CITATION_VERIFICATION_PENDING"
    CONFLICTING_EVIDENCE = "CONFLICTING_EVIDENCE"
    OUTDATED_EVIDENCE = "OUTDATED_EVIDENCE"
    PROGRAM_AMBIGUOUS = "PROGRAM_AMBIGUOUS"
    PROGRAM_NOT_FOUND = "PROGRAM_NOT_FOUND"
    PROMPT_INJECTION_DETECTED = "PROMPT_INJECTION_DETECTED"
    PRIVACY_VIOLATION = "PRIVACY_VIOLATION"
    OUTPUT_VALIDATION_FAILED = "OUTPUT_VALIDATION_FAILED"
    POLICY_EVALUATION_UNAVAILABLE = "POLICY_EVALUATION_UNAVAILABLE"
    INTERNAL_ERROR = "INTERNAL_ERROR"


# Static, deterministic Vietnamese fallback messages.
# Invariant: Never interpolate raw unredacted user text or fabricate admissions facts.
FALLBACK_TEMPLATES: dict[FallbackReasonCode, str] = {
    FallbackReasonCode.BACKEND_UNAVAILABLE: (
        "Hệ thống tư vấn tuyển sinh hiện chưa thể kết nối tới cơ sở dữ liệu. Vui lòng thử lại sau ít phút."
    ),
    FallbackReasonCode.TOOL_UNAVAILABLE: (
        "Hệ thống tra cứu tài liệu tuyển sinh EPU hiện tạm thời gián đoạn. Thí sinh vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ."
    ),
    FallbackReasonCode.INSUFFICIENT_OFFICIAL_EVIDENCE: (
        "Hiện tôi chưa có đủ thông tin chính thức đã được xác minh từ Đề án tuyển sinh của Trường Đại học Điện lực để trả lời chính xác nội dung này. Thí sinh có thể theo dõi các thông báo chính thức tại Cổng thông tin tuyển sinh EPU."
    ),
    FallbackReasonCode.UNVERIFIED_CLAIM: (
        "Nội dung này chưa được đối soát và chứng thực hoàn toàn với văn bản chính thức của Trường Đại học Điện lực (EPU). Để đảm bảo tính chính xác, tôi chưa thể cung cấp câu trả lời chi tiết cho phần thông tin này."
    ),
    FallbackReasonCode.CITATION_VERIFICATION_PENDING: (
        "Tài liệu tham khảo đang trong quá trình đối soát phê duyệt trên Hệ thống EPU và chưa hoàn tất xác thực. Vui lòng tra cứu văn bản gốc tại Cổng thông tin tuyển sinh."
    ),
    FallbackReasonCode.CONFLICTING_EVIDENCE: (
        "Hiện có sự khác biệt giữa các nguồn tài liệu tuyển sinh về nội dung bạn hỏi. Hệ thống không tự ý đưa ra kết luận; bạn có thể gửi yêu cầu để được cán bộ tuyển sinh EPU giải đáp cụ thể."
    ),
    FallbackReasonCode.OUTDATED_EVIDENCE: (
        "Thông tin hiện có thuộc các năm tuyển sinh trước và chưa được cập nhật chính thức cho mùa tuyển sinh mới. Vui lòng chờ công bố Đề án tuyển sinh chính thức từ Hội đồng tuyển sinh EPU."
    ),
    FallbackReasonCode.PROGRAM_AMBIGUOUS: (
        "Câu hỏi của bạn có thể liên quan đến nhiều ngành đào tạo khác nhau tại Trường Đại học Điện lực. Bạn vui lòng nêu rõ tên ngành hoặc mã ngành cụ thể (ví dụ: Công nghệ thông tin - 7480201) để tôi có thể hỗ trợ chính xác nhất."
    ),
    FallbackReasonCode.PROGRAM_NOT_FOUND: (
        "Hệ thống chưa tìm thấy thông tin ngành đào tạo phù hợp trong danh mục đào tạo của Trường Đại học Điện lực. Bạn vui lòng kiểm tra lại tên ngành hoặc mã ngành cần tra cứu."
    ),
    FallbackReasonCode.PROMPT_INJECTION_DETECTED: (
        "Yêu cầu của bạn không phù hợp với phạm vi tư vấn tuyển sinh của Trường Đại học Điện lực. Tôi chỉ hỗ trợ các câu hỏi liên quan đến đề án, chương trình đào tạo và thủ tục tuyển sinh của Nhà trường."
    ),
    FallbackReasonCode.PRIVACY_VIOLATION: (
        "Để bảo vệ an toàn thông tin cá nhân của thí sinh, vui lòng không chia sẻ mã định danh cá nhân, số CCCD/CMND, số điện thoại hoặc mật khẩu vào khung trò chuyện. Hệ thống không lưu trữ hoặc xử lý các dữ liệu nhạy cảm này."
    ),
    FallbackReasonCode.OUTPUT_VALIDATION_FAILED: (
        "Câu trả lời chưa đáp ứng đầy đủ tiêu chuẩn kiểm định an toàn và chính xác của Nhà trường nên đã được tạm giữ lại. Vui lòng đặt lại câu hỏi hoặc liên hệ cán bộ tuyển sinh EPU."
    ),
    FallbackReasonCode.POLICY_EVALUATION_UNAVAILABLE: (
        "Không thể hoàn tất quy trình thẩm định chính sách tư vấn tuyển sinh EPU. Để đảm bảo tính chính xác, Hệ thống tạm thời không thể đưa ra câu trả lời."
    ),
    FallbackReasonCode.INTERNAL_ERROR: (
        "Hệ thống tư vấn hiện chưa thể xử lý yêu cầu. Vui lòng thử lại sau."
    ),
}


def get_safe_fallback_text(
    reason_code: str | FallbackReasonCode,
    *,
    custom_detail: str | None = None,
) -> str:
    """Retrieve the standard safe Vietnamese fallback text for a given reason code.

    Guarantees no raw PII interpolation and no fabricated admissions commitments.
    """
    if isinstance(reason_code, str):
        try:
            code_enum = FallbackReasonCode(reason_code)
        except ValueError:
            return FALLBACK_TEMPLATES[FallbackReasonCode.INTERNAL_ERROR]
    else:
        code_enum = reason_code

    template = FALLBACK_TEMPLATES.get(
        code_enum, FALLBACK_TEMPLATES[FallbackReasonCode.INTERNAL_ERROR]
    )

    if custom_detail and code_enum == FallbackReasonCode.PROGRAM_AMBIGUOUS:
        # Only attach safe sanitized hints without echoing raw input
        return f"{template}\n\nGợi ý: {custom_detail}"

    return template
