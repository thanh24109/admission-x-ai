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

---

## 11. Task 3.1 Review Fixes: Củng cố an toàn Contract & Verification

**Commit SHA base được review:** `5e73ed636edcaf948f7282e2f85b886315b226fb`  
**Kết quả Review:** PASS WITH CHANGES  

### 11.1. Các vấn đề được chỉ ra và giải pháp khắc phục

1. **P1 — Khắc phục Legacy Citation Adapter (`to_legacy_chat_response`)**:
   - *Vấn đề:* Phiên bản ban đầu thay thế nhãn trang `Trang N` hoặc tên tài liệu `c.title` vào trường `source` của schema cũ khi `source_url` là `None`. Đồng thời fallback `confidence=1.0` tạo ra cảm giác sai lệch về độ chắc chắn (misleading certainty).
   - *Giải pháp:*
     - Tuyệt đối không bịa đặt nguồn hoặc URL trích dẫn. Không sử dụng `Trang N` hoặc tiêu đề tài liệu làm nguồn thay thế.
     - Các trích dẫn không có `source_url` chính thức, đã xác minh sẽ được **loại bỏ an toàn** (`omitted`) khỏi danh sách `citations` của `ChatResponse` cũ, thay vì chế tạo chuỗi giả.
     - Thuộc tính `confidence` khi chưa được đánh giá (`None`) sẽ fallback về `0.0` thay vì `1.0`.

2. **P1 — Chế độ Đóng an toàn khi thiếu Trusted Catalog (Fail Closed)**:
   - *Vấn đề:* `ContractCitationVerifier` trước đây trả về `is_valid=True` ngay cả khi `trusted_catalog` là `None` (fail open).
   - *Giải pháp:*
     - Triển khai nguyên tắc **Fail-Closed**: Khi `trusted_catalog` là `None`, việc xác thực danh mục được đánh dấu là `CATALOG_NOT_EVALUABLE` và `is_valid = False`.
     - Tuyệt đối không phê duyệt trích dẫn khi chưa có danh mục tài liệu phê duyệt của trường.
     - Định nghĩa model `TrustedDocumentEntry` có cấu trúc nghiêm ngặt (`document_id`, `title`, `source_tier`, `is_active`, `document_hash`, `allowed_major_codes`).
     - Thẩm định metadata danh mục: từ chối nếu tài liệu bị đánh dấu `is_active=False` (`CATALOG_DOCUMENT_INACTIVE`), lệch phân cấp nguồn (`CATALOG_METADATA_MISMATCH`), lệch hash mã hóa, hoặc mã ngành không được phân quyền trong tài liệu đó.
     - Hàm `verify_batch` chỉ đưa các trích dẫn có `is_valid=True` vào `verified_citations`. Khi thiếu catalog, `verified_citations` sẽ rỗng hoàn toàn.

3. **P2 — Củng cố ngữ nghĩa hợp đồng Handover (`HandoverInfo`)**:
   - *Vấn đề:* Trước đây `requested=True` có thể bị nhầm lẫn là đủ thẩm quyền để tạo vé hỗ trợ (`ticket_id`).
   - *Giải pháp:*
     - Bổ sung trường `consent_verified: bool = False` để phân tách rạch ròi giữa yêu cầu của người dùng (`requested=True`) và việc máy chủ đã kiểm chứng sự đồng thuận (`consent_verified=True`).
     - Thiết lập ràng buộc bất biến: `ticket_id` chỉ được phép tồn tại khi đồng thời `requested=True` VÀ `consent_verified=True`. Bất kỳ nỗ lực gán `ticket_id` khi chưa có xác nhận đồng thuận từ máy chủ đều bị Pydantic chặn bằng `ValueError`.
     - Thêm trạng thái `HandoverStatus.CONSENTED` khi thí sinh đã yêu cầu và đồng thuận đã được kiểm chứng nhưng vé chưa được khởi tạo.

4. **Kiểm toán tính nhất quán bổ sung (Additional Consistency Audit)**:
   - `apps/api/app/schemas/citation.py`: Hàm `CitationRecord.matches_evidence()` trực tiếp kiểm tra và từ chối nếu `evidence.verification_status != VerificationStatus.VERIFIED`.
   - `apps/api/app/ai/tools/contracts.py`:
     - `ToolResponseEnvelope` bắt buộc phải có `error_code` khi trạng thái là `error` hoặc `unavailable`.
     - `CurriculumRetrieveResult` chặn trường hợp `coverage == SUFFICIENT` nhưng danh sách `evidence` lại rỗng.

### 11.2. Danh sách tệp tin thay đổi trong Task 3.1
- `apps/api/app/schemas/response_envelope.py`: Cập nhật `HandoverStatus`, `HandoverInfo`, và `to_legacy_chat_response`.
- `apps/api/app/ai/rag/citations/verifier.py`: Bổ sung `TrustedDocumentEntry`, fail-closed khi thiếu catalog, kiểm định metadata catalog.
- `apps/api/app/ai/rag/citations/__init__.py`: Xuất khẩu `TrustedDocumentEntry`.
- `apps/api/app/schemas/citation.py`: Ràng buộc `evidence.verification_status == VERIFIED` trong `matches_evidence`.
- `apps/api/app/ai/tools/contracts.py`: Ràng buộc `error_code` cho trạng thái `unavailable` và chặn `coverage=SUFFICIENT` rỗng.
- `apps/api/tests/test_response_envelope.py`: Bổ sung 4 test cases kiểm tra loại bỏ trích dẫn thiếu URL, confidence fallback 0.0, và ràng buộc `consent_verified`.
- `apps/api/tests/test_citation_verifier.py`: Bổ sung 6 test cases kiểm tra fail-closed khi thiếu catalog, document inactive, metadata mismatch, hash mismatch, unauthorized major code, và batch unapproved.
- `apps/api/tests/test_citation_contract.py`: Bổ sung 1 test case kiểm tra từ chối evidence chưa verified.
- `apps/api/tests/test_tool_contracts.py`: Bổ sung 2 test cases kiểm tra `error_code` trên `unavailable` và `coverage=SUFFICIENT` rỗng.
- `docs/ai/phase-1/task-3-implementation-report.md`: Cập nhật mục 11.

### 11.3. Kết quả Kiểm thử & Lint sau Task 3.1
- **Pytest:** `131 passed in 7.13s` (Toàn bộ 131 test pass 100%, tăng thêm 12 test regressions so với Task 3 ban đầu).
- **Ruff Check:** `All checks passed!` (0 lỗi, 0 cảnh báo).

### 11.4. Thông tin Commit Task 3.1
- **Commit SHA:** `cd67c1f`
- **Thông điệp Commit:** `fix(ai): harden citation verification and legacy response contracts`
- **Tình trạng:** Sẵn sàng review Task 3.1. Dừng sau Task 3.1, không merge vào main, không bắt đầu Task 4.


---

## 12. Task 3.2 — Trusted Catalog Verification Hardening

**Nhánh:** `feat/phase-1-task-3-response-tool-contracts`  
**Commit cơ sở được review:** `53ff5d7dada6db6378f333f128a1ea20ca2b4d3c`  
**Kết quả Review:** PASS WITH CHANGES (1 vấn đề P1 trust-boundary còn lại)

### 12.1. Vấn đề Phát hiện & Phân tích Rủi ro
Trong quá trình rà soát commit `53ff5d7dada6db6378f333f128a1ea20ca2b4d3c`, phát hiện lỗ hổng an toàn tại ranh giới tin cậy (trust boundary) trong bộ xác thực trích dẫn:
1. **Tự động điền dữ liệu thiếu từ nguồn không tin cậy:** `ContractCitationVerifier` sử dụng `entry_data.setdefault("document_id", citation.document_id)` và `entry_data.setdefault("title", citation.title)` để bổ sung thông tin thiếu cho catalog. Điều này cho phép trích dẫn do người dùng hoặc LLM kiểm soát tự "hợp thức hóa" cho một bản ghi danh mục rỗng.
2. **Giá trị mặc định quá dễ dãi:** Model `TrustedDocumentEntry` đặt mặc định `is_active=True` và `source_tier=SourceTier.OFFICIAL_EPU`. Kết hợp với việc auto-populate, một entry danh mục dạng `{}` hoặc chỉ có `{"title": "..."}` sẽ mặc nhiên được hệ thống coi là tài liệu tuyển sinh chính thức đang có hiệu lực.
3. **Bỏ sót kiểm tra mã băm tài liệu:** Khi danh mục yêu cầu mã băm mật mã (`document_hash is not None`), nhưng bằng chứng (`evidence`) lại không có mã băm (`document_hash is None`), bộ xác thực trước đây bỏ qua bước kiểm tra thay vì từ chối.
4. **Không kiểm tra tính nhất quán giữa key và value của Catalog:** Không đối chiếu khóa của dictionary trong catalog với trường `document_id` bên trong bản ghi `TrustedDocumentEntry`.

### 12.2. Các giải pháp đã triển khai (Required Fixes)

1. **Tuyệt đối không sử dụng dữ liệu từ Citation để điền Catalog:**
   - Loại bỏ hoàn toàn các lệnh `setdefault` từ dữ liệu trích dẫn (`citation.document_id`, `citation.title`).
   - Catalog phải hoàn toàn độc lập và xuất phát từ nguồn có thẩm quyền (Authoritative Backend-Controlled Catalog).
2. **Bắt buộc cung cấp tường minh các trường định danh và phê duyệt:**
   - Cập nhật model `TrustedDocumentEntry`: các trường `document_id`, `title`, `source_tier`, và `is_active` đều được đặt là `Field(...)` bắt buộc, loại bỏ triệt để các default giá trị dễ dãi.
   - Các trường tùy chọn có chủ đích (`document_hash: str | None = None`, `allowed_major_codes: list[str] | None = None`) được giữ lại và ghi chú rõ ràng tài liệu mục đích kiểm định.
3. **Từ chối ngay các bản ghi Catalog không hoàn chỉnh:**
   - Bất kỳ entry nào dưới dạng dict thiếu một trong các trường bắt buộc (`document_id`, `title`, `source_tier`, `is_active`) sẽ bị Pydantic `ValidationError` bắt giữ và chuyển đổi thành lỗi `CATALOG_METADATA_MISMATCH` với thông báo rõ ràng "incomplete or invalid catalog entry".
4. **Xác thực khóa Dictionary so với `document_id`:**
   - Khi catalog được truyền dưới dạng dict, bộ xác thực kiểm tra: `if catalog_key != entry_data["document_id"]`, ngay lập tức từ chối với lý do "Catalog key ... mismatches entry document_id ...".
5. **Thắt chặt xác thực Cryptographic Hash:**
   - Nếu `catalog_entry.document_hash is not None`, bộ xác thực bắt buộc `evidence.document_hash` phải khác rỗng và phải khớp tuyệt đối (`evidence.document_hash == catalog_entry.document_hash`). Nếu `evidence.document_hash` bị thiếu hoặc `None`, trích dẫn bị từ chối ngay với lý do "evidence document_hash is missing".
6. **Bảo toàn trạng thái `catalog_verified` & `claim_grounding_status`:**
   - `catalog_verified` chỉ được đặt thành `True` khi toàn bộ các kiểm tra danh mục thẩm quyền hoàn tất thành công.
   - `claim_grounding_status` giữ nguyên tuyệt đối ở mức `VerificationStatus.PENDING` (không giả lập đánh giá ngữ nghĩa claim-level của Phase 6).
7. **Ranh giới tin cậy và kiểm chứng nguồn gốc (Trust Boundary & Provenance):**
   - Đã bổ sung tài liệu kiến trúc bảo mật chi tiết trong docstring của `ContractCitationVerifier`: Backend gọi xác thực, chứ không phải người dùng hay LLM, chịu trách nhiệm quản lý danh mục tài liệu tin cậy.
   - Docstring của adapter `to_legacy_chat_response` trong `apps/api/app/schemas/response_envelope.py` được bổ sung làm rõ: việc có một `source_url` không rỗng không tự động chứng minh URL đó là nguồn tin cậy; tính xác thực bắt buộc phải xuất phát từ quá trình kiểm tra danh mục có thẩm quyền.

### 12.3. Danh sách tệp tin thay đổi
- `apps/api/app/ai/rag/citations/verifier.py`:
  - Yêu cầu tường minh `source_tier: SourceTier` và `is_active: bool` trong `TrustedDocumentEntry`.
  - Bổ sung xác thực khóa catalog so với `document_id`.
  - Loại bỏ hoàn toàn auto-populate từ citation fields.
  - Thắt chặt so khớp document hash (từ chối khi thiếu hash bằng chứng).
  - Bổ sung tài liệu bảo mật ranh giới tin cậy (Security Trust Boundary).
- `apps/api/app/schemas/response_envelope.py`:
  - Cập nhật docstring của `to_legacy_chat_response` nhấn mạnh ranh giới provenance và ngăn chặn việc coi URL bất kỳ là nguồn đã xác minh.
- `apps/api/tests/test_citation_verifier.py`:
  - Cập nhật 5 test fixtures hiện có để cung cấp tường minh `source_tier` và `is_active`.
  - Bổ sung 6 test cases mới kiểm thử toàn diện các trường hợp hồi quy và ranh giới bảo mật.
- `docs/ai/phase-1/task-3-implementation-report.md`:
  - Thêm mục 12 ghi nhận chi tiết triển khai Task 3.2.

### 12.4. Danh mục Test Cases Hồi quy (Regression Tests)
Đã triển khai và vượt qua tất cả các ca kiểm thử hồi quy được yêu cầu:
1. `test_verifier_catalog_entry_empty_dict_rejected`: Bản ghi catalog `{}` bị từ chối.
2. `test_verifier_catalog_entry_only_title_rejected`: Bản ghi catalog chỉ có `title` bị từ chối.
3. `test_verifier_catalog_entry_missing_active_status_rejected`: Thiếu trạng thái `is_active` tường minh bị từ chối.
4. `test_verifier_catalog_key_and_document_id_mismatch_rejected`: Lệch giữa khóa catalog và `document_id` bị từ chối.
5. `test_verifier_missing_evidence_hash_when_catalog_requires_hash`: Thiếu hash bằng chứng khi catalog yêu cầu hash bị từ chối.
6. `test_verifier_success_contract`: Bản ghi catalog thẩm quyền hợp lệ với bằng chứng tương ứng vượt qua xác thực cấu trúc và danh mục.
7. `test_untrusted_metadata_cannot_become_verified_evidence`: Dữ liệu không đáng tin cậy do người dùng/client cung cấp không thể phê duyệt tài liệu tự tạo.
8. `test_claim_level_grounding_remains_pending_after_catalog_verification`: Khẳng định `claim_grounding_status` vẫn là `PENDING` sau khi xác thực catalog thành công.

### 12.5. Kết quả Kiểm thử & Linter
- **Pytest:**
  ```text
  python -m pytest apps/api/tests evals/harness/tests
  ============================= 137 passed in 7.64s =============================
  ```
  *(100% 137 tests đạt yêu cầu, không có bất kỳ test nào thất bại hay cảnh báo thoái lui).*
- **Ruff Check:**
  ```text
  python -m ruff check apps/api
  All checks passed!
  ```

### 12.6. Hạn chế còn lại (Remaining Limitations)
- **Claim Grounding Semantic Evaluation:** Khế ước chỉ bảo đảm tính hợp lệ về mặt cấu trúc, trích xuất và danh mục tài liệu có thẩm quyền (`catalog_verified=True`). Việc đối soát ngữ nghĩa giữa câu trả lời sinh ra bởi mô hình và đoạn trích dẫn (NLI / Hallucination Detection) sẽ được triển khai đầy đủ trong **Phase 6**.
- **Catalog Management Lifecycle:** Hiện tại danh mục tài liệu tin cậy được truyền vào verifier từ backend; quy trình quản lý vòng đời tài liệu (tải lên, băm SHA-256, phê duyệt và kích hoạt qua giao diện quản trị) sẽ được kết nối ở các Phase tiếp theo.

### 12.7. Thông tin Commit
- **Nhánh:** `feat/phase-1-task-3-response-tool-contracts`
- **Commit SHA:** `53eb835` (`53eb8351e695bc4fa5843253193602479b857044`)
- **Thông điệp Commit:** `fix(ai): enforce authoritative trusted catalog metadata`
- **Quy tắc tuân thủ:** Không merge vào `main`. Dừng lại sau khi hoàn thành Task 3.2. Không bắt đầu Task 4.
