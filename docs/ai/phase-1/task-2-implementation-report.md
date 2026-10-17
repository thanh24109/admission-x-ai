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
