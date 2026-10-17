# BÁO CÁO TRIỂN KHAI PHASE 1 — TASK 4: DETERMINISTIC DECISION FLOW, SAFE FALLBACK & FRONTEND P0 REMEDIATION

**Dự án:** Cổng thông tin Tuyển sinh Trường Đại học Điện lực (EPU) — Hệ thống Trợ lý AI (Admission X AI)  
**Nhánh:** `feat/phase-1-task-4-decision-safe-fallback`  
**Giai đoạn:** Phase 1 — Prompting, Policy, Response Contracts & Deterministic Decision Flow  
**Trạng thái:** HOÀN THÀNH (Ready for Independent Diff Review)  

---

## 1. Tổng quan triển khai Task 4

Task 4 hoàn thiện tầng ra quyết định tất định (Deterministic Decision Layer) kết nối giữa hệ thống thẩm định chính sách (Task 2 `RulebaseEngine`) và các khế ước phản hồi/trích dẫn (Task 3 `AIResponseEnvelope`, `CitationRecord`).

Đặc biệt, Task 4 đã giải quyết triệt để lỗ hổng bảo mật cấp cao nhất (**P0 Frontend Security Remediation**): xóa bỏ hoàn toàn cơ chế tạo câu trả lời tuyển sinh bịa đặt (học phí 2026, điểm chuẩn, phương thức xét tuyển giả lập, trích dẫn PDF và liên kết `/tuyensinh` giả mạo) khi backend ngoại tuyến hoặc gặp sự cố.

### Nguyên tắc cốt lõi:
1. **Hoàn toàn tất định (Pure & Deterministic):** Không gọi LLM, không truy cập Supabase / pgvector, không gọi dynamic tool, không phụ thuộc vào LangGraph StateGraph đang chạy.
2. **Fail-Closed:** Mọi trường hợp thiếu bằng chứng kiểm chứng, lệch mốc thời gian tuyển sinh, hoặc nghi vấn claim grounding đều chuyển hướng sang cơ chế từ chối an toàn (`abstain`) hoặc fallback lịch sự.
3. **Phân tách ranh giới Handover:** Đề xuất kết nối cán bộ tuyển sinh (`handover_offered`) tuyệt đối KHÔNG tự động tạo ticket (`ticket_id = None`) khi chưa có sự đồng thuận được xác thực từ máy chủ.
4. **Trung thực ở Frontend:** Khi API lỗi, hiển thị thông báo lỗi tĩnh bằng tiếng Việt, không bịa đặt bất kỳ thông tin tuyển sinh nào.

---

## 2. Kết quả kiểm toán kho lưu trữ ban đầu (Initial Repository Audit)

1. **Khế ước Backend (Tasks 1, 2, 3):**
   - Đã được merge đầy đủ vào `main` (commit `d4dbb12`).
   - `apps/api/app/ai/rules/engine.py` và `evaluators.py` đã cung cấp 13 rule evaluators (RB-01 đến RB-13).
   - `apps/api/app/schemas/response_envelope.py` đã thiết lập các enums và mô hình khế ước chuẩn (`AnswerStatus`, `EvidenceStatus`, `SourceMode`, `HandoverInfo`, `AIResponseEnvelope`).
   - `apps/api/app/ai/rag/citations/verifier.py` đã thắt chặt xác thực danh mục tin cậy (`TrustedDocumentEntry`).
2. **Thực trạng P0 tại Frontend (`apps/web`):**
   - Trong `CandidateChatWorkspace.tsx`, khi gọi `/api/v1/chat` thất bại hoặc ngoại tuyến, hàm `setTimeout` đã sinh ra câu trả lời mô phỏng chứa các con số giả định về học phí EPU năm 2026 (`450.000đ - 550.000đ / tín chỉ`), điểm chuẩn (`21 - 24.5 điểm`) và trích dẫn giả mạo (`/post/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2025`, `Trang 15 - 18`, `4.2 MB`).
   - Khi API thành công, frontend tự động gán nhãn cứng `page: "Trang tài liệu"`, `fileSize: "Chính thức"`, `url: "/tuyensinh"`.
   - Trong `chatMockData.ts`, `initialChatMessages` khởi tạo hội thoại thí sinh bằng một câu hỏi và câu trả lời mô phỏng về phương thức tuyển sinh 2026.
   - Trong `ChatCitationCard.tsx`, thuộc tính liên kết mặc định fallback về `/tuyensinh`.
   - Trong `CandidateChatWorkspace.tsx`, `candidate_id` mặc định sử dụng `"mock-candidate-001"` thay vì `undefined` khi thí sinh chưa đăng nhập.

---

## 3. Kiến trúc Tầng Ra Quyết Định Tất Định (Decision Layer Architecture)

Mô-đun mới được tổ chức độc lập tại `apps/api/app/ai/decision/`:

```text
apps/api/app/ai/decision/
├── __init__.py      # Xuất khẩu DecisionEngine, models, fallback library, mappings
├── models.py        # DecisionAction, DecisionResult với semantic invariants validator
├── fallback.py      # FallbackReasonCode enum và thư viện mẫu câu phản hồi tiếng Việt chuẩn mực
├── engine.py        # DecisionEngine thực hiện 6 giai đoạn ra quyết định theo decision-matrix.md
└── mappings.py      # assemble_response_envelope chuyển đổi DecisionResult sang AIResponseEnvelope
```

### 3.1. Mô hình dữ liệu `DecisionResult`
Kế thừa và tái sử dụng các enum chuẩn từ Task 3, đảm bảo không có mâu thuẫn trạng thái:
- `decision: DecisionAction` (`ANSWER`, `PARTIAL_ANSWER`, `CLARIFY`, `ABSTAIN`, `SAFE_FALLBACK`, `OFFER_HANDOVER`, `BLOCK`).
- `answer_status: AnswerStatus` (`answered`, `partial`, `clarification_needed`, `insufficient_evidence`, `handover_offered`, `error`, `rejected`, `out_of_scope`).
- `evidence_status: EvidenceStatus` (`supported`, `partially_supported`, `unsupported`, `conflicting`, `not_applicable`).
- `source_mode: SourceMode` (`official_epu`, `general`, `mixed`, `none`, `out_of_scope`).
- `reason_code: str` (mã chẩn đoán định danh lý do).
- `is_safe_to_answer: bool` (cờ an toàn).
- `requires_clarification: bool`.
- `requires_handover_confirmation: bool`.
- `missing_aspects: list[str]`.
- `policy_violations: list[str]`.
- `safe_response_text: str | None`.
- `handover: HandoverInfo`.
- `resolved_major_codes: list[str]`.
- `citations: list[CitationRecord]`.
- `trace_metadata: dict[str, Any]`.

Ràng buộc bất biến (`validate_semantic_invariants`):
- `is_safe_to_answer=True` KHÔNG ĐƯỢC phép đi cùng `BLOCK`, `SAFE_FALLBACK`, hoặc khi có `policy_violations`.
- `requires_clarification=True` không được phép đánh dấu `is_safe_to_answer=True`.
- `answer_status` là `INSUFFICIENT_EVIDENCE` hoặc `ERROR` bắt buộc danh sách trích dẫn `citations` phải rỗng.
- `source_mode == GENERAL` không được phép chứa trích dẫn cấp `official_epu`.
- `DecisionResult` tuyệt đối không được tự ý tạo `handover.ticket_id`.

---

## 4. Triển khai Ma trận Ra quyết định (Decision Matrix Implementation)

Thực hiện nghiêm ngặt theo vòng đời 6 bước được tài liệu hóa tại `docs/ai/phase-1/decision-matrix.md`:

```text
YÊU CẦU CỦA THÍ SINH
        |
        v
1. KIỂM TRA TÌNH TRẠNG BACKEND / TOOL
        |-- Ngoại tuyến? --> SAFE_FALLBACK (AnswerStatus.ERROR, reason: BACKEND_UNAVAILABLE)
        v
2. KIỂM ĐỊNH AN TOÀN ĐẦU VÀO & QUYỀN RIÊNG TƯ
        |-- Prompt Injection (RB-11)? --> BLOCK (AnswerStatus.REJECTED, PROMPT_INJECTION_DETECTED)
        |-- Lộ PII cá nhân (RB-10)?  --> BLOCK (AnswerStatus.REJECTED, PRIVACY_VIOLATION)
        |-- Ngoài phạm vi EPU?        --> SAFE_FALLBACK (AnswerStatus.OUT_OF_SCOPE)
        v
3. XỬ LÝ ĐỘ MƠ HỒ (AMBIGUITY RESOLUTION)
        |-- Mơ hồ ngành/ý định (RB-03)? --> CLARIFY (AnswerStatus.CLARIFICATION_NEEDED, PROGRAM_AMBIGUOUS)
        |-- Ngành không tồn tại (RB-02)? --> SAFE_FALLBACK (AnswerStatus.INSUFFICIENT_EVIDENCE, PROGRAM_NOT_FOUND)
        v
4. PHÂN LOẠI NGUỒN & ĐÁNH GIÁ BẰNG CHỨNG XÁC THỰC
        |-- Kiến thức đại cương (RB-08)?
        |     |-- Có gán ghép sai EPU? --> SAFE_FALLBACK (UNVERIFIED_CLAIM)
        |     +-- Khái niệm chung?    --> ANSWER (AnswerStatus.ANSWERED, GENERAL, 0 citations)
        |-- Bằng chứng xung đột?      --> ABSTAIN (INSUFFICIENT_EVIDENCE, CONFLICTING)
        |-- Bằng chứng lỗi thời (RB-05)? --> ABSTAIN (INSUFFICIENT_EVIDENCE, OUTDATED_EVIDENCE)
        |-- Thiếu bằng chứng (RB-01)?  --> ABSTAIN (INSUFFICIENT_EVIDENCE, INSUFFICIENT_OFFICIAL_EVIDENCE)
        |-- Bằng chứng một phần (RB-07)?
        |     |-- Chưa kiểm chứng claim? --> SAFE_FALLBACK (UNVERIFIED_CLAIM)
        |     +-- Đã kiểm chứng phần hỗ trợ? --> PARTIAL_ANSWER (AnswerStatus.PARTIAL)
        |-- Bằng chứng đầy đủ nhưng claim chưa xác thực? --> SAFE_FALLBACK (UNVERIFIED_CLAIM)
        v
5. KIỂM ĐỊNH CHÍNH SÁCH ĐẦU RA
        |-- Cam kết / hứa hẹn trúng tuyển (RB-09)? --> BLOCK (AnswerStatus.REJECTED, OUTPUT_VALIDATION_FAILED)
        |-- Trích dẫn lỗi / chưa phê duyệt (RB-06)? --> SAFE_FALLBACK (CITATION_VERIFICATION_PENDING)
        v
6. XEM XÉT CHUYỂN TIẾP CÁN BỘ (HANDOVER)
        |-- Thí sinh yêu cầu cán bộ (RB-12)? --> OFFER_HANDOVER (AnswerStatus.HANDOVER_OFFERED, ticket_id=None)
        +-- Vượt qua toàn bộ?                --> ANSWER (AnswerStatus.ANSWERED, SUPPORTED, OFFICIAL_EPU)
```

---

## 5. Ma trận Độ phủ Tình huống (Scenario Coverage Matrix)

| Kịch bản | Tình huống nghiệp vụ | Quyết định (`DecisionAction`) | Trạng thái (`AnswerStatus`) | Trạng thái Bằng chứng | Handover | Test Case kiểm chứng |
|---|---|---|---|---|---|---|
| **A** | Câu hỏi chính thức EPU có bằng chứng và claim đã xác minh | `ANSWER` | `answered` | `supported` | Không | `test_scenario_a_verified_official_response` |
| **A-Fail** | Bằng chứng có nhưng claim chưa xác minh | `SAFE_FALLBACK` | `insufficient_evidence` | `unsupported` | Không | `test_scenario_a_unverified_official_response_fails_closed` |
| **B** | Câu hỏi kiến thức chung giáo dục | `ANSWER` | `answered` | `not_applicable` | Không | `test_scenario_b_pure_general_knowledge` |
| **B-Fail** | Kiến thức chung nhưng tự ý gán ghép EPU | `SAFE_FALLBACK` | `insufficient_evidence` | `not_applicable` | Không | `test_scenario_b_general_knowledge_with_unverified_attribution_blocked` |
| **C** | Câu hỏi hỗn hợp (ngành nghề + EPU) | `ANSWER` | `answered` | `supported` | Không | `test_scenario_c_mixed_answer_mode` |
| **D** | Bằng chứng một phần và claim đã xác minh | `PARTIAL_ANSWER` | `partial` | `partially_supported` | Không | `test_scenario_d_verified_partial_evidence` |
| **D-Fail** | Bằng chứng một phần nhưng claim chưa xác minh | `SAFE_FALLBACK` | `insufficient_evidence` | `partially_supported` | Không | `test_scenario_d_partial_evidence_without_claim_verification_falls_closed` |
| **E** | Mơ hồ ngành đào tạo hoặc nguyện vọng | `CLARIFY` | `clarification_needed` | `not_applicable` | Không | `test_scenario_e_ambiguous_major_resolution` |
| **E-404** | Ngành không có trong danh mục EPU | `SAFE_FALLBACK` | `insufficient_evidence` | `unsupported` | Không | `test_scenario_e_program_not_found` |
| **F** | Thiếu bằng chứng chính thức EPU | `ABSTAIN` | `insufficient_evidence` | `unsupported` | Đề xuất | `test_scenario_f_missing_official_evidence` |
| **G1** | Tài liệu chính thức mâu thuẫn số liệu | `ABSTAIN` | `insufficient_evidence` | `conflicting` | Đề xuất | `test_scenario_g_conflicting_evidence` |
| **G2** | Tài liệu cũ / lệch năm tuyển sinh | `ABSTAIN` | `insufficient_evidence` | `unsupported` | Đề xuất | `test_scenario_g_outdated_stale_evidence` |
| **H** | Tấn công Prompt Injection | `BLOCK` | `rejected` | `not_applicable` | Không | `test_scenario_h_prompt_injection_blocked` |
| **I** | Vi phạm PII / gửi số CCCD, mật khẩu | `BLOCK` | `rejected` | `not_applicable` | Không | `test_scenario_i_pii_violation_blocked` |
| **J** | Máy chủ Backend / Tool ngoại tuyến | `SAFE_FALLBACK` | `error` | `not_applicable` | Không | `test_scenario_j_backend_unavailable` |
| **K** | Thí sinh chủ động xin gặp tư vấn viên | `OFFER_HANDOVER` | `handover_offered` | `supported` | Đề xuất (chưa tạo vé) | `test_scenario_k_user_requested_handover_offered_without_ticket` |

---

## 6. Thư viện Phản hồi An toàn Tiếng Việt (Safe Fallback Library)

Toàn bộ các mẫu câu phản hồi dự phòng được tập trung tại `apps/api/app/ai/decision/fallback.py`:
- `BACKEND_UNAVAILABLE`: Thông báo hệ thống tư vấn chưa thể kết nối tới cơ sở dữ liệu.
- `TOOL_UNAVAILABLE`: Thông báo hệ thống tra cứu tài liệu tạm thời gián đoạn.
- `INSUFFICIENT_OFFICIAL_EVIDENCE`: Giải thích rõ chưa có đủ thông tin từ Đề án tuyển sinh chính thức của EPU và hướng dẫn theo dõi Cổng thông tin tuyển sinh.
- `UNVERIFIED_CLAIM`: Giải thích nội dung chưa được chứng thực đầy đủ với văn bản chính thức của Nhà trường.
- `CITATION_VERIFICATION_PENDING`: Tài liệu tham khảo đang chờ phê duyệt trên hệ thống EPU.
- `CONFLICTING_EVIDENCE`: Nêu rõ sự khác biệt giữa các nguồn tài liệu và không tự ý đưa ra kết luận.
- `OUTDATED_EVIDENCE`: Giải thích thông tin thuộc năm cũ và chưa áp dụng chính thức cho mùa tuyển sinh mới.
- `PROGRAM_AMBIGUOUS`: Đề nghị thí sinh nêu rõ tên ngành hoặc mã ngành cụ thể (kèm gợi ý chuẩn).
- `PROGRAM_NOT_FOUND`: Thông báo không tìm thấy ngành trong danh mục đào tạo của EPU.
- `PROMPT_INJECTION_DETECTED`: Từ chối lịch sự, xác định rõ phạm vi chỉ hỗ trợ tư vấn tuyển sinh EPU.
- `PRIVACY_VIOLATION`: Cảnh báo không chia sẻ CCCD/CMND, số điện thoại hoặc mật khẩu vào khung chat.
- `OUTPUT_VALIDATION_FAILED`: Tạm giữ câu trả lời không đạt tiêu chuẩn an toàn tuyển sinh.
- `POLICY_EVALUATION_UNAVAILABLE`: Báo lỗi gián đoạn thẩm định chính sách.
- `INTERNAL_ERROR`: Thông báo hệ thống chưa thể xử lý yêu cầu.

---

## 7. Chi tiết Khắc phục Lỗ hổng Frontend P0 (Frontend P0 Remediation)

### 7.1. Loại bỏ hoàn toàn Simulated RAG Fallback trong `CandidateChatWorkspace.tsx`
- Xóa bỏ triệt để khối `setTimeout` mô phỏng sinh câu trả lời bịa đặt khi backend ngoại tuyến.
- Khi `fetch('/api/v1/chat')` gặp lỗi mạng, HTTP 4xx/5xx, timeout hoặc JSON không hợp lệ:
  - Lập tức hiển thị thông báo lỗi tĩnh bằng tiếng Việt từ `createSafeErrorAssistantMessage()`:
    *"Hệ thống tư vấn hiện chưa thể xử lý yêu cầu. Vui lòng thử lại sau."*
  - Tuyệt đối không sinh ra bất kỳ con số học phí, điểm chuẩn, trích dẫn, hoặc liên kết giả nào.
- Bổ sung thanh công cụ **"Thử lại" (Retry Mechanism)**:
  - Hiển thị nút "Thử lại" khi yêu cầu thất bại.
  - Khi người dùng nhấn "Thử lại", hệ thống gửi lại nội dung câu hỏi trước đó mà **không tạo thêm bong bóng tin nhắn trùng lặp** của người dùng trong danh sách trò chuyện.
- Xử lý xung đột bất đồng bộ (Race Conditions / Conversation Reset):
  - Sử dụng `conversationResetIdRef` và `AbortController`.
  - Khi thí sinh nhấn "Cuộc trò chuyện mới" (`handleNewConversation`), yêu cầu đang gửi dở sẽ bị hủy (`abort()`) và mọi phản hồi đến muộn sẽ bị loại bỏ, không bao giờ ghi đè lên cuộc hội thoại mới.
- Khắc phục `candidate_id`:
  - Loại bỏ hoàn toàn giá trị mặc định `"mock-candidate-001"`. Nếu thí sinh là khách chưa đăng nhập (`user?.id` không tồn tại), trường `candidate_id` sẽ là `undefined` và được loại bỏ khỏi JSON payload.

### 7.2. Chuẩn hóa `chatMockData.ts`
- Làm sạch `initialChatMessages`:
  - Xóa bỏ `msg-user-01` và câu trả lời mô phỏng `msg-assistant-01` chứa thông tin tuyển sinh 2026 tự chế.
  - Chỉ giữ lại duy nhất 1 tin nhắn chào đón trung tính (`msg-welcome-01`) giới thiệu các chủ đề có thể hỗ trợ.
- Chuẩn hóa `chatRelatedDocuments`:
  - Xóa bỏ các tiêu đề năm 2026 giả mạo liên kết lệch sang bài viết năm 2025.
  - Sử dụng các tiêu đề văn bản trung thực, khớp với đích đến thực tế của bài viết.

### 7.3. Thắt chặt hiển thị Trích dẫn trong `ChatCitationCard.tsx`
- Loại bỏ hoàn toàn fallback cứng `href={citation.url || "/tuyensinh"}`.
- Chỉ hiển thị nút liên kết "Xem tài liệu" khi `citation.url` là một URL an toàn, hợp lệ (`https://` hoặc đường dẫn nội bộ hợp lệ).
- Nếu không có URL, hiển thị nhãn văn bản "Tài liệu đối chiếu" không thể bấm, không dẫn đến trang tuyển sinh chung.
- Không tự động thêm nhãn `"Trang tài liệu"` hoặc kích thước `"Chính thức"` nếu backend không trả về metadata tương ứng.

---

## 8. Danh sách tệp tin thay đổi (Changed Files)

### Backend:
1. `apps/api/app/ai/decision/__init__.py`: Module init xuất khẩu `DecisionEngine`, `DecisionResult`, `FallbackReasonCode`, `assemble_response_envelope`.
2. `apps/api/app/ai/decision/models.py`: Định nghĩa `DecisionAction` và `DecisionResult` kèm `validate_semantic_invariants`.
3. `apps/api/app/ai/decision/fallback.py`: Thư viện lý do và mẫu phản hồi dự phòng an toàn tiếng Việt.
4. `apps/api/app/ai/decision/engine.py`: Động cơ ra quyết định tất định 6 bước theo `decision-matrix.md`.
5. `apps/api/app/ai/decision/mappings.py`: Hàm `assemble_response_envelope` chuyển đổi sang khế ước Task 3.
6. `apps/api/tests/test_decision_engine.py`: 18 ca kiểm thử bao phủ toàn bộ các kịch bản A - K, thứ tự ưu tiên và bất biến.
7. `apps/api/tests/test_safe_fallback.py`: 6 ca kiểm thử kiểm tra mẫu câu tiếng Việt, chống PII và cam kết ảo.
8. `apps/api/tests/test_response_assembly.py`: 5 ca kiểm thử kiểm tra lắp ráp response envelope an toàn.

### Frontend:
9. `apps/web/src/lib/chatClient.ts`: Bộ hàm thuần túy phân tích cú pháp, thẩm định response, tạo tin nhắn lỗi tĩnh và làm sạch trích dẫn.
10. `apps/web/src/components/chat/CandidateChatWorkspace.tsx`: Loại bỏ simulated fallback, thêm retry không trùng lặp tin nhắn, hủy request khi reset chat, loại bỏ mock `candidate_id`.
11. `apps/web/src/components/chat/ChatCitationCard.tsx`: Loại bỏ `/tuyensinh` cứng và loại bỏ nhãn metadata giả mạo.
12. `apps/web/src/data/chatMockData.ts`: Xóa bỏ tin nhắn giả lập tuyển sinh 2026, giữ lại lời chào trung tính và tài liệu đối chiếu thật.
13. `apps/web/package.json`: Bổ sung script `"test": "node --test --experimental-strip-types tests/chatClient.test.ts"`.
14. `apps/web/tests/chatClient.test.ts`: Bộ kiểm thử 13 ca kiểm tra khế ước API frontend, lỗi mạng, HTTP 500, timeout, và loại trừ dữ liệu giả lập.

---

## 9. Kết quả Kiểm thử & Xác thực Mã (Validation Results)

### 9.1. Backend Validation

```bash
# 1. Toàn bộ kiểm thử Backend & Harness
python -m pytest apps/api/tests evals/harness/tests
============================= 166 passed in 7.62s =============================

# 2. Kiểm tra tĩnh Linter Backend
python -m ruff check apps/api
All checks passed!
```
*(Tăng từ 137 lên 166 test cases — 100% PASS, 0 thất bại, 0 cảnh báo lint)*.

### 9.2. Frontend Validation

```bash
# 1. Kiểm thử khế ước & xử lý lỗi Frontend (Node 24 native test runner)
npm --prefix apps/web test
▶ Frontend Chat API Contract & Error Handling Tests
  ✔ 1. Successfully parses authentic backend response (0.96ms)
  ✔ 2. Handles backend connection refused with safe static error message (1.74ms)
  ✔ 3. Handles backend HTTP 500 without fabricating admissions claims (0.35ms)
  ✔ 4. Handles backend timeout safely (0.14ms)
  ✔ 5. Throws on malformed JSON / non-object payload (0.66ms)
  ✔ 6. Throws on missing required 'answer' field (0.45ms)
  ✔ 7. Safely parses responses with empty citations list (0.20ms)
  ✔ 8. Omits untrusted URLs and does NOT default to /tuyensinh (0.32ms)
  ✔ 9. Guarantees no mock admissions answers under failure (0.34ms)
  ✔ 10. Does not manufacture fake page labels or file sizes (0.19ms)
  ✔ 11. Conversation reset state invariant: reset identifier invalidates in-flight responses (0.13ms)
  ✔ 12. Retry pattern handles message resend without duplication (0.15ms)
  ✔ 13. Production initial chat contains strictly 1 truthful welcome message (0.11ms)
✔ Frontend Chat API Contract & Error Handling Tests (7.21ms)
ℹ tests 13 | pass 13 | fail 0

# 2. Kiểm tra Lint Frontend
npm --prefix apps/web run lint
✔ No ESLint warnings or errors

# 3. Biên dịch Production Build Frontend
npm --prefix apps/web run build
✓ Compiled successfully in 13.4s
✓ Generating static pages (131/131)
```

---

## 10. Hạn chế đã biết (Known Limitations)

1. **Semantic Claim Grounding (Phase 6):** Tầng quyết định hiện tại chỉ kiểm tra trạng thái xác thực từ khế ước upstream (`claim_verification_status == 'verified'`). Việc chạy mô hình suy luận tự nhiên (NLI / Hallucination Detection) để so khớp từng câu văn bản với tài liệu sẽ được thực hiện tại Phase 6.
2. **LangGraph StateGraph Compilation (Phase 7):** `DecisionEngine` hoạt động như một thành phần độc lập (standalone engine); việc nhúng trực tiếp thành một node chính thức trong LangGraph StateGraph sẽ diễn ra ở Phase 7.
3. **Phân phối Tài liệu có Chữ ký số (Signed URLs):** Các liên kết URL trích dẫn hiện trỏ vào đường dẫn nội bộ hệ thống CMS; cơ chế tạo URL an toàn có thời hạn (presigned URLs từ Supabase Storage) sẽ được tích hợp trong giai đoạn tích hợp Storage.

---

## 11. Các hạng mục hoãn lại (Deferred Items & Justification)

- **Không tích hợp Supabase Vector Retrieval:** Thuộc phạm vi Phase 2/3 (Ingestion & Retrieval Pipeline).
- **Không triển khai LLM Inference:** Thuộc phạm vi Phase 4/5 (Generation & Prompt Orchestration).
- **Không tạo API `/api/v2/chat`:** Giữ nguyên tính tương thích ngược tuyệt đối với `/api/v1/chat` hiện tại.
- **Không cài đặt thêm thư viện frontend mới:** Tuân thủ quy tắc workspace Phase A (Frontend-only), tận dụng Node 24 `--experimental-strip-types` cho unit test frontend với 0 dependencies cài thêm.

---

## 12. Đánh giá Rủi ro còn lại (P0 / P1 / P2)

| Mức độ | Rủi ro | Tác động | Trạng thái sau Task 4 |
|---|---|---|---|
| **P0** | Frontend Mock Fallback bịa đặt điểm chuẩn / học phí 2026 | Thí sinh nhận thông tin sai lệch khi hệ thống mất kết nối | **ĐÃ GIẢI QUYẾT TRIỆT ĐỂ** (Xóa hoàn toàn fallback mô phỏng; hiển thị lỗi tĩnh, không sinh số liệu tuyển sinh) |
| **P1** | Đánh giá đối soát ngữ nghĩa claim-level chưa có mô hình ML | Bằng chứng tồn tại nhưng đoạn văn AI sinh có thể diễn đạt sai lệch nhỏ | Sẽ được giải quyết tại **Phase 6** (Claim Grounding Verifier) |
| **P2** | Định danh thí sinh khi chưa có session xác thực thật | Trò chuyện công khai có thể gửi `candidate_id` rỗng | Hệ thống đã xử lý an toàn bằng cách bỏ qua trường này, chờ tích hợp Supabase Auth ở **Phase B** |

---

## 13. Thông tin Git Commit

- **Nhánh hiện tại:** `feat/phase-1-task-4-decision-safe-fallback`
- **Khởi nguồn:** Từ đỉnh `origin/main` (commit `d4dbb12`)
- **Quy tắc tuân thủ:**
  - Không commit trực tiếp lên `main`.
  - Không tự ý merge nhánh.
  - Dừng lại sau khi hoàn thành Task 4, chờ review diff độc lập.
