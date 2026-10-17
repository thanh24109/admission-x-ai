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
- **Các commit:**
  1. `e906be4`: `feat(ai): implement deterministic decision flow and safe fallback` (Tầng quyết định tất định, thư viện fallback tiếng Việt, lắp ráp response envelope, 29 backend tests).
  2. `86ea714`: `fix(web): remediate frontend p0 admissions hallucination and add api contract tests` (Xóa bỏ simulated RAG fallback, chuẩn hóa mock data, chống giả mạo trích dẫn, retry không trùng tin nhắn, 13 frontend tests).
- **Quy tắc tuân thủ:**
  - Không commit trực tiếp lên `main`.
  - Không tự ý merge nhánh.
  - Dừng lại sau khi hoàn thành Task 4, chờ review diff độc lập. Không bắt đầu Task 5.

---

# Task 4.1 — Policy Bypass & Frontend Trust Boundary Fixes

## 1. Mục tiêu & Bối cảnh (Objectives & Review Context)

Sau khi hoàn thành Task 4 (`feat/phase-1-task-4-decision-safe-fallback`), bản kiểm tra độc lập tại commit `4051e88bfe711da08f246391513ac9502d690cdf` đưa ra kết luận **PASS WITH CHANGES**. Các lỗ hổng an toàn và biên giới tin cậy cần khắc phục gồm:

1. **P1 — DecisionEngine Policy Bypass:** Các nhánh General Knowledge và Partial Answer có khả năng cấp phép câu trả lời (`ANSWER`, `PARTIAL_ANSWER`) mà không đối soát đầy đủ `PolicyEvaluationReport`:
   - Vi phạm RB-08 (gắn quy kết tuyển sinh EPU vào tri thức chung) bị bỏ qua.
   - Vi phạm RB-09 (cam kết/hứa hẹn trúng tuyển) bị đánh giá sau các nhánh cấp phép câu trả lời.
   - Thất bại hoặc trạng thái chờ của RB-06 không chặn các câu trả lời chính thức không có bằng chứng.
   - Trả lời từng phần (`PARTIAL_ANSWER`) được cấp phép ngay cả khi các hạn mức (RB-04) hoặc trích dẫn (RB-06) chưa xác thực.
   - `is_safe_to_answer` không hoàn toàn đồng bộ với `report.is_safe_to_proceed`.
   - Chuỗi ký tự không tin cậy `"verified"` trên context tự cấp quyền trả lời bất chấp vi phạm chính sách.
2. **P1 — Frontend Citation Trust Boundaries:**
   - Client tự động điền `source: "Trường Đại học Điện lực (EPU)"` khi backend bỏ trống.
   - Client tự động gán `fileType: "pdf"` cho mọi trích dẫn không có định dạng file.
   - Chưa phân tách rõ ràng giữa thẩm định cú pháp URL (`isValidUrlSyntax`) và xác minh nguồn gốc chính thống (`isOfficialProvenanceUrl`).
   - Nút bấm xem tài liệu vẫn có thể nhấn được đối với các liên kết chưa xác minh.
3. **P1 — Loại bỏ Thẻ Tài liệu Mock Sản xuất (Unverified Document Cards):**
   - Danh sách `chatRelatedDocuments` trong `chatMockData.ts` giả mạo các bài viết CMS web (`/post/...`, `/page/...`) thành file PDF/DOCX với kích thước "Văn bản chính thức".
   - `ChatContextSidebar.tsx` chưa có trạng thái rỗng trung tính (neutral empty state).
4. **P2 — Tính nhất quán Vòng đời Quyết định & Yêu cầu:**
   - Loại bỏ chuỗi cứng `missing_aspects` về tuyển sinh khi context không chứa dữ liệu.
   - Ngăn chặn `assemble_response_envelope` bịa đặt câu trả lời hỗ trợ khi `verified_answer` bị thiếu.
   - Làm rõ trách nhiệm sinh `response_id` và quản lý `session_id`.

---

## 2. Các thay đổi Mã nguồn Thực tế (Actual Code Changes)

### 2.1. Backend — Khắc phục Policy Bypass trong `engine.py` & `mappings.py`
- **Đánh giá RB-09 Tiên quyết:** Đưa khối thẩm định RB-09 (Commitment Guard) lên trước toàn bộ các nhánh trả lời. Bất kỳ câu trả lời dự thảo nào chứa cam kết/hứa hẹn trúng tuyển (kể cả trong chế độ tri thức chung hay câu trả lời từng phần) đều lập tức bị `BLOCK` với `AnswerStatus.REJECTED`.
- **Khép kín Nhánh General Knowledge (RB-08):**
  - Kiểm tra kết quả `report.get_result("RB-08")`: Nếu `FAIL` hoặc `NOT_EVALUABLE`, hoặc `context.attribution_verified is False`, chuyển sang `SAFE_FALLBACK` với vi phạm `RB-08`.
  - Kiểm tra tính nhất quán: `report.is_safe_to_proceed` phải là `True` và `report.overall_outcome == RuleOutcome.PASS`.
- **Thắt chặt Nhánh Partial Answer (Scenario D):**
  - Yêu cầu toàn bộ các quy tắc trọng yếu áp dụng (RB-01, RB-04, RB-05, RB-06, RB-09) không được `FAIL` hoặc `NOT_EVALUABLE`.
  - `context.claim_verification_status` bắt buộc phải là `"verified"`, nhưng chuỗi này không được độc lập cấp quyền nếu báo cáo chính sách có vi phạm.
  - Trích xuất `missing_aspects` trung thực từ `context.extra_context.get("missing_aspects")`; nếu rỗng, trả về mảng rỗng `[]`, không bao giờ gán chuỗi cứng bịa đặt.
- **Thẩm định RB-06 (Citation Validity):** Nếu có trích dẫn nhưng kiểm tra danh mục chưa hoàn tất (`NOT_EVALUABLE`) hoặc thất bại (`FAIL`), hệ thống chuyển sang `SAFE_FALLBACK` với lý do `CITATION_VERIFICATION_PENDING`.
- **Đồng bộ `is_safe_to_answer`:** Đảm bảo `result.is_safe_to_answer == True` khi và chỉ khi `report.is_safe_to_proceed == True`. Mọi báo cáo chính sách mâu thuẫn (contradictory report) có `is_safe_to_proceed=False` đều lập tức đóng đường dẫn trả lời.
- **Bảo vệ `assemble_response_envelope` (`mappings.py`):**
  - Làm rõ trách nhiệm sinh mã: `response_id` do caller cung cấp để duy trì tương quan trace phân tán, hoặc tự động sinh UUID nếu khuyết; `session_id` do client session manager quản lý, không bao giờ tự bịa đặt.
  - INVARIANT: Nếu `decision_result.answer_status` là `ANSWERED` hoặc `PARTIAL` mà `verified_answer` bị thiếu (None hoặc rỗng), hàm ném ngoại lệ `ValueError`, triệt tiêu khả năng phát sinh câu trả lời bịa đặt.

### 2.2. Frontend — Thiết lập Biên giới Tin cậy Trích dẫn & URL
- **`apps/web/src/types/chat.ts`:**
  - Chuyển `fileType?: "pdf" | "docx" | "url" | "web"` thành trường tùy chọn (optional) trên cả `ChatCitation` và `RelatedDocumentItem`.
  - Bổ sung cờ `isVerifiedDestination?: boolean` trên `ChatCitation`.
- **`apps/web/src/lib/chatClient.ts`:**
  - Triển khai `isValidUrlSyntax(rawUrl: string): boolean`: Loại bỏ URL rỗng, chứa khoảng trắng, protocol-relative (`//evil.com`), và các giao thức nguy hiểm (`javascript:`, `data:`, `vbscript:`, `file:`, `blob:`).
  - Triển khai `isOfficialProvenanceUrl(rawUrl: string): boolean`: Tách biệt hoàn toàn việc kiểm tra cú pháp với việc xác minh nguồn gốc. Chỉ chấp nhận các đường dẫn nội bộ (`/post/...`, `/tuyensinh`), các tên miền chính thức của EPU (`*.epu.edu.vn`, `epu.edu.vn`), cổng Bộ GD&ĐT (`moet.gov.vn`), hoặc localhost môi trường phát triển.
  - Cập nhật `formatSafeCitation`:
    - KHÔNG BAO GIỜ gán mặc định `source: "Trường Đại học Điện lực (EPU)"`. Nếu backend không cung cấp, giữ nguyên `source: ""`.
    - KHÔNG BAO GIỜ gán mặc định `fileType: "pdf"`. Nếu backend không cung cấp, giữ nguyên `undefined`.
    - KHÔNG BAO GIỜ tự chế số trang hoặc dung lượng file.
- **`apps/web/src/components/chat/ChatCitationCard.tsx`:**
  - Biểu tượng huy hiệu tài liệu: Chỉ hiển thị huy hiệu đỏ `"PDF"` khi `fileType === "pdf"`, xanh `"DOC"` khi `fileType === "docx"`. Với các trường hợp khác hoặc không có định dạng, hiển thị biểu tượng tài liệu trung tính (`FileText`).
  - Nút xem tài liệu: Chỉ render liên kết có thể bấm (`<a>` hoặc `<Link>`) khi đích đến vừa có cú pháp hợp lệ vừa được chứng thực nguồn gốc chính thức (`isVerifiedDestination`). Nếu không, hiển thị nhãn tĩnh không thể nhấn `"Tài liệu đối chiếu"`.

### 2.3. Frontend — Xóa bỏ Tài liệu Mock Sản xuất
- **`apps/web/src/data/chatMockData.ts`:**
  - Đưa mảng `chatRelatedDocuments: RelatedDocumentItem[] = []` về trạng thái rỗng hoàn toàn, loại bỏ 4 thẻ tài liệu mock gán nhãn PDF cho bài viết web.
- **`apps/web/src/components/chat/ChatContextSidebar.tsx`:**
  - Bổ sung trạng thái rỗng trung tính: Khi `chatRelatedDocuments` rỗng, hiển thị thông báo trung tính:
    *"Chưa có tài liệu đính kèm cho phiên trò chuyện này."*
  - Giữ nguyên cấu trúc sidebar, chế độ sáng/tối (light/dark mode) và giao diện co giãn responsive.

---

## 3. Bộ Kiểm thử Hồi quy Bổ sung (Regression Test Suite)

### 3.1. Backend Tests (`apps/api/tests/test_decision_engine.py` & `test_response_assembly.py`)
1. `test_general_mode_with_rb08_fail_blocks_answer`: Draft câu trả lời tri thức chung chứa quy kết EPU trái phép -> SAFE_FALLBACK, `is_safe_to_answer=False`, vi phạm RB-08.
2. `test_general_mode_with_rb09_fail_blocks_answer`: Draft câu trả lời tri thức chung hứa hẹn trúng tuyển -> BLOCK, `is_safe_to_answer=False`, vi phạm RB-09.
3. `test_partial_evidence_with_rb06_not_evaluable_blocks_partial_answer`: Bằng chứng một phần nhưng trích dẫn đang chờ đối soát -> SAFE_FALLBACK (`CITATION_VERIFICATION_PENDING`).
4. `test_partial_evidence_with_rb04_fail_blocks_partial_answer`: Bằng chứng một phần nhưng draft khẳng định số tiền học phí/điểm chuẩn chưa thẩm định -> SAFE_FALLBACK, vi phạm RB-04.
5. `test_partial_evidence_with_temporal_failure_blocks_partial_answer`: Bằng chứng một phần nhưng năm tuyển sinh bị lệch (RB-05 FAIL) -> ABSTAIN, vi phạm RB-05.
6. `test_verified_legitimate_general_answer`: Tri thức chung thuần túy, nguồn gốc xác thực, không vi phạm -> ANSWER, `is_safe_to_answer=True`, không có trích dẫn EPU.
7. `test_verified_legitimate_partial_answer`: Bằng chứng một phần hợp lệ, claim và citation đã xác thực -> PARTIAL_ANSWER, `is_safe_to_answer=True`, bảo toàn `missing_aspects` từ upstream.
8. `test_contradictory_policy_report_blocks_answer`: Báo cáo chính sách mâu thuẫn (`is_safe_to_proceed=False`) -> Không cho phép ANSWER hay PARTIAL_ANSWER.
9. `test_no_fabricated_missing_aspects_when_upstream_empty`: Khi `extra_context` không có `missing_aspects`, kết quả trả về mảng rỗng `[]`, không bịa đặt khía cạnh tuyển sinh.
10. `test_no_fabricated_supported_answer_text_when_verified_answer_absent`: Lắp ráp response envelope ANSWERED/PARTIAL khi thiếu `verified_answer` ném `ValueError`.

### 3.2. Frontend Tests (`apps/web/tests/chatClient.test.ts`)
1. `Missing citation source`: Trích dẫn không có source -> Không tự động điền "Trường Đại học Điện lực (EPU)".
2. `Missing document type`: Trích dẫn không có fileType -> Không tự động điền "pdf".
3. `Invalid URL`: URL chứa khoảng trắng hoặc cú pháp sai -> Bị loại bỏ (`url === undefined`).
4. `Protocol-relative URL`: URL bắt đầu bằng `//` -> Bị từ chối (`isValidUrlSyntax === false`).
5. `Unsafe protocol`: URL chứa `javascript:`, `data:`, `vbscript:`, `file:` -> Bị từ chối.
6. `Unknown document URL`: Tách biệt cú pháp hợp lệ với kiểm tra nguồn gốc (`isOfficialProvenanceUrl === false`).
7. `Backend offline`: Kết nối bị từ chối -> Trả về thông điệp lỗi tĩnh, không sinh nội dung tuyển sinh.
8. `HTTP error`: Mã lỗi HTTP 500 -> Trả về thông điệp lỗi tĩnh an toàn.
9. `Timeout`: Hết thời gian chờ 15s -> Trả về thông điệp lỗi tĩnh an toàn.
10. `Malformed JSON`: Dữ liệu không phải object -> Ném lỗi `Invalid response`.
11. `New conversation during request`: Reset cuộc hội thoại vô hiệu hóa phản hồi đang trên đường truyền.
12. `Retry without duplicate user messages`: Thử lại không nhân đôi tin nhắn người dùng trong thread.
13. `No production mock document metadata`: `chatRelatedDocuments` có độ dài bằng 0; không có thẻ bài viết CMS nào bị gán nhãn PDF/DOCX giả mạo.

---

## 4. Kết quả Xác thực Thực tế (Exact Validation Execution)

```bash
# 1. Backend Pytest & Evaluation Harness
python -m pytest apps/api/tests evals/harness/tests
============================ 176 passed in 13.78s =============================
Agent-Harness: 7 passed, 0 failed

# 2. Backend Ruff Static Linter
python -m ruff check apps/api
All checks passed!

# 3. Frontend Unit Tests (Node 24 test runner)
npm --prefix apps/web test
▶ Frontend Chat API Contract & Error Handling Tests
  ✔ 1. Successfully parses authentic backend response (4.02ms)
  ✔ 2. Handles backend offline / connection refused with safe static error message (2.34ms)
  ✔ 3. Handles backend HTTP error without fabricating admissions claims (2.04ms)
  ✔ 4. Handles backend timeout safely (1.03ms)
  ✔ 5. Throws on malformed JSON / non-object payload (2.75ms)
  ✔ 6. Throws on missing required 'answer' field (1.41ms)
  ✔ 7. Safely parses responses with empty citations list (0.47ms)
  ✔ 8. Never defaults missing citation source to 'Trường Đại học Điện lực (EPU)' (0.66ms)
  ✔ 9. Never defaults missing document type to PDF (1.54ms)
  ✔ 10. Rejects invalid and malformed URLs (1.19ms)
  ✔ 11. Strictly rejects protocol-relative URLs (//evil.com) (0.64ms)
  ✔ 12. Rejects unsafe protocols (javascript, data, vbscript, file) (0.45ms)
  ✔ 13. Separates URL syntax validation from official provenance verification (0.98ms)
  ✔ 14. Guarantees no mock admissions answers under failure (2.01ms)
  ✔ 15. Does not manufacture fake page labels or file sizes (1.43ms)
  ✔ 16. New conversation during request invalidates in-flight responses (1.28ms)
  ✔ 17. Retry pattern resends without duplicating user messages in thread (1.07ms)
  ✔ 18. No production mock document metadata in chatRelatedDocuments (0.34ms)
✔ Frontend Chat API Contract & Error Handling Tests (33.57ms)
ℹ tests 18 | pass 18 | fail 0

# 4. Frontend ESLint
npm --prefix apps/web run lint
✔ No ESLint warnings or errors

# 5. Frontend Production Build
npm --prefix apps/web run build
✓ Compiled successfully in 13.0s
✓ Generating static pages (131/131)
```

---

---

# Task 4.2 — Handover Safety and Citation Destination Verification

## 1. Mục tiêu & Bối cảnh

Tiếp tục triển khai trên nhánh `feat/phase-1-task-4-decision-safe-fallback` sau phiên review commit `4c80122` (PASS WITH CHANGES).

Task 4.2 giải quyết triệt để 2 ranh giới an toàn then chốt:
1. **Tính nhất quán của chính sách chuyển giao tư vấn viên (Handover Policy Consistency)**: Lời đề nghị chuyển giao tư vấn viên không bao giờ được coi là giấy phép hợp thức hóa câu trả lời sự thật chưa được kiểm chứng; `is_safe_to_answer` không được bật thành True chỉ vì có yêu cầu chuyển giao; trạng thái bằng chứng không được nâng cấp thành SUPPORTED; không đính kèm trích dẫn chưa xác thực; không tự động tạo ticket; đồng thời bảo lưu quyền xử lý an toàn cho yêu cầu gặp cán bộ tư vấn hợp lệ.
2. **Ranh giới tin cậy đích đến trích dẫn (Citation Destination Trust Boundary)**: Phân định rạch ròi giữa cú pháp URL, khả năng điều hướng chung và nguồn gốc trích dẫn được phê duyệt; cấm bypass chuẩn hóa URL qua backslash (`\`); cấm liên kết tới các route nội bộ tùy ý (`/admin`, `/login`, v.v.); bắt buộc HTTPS cho liên kết ngoài; cấm ngoại lệ localhost cấp quyền cho liên kết sản phẩm; không bao giờ tin cậy cờ boolean phía client (`isVerifiedDestination`) làm bằng chứng phê duyệt của backend; bảo toàn cấu trúc phản hồi legacy và không bịa đặt trích dẫn/metadata.

---

## 2. Chi tiết Thay đổi Mã nguồn (Exact Files Changed)

### 2.1. Backend Rulebase & Evaluators
- **`apps/api/app/ai/rules/evaluators.py`**:
  - `evaluate_rb01_official_evidence`: Đảm bảo `context.intent == "counselor_request"` không bị coi là material EPU factual claim đòi hỏi văn bản đề án tuyển sinh.
  - `evaluate_rb02_program_resolution`: Bỏ qua yêu cầu phân giải ngành chính thức đối với `counselor_request` khi thí sinh chỉ yêu cầu gặp cán bộ.
  - `evaluate_rb12_handover_policy`: Nhận diện cả `context.handover_requested` và `context.intent == "counselor_request"` để kích hoạt hành động đề xuất `HANDOVER_SUGGESTED`.
- **`apps/api/app/ai/rules/engine.py`**:
  - `_determine_aggregate_action`: Bổ sung kiểm tra `context.intent == "counselor_request"` tại Layer 4 nhằm định tuyến an toàn sang `HANDOVER_SUGGESTED` khi các kiểm tra an toàn/bằng chứng đã thỏa mãn.

### 2.2. Backend Deterministic Decision Engine & Schema Contracts
- **`apps/api/app/ai/decision/models.py`**:
  - Thêm 4 bất biến ngữ nghĩa vào `validate_semantic_invariants` của `DecisionResult`:
    1. Cấm `is_safe_to_answer=True` khi `decision == DecisionAction.OFFER_HANDOVER`.
    2. Cấm `evidence_status=EvidenceStatus.SUPPORTED` khi `decision == DecisionAction.OFFER_HANDOVER`.
    3. Cấm đính kèm `citations` khi `decision == DecisionAction.OFFER_HANDOVER`.
    4. Cấm tự ý tạo `handover.ticket_id` trong `DecisionResult`.
- **`apps/api/app/ai/decision/engine.py`**:
  - Chuyển kiểm tra `RB-04` (Restricted Claims) lên trước Scenario F (Missing Evidence) để đảm bảo các câu trả lời khẳng định học phí/điểm chuẩn trái phép luôn bị gắn mã vi phạm `RB-04` (`UNVERIFIED_CLAIM`) thay vì bị nuốt vào trường hợp thiếu bằng chứng thông thường.
  - Loại trừ `context.intent == "counselor_request"` khỏi điều kiện từ chối của Scenario F, cho phép yêu cầu kết nối tư vấn viên chính đáng được tiếp nhận an toàn.
  - Củng cố nhánh chuyển giao (Scenario K): Thiết lập dứt khoát `is_safe_to_answer=False`, `evidence_status=EvidenceStatus.NOT_APPLICABLE`, `citations=[]`, `safe_response_text` chuẩn hóa, và `ticket_id=None`.
  - Loại bỏ biến cục bộ không sử dụng `is_official` (tuân thủ ruff lint `F841`).
- **`apps/api/app/ai/decision/mappings.py`**:
  - Trong `assemble_response_envelope`, loại bỏ `AnswerStatus.HANDOVER_OFFERED` khỏi danh sách trạng thái được phép phát trích dẫn (`sanitized_citations = []`).
  - Đảm bảo `handover.ticket_id = None` khi tạo envelope chuyển giao.
  - Cung cấp văn bản an toàn mặc định cho lời đề nghị chuyển giao khi không có draft answer.
- **`apps/api/app/schemas/response_envelope.py`**:
  - Bổ sung `AnswerStatus.HANDOVER_OFFERED` vào Invariant 3 của `AIResponseEnvelope`, nghiêm cấm việc phát hành trích dẫn trong envelope chuyển giao ở cấp độ schema Pydantic.

### 2.3. Frontend Trust Boundary & Citation Hardening
- **`apps/web/src/lib/chatClient.ts`**:
  - Định nghĩa `APPROVED_DOCUMENT_PATH_PREFIXES`: Danh sách trắng các tiền tố đường dẫn tài liệu tuyển sinh hợp lệ (`/post/`, `/tuyensinh`, `/candidate/documents`, `/dao-tao/`, `/page/`, `/documents/`, `/bieu-mau/`). Từ chối tuyệt đối các route nội bộ như `/admin`, `/login`, `/staff`, `/candidate/profile`, `/api/...`.
  - `isValidUrlSyntax`: Loại bỏ ngay lập tức bất kỳ URL nào chứa ký tự backslash `\` để chặn kỹ thuật URL normalization bypass; chặn protocol-relative (`//`), các scheme nguy hiểm (`javascript:`, `data:`, `vbscript:`, `file:`, `blob:`).
  - `isAllowedNavigationUrl`: Xác thực cú pháp điều hướng thông thường (relative path hoặc HTTP/HTTPS an toàn, không chứa directory traversal `..`).
  - `isApprovedDocumentDestination`: Xác thực thẩm quyền tài liệu trích dẫn:
    - Đường dẫn tương đối: Phải thuộc danh mục tiền tố tài liệu được phê duyệt, không chứa `..`.
    - Đường dẫn tuyệt đối: Bắt buộc giao thức HTTPS; cấm ngoại lệ `localhost` và `127.0.0.1` đối với môi trường production; chỉ chấp nhận tên miền chính thức (`epu.edu.vn`, `*.epu.edu.vn`, `moet.gov.vn`, `*.moet.gov.vn`) với cổng chuẩn 443 hoặc rỗng.
  - `isOfficialProvenanceUrl`: Bảo toàn khả năng tương thích ngược và chuyển tiếp tới `isApprovedDocumentDestination`.
  - `formatSafeCitation`: Tính toán `isVerifiedDestination` một cách độc lập từ `isApprovedDocumentDestination(safeUrl)`. Giữ nguyên cấu trúc legacy và không bịa đặt source, fileType, page, fileSize.
- **`apps/web/src/components/chat/ChatCitationCard.tsx`**:
  - `isClickableDestination`: Đánh giá trực tiếp qua `isApprovedDocumentDestination(citation.url)`. Không bao giờ tin cậy cờ boolean phía client `citation.isVerifiedDestination`. Nếu không được phê duyệt, hiển thị nhãn tĩnh trung tính "Tài liệu đối chiếu".

---

## 3. Bộ Kiểm thử Hồi quy Bổ sung (Regression Tests)

### 3.1. Backend Tests
1. **`test_handover_combined_with_unresolved_evidence_abstains_safely`**: Yêu cầu chuyển giao kết hợp câu hỏi sự thật thiếu bằng chứng -> `ABSTAIN`, `is_safe_to_answer=False`, `evidence_status=UNSUPPORTED`, `citations=[]`, `handover.offered=True`, `ticket_id=None`.
2. **`test_handover_combined_with_citation_failure_blocks_with_violation`**: Yêu cầu chuyển giao khi trích dẫn đối soát thất bại -> `SAFE_FALLBACK`, `policy_violations=["RB-06"]`, `is_safe_to_answer=False`, `citations=[]`.
3. **`test_handover_combined_with_rb04_failure_blocks_with_violation`**: Yêu cầu chuyển giao khi draft khẳng định số tiền học phí/điểm chuẩn chưa thẩm định -> `SAFE_FALLBACK`, `policy_violations=["RB-04"]`, `is_safe_to_answer=False`, `citations=[]`.
4. **`test_valid_staff_only_request_receives_safe_offer_without_ticket`**: Yêu cầu gặp cán bộ tư vấn hợp lệ (`intent="counselor_request"`) -> `OFFER_HANDOVER`, `answer_status=HANDOVER_OFFERED`, `is_safe_to_answer=False`, `evidence_status=NOT_APPLICABLE`, `citations=[]`, `ticket_id=None`.
5. **`test_decision_result_semantic_invariants_for_handover`**: Kiểm tra Pydantic model validator chặn đứng các trạng thái mâu thuẫn (`is_safe_to_answer=True`, `evidence_status=SUPPORTED`, có `citations`).
6. **`test_scenario_k_user_requested_handover_offered_without_ticket`**: Khẳng định bổ sung `is_safe_to_answer=False`, `evidence_status=NOT_APPLICABLE`, `citations=[]`.
7. **`test_assemble_handover_offered_never_has_ticket`**: Lắp ráp envelope chuyển giao khẳng định `citations=[]`, `ticket_id=None`.

### 3.2. Frontend Tests (`apps/web/tests/chatClient.test.ts`)
1. **Test 19 (`Strictly rejects backslash-based URL normalization bypasses`)**: Chặn đứng URL normalization bypass dạng `https://epu.edu.vn\evil.com`, `/post/\attacker.com`.
2. **Test 20 (`Prohibits arbitrary internal routes from being treated as approved document links`)**: Chặn các route nội bộ tùy ý (`/admin`, `/login`, `/staff/dashboard`, `/candidate/profile`, `/api/chat`, `/chat`), chấp nhận các route tài liệu chính thức (`/post/...`, `/tuyensinh`, `/candidate/documents`, `/dao-tao/dai-hoc`, `/page/dai-hoc`).
3. **Test 21 (`Enforces production-safe HTTPS for external document links`)**: Bắt buộc HTTPS cho tài liệu ngoài; từ chối plain HTTP.
4. **Test 22 (`Prohibits localhost/127.0.0.1 exceptions from authorizing production document links`)**: Cấm `localhost` và `127.0.0.1` cấp quyền cho tài liệu production.
5. **Test 23 (`Never trusts raw client-facing boolean as proof of backend approval`)**: Khi object chứa `isVerifiedDestination: true` trỏ tới `attacker.com`, client tính toán lại và đặt thành `false`, không cho phép click.
6. **Test 24 (`Rejects directory traversal paths in citations`)**: Từ chối các đường dẫn chứa traversal (`/post/../../admin`).

---

## 4. Kết quả Thực thi Lệnh Xác thực Thực tế (Actual Command Results)

```bash
# 1. Backend Pytest & Evaluation Harness
& "E:\admission-x-ai\.venv\Scripts\python.exe" -m pytest apps/api/tests evals/harness/tests
============================= 181 passed in 9.81s =============================
Agent-Harness: 7 passed, 0 failed

# 2. Backend Ruff Static Linter
& "E:\admission-x-ai\.venv\Scripts\python.exe" -m ruff check apps/api
All checks passed!

# 3. Frontend Unit Tests (Node 24 native test runner)
& "C:\nvm4w\nodejs\npm.cmd" --prefix apps/web test
▶ Frontend Chat API Contract & Error Handling Tests
  ✔ 1. Successfully parses authentic backend response (1.56ms)
  ✔ 2. Handles backend offline / connection refused with safe static error message (0.96ms)
  ✔ 3. Handles backend HTTP error without fabricating admissions claims (0.24ms)
  ✔ 4. Handles backend timeout safely (0.14ms)
  ✔ 5. Throws on malformed JSON / non-object payload (0.63ms)
  ✔ 6. Throws on missing required 'answer' field (0.33ms)
  ✔ 7. Safely parses responses with empty citations list (0.19ms)
  ✔ 8. Never defaults missing citation source to 'Trường Đại học Điện lực (EPU)' (0.33ms)
  ✔ 9. Never defaults missing document type to PDF (0.23ms)
  ✔ 10. Rejects invalid and malformed URLs (0.54ms)
  ✔ 11. Strictly rejects protocol-relative URLs (//evil.com) (0.17ms)
  ✔ 12. Rejects unsafe protocols (javascript, data, vbscript, file) (0.13ms)
  ✔ 13. Separates URL syntax validation from official provenance verification (0.17ms)
  ✔ 14. Guarantees no mock admissions answers under failure (0.29ms)
  ✔ 15. Does not manufacture fake page labels or file sizes (0.10ms)
  ✔ 16. New conversation during request invalidates in-flight responses (0.09ms)
  ✔ 17. Retry pattern resends without duplicating user messages in thread (0.13ms)
  ✔ 18. No production mock document metadata in chatRelatedDocuments (0.07ms)
  ✔ 19. Strictly rejects backslash-based URL normalization bypasses (0.09ms)
  ✔ 20. Prohibits arbitrary internal routes from being treated as approved document links (0.11ms)
  ✔ 21. Enforces production-safe HTTPS for external document links (rejects plain HTTP) (0.10ms)
  ✔ 22. Prohibits localhost/127.0.0.1 exceptions from authorizing production document links (0.32ms)
  ✔ 23. Never trusts raw client-facing boolean (isVerifiedDestination) as proof of backend approval (0.10ms)
  ✔ 24. Rejects directory traversal paths in citations (0.11ms)
✔ Frontend Chat API Contract & Error Handling Tests (9.13ms)
ℹ tests 24 | pass 24 | fail 0

# 4. Frontend ESLint
& "C:\nvm4w\nodejs\npm.cmd" --prefix apps/web run lint
✔ No ESLint warnings or errors

# 5. Frontend Production Build
& "C:\nvm4w\nodejs\npm.cmd" --prefix apps/web run build
✓ Compiled successfully in 13.7s
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (131/131)
✓ Finalizing page optimization
```

---

## 5. Các Giới hạn Còn lại (Remaining Limitations)

1. **Phạm vi Phase 1**: Quyết định chuyển giao hiện tại chỉ hoạt động ở cấp độ đề xuất (`HandoverInfo(offered=True)`). Hệ thống chưa tích hợp hàng đợi hỗ trợ trực tuyến, WebSocket tương tác nhân viên, hoặc bảng điều khiển tiếp nhận của cán bộ tuyển sinh (thuộc các Phase tiếp theo).
2. **Xác thực nội dung tài liệu trích dẫn**: Phía frontend chỉ xác thực ranh giới đích đến (destination boundary: giao thức HTTPS, tên miền chính thức, danh mục tiền tố tài liệu hợp lệ). Việc xác minh tính toàn vẹn ngữ nghĩa của trích dẫn (document hash, chunk id, temporal validity) hoàn toàn do backend `ContractCitationVerifier` và `DecisionEngine` chịu trách nhiệm.

---

## 6. Kết luận & Cam kết Phạm vi (Verdict & Scope Conformance)

- **Nhánh hiện tại:** `feat/phase-1-task-4-decision-safe-fallback`
- **Reviewed Commit (Task 4.1):** `4c801226b7615b8e396c9dd2d2d505e38eb35f3e`
- **Task 4.2 Commit Message:** `fix(ai): enforce handover safety and citation destination trust boundaries`
- **Tình trạng:** Hoàn tất 100% yêu cầu Task 4.2.
  - Toàn bộ 181 backend tests (pytest + agent-harness) đều PASS.
  - Toàn bộ 24 frontend tests (Node 24 test runner) đều PASS.
  - Ruff linter và Next.js build không có lỗi hay cảnh báo.
- **Tuân thủ quy tắc:**
  - Không merge vào `main`.
  - Không bắt đầu Task 5.
  - Dừng lại sau Task 4.2 và chờ kiểm duyệt độc lập (Await independent review).

---

# TASK 4.3 — BÁO CÁO TÁCH BIỆT NGUỒN GỐC TRÍCH DẪN & RANH GIỚI TIN CẬY (FINAL CITATION PROVENANCE SEPARATION)

## 1. Bối cảnh & Mục tiêu Task 4.3

Trong đợt rà soát Task 4.2 (Reviewed commit `7c7342eca3452540ccc0cdda4a86dbe02ec66cf5`), một vấn đề ranh giới tin cậy (trust boundary) còn tồn tại ở tầng frontend:
- **Hiện tượng**: Hàm phân tích trích dẫn frontend trước đây thiết lập `isVerifiedDestination = true` mỗi khi URL trích dẫn thuộc danh sách allowlist (tên miền `epu.edu.vn`, `moet.gov.vn`, hoặc đường dẫn tương đối được phê duyệt).
- **Hệ quả rủi ro**: Việc một URL thuộc tên miền hợp lệ chỉ có nghĩa đây là điểm đến điều hướng được phép (allowed navigation destination), **không đồng nghĩa** với việc tài liệu hay liên kết đó đã được hệ thống thẩm định chứng cứ, kiểm tra hash hoặc đối chiếu nội dung tuyển sinh chính thức (evidence verification).
- **Mục tiêu Task 4.3**: Tách bạch triệt để ranh giới cho phép điều hướng (`isAllowedDocumentDestination`) khỏi trạng thái xác thực nguồn gốc trích dẫn thực tế (`isBackendVerifiedCitation`), không tin cậy boolean thô từ API payload, phòng chống triệt để tấn công directory traversal dạng mã hóa (`%2e%2e`, `%252e%252e`, `%5c`, `%00`), và bổ sung suite kiểm thử hồi quy 100% tự động.

---

## 2. Các Thay đổi Kỹ thuật Thực tế

### 2.1. Cấu trúc dữ liệu & Ranh giới tương lai (`apps/web/src/types/chat.ts`)
- Bổ sung type `CitationProvenanceStatus = "verified_backend" | "unverified_allowlisted" | "untrusted"`.
- Bổ sung interface `CitationProvenanceMetadata` chứa `status`, `documentId`, `sourceTier`, `verificationHash`.
- Cập nhật interface `ChatCitation`:
  - `isAllowedDestination?: boolean`: Biểu thị URL trích dẫn thuộc danh sách điều hướng được phê duyệt.
  - `isVerifiedDestination?: boolean`: Đánh dấu `@deprecated` cho client cũ, chỉ mang giá trị `true` khi có xác thực backend hợp lệ; không bao giờ tự động `true` chỉ vì URL khớp allowlist.
  - `provenance?: CitationProvenanceMetadata`: Ranh giới dữ liệu chuẩn hóa cho các phase tích hợp tiếp theo.

### 2.2. Kiểm tra Directory Traversal & Canonicalization Bypass (`apps/web/src/lib/chatClient.ts`)
- Xây dựng hàm `hasTraversalOrCanonicalizationBypass(raw: string): boolean`:
  - Kiểm tra chuỗi thô: `..`, `\`, `\0`.
  - Kiểm tra các mẫu ký tự mã hóa URL phổ biến: `%2e%2e`, `%2e.`, `.%2e`, `%5c`, `%00`, `..%2f`.
  - Thực hiện giải mã URL đơn cấp và đệ quy hai cấp (`decodeURIComponent`) để triệt tiêu các kỹ thuật bypass bypass mã hóa kép như `%252e%252e`, `%255c`. Bất kỳ lỗi parse URL encoding nào đều lập tức bị xem là bypass attempt và từ chối.
- Cập nhật `isValidUrlSyntax()` và `isAllowedNavigationUrl()` để lập tức từ chối mọi chuỗi chứa mẫu traversal.

### 2.3. Tách biệt Allowlisting và Authoritative Verification (`apps/web/src/lib/chatClient.ts`)
- Định nghĩa hàm `isAllowedDocumentDestination(rawUrl: string): boolean`: Chỉ kiểm tra tính an toàn điều hướng (HTTPS bắt buộc, cổng chuẩn 443, tên miền chính thức EPU/MOET, tiền tố tương đối hợp lệ, không traversal).
- Xây dựng hàm `isBackendVerifiedCitation(rawRecord: unknown): boolean`:
  - Không tin cậy cờ boolean thô từ payload API (`record.isVerifiedDestination: true` bị phớt lờ hoàn toàn).
  - Yêu cầu cấu trúc `provenance` hợp lệ từ backend với `status === "verified_backend"`, `documentId` không rỗng và `sourceTier === "official_epu"`.
- Chuẩn hóa trong `formatSafeCitation()`:
  - Nếu URL thuộc allowlist nhưng chưa có bằng chứng backend: gán `isAllowedDestination: true`, `isVerifiedDestination: false`, `provenance: { status: "unverified_allowlisted" }`.
  - Nếu phát hiện traversal hoặc URL không hợp lệ: loại bỏ hoàn toàn `url = undefined`, `isAllowedDestination: false`, `isVerifiedDestination: false`.

### 2.4. Khắc phục Component Hiển thị (`apps/web/src/components/chat/ChatCitationCard.tsx`)
- Import và sử dụng trực tiếp `isAllowedDocumentDestination(citation.url)` cho logic click xem tài liệu.
- Giữ nguyên trải nghiệm người dùng ("Xem tài liệu" cho các liên kết điều hướng an toàn) mà không tuyên bố sai lệch rằng tài liệu đã qua thẩm định nội dung, đảm bảo không bịa đặt nhãn trang, dung lượng hay nguồn gốc.

---

## 3. Bộ Kiểm Thử Hồi Quy Mới (Regression Tests)

Đã bổ sung các ca kiểm thử từ 25 đến 29 vào `apps/web/tests/chatClient.test.ts`:
1. **Test 25**: Phân biệt điểm đến chính thức hợp lệ chưa qua thẩm định chứng cứ (`isAllowedDestination === true`, `isVerifiedDestination === false`, `provenance.status === 'unverified_allowlisted'`).
2. **Test 26**: Từ chối cờ boolean thô `isVerifiedDestination=true` từ payload không tin cậy ngay cả trên tên miền chính thức.
3. **Test 27**: Xác thực trích dẫn thành công khi có hợp đồng chứng cứ có cấu trúc từ backend (`isBackendVerifiedCitation === true`, `isVerifiedDestination === true`, `provenance.status === 'verified_backend'`).
4. **Test 28**: Từ chối toàn diện các dạng mã hóa traversal (`%2e%2e`, `%2e%2e%2f`, `%252e%252e`, `%5c`, `%00`, `..%2f`) trên cả đường dẫn tương đối và URL tuyệt đối.
5. **Test 29**: Đảm bảo hành vi điều hướng an toàn cho các URL đích hợp lệ mà không tạo ra các tuyên bố thẩm định sai sự thật.

---

## 4. Kết Quả Xác Nhận Thực Tế (Execution Logs)

```bash
# 1. Backend Pytest & Agent-Harness (181 tests)
& "E:\admission-x-ai\.venv\Scripts\python.exe" -m pytest apps/api/tests evals/harness/tests
============================ 181 passed in 10.21s =============================
Agent-Harness: 7 passed, 0 failed

# 2. Backend Ruff Linter
& "E:\admission-x-ai\.venv\Scripts\python.exe" -m ruff check apps/api
All checks passed!

# 3. Frontend Unit Tests (29 tests)
& "C:\nvm4w\nodejs\npm.cmd" --prefix apps/web test
▶ Frontend Chat API Contract & Error Handling Tests
  ✔ 1. Successfully parses authentic backend response (2.55ms)
  ✔ 2. Handles backend offline / connection refused with safe static error message (1.25ms)
  ✔ 3. Handles backend HTTP error without fabricating admissions claims (0.40ms)
  ✔ 4. Handles backend timeout safely (0.17ms)
  ✔ 5. Throws on malformed JSON / non-object payload (0.58ms)
  ✔ 6. Throws on missing required 'answer' field (0.21ms)
  ✔ 7. Safely parses responses with empty citations list (0.18ms)
  ✔ 8. Never defaults missing citation source to 'Trường Đại học Điện lực (EPU)' (0.23ms)
  ✔ 9. Never defaults missing document type to PDF (0.25ms)
  ✔ 10. Rejects invalid and malformed URLs (0.62ms)
  ✔ 11. Strictly rejects protocol-relative URLs (//evil.com) (0.30ms)
  ✔ 12. Rejects unsafe protocols (javascript, data, vbscript, file) (0.24ms)
  ✔ 13. Separates URL syntax validation from official provenance verification (0.36ms)
  ✔ 14. Guarantees no mock admissions answers under failure (0.48ms)
  ✔ 15. Does not manufacture fake page labels or file sizes (0.19ms)
  ✔ 16. New conversation during request invalidates in-flight responses (0.14ms)
  ✔ 17. Retry pattern resends without duplicating user messages in thread (0.17ms)
  ✔ 18. No production mock document metadata in chatRelatedDocuments (0.10ms)
  ✔ 19. Strictly rejects backslash-based URL normalization bypasses (0.12ms)
  ✔ 20. Prohibits arbitrary internal routes from being treated as approved document links (0.21ms)
  ✔ 21. Enforces production-safe HTTPS for external document links (rejects plain HTTP) (0.18ms)
  ✔ 22. Prohibits localhost/127.0.0.1 exceptions from authorizing production document links (0.15ms)
  ✔ 23. Never trusts raw client-facing boolean (isVerifiedDestination) as proof of backend approval (0.19ms)
  ✔ 24. Rejects directory traversal paths in citations (0.14ms)
  ✔ 25. Distinguishes allowed official destination from evidence verification (0.17ms)
  ✔ 26. Rejects raw payload boolean 'isVerifiedDestination=true' without authentic backend verification (0.12ms)
  ✔ 27. Authoritative backend contract provenance verifies citation (0.16ms)
  ✔ 28. Rejects encoded traversal (%2e%2e, %252e%252e, %5c, %00, ..%2f) (0.21ms)
  ✔ 29. Preserves safe navigation for valid destinations without false verification claims (0.40ms)
✔ Frontend Chat API Contract & Error Handling Tests (13.91ms)
ℹ tests 29 | pass 29 | fail 0

# 4. Frontend ESLint
& "C:\nvm4w\nodejs\npm.cmd" --prefix apps/web run lint
✔ No ESLint warnings or errors

# 5. Frontend Production Build
& "C:\nvm4w\nodejs\npm.cmd" --prefix apps/web run build
✓ Compiled successfully in 21.0s
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (131/131)
✓ Finalizing page optimization
```

---

## 5. Kết luận & Cam kết Phạm vi Task 4.3

- **Nhánh thực hiện:** `feat/phase-1-task-4-decision-safe-fallback`
- **Commit SHA reviewed:** `7c7342eca3452540ccc0cdda4a86dbe02ec66cf5`
- **Commit Message chuẩn:** `fix(web): separate citation provenance from destination allowlisting`
- **Phạm vi bảo toàn:**
  - Không thay đổi thiết kế Task 4.
  - Không thêm production RAG, database queries hay API endpoints mới.
  - Giữ vững ranh giới Phase 1 (không merge vào `main`, không bắt đầu Task 5).

---

# TASK 4.4 — LOẠI BỎ CƠ CHẾ TỰ XÁC THỰC NGUỒN GỐC TRÍCH DẪN (PREVENT SELF-ASSERTED CITATION VERIFICATION)

## 1. Bối cảnh & Vấn đề Phát hiện (Issue & Trust Boundary)

Trong quá trình rà soát Task 4.3 (Reviewed commit `bdcac55fec13090a79538afa8a64790a9833e9f2`), một lỗ hổng ranh giới tin cậy (P1 trust-boundary flaw) đã được phát hiện:
- **Vấn đề**: Hàm `isBackendVerifiedCitation(rawRecord)` trước đây kiểm tra sự tồn tại của các trường plain JSON trong API payload:
  ```json
  {
    "provenance": {
      "status": "verified_backend",
      "documentId": "epu-dean-2025-v1",
      "sourceTier": "official_epu"
    }
  }
  ```
- **Rủi ro**: Các trường này hoàn toàn mang tính tự khẳng định (self-asserted) từ dữ liệu mạng không tin cậy. Một payload JSON tùy ý có thể đính kèm cấu trúc này để tự thăng cấp trạng thái thành `isVerifiedDestination = true` và `status = "verified_backend"`, vi phạm nguyên tắc thẩm định chứng cứ từ backend catalog chính thức.
- **Mục tiêu Task 4.4**: 
  - Triệt tiêu khả năng tự phong xác minh từ dữ liệu JSON thô.
  - Áp dụng cơ chế fail-closed 100% cho Phase 1: Mọi trích dẫn từ API phản hồi thông thường đều không thể tự xưng là `verified_backend`.
  - Phân loại rõ ràng 2 trạng thái hợp lệ trong Phase 1:
    - URL thuộc danh sách allowlist: Cho phép điều hướng ("Xem tài liệu"), nhưng bằng chứng trích dẫn vẫn là chưa xác minh (`isAllowedDestination = true`, `isVerifiedDestination = false`, `provenance.status = "unverified_allowlisted"`).
    - URL không thuộc allowlist / bị từ chối / traversal: Điểm đến không tin cậy (`isAllowedDestination = false`, `isVerifiedDestination = false`, `provenance.status = "untrusted"`).
    - Trạng thái `verified_backend` được bảo lưu cho ranh giới tích hợp kênh xác thực bảo mật tương lai, không bao giờ được tổng hợp từ payload JSON thông thường.

---

## 2. Các Thay đổi Kỹ thuật Thực tế (Code Changes)

### 2.1. Tái định nghĩa Fail-Closed cho `isBackendVerifiedCitation` (`apps/web/src/lib/chatClient.ts`)
- Thay đổi `isBackendVerifiedCitation(_rawRecord?: unknown): boolean`: Lập tức trả về `false` cho mọi plain JSON payload trong Phase 1.
- Loại bỏ hoàn toàn logic kiểm tra các khóa self-asserted `status === "verified_backend"` từ object thô.

### 2.2. Chuẩn hóa Quy tắc Phân loại Nguồn gốc (`apps/web/src/lib/chatClient.ts`)
- Trong `formatSafeCitation()`:
  - Cờ `isVerifiedDestination`: Luôn nhận giá trị `false` đối với các payload phản hồi JSON thông thường trong Phase 1.
  - Không tin cậy bất kỳ trường nào trong `record.isVerifiedDestination` hay `record.provenance.status` làm căn cứ ủy quyền.
  - Phân nhánh fail-closed:
    - Nếu `isAllowedDest === true` -> `provenance: { status: "unverified_allowlisted" }`.
    - Ngược lại -> `provenance: { status: "untrusted" }`.

### 2.3. Cập nhật Bộ Kiểm Thử Hồi Quy (`apps/web/tests/chatClient.test.ts`)
- Cập nhật **Test 27**: Đổi từ kiểm tra chấp nhận metadata backend sang kiểm chứng nghiêm ngặt rằng một đối tượng JSON giả mạo chứa `status: "verified_backend"` **không thể** tự thăng hạng thành `verified`:
  - `isBackendVerifiedCitation(fabricatedBackendCitation)` trả về `false`.
  - `formatted.isVerifiedDestination` trả về `false`.
  - `formatted.provenance.status` nhận giá trị `"unverified_allowlisted"` (nếu URL thuộc allowlist).
  - Đối với URL ngoài luồng chứa metadata giả mạo, `formatted.provenance.status` nhận giá trị `"untrusted"`.

---

## 3. Kết Quả Kiểm Thử Thực Tế (Execution Logs)

```bash
# 1. Backend Pytest & Agent-Harness (181 tests)
& "E:\admission-x-ai\.venv\Scripts\python.exe" -m pytest apps/api/tests evals/harness/tests
============================= 181 passed in 7.93s =============================
Agent-Harness: 7 passed, 0 failed

# 2. Backend Ruff Linter
& "E:\admission-x-ai\.venv\Scripts\python.exe" -m ruff check apps/api
All checks passed!

# 3. Frontend Unit Tests (29 tests)
& "C:\nvm4w\nodejs\npm.cmd" --prefix apps/web test
▶ Frontend Chat API Contract & Error Handling Tests
  ✔ 1. Successfully parses authentic backend response (1.87ms)
  ✔ 2. Handles backend offline / connection refused with safe static error message (1.13ms)
  ✔ 3. Handles backend HTTP error without fabricating admissions claims (0.29ms)
  ✔ 4. Handles backend timeout safely (0.16ms)
  ✔ 5. Throws on malformed JSON / non-object payload (0.78ms)
  ✔ 6. Throws on missing required 'answer' field (0.25ms)
  ✔ 7. Safely parses responses with empty citations list (0.27ms)
  ✔ 8. Never defaults missing citation source to 'Trường Đại học Điện lực (EPU)' (0.36ms)
  ✔ 9. Never defaults missing document type to PDF (0.26ms)
  ✔ 10. Rejects invalid and malformed URLs (0.31ms)
  ✔ 11. Strictly rejects protocol-relative URLs (//evil.com) (0.15ms)
  ✔ 12. Rejects unsafe protocols (javascript, data, vbscript, file) (0.13ms)
  ✔ 13. Separates URL syntax validation from official provenance verification (0.22ms)
  ✔ 14. Guarantees no mock admissions answers under failure (0.29ms)
  ✔ 15. Does not manufacture fake page labels or file sizes (0.11ms)
  ✔ 16. New conversation during request invalidates in-flight responses (0.11ms)
  ✔ 17. Retry pattern resends without duplicating user messages in thread (0.13ms)
  ✔ 18. No production mock document metadata in chatRelatedDocuments (0.07ms)
  ✔ 19. Strictly rejects backslash-based URL normalization bypasses (0.10ms)
  ✔ 20. Prohibits arbitrary internal routes from being treated as approved document links (0.17ms)
  ✔ 21. Enforces production-safe HTTPS for external document links (rejects plain HTTP) (0.13ms)
  ✔ 22. Prohibits localhost/127.0.0.1 exceptions from authorizing production document links (0.12ms)
  ✔ 23. Never trusts raw client-facing boolean (isVerifiedDestination) as proof of backend approval (0.12ms)
  ✔ 24. Rejects directory traversal paths in citations (0.10ms)
  ✔ 25. Distinguishes allowed official destination from evidence verification (0.14ms)
  ✔ 26. Rejects raw payload boolean 'isVerifiedDestination=true' without authentic backend verification (0.10ms)
  ✔ 27. Fabricated JSON provenance object cannot promote itself to verified (fails closed) (0.15ms)
  ✔ 28. Rejects encoded traversal (%2e%2e, %252e%252e, %5c, %00, ..%2f) (0.17ms)
  ✔ 29. Preserves safe navigation for valid destinations without false verification claims (0.30ms)
✔ Frontend Chat API Contract & Error Handling Tests (10.71ms)
ℹ tests 29 | pass 29 | fail 0

# 4. Frontend ESLint
& "C:\nvm4w\nodejs\npm.cmd" --prefix apps/web run lint
✔ No ESLint warnings or errors

# 5. Frontend Production Build
& "C:\nvm4w\nodejs\npm.cmd" --prefix apps/web run build
✓ Compiled successfully in 10.0s
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (131/131)
✓ Finalizing page optimization
```

---

## 4. Kết luận & Cam kết Phạm vi Task 4.4

- **Nhánh thực hiện:** `feat/phase-1-task-4-decision-safe-fallback`
- **Reviewed Commit:** `bdcac55fec13090a79538afa8a64790a9833e9f2`
- **Commit Message đề xuất:** `fix(web): prevent self-asserted citation verification`
- **Phạm vi bảo toàn:**
  - Không bổ sung chữ ký mật mã (cryptographic signatures), RAG retrieval, truy vấn Supabase hay API endpoints mới.
  - Bảo tồn toàn vẹn khả năng điều hướng URL an toàn và các cơ chế phòng thủ directory traversal đã thiết lập.
  - Giữ vững ranh giới Phase 1 (không merge vào `main`, dừng lại chờ review).



