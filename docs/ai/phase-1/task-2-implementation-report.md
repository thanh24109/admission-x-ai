# BÁO CÁO KẾT QUẢ THỰC HIỆN TASK 2: RULEBASE ENGINE & DETERMINISTIC GUARDRAILS

**Dự án**: Admission X AI — Trợ lý Tuyển sinh Đại học Điện lực (EPU)  
**Nhánh Git**: `feat/phase-1-task-2-rulebase-guardrails`  
**Commit**: `b20c9e0` (`feat(ai): implement deterministic rulebase engine and guardrails`)  
**Trạng thái**: Clean working tree — 100% tests & linter passed.

---

## A. TỔNG KẾT TRIỂN KHAI (IMPLEMENTATION SUMMARY)

Trong phạm vi Task 2 của Phase 1, hệ thống đánh giá chính sách xác định và các bộ lọc an toàn cốt lõi đã được xây dựng hoàn thiện:

### 1. Kiến trúc Đánh giá Quy tắc Xác định (`RulebaseEngine`)
- **Tích hợp Cấu hình Chuẩn**: Nạp tự động `PolicyConfig` từ Task 1 (chứa đầy đủ 13 quy tắc từ `rulebase-v1.yaml`).
- **Phân loại Trạng thái Đánh giá 3 Mức (Evaluation Semantics)**:
  - `PASS`: Quy tắc được đánh giá và thỏa mãn.
  - `FAIL`: Quy tắc được đánh giá và phát hiện vi phạm.
  - `NOT_EVALUABLE`: Quy tắc chưa thể xác minh đầy đủ do thiếu dependency hạ tầng (ví dụ: chưa chạy major resolver hoặc claim-level citation verifier).
  - **Bảo toàn Bất biến Trọng yếu**: `NOT_EVALUABLE` **tuyệt đối không bao giờ** được coi là `PASS`. Đối với các tuyên bố chính thức của EPU, trạng thái thiếu kiểm chứng luôn dẫn tới hành động chặn an toàn (`safe_fallback` hoặc `block_response`).
- **Mô hình Dữ liệu Bất biến**:
  - `PolicyEvaluationContext`: Nắm bắt đầy đủ ngữ cảnh truy vấn, intent, source mode, mã ngành resolved, trạng thái bằng chứng, danh sách trích dẫn và trạng thái kết nối backend.
  - `PolicyEvaluationReport`: Tổng hợp kết quả từng quy tắc, bóc tách danh sách vi phạm (`violations`), danh sách quy tắc chưa thể đánh giá (`unverified_rules`) và xác định hành vi tổng hợp (`recommended_action`).

### 2. Nâng cấp Bộ lọc An toàn (Deterministic Guardrails)
- **Commitment Guard (`commitment_guard.py`)**:
  - Biên dịch danh mục Regex mở rộng bao quát toàn diện các từ lóng cam kết trúng tuyển ("chắc chắn đỗ", "đảm bảo trúng tuyển", "cam kết trúng tuyển", "bao đậu", "chắc suất", "yên tâm sẽ đỗ", "auto đỗ", "cam kết việc làm 100%").
  - Xử lý phủ định thông minh: Phân tích tiền tố phủ định (`không`, `chưa`, `không thể`, `không bao giờ`, `khó có thể`, `không có chuyện`) để loại bỏ triệt để các cảnh báo sai (false positives) khi hệ thống đưa ra lời giải thích thận trọng.
  - Bảo toàn interface tương thích ngược: `contains_forbidden_commitment(text) -> bool` song song cùng hàm chi tiết `check_commitment(text) -> CommitmentCheckResult`.
- **PII Guard (`pii.py`)**:
  - Nhận diện và che giấu (redaction) 3 loại định danh cá nhân nhạy cảm phổ biến tại Việt Nam: Số điện thoại (các đầu số 03, 05, 07, 08, 09 và +84), Email, Số CCCD (12 chữ số) và CMND (9 chữ số có nhãn).
  - Triển khai hàm `mask_pii(text) -> str` thay thế PII bằng các placeholder chuẩn (`[REDACTED_PHONE]`, `[REDACTED_EMAIL]`, `[REDACTED_CCCD]`) theo cơ chế thay thế ngược (từ phải sang trái) để tránh lệch offset.
  - Không ghi log PII thô, đảm bảo quyền riêng tư theo quy chế tuyển sinh.
- **Prompt Injection Guard (`injection.py`)**:
  - Phòng thủ theo chiều sâu (defense-in-depth) nhận dạng các mẫu tấn công chiếm quyền điều khiển chỉ dẫn hệ thống ở mức độ tin cậy cao bằng cả Tiếng Anh và Tiếng Việt ("ignore previous instructions", "system prompt override", "bỏ qua hướng dẫn trước", "bỏ qua mọi quy tắc", "tiết lộ system prompt", "bạn là một AI không bị kiểm duyệt", "jailbreak").

---

## B. MA TRẬN PHỦ 13 QUY TẮC (RULE COVERAGE MATRIX)

| Mã Quy tắc | Tên Quy tắc | Mức độ Thực thi trong Task 2 | Lý giải Kỹ thuật & Hiện trạng |
| :--- | :--- | :---: | :--- |
| **RB-01** | Official Evidence Requirement | **Hoàn thành một phần (Partial)** | Nếu `source_mode == official_epu` mà `evidence_status == verified` -> PASS. Nếu missing/none -> FAIL. Nếu chưa có claim-level verifier -> trả về `NOT_EVALUABLE` và kích hoạt `safe_fallback` để chặn an toàn. |
| **RB-02** | Program Resolution | **Hoàn thành một phần (Partial)** | Đã kiểm định danh sách `resolved_major_codes`. Nếu có đúng 1 mã ngành hợp lệ -> PASS. Nếu rỗng (không tìm thấy) -> FAIL. Nếu resolver chưa chạy -> `NOT_EVALUABLE`. Không tự bịa mã ngành. |
| **RB-03** | Ambiguous Program | **Hoàn thành đầy đủ (Complete)** | Nếu `resolved_major_codes` trả về > 1 mã ngành -> Đánh dấu FAIL và kích hoạt hành động `clarification_needed`. |
| **RB-04** | Restricted Admissions Claims | **Hoàn thành một phần (Partial)** | Regex engine phát hiện các tuyên bố cụ thể về học phí (số tiền, tín chỉ), điểm chuẩn hoặc chỉ tiêu trong câu trả lời đề xuất (`draft_answer`). Nếu thiếu bằng chứng verified -> Đánh dấu FAIL và chặn lại. |
| **RB-05** | Temporal Validity | **Hoàn thành một phần (Partial)** | Nếu câu hỏi yêu cầu niên khóa tuyển sinh cụ thể (`requested_admissions_year`), engine đối soát với `evidence_year`. Nếu lệch năm -> FAIL. Nếu không có metadata năm -> `NOT_EVALUABLE`. |
| **RB-06** | Citation Validity | **Hoàn thành một phần (Partial)** | Phát hiện và loại bỏ các trích dẫn giả tạo (thiếu `document_id` hoặc `page_start < 1`). Xác thực cấu trúc trích dẫn; claim-level verifier chi tiết thuộc về Phase 6. |
| **RB-07** | Partial Evidence | **Hoàn thành đầy đủ (Complete)** | Nhận diện trạng thái `evidence_status == partial` và thiết lập hành động khuyến nghị là `partial_answer` (chỉ trả lời phần có bằng chứng). |
| **RB-08** | General Knowledge | **Hoàn thành đầy đủ (Complete)** | Cho phép trả lời trực tiếp khi `source_mode == general`. Phát hiện và đánh dấu FAIL nếu câu trả lời kiến thức chung tự ý gán ghép trích dẫn tài liệu EPU chính thức. |
| **RB-09** | Admission Guarantees | **Hoàn thành đầy đủ (Complete)** | Tích hợp bộ lọc cam kết trúng tuyển nâng cao, bắt các từ lóng ("bao đậu", "chắc suất", "auto đỗ") và xử lý chính xác các phát ngôn phủ định/thận trọng. Vi phạm sẽ bị kích hoạt `block_response`. |
| **RB-10** | Privacy | **Hoàn thành đầy đủ (Complete)** | Phát hiện số điện thoại, email, CCCD trong câu hỏi. Nếu chưa được che giấu -> Đánh dấu FAIL và yêu cầu kích hoạt `mask_pii`. |
| **RB-11** | Prompt Injection | **Hoàn thành đầy đủ (Complete)** | Phát hiện các mẫu câu ghi đè chỉ dẫn hệ thống ("bỏ qua quy tắc", "system prompt override") và kích hoạt hành động `block_response`. |
| **RB-12** | Handover Policy | **Hoàn thành đầy đủ (Complete)** | Ngăn chặn triệt để lỗi tự động bàn giao: Thiếu bằng chứng chỉ kích hoạt `safe_fallback`, KHÔNG BAO GIỜ tự ý tạo ticket bàn giao. Chỉ đề xuất bàn giao khi người dùng có yêu cầu và xác nhận đồng ý. |
| **RB-13** | Frontend Fallback Safety | **Hoàn thành đầy đủ (Complete)** | Khi `backend_available == False`, engine lập tức đánh dấu FAIL và định tuyến sang `safe_fallback` để ngăn chặn việc client tự tạo thông tin giả lập. |

---

## C. DANH MỤC CÁC TỆP THAY ĐỔI (CHANGED FILES)

### 1. Tệp tạo mới (New Files)
- **Engine Đánh giá Quy tắc** (tại `apps/api/app/ai/rules/`):
  - [`models.py`](file:///e:/admission-x-ai/apps/api/app/ai/rules/models.py): Enums `RuleOutcome`, `RecommendedAction`, các Pydantic models `PolicyEvaluationContext`, `RuleEvaluationResult`, `PolicyEvaluationReport`.
  - [`evaluators.py`](file:///e:/admission-x-ai/apps/api/app/ai/rules/evaluators.py): 13 hàm đánh giá chuyên biệt cho từng quy tắc từ `evaluate_rb01_official_evidence` đến `evaluate_rb13_frontend_fallback_safety`.
  - [`engine.py`](file:///e:/admission-x-ai/apps/api/app/ai/rules/engine.py): Lớp điều phối `RulebaseEngine` nạp cấu hình chính sách và tính toán hành vi tổng hợp theo ma trận quyết định.
  - [`__init__.py`](file:///e:/admission-x-ai/apps/api/app/ai/rules/__init__.py): Export công khai các thành phần của module rules.
- **Bộ lọc An toàn Mới**:
  - [`apps/api/app/ai/guardrails/injection.py`](file:///e:/admission-x-ai/apps/api/app/ai/guardrails/injection.py): Mô-đun phát hiện tấn công prompt injection với `check_prompt_injection` và `detect_prompt_injection`.
- **Bộ Unit Tests**:
  - [`apps/api/tests/test_commitment_guard.py`](file:///e:/admission-x-ai/apps/api/tests/test_commitment_guard.py): 4 tests bao phủ các ca cam kết tích cực, câu phủ định thận trọng, câu hỏi bình thường và cấu trúc kết quả.
  - [`apps/api/tests/test_pii_guard.py`](file:///e:/admission-x-ai/apps/api/tests/test_pii_guard.py): 6 tests bao phủ nhận diện SĐT, Email, CCCD, CMND và che giấu nhiều PII cùng lúc.
  - [`apps/api/tests/test_injection_guard.py`](file:///e:/admission-x-ai/apps/api/tests/test_injection_guard.py): 4 tests bao phủ tấn công Tiếng Anh, Tiếng Việt và các câu hỏi tuyển sinh thông thường chứa từ khóa nhạy cảm.
  - [`apps/api/tests/test_rulebase_engine.py`](file:///e:/admission-x-ai/apps/api/tests/test_rulebase_engine.py): 15 tests toàn diện kiểm thử độc lập cho cả 13 quy tắc và hành vi ra quyết định tổng hợp.

### 2. Tệp sửa đổi (Modified Files)
- [`apps/api/app/ai/guardrails/commitment_guard.py`](file:///e:/admission-x-ai/apps/api/app/ai/guardrails/commitment_guard.py): Nâng cấp regex engine, phân tích tiền tố phủ định và bổ sung hàm `check_commitment`.
- [`apps/api/app/ai/guardrails/pii.py`](file:///e:/admission-x-ai/apps/api/app/ai/guardrails/pii.py): Bổ sung `detect_pii`, `mask_pii`, `contains_pii` hỗ trợ định dạng định danh Việt Nam.
- [`apps/api/app/ai/guardrails/__init__.py`](file:///e:/admission-x-ai/apps/api/app/ai/guardrails/__init__.py): Export các hàm và lớp guardrail mới.

---

## D. KẾT QUẢ KIỂM THỬ VÀ LINTER (TEST RESULTS)

### 1. Kiểm thử Toàn diện (Pytest)
Lệnh thực thi:
```bash
& "E:\admission-x-ai\.venv\Scripts\python.exe" -m pytest apps/api/tests evals/harness/tests
```
**Kết quả**:
```text
============================= test session starts =============================
platform win32 -- Python 3.13.5, pytest-8.4.2, pluggy-1.6.0
rootdir: E:\admission-x-ai
configfile: pyproject.toml
plugins: anyio-4.15.1, langsmith-0.14.7, agentharness-0.1.0a2
collected 61 items

apps\api\tests\test_ai_integration.py ...                                [  4%]
apps\api\tests\test_chat.py .                                            [  6%]
apps\api\tests\test_commitment_guard.py ....                             [ 13%]
apps\api\tests\test_database.py .....                                    [ 21%]
apps\api\tests\test_health.py .                                          [ 22%]
apps\api\tests\test_injection_guard.py ....                              [ 29%]
apps\api\tests\test_pii_guard.py ......                                  [ 39%]
apps\api\tests\test_policy_config.py ..........                          [ 55%]
apps\api\tests\test_prompt_builder.py .........                          [ 70%]
apps\api\tests\test_rulebase_engine.py ...............                   [ 95%]
evals\harness\tests\test_guardrail.py .                                  [ 96%]
evals\harness\tests\test_handover.py .                                   [ 98%]
evals\harness\tests\test_trace_behavior.py .                             [100%]

Agent-Harness: 7 passed, 0 failed
============================= 61 passed in 9.51s ==============================
```
- **Tổng số tests**: **61 passed, 0 failed, 0 errors**.
  - `test_rulebase_engine.py`: 15/15 passed.
  - `test_commitment_guard.py`: 4/4 passed.
  - `test_pii_guard.py`: 6/6 passed.
  - `test_injection_guard.py`: 4/4 passed.
  - Toàn bộ các bài test cũ của Task 1 (`test_prompt_builder.py`, `test_policy_config.py`) và test hệ thống (`test_ai_integration.py`, `test_database.py`, `evals/harness/tests`) tiếp tục pass 100%.

### 2. Kiểm tra Định dạng & Quy chuẩn (Ruff Linter)
Lệnh thực thi:
```bash
& "E:\admission-x-ai\.venv\Scripts\python.exe" -m ruff check apps/api
```
**Kết quả**:
```text
All checks passed!
```

---

## E. TÍNH TƯƠNG THÍCH (COMPATIBILITY)

1. **Bảo tồn Interface Cũ**:
   - Hàm `contains_forbidden_commitment(text: str) -> bool` tiếp tục hoạt động chính xác và tương thích hoàn toàn với các test cũ, nhưng nay thông minh hơn nhờ xử lý phủ định và từ lóng.
   - Tập hợp `ALLOWED_PROFILE_FIELDS` trong `pii.py` được giữ nguyên vẹn.
2. **Không thay đổi API Contract của `/api/v1/chat`**:
   - `RulebaseEngine` được thiết kế dưới dạng lớp dịch vụ nội bộ độc lập (pure Python / Pydantic), chưa can thiệp vào router FastAPI trong Task 2 nhằm duy trì sự ổn định tuyệt đối cho frontend.
3. **Không phát sinh phụ thuộc bên ngoài**:
   - Hoạt động 100% offline, không gọi LLM bên ngoài, không truy vấn Supabase hay vector database.

---

## F. TRẠNG THÁI PHIÊN BẢN GIT (GIT STATUS)

- **Nhánh hiện tại**: `feat/phase-1-task-2-rulebase-guardrails` (nhánh tính năng độc lập tạo từ `main`).
- **Commit SHA**: `b20c9e0f028bd25fe3ad62af444252db4287ac58`
- **Thông điệp Commit**: `feat(ai): implement deterministic rulebase engine and guardrails`
- **Trạng thái Working Tree**: Hoàn toàn sạch (`nothing to commit, working tree clean`).

---

## G. CÔNG VIỆC TIẾP THEO (TASK 3 PREPARATION)

Task 2 đã hoàn thành toàn diện việc xây dựng `RulebaseEngine` và các guardrails xác định. Sẵn sàng chuyển tiếp sang **Task 3: Response Contract & Agent Tool Interfaces**:

1. **Chuẩn hóa Response Envelope V1.1**:
   - Định nghĩa `AdmissionResponseEnvelope` chứa các trường `status`, `evidence_decision`, `source_mode`, `missing_aspects` tương ứng với các `RecommendedAction` được sinh ra từ `RulebaseEngine`.
2. **Chuẩn hóa Hợp đồng Trích dẫn (`CitationContract`)**:
   - Đồng bộ giữa backend (`document_id`, `page_start`, `page_end`, `quote_text`, `source_tier`) và frontend citation card.
3. **Định nghĩa Typed Tool Interfaces**:
   - Xây dựng schema I/O cho 6 công cụ agent sẵn sàng cho Phase 7.

---

## H. BỔ SUNG TASK 2.1: KHẮC PHỤC CÁC PHÁT HIỆN ĐÁNH GIÁ RULEBASE ENGINE (REVIEW FIXES)

- **Nhánh Git**: `feat/phase-1-task-2-rulebase-guardrails`
- **Commit Task 2.0**: `b20c9e0f028bd25fe3ad62af444252db4287ac58`
- **Commit Task 2.1 (Fixes)**: `9b76c01` (`fix(ai): address phase-1 task-2 rulebase review findings`)
- **Kết quả đánh giá**: **PASS WITH ALL CHANGES APPLIED**

### 1. Chi tiết các vấn đề P1 & P2 đã khắc phục

#### Nhóm P1 (Critical Defects)
1. **Commitment Guard Early Return (`check_commitment`)**:
   - **Vấn đề**: `check_commitment` lập tức trả về `has_violation=False, is_negated=True` khi phát hiện cụm từ phủ định đầu tiên, vô tình bỏ qua các cam kết khẳng định xuất hiện sau đó trong văn bản (ví dụ: *"Nhà trường không cam kết trúng tuyển. Nhưng em chắc chắn đỗ."*).
   - **Giải pháp**:
     - Thu thập toàn bộ các vị trí khớp cam kết trên toàn bộ văn bản và sắp xếp theo vị trí xuất hiện.
     - Thiết lập biên phân định mệnh đề/câu (`.`, `!`, `?`, `;`, `\n`) và các liên từ tương phản (`nhưng`, `tuy nhiên`, `song`, `thế nhưng`) để phạm vi phủ định không rò rỉ sang mệnh đề chứa cam kết khẳng định.
     - Trả về `has_violation=True` ngay khi phát hiện **bất kỳ** cam kết khẳng định không bị phủ định nào.
     - Chỉ trả về `has_violation=False, is_negated=True` khi **toàn bộ** các cụm từ cam kết trong câu đều được phủ định rõ ràng.

2. **Aggregate Decision Precedence (`_determine_aggregate_action`)**:
   - **Vấn đề**: `handover_requested` được xét trước các vi phạm về bằng chứng và quyền riêng tư, cho phép yêu cầu chuyển tiếp ghi đè lỗi thiếu bằng chứng hoặc lộ PII.
   - **Giải pháp**: Tái cấu trúc bộ xác định hành động tổng hợp theo đúng 4 tầng ưu tiên chuẩn hóa trong `docs/ai/phase-1/rulebase-v1.yaml` và `docs/ai/phase-1/decision-matrix.md`:
     - **Tầng 1 (Safety & Privacy)**: Chặn ngay lập tức nếu có Prompt Injection (RB-11), Cam kết trúng tuyển (RB-09), Lộ PII trong câu trả lời (RB-10); fallback an toàn nếu Backend offline (RB-13) hoặc PII chưa che giấu trong câu hỏi (RB-10).
     - **Tầng 2 (Verified Evidence & Temporal Validity)**: Fallback an toàn nếu thiếu bằng chứng chính thức (RB-01), phát ngôn số liệu không căn cứ (RB-04), lệch niên khóa (RB-05), trích dẫn giả mạo/thiếu trích dẫn (RB-06).
     - **Tầng 3 (Ambiguity & Source Classification)**: Yêu cầu làm rõ nếu ngành mơ hồ (RB-03) hoặc không tìm thấy mã ngành (RB-02); fallback nếu gán trích dẫn giả cho kiến thức chung (RB-08); câu trả lời một phần (RB-07) khi bằng chứng là `partial`.
     - **Tầng 4 (Answer Format & Tone)**: Chỉ gợi ý chuyển tiếp tư vấn viên (`HANDOVER_SUGGESTED`) khi các tầng an toàn và bằng chứng ở trên đều hợp lệ. `HANDOVER_SUGGESTED` chỉ là đề xuất trạng thái, **tuyệt đối không tự động tạo ticket**.
     - **Bất biến**: `NOT_EVALUABLE` trong các tuyên bố chính thức luôn dẫn đến `SAFE_FALLBACK`, không bao giờ cho phép `DIRECT_ANSWER`.

3. **RB-01 Evidence Verification Semantics**:
   - **Vấn đề**: RB-01 trả về `PASS` chỉ vì `evidence_items` khác rỗng và `evidence_status == "verified"`. Việc có tài liệu không chứng minh từng phát ngôn cụ thể đã được kiểm chứng (claim-level grounding).
   - **Giải pháp**:
     - Bổ sung trường kiểu rõ ràng `claim_verification_status` vào `PolicyEvaluationContext`.
     - RB-01 chỉ `PASS` khi đồng thời: có dữ liệu bằng chứng Tier 1 (`evidence_status == "verified"`) **VÀ** kiểm chứng phát ngôn thành công (`claim_verification_status == "verified"`).
     - Khi kiểm chứng phát ngôn chưa chạy hoặc chưa có validator, RB-01 trả về `NOT_EVALUABLE` (`CLAIM_VERIFICATION_UNAVAILABLE`), kích hoạt `SAFE_FALLBACK` an toàn thay vì tự tiện trả lời.

#### Nhóm P2 (Semantics & Robustness Improvements)
1. **RB-02 (Canonical Program Resolver Contract)**: Bổ sung `program_resolver_status`. Yêu cầu trạng thái `"canonical_match"` với đúng 1 mã ngành chuẩn để `PASS`. Nếu resolver chưa chạy $\rightarrow$ trả về `NOT_EVALUABLE`.
2. **RB-06 (Citation Verification Status Contract)**: Bổ sung trường định danh rõ ràng `citation_verification_status`. Phân tách kiểm tra định dạng cấu trúc (document_id, chunk_id, page_start $\ge 1$) và kiểm chứng catalog tài liệu được phép. Nếu mới chỉ đạt kiểm tra cấu trúc $\rightarrow$ trả về `NOT_EVALUABLE`.
3. **RB-08 (General Knowledge Attribution & Fallback)**: Thêm regex `_EPU_ATTRIBUTION_PATTERN` phát hiện các dấu hiệu quy kết quy chế EPU trong chế độ `general` khi chưa có bằng chứng. Thêm cờ `attribution_verified`: nếu mang giá trị `False` $\rightarrow$ trả về `NOT_EVALUABLE`.
4. **RB-09 (User Query vs Assistant Answer Guard)**: Câu hỏi của thí sinh chứa cụm từ cam kết (ví dụ: *"Em 23 điểm có chắc chắn đỗ ngành CNTT không?"*) là câu hỏi hợp lệ, không phải vi phạm. RB-09 chỉ đánh giá phát ngôn của trợ lý (`context.draft_answer`). Nếu `draft_answer is None` $\rightarrow$ trả về `PASS` (`NO_DRAFT_ANSWER`), không chặn truy vấn của thí sinh.
5. **RB-10 (Bảo vệ PII & Ngăn rò rỉ dữ liệu nhạy cảm trong log/thông báo)**: Tuyệt đối không in PII thô ra message chẩn đoán; chỉ ghi nhận loại PII (`PHONE`, `EMAIL`, `CCCD`). Thêm cờ `pii_redacted`: Cho phép tiếp tục hỗ trợ tư vấn tuyển sinh an toàn sau khi dữ liệu nhạy cảm đã được che chắn/ẩn danh hóa (`PII_SAFELY_REDACTED`). Phát hiện rò rỉ PII trong bản nháp câu trả lời trợ lý $\rightarrow$ lập tức `BLOCK_RESPONSE`.
6. **RB-11 (Quét Indirect Prompt Injection trong Passages)**: Quét bổ sung các đoạn văn bản truy xuất (`evidence_items`) để phát hiện tấn công chèn lệnh gián tiếp (indirect prompt injection) từ dữ liệu ngoại lai/web crawl $\rightarrow$ kích hoạt `BLOCK_RESPONSE` (`INDIRECT_PROMPT_INJECTION_DETECTED`).
7. **RB-13 (Phân định ranh giới Backend Policy vs Frontend Offline Remediation)**: Cập nhật docstring kiến trúc: Quy định rõ động cơ backend chỉ thực thi hợp đồng chính sách khi dịch vụ backend hoạt động. Mock fallback của client Next.js (`CandidateChatWorkspace.tsx`) là tầng giao diện presentation được hoãn lại sang Task 4.
8. **Engine Priority Binding & Fail-Closed Registry**: Đồng bộ hóa mức độ ưu tiên `severity` trực tiếp từ file YAML cấu hình `policy_config.get_rule(rule_id).priority`. Kiểm tra toàn diện danh sách rules trong `__init__`, thực hiện **Fail-Closed** nếu thiếu evaluator thay vì âm thầm bỏ qua.

---

### 2. Các vấn đề hoãn lại có chủ đích (Deferred Scope)

1. **Frontend Mock Fallback Remediation**: Sửa mock fallback ở client Next.js (`CandidateChatWorkspace.tsx`) được hoãn sang **Task 4 (Frontend UI & Production Polish)**.
2. **Phase 6 Full Citation Verifier**: So khớp ngữ nghĩa từng câu trích dẫn với vector store thuộc về **Phase 6**; Task 2.1 hoàn thành hợp đồng kiểu `citation_verification_status` và bộ kiểm tra cấu trúc deterministic.
3. **LangGraph Execution / Supabase SDK / Live LLM**: Không triển khai để giữ vững phạm vi độc lập của Rulebase Engine.

---

### 3. Danh mục các file thay đổi trong Task 2.1

- [`apps/api/app/ai/guardrails/commitment_guard.py`](file:///e:/admission-x-ai/apps/api/app/ai/guardrails/commitment_guard.py): Quét đa mệnh đề, phân định câu/liên từ tương phản, loại bỏ early return.
- [`apps/api/app/ai/rules/models.py`](file:///e:/admission-x-ai/apps/api/app/ai/rules/models.py): Bổ sung `claim_verification_status`, `program_resolver_status`, `citation_verification_status`, `attribution_verified`, `pii_redacted`.
- [`apps/api/app/ai/rules/evaluators.py`](file:///e:/admission-x-ai/apps/api/app/ai/rules/evaluators.py): Cập nhật RB-01, RB-02, RB-06, RB-08, RB-09, RB-10, RB-11, RB-13 với typed contracts và sanitization.
- [`apps/api/app/ai/rules/engine.py`](file:///e:/admission-x-ai/apps/api/app/ai/rules/engine.py): Cấu trúc lại 4 tầng ưu tiên theo Decision Matrix; fail-closed khi thiếu evaluator; gắn severity từ YAML.
- [`apps/api/tests/test_commitment_guard.py`](file:///e:/admission-x-ai/apps/api/tests/test_commitment_guard.py): Thêm `test_mixed_negated_and_positive_guarantees`.
- [`apps/api/tests/test_rulebase_engine.py`](file:///e:/admission-x-ai/apps/api/tests/test_rulebase_engine.py): Bổ sung 9 hàm test hồi quy kiểm chứng RB-01 đến RB-11 và xung đột độ ưu tiên.

---

### 4. Kết quả kiểm thử và Lint sau Task 2.1

#### Pytest:
```text
============================= test session starts =============================
platform win32 -- Python 3.13.5, pytest-8.4.2, pluggy-1.6.0
rootdir: E:\admission-x-ai
configfile: pyproject.toml
plugins: anyio-4.15.1, langsmith-0.14.7, agentharness-0.1.0a2
collected 70 items

apps\api\tests\test_ai_integration.py ...                                [  4%]
apps\api\tests\test_chat.py .                                            [  5%]
apps\api\tests\test_commitment_guard.py .....                            [ 12%]
apps\api\tests\test_database.py .....                                    [ 20%]
apps\api\tests\test_health.py .                                          [ 21%]
apps\api\tests\test_injection_guard.py ....                              [ 27%]
apps\api\tests\test_pii_guard.py ......                                  [ 35%]
apps\api\tests\test_policy_config.py ..........                          [ 50%]
apps\api\tests\test_prompt_builder.py .........                          [ 62%]
apps\api\tests\test_rulebase_engine.py .......................           [ 95%]
evals\harness\tests\test_guardrail.py .                                  [ 97%]
evals\harness\tests\test_handover.py .                                   [ 98%]
evals\harness\tests\test_trace_behavior.py .                             [100%]

Agent-Harness: 7 passed, 0 failed
============================= 70 passed in 8.20s ==============================
```
*(70/70 tests passed — đạt tỷ lệ 100%)*

#### Ruff Linter:
```text
All checks passed!
```

---

### 5. Cập nhật Bảng bao phủ 13 Quy tắc (RB-01 đến RB-13)

| Mã Quy tắc | Tên Quy tắc | Hiện trạng sau Task 2.1 | Cơ chế kiểm chứng sau nâng cấp |
| :--- | :--- | :---: | :--- |
| **RB-01** | Official Evidence Requirement | **Verified** | Tách biệt `evidence_items` và `claim_verification_status`. Có bằng chứng nhưng chưa xác thực phát ngôn $\rightarrow$ `NOT_EVALUABLE`. |
| **RB-02** | Program Resolution | **Verified** | Yêu cầu `program_resolver_status == "canonical_match"`, danh sách mã thô không được coi là PASS. |
| **RB-03** | Ambiguous Program | **Verified** | Đa kết quả mã ngành $\rightarrow$ `CLARIFICATION_NEEDED`. |
| **RB-04** | Restricted Admissions Claims | **Verified** | Phát hiện số liệu học phí/điểm chuẩn khi chưa có bằng chứng Tier 1 $\rightarrow$ `SAFE_FALLBACK`. |
| **RB-05** | Temporal Validity | **Verified** | Lệch năm tuyển sinh đối chiếu với metadata $\rightarrow$ `SAFE_FALLBACK`. |
| **RB-06** | Citation Validity | **Verified** | Phân biệt kiểm tra cấu trúc vs xác thực catalog tài liệu (`citation_verification_status`). |
| **RB-07** | Partial Evidence | **Verified** | Trạng thái `partial` dẫn đến `PARTIAL_ANSWER` ở Tầng 3. |
| **RB-08** | General Knowledge | **Verified** | Phát hiện trích dẫn giả mạo và quy kết quy chế EPU trái phép trong chế độ `general`. |
| **RB-09** | Admission Guarantees | **Verified** | Quét toàn văn bản không thoát sớm khi gặp phủ định; câu hỏi của thí sinh không bị coi là vi phạm. |
| **RB-10** | Privacy | **Verified** | Không in PII thô trong message chẩn đoán; hỗ trợ `pii_redacted`; chặn phát ngôn rò rỉ PII. |
| **RB-11** | Prompt Injection | **Verified** | Quét cả tin nhắn người dùng và các đoạn trích dẫn truy xuất (`evidence_items`) cho indirect injection. |
| **RB-12** | Handover Policy | **Verified** | Đưa về đúng Tầng 4 trong thứ tự ưu tiên; không bao giờ đè bẹp lỗi an toàn hay thiếu bằng chứng; không tự tạo ticket. |
| **RB-13** | Frontend Fallback Safety | **Verified** | Backend policy chặn phát ngôn bịa đặt khi backend offline; mock UI Next.js hoãn sang Task 4. |
