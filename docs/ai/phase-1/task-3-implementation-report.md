# BÁO CÁO TRIỂN KHAI TASK 3: RESPONSE CONTRACT & AGENT TOOL INTERFACES

**Dự án:** Admission X AI — Hệ thống Trợ lý Tuyển sinh Đại học Điện lực (EPU)  
**Pha:** Phase 1 — AI Design & Rulebase  
**Nhiệm vụ:** Task 3 — Response Contract & Agent Tool Interfaces  
**Nhánh Git:** `feat/phase-1-task-3-response-tool-contracts`  
**Trạng thái:** HOÀN THÀNH — SẴN SÀNG REVIEW  

---

## 1. Tóm tắt các Contract đã triển khai

Task 3 thiết lập hệ thống hợp đồng dữ liệu chuẩn hóa, định kiểu tĩnh (strongly-typed) và kiểm định nghiêm ngặt (validated) bằng Pydantic v2 theo nguyên tắc **Contract-First**. Toàn bộ các mô hình tuân thủ tuyệt đối các tài liệu đặc tả của Phase 1 (`response-contract.md`, `citation-contract.md`, `tool-contracts.md`, `decision-matrix.md`):

1. **AI Response Envelope (`apps/api/app/schemas/response_envelope.py`)**:
   - Bao gói phản hồi đầu ra của AI (`AIResponseEnvelope`) với mã phiên bản hợp đồng `contract_version = "1.0.0"`.
   - Các trường chuẩn: `response_id`, `session_id`, `answer`, `answer_status`, `evidence_status`, `source_mode`, `intent`, `resolved_major_codes`, `citations`, `handover`, `policy_version`, `prompt_version`, `confidence` (chỉ đóng vai trò diagnostic metric, không coi là bằng chứng xác thực).
   - Kiểm định ràng buộc ngữ nghĩa bất biến (semantic invariants): triệt tiêu trích dẫn bịa đặt ở chế độ kiến thức chung (`general`), không có nguồn (`none`), hoặc trạng thái thiếu căn cứ (`unsupported`, `insufficient_evidence`).
   - Tách biệt trạng thái bàn giao: `handover.offered = True` tuyệt đối không bao hàm hay sinh ra `ticket_id`.

2. **Evidence & Citation Contracts (`apps/api/app/schemas/citation.py`)**:
   - `EvidenceRecord`: Chứa 14 trường siêu dữ liệu định danh nguồn trích từ kho tài liệu chính thống EPU, đánh chỉ mục trang vật lý PDF bắt đầu từ 1 (`1-based`), ràng buộc `page_start <= page_end`. Trường URL hoặc trang không xác định được giữ là `None`, nghiêm cấm bịa đặt placeholder.
   - `CitationRecord`: Cấu trúc trích dẫn 10 trường gửi tới UI thí sinh, liên kết chính xác với `evidence_id`, `document_id`, `major_code`, và phân cấp nguồn `source_tier`.
   - Phân cấp `SourceTier` (`official_epu`, `general`, `restricted`) và `VerificationStatus` (`verified`, `unverified`, `pending`, `failed`, `not_evaluable`).

3. **Contract-Level Citation Verifier (`apps/api/app/ai/rag/citations/verifier.py`)**:
   - Bộ thẩm định kiểm chứng trích dẫn cấp hợp đồng độc lập, tiền định (deterministic).
   - Phân định rạch ròi 4 tầng xác thực:
     1. Tính hợp lệ cấu trúc dữ liệu (`structural_validity`).
     2. Khớp nối định danh và dải trang với đoạn bằng chứng (`evidence_record_matched`).
     3. Xác minh sự tồn tại trong danh mục tài liệu phê duyệt (`catalog_verified`).
     4. Grounding ngữ nghĩa cấp độ mệnh đề (`claim_grounding_status`): LUÔN ở trạng thái `PENDING` hoặc `NOT_EVALUABLE` ở tầng hợp đồng này. Tuyệt đối không đánh giá là `VERIFIED` chỉ vì trích dẫn trỏ tới một bản ghi bằng chứng có thật.

4. **Agent Tool Contracts (`apps/api/app/ai/tools/contracts.py`)**:
   - Envelopes dùng chung: `ToolRequestEnvelope[T]`, `ToolResponseEnvelope[T]` với tham số `request_id`, `trace_id`, `policy_version`, `status`, `data`, `provenance`, `error_code`, `elapsed_ms`.
   - Trạng thái chuẩn: `ok`, `not_found`, `ambiguous`, `unavailable`, `error`.
   - Mã lỗi an toàn (safe error codes): `INVALID_ARGUMENT`, `UNKNOWN_MAJOR`, `AMBIGUOUS_MAJOR`, `NO_VERIFIED_EVIDENCE`, `SOURCE_UNAVAILABLE`, `TOOL_TIMEOUT`, `POLICY_DENIED`.
   - 5 công cụ AI thông thường: `program_lookup`, `curriculum_retrieve`, `general_knowledge_explain`, `request_clarification`, `offer_handover`.
   - 1 dịch vụ đặc quyền (Privileged contract): `create_handover_ticket` (được đánh dấu `is_privileged = True`, yêu cầu bằng chứng đồng thuận `consent_reference`, khóa chống trùng lặp `idempotency_key`, tuyệt đối cấm mô hình LLM tự ý kích hoạt).

5. **Legacy Compatibility Adapter (`to_legacy_chat_response`)**:
   - Giữ nguyên vẹn 100% schema cũ `apps/api/app/schemas/chat.py` và route `apps/api/app/api/routes/chat.py` để không gây xung đột với hệ thống đang chạy.
   - Hàm adapter chuyển đổi an toàn từ `AIResponseEnvelope` sang `ChatResponse` cũ.

---

## 2. Danh sách tệp tin đã tạo và cập nhật

### Tệp tạo mới:
1. `apps/api/app/schemas/citation.py` — Mô hình bằng chứng và trích dẫn.
2. `apps/api/app/schemas/response_envelope.py` — Bao gói phản hồi AI, enums, và adapter tương thích.
3. `apps/api/app/ai/rag/citations/verifier.py` — Bộ thẩm định trích dẫn cấp độ hợp đồng.
4. `apps/api/app/ai/tools/contracts.py` — Hợp đồng đầu vào/đầu ra và envelope của 6 tool.
5. `apps/api/app/ai/tools/__init__.py` — Xuất khẩu module tool contracts.
6. `apps/api/tests/test_citation_contract.py` — Bộ kiểm thử hợp đồng bằng chứng & trích dẫn (11 tests).
7. `apps/api/tests/test_response_envelope.py` — Bộ kiểm thử bao gói phản hồi & adapter (11 tests).
8. `apps/api/tests/test_citation_verifier.py` — Bộ kiểm thử bộ thẩm định trích dẫn & ranh giới tin cậy (10 tests).
9. `apps/api/tests/test_tool_contracts.py` — Bộ kiểm thử hợp đồng công cụ và phong tỏa đặc quyền (11 tests).
10. `docs/ai/phase-1/task-3-implementation-report.md` — Báo cáo triển khai chi tiết Task 3.

### Tệp cập nhật:
1. `apps/api/app/schemas/__init__.py` — Xuất khẩu các schema mới.
2. `apps/api/app/ai/rag/citations/__init__.py` — Xuất khẩu các lớp thẩm định trích dẫn.

### Tệp giữ nguyên vẹn (Không gây phá vỡ tương thích):
- `apps/api/app/schemas/chat.py` (Không sửa)
- `apps/api/app/api/routes/chat.py` (Không sửa)
- `apps/web/src/*` (Không chạm frontend trong Task 3)

---

## 3. Quyết định thiết kế kiến trúc Contract

### 3.1. Phiên bản hóa rõ ràng (`contract_version = "1.0.0"`)
Đảm bảo khả năng tiến hóa của giao thức API mà không làm gãy các client cũ. Mọi phản hồi đều đóng dấu phiên bản hợp đồng cùng với phiên bản chính sách (`policy_version`) và phiên bản prompt (`prompt_version`).

### 3.2. Ràng buộc bất biến ngữ nghĩa (Semantic Invariants)
- **Kiến thức chung (`source_mode == general | none`)**: Nghiêm cấm gán trích dẫn PDF của trường EPU. Nếu `citations` có phần tử, Pydantic validator sẽ chủ động chặn và ném lỗi `ValueError`.
- **Thiếu chứng cứ / Lỗi / Từ chối**: Khi `answer_status` là `insufficient_evidence`, `out_of_scope`, `rejected`, hoặc `error`, danh sách trích dẫn `citations` bắt buộc phải rỗng.
- **Yêu cầu làm rõ (`clarification_needed`)**: Không được phép đồng thời khẳng định chứng cứ đầy đủ (`supported`) kèm trích dẫn, vì việc làm rõ phải được ưu tiên giải quyết trước khi đưa ra câu trả lời chính thức.

### 3.3. Tách biệt hoàn toàn trong quy trình Handover
- `handover.offered = True`: Chỉ là một lời đề xuất trợ giúp hiển thị trên giao diện người dùng.
- `handover.requested = True`: Thí sinh chủ động nhấn nút hoặc xác nhận đồng ý kết nối.
- `handover.ticket_id`: Mã vé hỗ trợ được hệ thống backend lưu trữ. Ràng buộc: `ticket_id` chỉ được phép tồn tại khi thí sinh đã yêu cầu (`requested = True`) và có bằng chứng xác nhận đồng thuận.

### 3.4. Cô lập hợp đồng công cụ đặc quyền (`create_handover_ticket`)
Mô hình ngôn ngữ (LLM) không được cấp quyền tự động gọi tạo vé hỗ trợ hoặc truyền dữ liệu cá nhân. Hợp đồng `create_handover_ticket` được đóng dấu `is_privileged = True` và chỉ được gọi thông qua luồng backend đã kiểm tra danh tính và chữ ký đồng thuận của thí sinh.

---

## 4. Ranh giới tin cậy kiểm chứng trích dẫn (Trust Boundaries)

Để tránh hiện tượng "ảo giác đáng tin cậy" (hallucinated credibility), Task 3 phân tách rạch ròi 4 tầng thẩm định:

```
+-----------------------------------------------------------------------+
| 1. Cấu trúc (Structural Validity): ID hợp lệ, dải trang 1-based,      |
|    page_start <= page_end, không chứa URL placeholder rỗng.           |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
| 2. Khớp nối Bằng chứng (Evidence Matching): Khớp evidence_id,         |
|    document_id, major_code, và dải trang nằm trong đoạn trích.        |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
| 3. Danh mục Chứng thực (Catalog Verification): Tài liệu có nằm trong  |
|    danh mục tài liệu được trường phê duyệt hay không.                 |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
| 4. Căn cứ Mệnh đề (Claim-Level Grounding): [Phase 6]                  |
|    Kiểm tra xem câu trả lời có được suy diễn đúng từ văn bản hay      |
|    không. TẦNG CONTRACT NÀY LUÔN TRẢ VỀ: PENDING / NOT_EVALUABLE.     |
+-----------------------------------------------------------------------+
```

**Nguyên tắc bất di bất dịch:**  
- Một trích dẫn trỏ đến một `EvidenceRecord` có thật KHÔNG ĐỒNG NGHĨA VỚI VIỆC câu trả lời được xác thực đầy đủ.
- Metadata do client gửi lên hoặc do mô hình sinh ra là **không đáng tin cậy** cho đến khi đi qua bộ `ContractCitationVerifier` và sau này là Phase 6 Claim Verifier.

---

## 5. Phân tích tương thích và Lộ trình di chuyển API

### Hiện trạng:
Endpoint `/api/v1/chat` trả về `ChatResponse` gồm: `{answer, intent, confidence, handover: bool, citations: [{title, source}]}`.

### Đánh giá phương án:
- **Phương án A (Được chọn):** Giữ nguyên vẹn `ChatResponse` và endpoint cũ `/api/v1/chat`. Cung cấp adapter thuần `to_legacy_chat_response` để khi các tác vụ sau hoàn thiện có thể ánh xạ ngược lại mà không làm hỏng frontend Next.js đang chạy.
- **Lộ trình tương lai:**
  1. *Ngắn hạn (Task 4):* Frontend `apps/web` sửa lỗi fallback giả lập P0, thích ứng dần với schema mới.
  2. *Dài hạn (Phase 8):* Giới thiệu endpoint tường minh `/api/v2/chat` sử dụng trực tiếp `AIResponseEnvelope`. Endpoint `/api/v1/chat` được chuyển thành wrapper gọi qua adapter. Cách tiếp cận này loại trừ hoàn toàn nguy cơ breaking changes giữa các sprint.

---

## 6. Ma trận bao phủ Contract (Coverage Matrix)

| Thành phần Contract | Tệp mã nguồn | Trạng thái | Unit Test File | Kết quả Test |
|---|---|---|---|---|
| `EvidenceRecord` | `apps/api/app/schemas/citation.py` | Hoàn thành | `test_citation_contract.py` | PASS (11/11) |
| `CitationRecord` | `apps/api/app/schemas/citation.py` | Hoàn thành | `test_citation_contract.py` | PASS (11/11) |
| `AIResponseEnvelope` | `apps/api/app/schemas/response_envelope.py` | Hoàn thành | `test_response_envelope.py` | PASS (11/11) |
| `HandoverInfo` | `apps/api/app/schemas/response_envelope.py` | Hoàn thành | `test_response_envelope.py` | PASS (11/11) |
| `to_legacy_chat_response` | `apps/api/app/schemas/response_envelope.py` | Hoàn thành | `test_response_envelope.py` | PASS (11/11) |
| `ContractCitationVerifier` | `apps/api/app/ai/rag/citations/verifier.py` | Hoàn thành | `test_citation_verifier.py` | PASS (10/10) |
| `program_lookup` | `apps/api/app/ai/tools/contracts.py` | Hoàn thành | `test_tool_contracts.py` | PASS (11/11) |
| `curriculum_retrieve` | `apps/api/app/ai/tools/contracts.py` | Hoàn thành | `test_tool_contracts.py` | PASS (11/11) |
| `general_knowledge_explain` | `apps/api/app/ai/tools/contracts.py` | Hoàn thành | `test_tool_contracts.py` | PASS (11/11) |
| `request_clarification` | `apps/api/app/ai/tools/contracts.py` | Hoàn thành | `test_tool_contracts.py` | PASS (11/11) |
| `offer_handover` | `apps/api/app/ai/tools/contracts.py` | Hoàn thành | `test_tool_contracts.py` | PASS (11/11) |
| `create_handover_ticket` | `apps/api/app/ai/tools/contracts.py` | Hoàn thành | `test_tool_contracts.py` | PASS (11/11) |

---

## 7. Các chi tiết hoãn triển khai (Deferred Details)

Tuân thủ nghiêm ngặt phạm vi **Contract-First** của Task 3, các hạng mục sau chủ động không triển khai:
1. **Truy vấn cơ sở dữ liệu Supabase**: Chưa kết nối cơ sở dữ liệu thật; việc lưu trữ và truy xuất vector/catalog được hoãn đến Phase 3 và Phase 5.
2. **Retrieval & Reranking**: Không triển khai logic tìm kiếm embedding hay thuật toán lai (Hybrid Retriever); chỉ định nghĩa hợp đồng đầu vào/đầu ra `curriculum_retrieve`.
3. **Gọi LLM & Tạo câu trả lời**: Không kích hoạt lời gọi model qua mạng; không thay đổi runner đồ thị hiện tại.
4. **LangGraph Graph State**: Trạng thái đồ thị tác nhân sẽ được cập nhật trong Phase 7.
5. **Tạo vé hỗ trợ thật (Ticket persistence)**: Hoãn đến Phase 8; Task 3 chỉ cung cấp schema và khóa phong tỏa đặc quyền.
6. **Frontend Mock Remediation**: Việc loại bỏ mock data và đường dẫn giả lập `/tuyensinh` trong Next.js là mục tiêu trọng tâm của Task 4.

---

## 8. Kết quả Kiểm thử & Lint

### 8.1. Kiểm thử Pytest
- Lệnh thực thi:
  ```bash
  python -m pytest apps/api/tests evals/harness/tests
  ```
- Kết quả: **119 passed in 7.33s** (Toàn bộ 76 test cũ của Task 1 và Task 2 cùng 43 test mới của Task 3 đều vượt qua 100%).
- Các kịch bản trọng yếu được kiểm tra:
  - Serialization và JSON Schema generation của envelope.
  - Chặn trích dẫn trong `general`, `none`, `out_of_scope`, `unsupported`, `insufficient_evidence`.
  - Phân định rõ `handover.offered` và việc không được có `ticket_id`.
  - Bắt buộc mã ngành 7 chữ số, số trang PDF 1-based, từ chối URL giả mạo.
  - Phát hiện lệch mã tài liệu, lệch ngành, dải trang vượt giới hạn đoạn trích.
  - Bảo lưu trạng thái `claim_grounding_status = PENDING`.
  - Xử lý mập mờ trong `program_lookup` và cô lập đặc quyền trong `create_handover_ticket`.

### 8.2. Kiểm tra Lint Ruff
- Lệnh thực thi:
  ```bash
  python -m ruff check apps/api
  ```
- Kết quả: **All checks passed!** (Không có bất kỳ cảnh báo hay lỗi cú pháp nào).

---

## 9. Phân loại Rủi ro còn lại (Remaining Risks)

| Mức độ | Rủi ro | Tác động | Kế hoạch giảm thiểu |
|---|---|---|---|
| **P0** | Frontend Mock Fallback (`CandidateChatWorkspace.tsx` và `chatMockData.ts`) | Khi API lỗi hoặc offline, frontend có thể tự sinh câu trả lời bịa đặt về điểm chuẩn/học phí năm 2026 kèm đường dẫn trích dẫn giả lập `/tuyensinh`. | Đây là rủi ro nghiêm trọng nhất, đã được đưa vào phạm vi giải quyết ngay trong **Task 4**. |
| **P1** | Semantic Claim Grounding chưa được triển khai | Một trích dẫn hợp lệ về mặt cấu trúc và khớp với tài liệu vẫn có thể trích đoạn không chứa đầy đủ câu trả lời mà AI sinh ra. | Triển khai mô hình thẩm định ngữ nghĩa claim-level ở **Phase 6**. |
| **P2** | Cơ chế ký URL tài liệu nội bộ / công khai | Hiện tại URL trong tài liệu có thể là link công khai hoặc file nội bộ trong hệ thống tài liệu. | Thống nhất chính sách phân phối tài liệu có chữ ký số (Signed URLs) trong **Phase 3/4**. |

---

## 10. Thông tin Git & Sẵn sàng bàn giao

- **Nhánh triển khai:** `feat/phase-1-task-3-response-tool-contracts`
- **Khởi nguồn:** Từ đỉnh `origin/main` (commit `0c797a6`)
- **Tình trạng:**
  - Không commit trực tiếp lên `main`.
  - Không tự ý merge nhánh.
  - Sẵn sàng để thực hiện commit theo quy định:
    `feat(ai): define response citation and agent tool contracts`
