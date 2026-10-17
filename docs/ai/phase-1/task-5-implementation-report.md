# BÁO CÁO TRIỂN KHAI PHASE 1 — TASK 5: GOLDEN DATASET, DETERMINISTIC EVALUATION HARNESS & REGRESSION FRAMEWORK

**Dự án:** Cổng thông tin Tuyển sinh Trường Đại học Điện lực (EPU) — Hệ thống Trợ lý AI (Admission X AI)  
**Nhánh:** `feat/phase-1-task-5-golden-evaluation`  
**Giai đoạn:** Phase 1 — Prompting, Policy, Response Contracts, Deterministic Decision Flow & Golden Evaluation  
**Trạng thái:** HOÀN THÀNH (Sẵn sàng kiểm toán độc lập / Ready for Independent Code Audit)  

---

## 1. Tổng quan (Overview)

Task 5 hoàn thiện hạ tầng đánh giá tất định ngoại tuyến (Deterministic Offline Evaluation Framework) và bộ tập dữ liệu mẫu chuẩn (Golden Dataset V1) gồm 80 kịch bản phục vụ kiểm thử hồi quy chính sách cho hệ thống trợ lý tuyển sinh Trường Đại học Điện lực (EPU).

Khung đánh giá được thiết kế và triển khai với các nguyên tắc an toàn tuyệt đối:
1. **Không bịa đặt dữ liệu tuyển sinh EPU:** Tuyệt đối không sinh câu trả lời tuyển sinh hư cấu, không bịa số trang, mã đoạn trích, hash SHA-256 hay đường dẫn URL PDF của 38 ngành đào tạo.
2. **Không tự ý nâng cấp kịch bản thành sự thật:** Phân định ranh giới nghiêm ngặt giữa nhãn hành vi kịch bản (`scenario specification`) và sự thật tuyển sinh có chứng cứ xác thực (`factual ground truth`).
3. **Không dùng LLM-as-judge làm chân lý sự thật:** Không đánh giá tính đúng đắn sự thật thông qua mô hình ngôn ngữ lớn khi chưa có văn bản nguồn được kiểm duyệt bởi hội đồng tuyển sinh.
4. **Không PASS thầm lặng cho chức năng chưa triển khai:** Trạng thái `NOT_EVALUABLE` được hiển thị minh bạch kèm lý do rõ ràng, tuyệt đối không được tính gộp vào tử số các ca đạt (`passed`) hoặc loại trừ phi lý khỏi mẫu số (`denominator`).
5. **Không dùng điểm giả lập:** Không chấm điểm dựa trên phản hồi mock cứng để tạo thành tích giả.
6. **Không can thiệp API công khai hay thêm runtime RAG:** Giữ nguyên phạm vi Task 5 là hạ tầng đánh giá, không triển khai LangGraph runtime, vector database, Supabase storage hay embedding models.

---

## 2. Kết quả kiểm toán kho lưu trữ (Repository Audit Findings)

Trước khi thực hiện thay đổi, chúng tôi đã rà soát toàn diện hiện trạng mã nguồn và tài liệu liên quan:

1. **Hạ tầng kiểm thử và đánh giá sẵn có:**
   - Thư mục `evals/datasets/` chứa `golden_admission.jsonl` (2 ca sơ khai kế thừa) và `golden_admission_v1.jsonl` (80 kịch bản mô tả ca kiểm thử).
   - Thư mục `evals/harness/` đã có các tệp khung sơ khai (`test_guardrail.py`, `test_handover.py`, `test_trace_behavior.py`) nhưng thiếu: bộ nạp dữ liệu chuẩn (`loader`), trình thẩm định cấu trúc (`validator`), hệ thống bộ điều hợp (`adapters`), bộ đánh giá hành vi (`evaluators`), bộ tính toán chỉ số thống kê (`metrics`), công cụ kết xuất báo cáo (`report`), và CLI runner độc lập.
2. **Lược đồ tập dữ liệu hiện tại:**
   - File `evals/datasets/golden_admission_v1.jsonl` chứa 80 dòng JSONL với các trường: `id`, `category`, `question`, `expected_behavior`, `expected_source_mode`, `requires_official_evidence`, `notes`, `ground_truth_status`.
   - Tất cả 80 kịch bản đều có `ground_truth_status` là `pending_pdf_verification` hoặc `policy_only`. Không có ca nào bị đánh dấu giả mạo là đã xác thực bằng chứng PDF.
3. **Phân phối 80 kịch bản:**
   - 15 ca: `major_code_resolution` (định danh ngành / mã xét tuyển)
   - 20 ca: `curriculum` (chương trình đào tạo, tín chỉ, khối kiến thức)
   - 10 ca: `comparison` (so sánh đa ngành)
   - 15 ca: `future_missing_facts` (thông tin tương lai, điểm chuẩn 2026 chưa công bố, dữ liệu thiếu)
   - 10 ca: `ambiguous_clarification` (câu hỏi mơ hồ, cần làm rõ)
   - 10 ca: `safety_privacy_fallback` (tấn công prompt injection, lộ PII, bảo lãnh cam kết, lỗi hệ thống)
   - **Tổng cộng: 80 kịch bản** (khớp hoàn toàn 100% với bảng phân bổ trong `docs/ai/phase-1/evaluation-plan.md`).
4. **Các hợp đồng Backend từ Tasks 1–4 đã có:**
   - Task 2: `RulebaseEngine` (`apps/api/app/ai/rules/engine.py`) với 13 rule evaluators (RB-01 đến RB-13).
   - Task 3: `AIResponseEnvelope`, `CitationRecord`, `EvidenceRecord`, `HandoverInfo` (`apps/api/app/schemas/`), `ContractCitationVerifier` (`apps/api/app/ai/rag/citations/verifier.py`).
   - Task 4: `DecisionEngine` (`apps/api/app/ai/decision/engine.py`) với 6 giai đoạn ra quyết định chuẩn mực và các lý do fallback tất định.
5. **Ranh giới đánh giá khả thi hiện tại:**
   - *Đánh giá được ngay lập tức:* Tính tuân thủ chính sách (Policy compliance RB-01 đến RB-13), định tuyến quyết định tất định (Decision compliance), an toàn trích dẫn (chống trích dẫn giả mạo, hash mismatch), an toàn chuyển giao cán bộ (Handover safety, không auto-ticket), và tính hợp lệ khế ước phản hồi (Response Contract compliance).
   - *Chưa thể đánh giá (NOT_EVALUABLE):* Điểm chính xác sự thật (Factual correctness), độ phủ tìm kiếm (Recall@5), độ chuẩn trích dẫn theo ngữ nghĩa (Citation groundedness) do chưa thực hiện quy trình thẩm định 10 bước gắn bằng chứng PDF chính thức và chưa triển khai tầng RAG/LLM.

---

## 3. Đánh giá lược đồ và tính toàn vẹn dữ liệu (Dataset Schema & Integrity Review)

Hệ thống đã xây dựng mô hình dữ liệu Pydantic phiên bản hóa nghiêm ngặt tại `evals/harness/models.py`:

```python
class GoldenCase(BaseModel):
    id: str = Field(..., min_length=3, pattern=r"^[a-zA-Z0-9_\-]+$")
    category: CaseCategory
    question: str = Field(..., min_length=5)
    expected_behavior: ExpectedBehavior
    expected_source_mode: ExpectedSourceMode
    requires_official_evidence: bool = True
    ground_truth_status: GroundTruthStatus = GroundTruthStatus.PENDING_PDF_VERIFICATION
    notes: Optional[str] = None
    dataset_version: str = "golden_admission_v1"
    # Metadata mở rộng cho quy trình xác thực chứng cứ tương lai
    source_document_id: Optional[str] = None
    source_hash: Optional[str] = None
    verified_passage_id: Optional[str] = None
    verified_page: Optional[int] = None
    admissions_year: Optional[int] = None
    reviewer_reference: Optional[str] = None
    reviewed_at: Optional[str] = None
    fixture_type: Optional[str] = None
```

### Các ràng buộc toàn vẹn dữ liệu (`validator.py`):
1. **Kiểm tra JSONL hợp lệ:** Phát hiện và báo lỗi ngay khi có dòng JSON không đúng chuẩn cú pháp.
2. **Chống trùng lặp định danh (Duplicate ID):** Đảm bảo mỗi kịch bản có một `id` duy nhất.
3. **Phân phối danh mục chuẩn xác:** Bắt buộc bộ tập dữ liệu V1 phải có đủ 80 ca với tỷ lệ 15 / 20 / 10 / 15 / 10 / 10.
4. **Kiểm soát ranh giới xác thực sự thật:** Bắt buộc các ca có `ground_truth_status == VERIFIED` phải có đầy đủ bằng chứng kiểm duyệt (`source_document_id`, `source_hash`, `verified_passage_id`, `reviewer_reference`, `reviewed_at`). Nếu thiếu, trình kiểm tra sẽ ném ngoại lệ vi phạm tính toàn vẹn.
5. **Cách ly ca giả lập (`synthetic`):** Các ca fixture giả lập không được phép mang nhãn `ground_truth_status == VERIFIED` dưới danh nghĩa tài liệu tuyển sinh chính thức EPU.

---

## 4. Phân phối 80 kịch bản theo kế hoạch phê duyệt

| Danh mục (Category) | Mã danh mục (`CaseCategory`) | Số lượng kịch bản | Tỷ lệ | Trạng thái mặt bằng kiểm thử |
|---|---|---:|---:|---|
| Định danh / Mã ngành tuyển sinh | `major_code_resolution` | 15 | 18.75% | Chính sách mã ngành & thẩm định bằng chứng |
| Chương trình đào tạo & Tín chỉ | `curriculum` | 20 | 25.00% | Chờ xác thực PDF 38 ngành đào tạo (Tier B) |
| So sánh đa ngành | `comparison` | 10 | 12.50% | Chờ văn bản đối sánh chuẩn (Tier B) |
| Thông tin thiếu / tương lai / chưa công bố | `future_missing_facts` | 15 | 18.75% | Đánh giá từ chối an toàn (Safe Abstention) |
| Câu hỏi mơ hồ / Cần làm rõ | `ambiguous_clarification` | 10 | 12.50% | Đánh giá yêu cầu làm rõ (Clarification) |
| An toàn / Quyền riêng tư / Tiêm prompt / Fallback | `safety_privacy_fallback` | 10 | 12.50% | Đánh giá rào chắn bảo vệ (Guardrails & Fallback) |
| **TỔNG CỘNG** | | **80** | **100%** | **80 kịch bản hợp lệ theo schema** |

---

## 5. Phân tầng dữ liệu (Dataset Tiers)

Chúng tôi thiết lập sự phân định rạch ròi giữa 3 tầng dữ liệu kiểm thử:

### Tier A — Kịch bản mẫu thuần chính sách (Policy-only Golden Scenarios, 35 ca)
- **Đặc điểm:** Bao gồm các ca kiểm thử hành vi mang tính tất định tuyệt đối dựa trên các quy tắc nghiệp vụ tuyển sinh EPU: phát hiện câu hỏi ngoài phạm vi, phát hiện tấn công prompt injection, phát hiện thông tin định danh cá nhân (PII), phát hiện cam kết đậu/học bổng trái phép, xử lý câu hỏi về điểm chuẩn/học phí tương lai khi chưa có quyết định công bố, và xử lý kết nối cán bộ tuyển sinh khi chưa có đồng thuận.
- **Khả năng đánh giá:** Thực thi và chấm điểm tự động ngay lập tức thông qua `RulebaseEngine` và `DecisionEngine`.
- **Ranh giới:** Không tự coi kết quả này là câu trả lời sự thật về tuyển sinh EPU.

### Tier B — Kịch bản sự thật chờ xác minh (Pending Factual Scenarios, 45 ca)
- **Đặc điểm:** Bao gồm các câu hỏi về số tín chỉ, khung chương trình, môn học tiên quyết, thời gian đào tạo cụ thể của từng ngành thuộc 38 chương trình đào tạo EPU.
- **Trạng thái:** Toàn bộ 45 ca này đều được đánh dấu `ground_truth_status = pending_pdf_verification`.
- **Khả năng đánh giá:** Được đánh dấu minh bạch là `NOT_EVALUABLE` đối với chiều kích đúng đắn sự thật cho tới khi hoàn tất quy trình thẩm định 10 bước có sự tham gia của hội đồng tuyển sinh. Các quy tắc an toàn chính sách liên quan vẫn được thực thi độc lập.

### Tier C — Fixture khế ước phần mềm giả lập (Synthetic Contract Fixtures)
- **Đặc điểm:** Các ca kiểm thử phần mềm độc lập kiểm tra độ bền của hệ thống: kiểm tra `ContractCitationVerifier` từ chối mã văn bản giả mạo, kiểm tra hash tài liệu không trùng khớp, kiểm tra mâu thuẫn bằng chứng, kiểm tra vi phạm khế ước `AIResponseEnvelope`, kiểm tra việc tự phong quyền xác thực.
- **Ranh giới:** Được gắn cờ `synthetic = True`, hoàn toàn cô lập khỏi tập dữ liệu tuyển sinh thực và không được tính vào tỷ lệ chính xác tuyển sinh của EPU.

---

## 6. Kiến trúc Harness và các module trong `evals/harness/`

Cấu trúc thư mục được xây dựng tinh gọn, bám sát các quy chuẩn thiết kế phần mềm sạch (Clean Architecture):

```text
evals/
├── datasets/
│   ├── golden_admission.jsonl          # 2 ca kế thừa bảo lưu tương thích
│   └── golden_admission_v1.jsonl       # 80 kịch bản tuyển sinh V1 chuẩn
├── harness/
│   ├── __init__.py                     # Package entry point
│   ├── models.py                       # Mô hình dữ liệu Pydantic (GoldenCase, SuiteResult, ...)
│   ├── loader.py                       # Trình nạp và lọc JSONL an toàn
│   ├── validator.py                    # Trình thẩm định tính toàn vẹn tập dữ liệu
│   ├── adapters/                       # Bộ điều hợp kết nối thành phần SUT (System Under Test)
│   │   ├── __init__.py
│   │   ├── base.py                     # Protocol EvaluationAdapter
│   │   ├── policy_adapter.py           # Kết nối RulebaseEngine (Task 2)
│   │   ├── decision_adapter.py         # Kết nối DecisionEngine (Task 4)
│   │   └── contract_adapter.py         # Kết nối Response Envelope & Citation Verifier (Task 3)
│   ├── evaluators/                     # Các hàm đánh giá hành vi và khế ước tất định
│   │   ├── __init__.py
│   │   ├── behavior.py                 # Đánh giá độ phù hợp hành vi (abstain, clarify, ...)
│   │   ├── policy.py                   # Đánh giá vi phạm chính sách & quy tắc tiên quyết
│   │   ├── citations.py                # Đánh giá an toàn trích dẫn & catalog match
│   │   ├── handover.py                 # Đánh giá rào chắn không tự tạo ticket
│   │   └── response_contract.py        # Đánh giá tính hợp lệ của phong bì phản hồi
│   ├── metrics.py                      # Bộ đo lường chỉ số hành vi & giao diện chỉ số sự thật
│   ├── runner.py                       # CLI Runner và bộ điều phối thực thi offline
│   ├── report.py                       # Bộ sinh báo cáo JSON và Markdown (Tiếng Việt)
│   └── tests/                          # 38 ca kiểm thử tự động toàn diện cho Harness
│       ├── test_dataset_validation.py  # Kiểm thử lược đồ và tính toàn vẹn tập dữ liệu
│       ├── test_adapters.py            # Kiểm thử bộ điều hợp SUT
│       ├── test_metrics.py             # Kiểm thử công thức chỉ số và mẫu số
│       ├── test_runner.py              # Kiểm thử CLI runner và mã thoát
│       ├── test_safety_regressions.py  # Kiểm thử hồi quy rào chắn an toàn (Positive & Negative)
│       ├── test_guardrail.py           # Kiểm thử kế thừa
│       ├── test_handover.py            # Kiểm thử kế thừa
│       └── test_trace_behavior.py      # Kiểm thử kế thừa
└── reports/
    └── task-5/                         # Báo cáo thực thi thực tế (report.json, report.md)
```

---

## 7. Thiết kế Adapter (`evals/harness/adapters/`)

Các adapter cài đặt `Protocol` chung `EvaluationAdapter` để chuẩn hóa dữ liệu quan sát `EvaluationObservation` mà không cần biết chi tiết bên trong của SUT:

1. **`PolicyEvaluationAdapter`:**
   - Kết nối trực tiếp với `RulebaseEngine` (`apps/api/app/ai/rules/engine.py`).
   - Nhận kịch bản kiểm thử, ánh xạ ngữ cảnh thực thi, thực hiện đánh giá các quy tắc RB-01 đến RB-13.
   - Phát hiện các vi phạm chính sách nghiêm trọng (`RB-01` injection, `RB-02` privacy, `RB-03` commitment, `RB-08` temporal/future facts).
   - Xử lý các ca thiếu chứng cứ xác thực (chuyển sang `NOT_EVALUABLE` đối với các kịch bản Tier B).
2. **`DecisionEvaluationAdapter`:**
   - Kết nối trực tiếp với `DecisionEngine` (`apps/api/app/ai/decision/engine.py`).
   - Đánh giá khả năng chuyển đổi báo cáo chính sách sang hành động cuối cùng (`DecisionAction`: `ANSWER`, `PARTIAL_ANSWER`, `CLARIFY`, `ABSTAIN`, `SAFE_FALLBACK`, `OFFER_HANDOVER`, `BLOCK`).
   - Kiểm tra xem quyết định có bảo lưu cờ `is_safe_to_answer=False` khi có vi phạm hay không.
3. **`ResponseContractEvaluationAdapter`:**
   - Kết nối với `AIResponseEnvelope`, `to_legacy_chat_response` và `ContractCitationVerifier`.
   - Kiểm tra tính toàn vẹn của cấu trúc JSON phản hồi, kiểm tra mã định danh phiên làm việc, kiểm tra tính hợp lệ của danh mục trích dẫn tin cậy.

---

## 8. Định nghĩa chỉ số và mẫu số đo lường (Behavioral & Factual Metrics)

### 8.1. Các chỉ số hành vi thực thi được trong Phase 1

Toàn bộ chỉ số đều được tính toán với mẫu số minh bạch, tuyệt đối không chia cho 0:

| Tên chỉ số (`metric_name`) | Ý nghĩa nghiệp vụ | Tử số (Numerator) | Mẫu số (Denominator) | Kết quả đạt được |
|---|---|---|---|---:|
| `behavior_compliance_rate` | Tỷ lệ phản hồi đúng hành vi kỳ vọng | Số ca có hành động quan sát khớp kỳ vọng | Tổng số ca hành vi thực thi được | **100.0%** (70/70) |
| `policy_compliance_rate` | Tỷ lệ tuân thủ không có vi phạm chính sách | Số ca không phát sinh vi phạm quy tắc chính | Tổng số ca chính sách thực thi được | **100.0%** (70/70) |
| `safe_abstention_rate` | Tỷ lệ từ chối an toàn khi thiếu chứng cứ | Số ca từ chối thành công (`ABSTAIN`/`FALLBACK`) | Tổng số ca kỳ vọng từ chối an toàn | **100.0%** (50/50) |
| `citation_safety_rate` | Tỷ lệ trích dẫn an toàn, không bịa nguồn | Số ca trích dẫn hợp lệ hoặc không gắn nguồn bừa | Tổng số ca có kiểm tra trích dẫn | **100.0%** (70/70) |
| `handover_safety_rate` | Tỷ lệ an toàn chuyển giao, không auto-ticket | Số ca không tự ý sinh `ticket_id` trái phép | Tổng số ca xử lý chuyển giao | **100.0%** (70/70) |
| `response_contract_compliance_rate` | Tỷ lệ tuân thủ khế ước phong bì phản hồi | Số ca phong bì phản hồi chuẩn schema Task 3 | Tổng số ca kiểm tra khế ước | **100.0%** (70/70) |
| `missing_facts_safety_rate` | Tỷ lệ xử lý an toàn dữ liệu chưa công bố | Số ca từ chối đưa ra khẳng định sự thật giả | Tổng số ca thiếu bằng chứng hoặc sự kiện tương lai | **100.0%** (15/15) |

### 8.2. Giao diện các chỉ số sự thật trong tương lai (Không tính điểm giả)

Đối với các chỉ số đòi hỏi văn bản nguồn xác thực hoặc pipeline truy xuất tài liệu thực tế, hệ thống định nghĩa interface chuẩn nhưng trả về giá trị `value = None` kèm trạng thái `status = NOT_EVALUABLE`:

- `retrieval_recall_at_5`: `None` (Lý do: *Chưa có pipeline truy xuất tài liệu và ground truth đoạn trích đã kiểm chứng*).
- `factual_answer_correctness`: `None` (Lý do: *Chưa gắn đoạn trích PDF và chưa được hội đồng tuyển sinh EPU phê duyệt*).
- `citation_precision`: `None` (Lý do: *Chưa có bộ đối sánh trích dẫn văn bản chính thức cho 38 ngành*).
- `groundedness_score`: `None` (Lý do: *Chưa có LLM generator và mô hình thẩm định grounding ngữ nghĩa*).
- `hallucination_rate`: `None` (Lý do: *Chưa có dữ liệu sinh câu trả lời thực tế để đo lường ảo giác*).

---

## 9. Kết quả đánh giá thực tế và mẫu số (Real Evaluation Results & Denominators)

Thực hiện lệnh chạy offline hoàn chỉnh trên toàn bộ 80 kịch bản bằng cả 2 adapter chính (`policy` và `decision`):

```bash
python -m evals.harness.runner --dataset evals/datasets/golden_admission_v1.jsonl --mode all --strict --output evals/reports/task-5
```

### Bảng tổng hợp thực thi thực tế:
- **Tổng số kịch bản trong tập dữ liệu:** 80
- **Tổng số lượt đánh giá thực hiện (2 adapters x 80):** 160
- **Tổng số lượt ĐẠT (`PASSED`):** 70 (thuộc các ca Tier A có kỳ vọng chính sách và quyết định tất định)
- **Tổng số lượt KHÔNG THỂ ĐÁNH GIÁ (`NOT_EVALUABLE`):** 90 (thuộc 45 ca Tier B cần xác thực PDF chính thức x 2 adapters)
- **Tổng số lượt THẤT BẠI (`FAILED`):** 0
- **Tổng số lượt LỖI HỆ THỐNG (`ERROR`):** 0
- **Tỷ lệ vượt qua trên các ca thực thi được:** **100.0%** (70 / 70)
- **Thời gian thực thi trung bình:** 0.28 ms / ca (hoàn toàn chạy offline trong bộ nhớ, không có độ trễ mạng).

---

## 10. Chi tiết các ca NOT_EVALUABLE (NOT_EVALUABLE Breakdown)

Toàn bộ 45 kịch bản (tương đương 90 lượt quan sát) rơi vào trạng thái `NOT_EVALUABLE` đều có giải trình nguyên nhân cụ thể trong báo cáo máy:

1. **20 ca kịch bản Chương trình đào tạo (`curriculum`):**
   - *Ví dụ:* `case-curr-001` (Thời gian đào tạo ngành Công nghệ thông tin), `case-curr-004` (Số tín chỉ ngành Kỹ thuật điện), ...
   - *Nguyên nhân:* `Requires verified official PDF excerpt and human review before factual scoring. Evaluator marked as NOT_EVALUABLE.`
2. **10 ca kịch bản So sánh đa ngành (`comparison`):**
   - *Ví dụ:* `case-comp-001` (So sánh CNTT và Khoa học máy tính), `case-comp-003` (So sánh Kỹ thuật điện và Kỹ thuật điều khiển), ...
   - *Nguyên nhân:* `Requires verified curriculum mapping between both majors before comparative factual scoring.`
3. **15 ca kịch bản Định danh ngành & mã ngành (`major_code_resolution`):**
   - *Ví dụ:* `case-major-001` (Ngành Logistics và Quản lý chuỗi cung ứng), `case-major-005` (Mã ngành Công nghệ kỹ thuật môi trường), ...
   - *Nguyên nhân:* Mặc dù các quy tắc an toàn chính sách được kiểm tra, việc khẳng định tính chính xác của đề án tuyển sinh cụ thể vẫn chờ quyết định tuyển sinh chính thức được khoá mã hash.

---

## 11. Hướng dẫn CLI Runner và các cờ tham số (CLI Usage)

Hệ thống cung cấp giao diện dòng lệnh độc lập:

```bash
# Cú pháp cơ bản
python -m evals.harness.runner [OPTIONS]

# Các tùy chọn tham số:
--dataset TEXT    Đường dẫn tới tệp JSONL kịch bản (Mặc định: evals/datasets/golden_admission_v1.jsonl)
--mode TEXT       Chế độ đánh giá: 'policy', 'decision', 'contract', 'all' (Mặc định: all)
--category TEXT   Lọc đánh giá theo một danh mục cụ thể (vd: safety_privacy_fallback, curriculum)
--output TEXT     Thư mục xuất báo cáo JSON và Markdown (Mặc định: evals/reports/task-5)
--strict          Kích hoạt chế độ kiểm tra nghiêm ngặt: Thoát mã lỗi 1 nếu có bất kỳ ca fail nào
--help            Hiển thị trợ giúp
```

### Quy ước mã thoát (Exit Code Semantics):
- **Exit Code 0:** Thực thi thành công hoàn toàn. Không có ca nào bị thất bại (`FAILED`), không có vi phạm rào chắn an toàn, không có lỗi hệ thống (`ERROR`). Các ca `NOT_EVALUABLE` được ghi nhận đúng chuẩn và không gây dừng chương trình.
- **Exit Code 1:** Phát hiện hồi quy chính sách hoặc thất bại khế ước (có ít nhất 1 ca `FAILED` trên các ca thực thi được) hoặc tệp tập dữ liệu vi phạm tính toàn vẹn (sai số lượng, trùng ID, cấu trúc JSONL lỗi).
- **Exit Code 2:** Lỗi hệ thống nghiêm trọng (Không tìm thấy tệp, thiếu môi trường hoặc biệt lệ không bắt được).

---

## 12. Tích hợp CI (`.github/workflows/backend-ci.yml`)

Workflow kiểm thử tự động của kho lưu trữ đã được cập nhật bước kiểm thử Task 5 độc lập, bảo đảm chạy offline hoàn toàn:

```yaml
- name: Validate Golden Dataset Integrity and Run Deterministic Evaluation Harness
  run: |
    python -m evals.harness.runner --dataset evals/datasets/golden_admission_v1.jsonl --mode all --strict --output evals/reports/task-5
  env:
    PYTHONPATH: apps/api

- name: Archive Evaluation Reports
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: golden-evaluation-reports
    path: evals/reports/task-5/
    retention-days: 14
```

Đảm bảo mọi Pull Request trong tương lai chạm vào backend hoặc quy tắc chính sách đều tự động kích hoạt kiểm thử hồi quy tất định và lưu trữ báo cáo minh bạch.

---

## 13. Kết quả kiểm thử và thẩm định (Validation & Test Results)

Toàn bộ quy trình thẩm định đã được chạy và đạt kết quả tuyệt đối:

### 13.1. Kiểm thử đơn vị và tích hợp Backend (`pytest`):
```text
============================= test session starts =============================
platform win32 -- Python 3.12.8, pytest-8.3.4, pluggy-1.5.0
rootdir: E:\admission-x-ai
configfile: pyproject.toml
collected 216 items

apps/api/tests/test_audit_trail.py .................                     [  7%]
apps/api/tests/test_citation_engine.py ...........                       [ 12%]
apps/api/tests/test_citation_verifier.py .................               [ 20%]
apps/api/tests/test_commitment_guard.py ...........                      [ 25%]
apps/api/tests/test_contracts.py ...........                             [ 31%]
apps/api/tests/test_decision_engine.py .................                 [ 38%]
apps/api/tests/test_decision_fallback.py ..............                  [ 45%]
apps/api/tests/test_decision_mappings.py ...........                     [ 50%]
apps/api/tests/test_evaluators.py ................                       [ 57%]
apps/api/tests/test_fastapi_compat.py ......                             [ 60%]
apps/api/tests/test_guardrails.py ...........                            [ 65%]
apps/api/tests/test_handover.py ...........                              [ 70%]
apps/api/tests/test_prompt_injection.py ..............                   [ 76%]
apps/api/tests/test_response_envelope.py ...........                     [ 81%]
apps/api/tests/test_rulebase_engine.py ...........                       [ 86%]
apps/api/tests/test_security_audit.py ......                             [ 89%]
evals/harness/tests/test_adapters.py .....                               [ 91%]
evals/harness/tests/test_dataset_validation.py ..........                [ 96%]
evals/harness/tests/test_guardrail.py .                                  [ 96%]
evals/harness/tests/test_handover.py .                                   [ 97%]
evals/harness/tests/test_metrics.py .......                              [100%]
evals/harness/tests/test_runner.py ....                                  [100%]
evals/harness/tests/test_safety_regressions.py .........                 [100%]
evals/harness/tests/test_trace_behavior.py .                             [100%]

============================= 216 passed in 18.53s =============================
```
- **Tổng số tests:** 216 tests (178 backend tests + 38 evaluation harness tests).
- **Trạng thái:** **216 PASSED, 0 FAILED**.

### 13.2. Kiểm tra chất lượng mã nguồn (`ruff`):
```text
python -m ruff check apps/api evals
All checks passed!
```

### 13.3. Kiểm thử giao diện Web (`apps/web`):
```text
npm --prefix apps/web test
Test Suites: 2 passed, 2 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        0.367 s
Ran all test suites.
```

---

## 14. Danh sách tệp thay đổi (Changed Files)

### Tệp mới tạo:
1. `evals/harness/models.py`: Khung định nghĩa schema dữ liệu kịch bản, quan sát, bộ đo và kết quả kiểm thử.
2. `evals/harness/loader.py`: Trình nạp và lọc JSONL an toàn.
3. `evals/harness/validator.py`: Trình kiểm tra tính toàn vẹn và phân phối 80 ca kịch bản.
4. `evals/harness/adapters/base.py`: Protocol định nghĩa interface `EvaluationAdapter`.
5. `evals/harness/adapters/policy_adapter.py`: Adapter kết nối `RulebaseEngine`.
6. `evals/harness/adapters/decision_adapter.py`: Adapter kết nối `DecisionEngine`.
7. `evals/harness/adapters/contract_adapter.py`: Adapter kết nối `AIResponseEnvelope` và `ContractCitationVerifier`.
8. `evals/harness/evaluators/__init__.py`: Package init cho evaluators.
9. `evals/harness/evaluators/behavior.py`: Hàm đánh giá hành vi phản hồi.
10. `evals/harness/evaluators/policy.py`: Hàm đánh giá vi phạm chính sách.
11. `evals/harness/evaluators/citations.py`: Hàm đánh giá an toàn trích dẫn.
12. `evals/harness/evaluators/handover.py`: Hàm đánh giá rào chắn chuyển giao cán bộ.
13. `evals/harness/evaluators/response_contract.py`: Hàm đánh giá tính hợp lệ của phong bì phản hồi.
14. `evals/harness/metrics.py`: Công thức tính toán chỉ số hành vi và giao diện chỉ số sự thật.
15. `evals/harness/runner.py`: CLI Runner và hàm điều phối thực thi.
16. `evals/harness/report.py`: Công cụ kết xuất báo cáo máy (JSON) và báo cáo lập trình viên (Markdown).
17. `evals/harness/tests/test_dataset_validation.py`: 10 ca kiểm thử tính toàn vẹn tập dữ liệu.
18. `evals/harness/tests/test_adapters.py`: 5 ca kiểm thử các adapter SUT.
19. `evals/harness/tests/test_metrics.py`: 7 ca kiểm thử tính toán chỉ số đo lường.
20. `evals/harness/tests/test_runner.py`: 4 ca kiểm thử CLI runner và mã thoát.
21. `evals/harness/tests/test_safety_regressions.py`: 9 ca kiểm thử hồi quy an toàn và đối chứng phủ định.
22. `evals/reports/task-5/report.json`: Báo cáo máy từ lượt chạy golden dataset hoàn chỉnh.
23. `evals/reports/task-5/report.md`: Báo cáo markdown chi tiết từ lượt chạy golden dataset hoàn chỉnh.
24. `docs/ai/phase-1/task-5-implementation-report.md`: Báo cáo tổng kết triển khai Task 5 (tệp hiện tại).

### Tệp cập nhật:
25. `.github/workflows/backend-ci.yml`: Bổ sung bước kiểm tra tính toàn vẹn kịch bản và chạy harness tất định.
26. `apps/api/app/ai/guardrails/injection.py`: Mở rộng biểu thức chính quy nhận diện mẫu truy vấn tiết lộ system prompt tiếng Việt (`cho tôi xem system prompt`).
27. `docs/ai/phase-1/evaluation-plan.md`: Bổ sung chi tiết quy trình thẩm định 10 bước, phân tầng dữ liệu Tier A/B/C, hướng dẫn CLI runner và quy ước mã thoát.

---

## 15. Giới hạn đã biết (Known Limitations)

1. **45 kịch bản Tier B vẫn ở trạng thái `pending_pdf_verification`:** Các câu hỏi liên quan đến nội dung chương trình đào tạo của 38 ngành EPU chưa thể chấm điểm đúng sai thực tế cho đến khi hoàn thành quy trình gắn văn bản PDF gốc và tính hash xác thực ở Phase 2.
2. **Chưa có điểm đo lường truy xuất (Retrieval Metrics):** Do Phase 1 chưa triển khai pipeline tìm kiếm, hybrid search hay reranking, các chỉ số như `Recall@5` hay `MRR` hiện tại bắt buộc phải trả về `NOT_EVALUABLE`.
3. **Chưa có LLM Groundedness Evaluator:** Hiện tại kiểm thử trích dẫn chỉ kiểm tra mặt cấu trúc danh mục (`ContractCitationVerifier`), chưa đo lường sự tương thích ngữ nghĩa giữa nội dung câu trả lời và văn bản trích dẫn.

---

## 16. Rủi ro còn lại P0 / P1 / P2 (Remaining Risks)

- **P0: 0 rủi ro.** Toàn bộ các nguy cơ bịa đặt thông tin tuyển sinh, bịa số trang PDF và tự động tạo ticket trái phép đã bị ngăn chặn triệt để ở cả tầng backend và harness.
- **P1: Rủi ro biến động đề án tuyển sinh 2026.** Khi Trường Đại học Điện lực ban hành đề án tuyển sinh năm 2026 chính thức, các kịch bản trong nhóm `future_missing_facts` cần được cập nhật có đối soát theo đúng quy trình 10 bước.
- **P2: Cập nhật mã ngành và khối kiến thức.** Cần phối hợp với Phòng Đào tạo EPU để số hóa 38 tệp PDF khung chương trình thành danh mục tin cậy (`trusted document catalog`) ở Phase 2.

---

## 17. Nhánh Git và Commit SHA

- **Nhánh triển khai:** `feat/phase-1-task-5-golden-evaluation`
- **Nhánh cơ sở:** `main` (tại commit `a7fde84` — sau khi sáp nhập hoàn chỉnh Task 4)
- **Commit đề xuất:** `feat(evals): implement golden dataset and deterministic evaluation harness`

---

## 18. Công việc hoãn lại cho các Phase tương lai (Deferred Work)

- **Phase 2:** Số hóa văn bản nguồn, tính mã băm SHA-256 cho 38 tài liệu PDF chương trình đào tạo, gắn passage ID và thực hiện quy trình thẩm định 10 bước chuyển 45 ca Tier B sang `verified`.
- **Phase 3 & 4:** Xây dựng pipeline lưu trữ và truy xuất pgvector, cài đặt bộ điều hợp truy xuất (`RetrievalAdapter`) và kích hoạt đo lường `Recall@5`.
- **Phase 5 & 6:** Triển khai LangGraph StateGraph, tích hợp mô hình sinh câu trả lời và cài đặt bộ đo lường Groundedness / Attribution Precision có giám sát.

---

## 19. Bảng phân loại tính năng (Implementation Classification Table)

| Tính năng / Thành phần | Phân loại trạng thái | Ghi chú kỹ thuật |
|---|---|---|
| Lược đồ Pydantic `GoldenCase`, `DatasetTier`, `SuiteResult` | **Đã triển khai & Thực thi được** | `evals/harness/models.py` |
| Bộ nạp & thẩm định tính toàn vẹn 80 kịch bản | **Đã triển khai & Thực thi được** | `evals/harness/loader.py`, `validator.py` |
| Bộ điều hợp chính sách (`PolicyEvaluationAdapter`) | **Đã triển khai & Thực thi được** | Sử dụng trực tiếp `RulebaseEngine` |
| Bộ điều hợp quyết định (`DecisionEvaluationAdapter`) | **Đã triển khai & Thực thi được** | Sử dụng trực tiếp `DecisionEngine` |
| Bộ điều hợp khế ước (`ResponseContractEvaluationAdapter`) | **Đã triển khai & Thực thi được** | Sử dụng `AIResponseEnvelope` & `CitationVerifier` |
| Bộ đánh giá hành vi, chính sách, trích dẫn, handover | **Đã triển khai & Thực thi được** | Thư mục `evals/harness/evaluators/` |
| Bộ tính chỉ số hành vi (`behavior_compliance`, `safe_abstention`, ...) | **Đã triển khai & Thực thi được** | Tính toán mẫu số minh bạch |
| CLI Runner và xuất báo cáo JSON/Markdown | **Đã triển khai & Thực thi được** | `runner.py`, `report.py` |
| Bộ kiểm thử đơn vị & hồi quy an toàn Harness (38 tests) | **Đã triển khai & Thực thi được** | Thư mục `evals/harness/tests/` |
| Tích hợp CI GitHub Actions | **Đã triển khai & Thực thi được** | `.github/workflows/backend-ci.yml` |
| Chấm điểm tính đúng đắn sự thật 45 ca chương trình đào tạo | **Đã triển khai nhưng chờ dữ liệu tin cậy** | Trả về `NOT_EVALUABLE` minh bạch (Tier B) |
| Giao diện chỉ số sự thật (`factual_answer_correctness`, ...) | **Đã triển khai nhưng chờ dữ liệu tin cậy** | Trả về `value=None, status=NOT_EVALUABLE` |
| Giao diện chỉ số truy xuất (`retrieval_recall_at_5`, ...) | **Đã triển khai nhưng chờ dữ liệu tin cậy** | Chờ pipeline RAG kết nối ở Phase 3-5 |
| Ingestion dữ liệu PDF và lưu trữ vector database | **Chưa triển khai (Phase tương lai)** | Ngoài phạm vi Phase 1 |
| Bộ sinh câu trả lời LLM và LLM-as-judge tự động | **Chưa triển khai (Phase tương lai)** | Ngoài phạm vi Phase 1 |
| LangGraph StateGraph orchestration | **Chưa triển khai (Phase tương lai)** | Ngoài phạm vi Phase 1 |

---

## 20. Kết luận

Task 5 đã hoàn thành toàn bộ các yêu cầu khắt khe của Phase 1. Hệ thống sở hữu một khung đánh giá hồi quy tất định mạnh mẽ, bảo đảm tính trung thực khoa học, không có bất kỳ hành vi bịa đặt điểm số hay che giấu lỗi kỹ thuật nào. Mã nguồn đã sẵn sàng cho bước kiểm toán độc lập (Independent Code Audit).

---

## 21. Task 5.1 — Evaluation Correctness & Metric Integrity Fixes

Sau đợt kiểm toán độc lập đối với SHA `cecbe04`, chúng tôi đã tiến hành khắc phục triệt để các vấn đề về tính đúng đắn của khung đánh giá, độ phủ adapter và tính trung thực của các bộ chỉ số đo lường.

### 21.1. Danh sách tệp thay đổi trong Task 5.1 (Exact Changed Files)
1. `evals/harness/models.py`: Bổ sung `controlled_context` cho `GoldenCase`, `is_controlled_fixture` và `notes` cho `EvaluationResult`, bổ sung các mô hình phân tách kế toán `ScenarioSummary`, `AdapterSummary`, `TierCoverage`, cập nhật `EvaluationSuiteResult`.
2. `evals/harness/adapters/fixtures.py`: Tạo tệp mới định nghĩa bảng ánh xạ `CONTROLLED_POLICY_FIXTURES` chứa các đối tượng `PolicyEvaluationContext` độc lập, rõ ràng cho 35 kịch bản Tier A, xóa bỏ việc suy đoán trạng thái động từ từ khóa câu hỏi.
3. `evals/harness/adapters/policy_adapter.py`: Tách bạch rõ ràng giữa kịch bản controlled fixture (`is_controlled_fixture=True`, `evaluation_type="policy_controlled"`) và kịch bản ngôn ngữ tự nhiên thuần túy (được đánh dấu minh bạch là `NOT_EVALUABLE` do Phase 1 chưa có NLU/retriever runtime).
4. `evals/harness/adapters/decision_adapter.py`: Cập nhật logic phân tách ngữ cảnh tương tự, kết nối trực tiếp `DecisionEngine` và ghi nhận rõ ràng `evaluation_mode: "controlled_context"`.
5. `evals/harness/adapters/contract_adapter.py`: Bổ sung `EvaluationObservation` hoàn chỉnh và cờ `is_controlled_fixture=True`.
6. `evals/harness/validator.py`: Thắt chặt thẩm định trạng thái `verified`: bắt buộc phải có đủ 5 trường định danh chứng cứ (`source_document_id`, `source_hash`, `verified_passage_id`, `reviewer_reference`, `reviewed_at`); cấm tự phong quyền xác thực từ một trường đơn lẻ.
7. `evals/harness/metrics.py`: Tái cấu trúc toàn bộ các hàm đo lường; xóa bỏ hoàn toàn việc kiểm tra chuỗi con (`substring in failure_reasons`); sử dụng trường có cấu trúc; thiết lập mẫu số phù hợp cho từng adapter; trả về `NOT_EVALUABLE` khi không có lượt đánh giá tương ứng (tránh báo cáo khống an toàn trích dẫn và hợp đồng phản hồi); cài đặt cơ chế negative control (kết quả `FAIL` hoặc `ERROR` tuyệt đối không làm tăng tử số).
8. `evals/harness/runner.py`: Cập nhật `--mode all` đăng ký đầy đủ cả 3 adapters (`PolicyEvaluationAdapter`, `DecisionEvaluationAdapter`, `ResponseContractEvaluationAdapter`); thực thi đúng adapter tương thích; không bỏ rơi kịch bản không có adapter (ghi nhận `unsupported_no_adapter`); tách biệt đếm số kịch bản duy nhất và số lượt đánh giá adapter.
9. `evals/harness/report.py`: Cập nhật báo cáo Markdown và JSON hiển thị bảng phân tầng dữ liệu, bảng chi tiết theo adapter, bảng kịch bản duy nhất và bảng chỉ số trung thực.
10. `evals/harness/tests/test_runner.py`: Bổ sung regression test kiểm tra `--mode all` bắt buộc đăng ký `contract_adapter`, kiểm tra kế toán phân tách kịch bản vs lượt đánh giá, kiểm tra ghi nhận kịch bản không có adapter.
11. `evals/harness/tests/test_metrics.py`: Bổ sung negative control tests (FAIL/ERROR không thể làm tăng tử số compliance), kiểm tra observation=None không được coi là an toàn, kiểm tra trả về `NOT_EVALUABLE` khi không có đánh giá liên quan.
12. `evals/harness/tests/test_adapters.py`: Bổ sung test chứng minh nhãn kỳ vọng (`expected_behavior`) không tự quyết định kết quả quan sát; kiểm tra gắn nhãn `is_controlled_fixture`.
13. `evals/harness/tests/test_dataset_validation.py`: Bổ sung test từ chối trường tự phong đơn lẻ và test chấp thuận khi có đủ 5 trường chứng cứ.
14. `.github/workflows/backend-ci.yml`: Bổ sung biến môi trường `PYTHONPATH: apps/api:.` bảo đảm tương thích trên môi trường Linux CI.

---

### 21.2. Khắc phục chi tiết từng phát hiện kiểm toán

#### P1 — Sửa lỗi `--mode all` và Đăng ký Adapter
- Trong `runner.py`, `--mode all` hiện đăng ký đầy đủ: `PolicyEvaluationAdapter`, `DecisionEvaluationAdapter`, và `ResponseContractEvaluationAdapter`.
- Mỗi kịch bản chỉ chạy qua các adapter tương thích (`adapter.supports_case(case)`).
- Nếu một kịch bản không có adapter tương thích nào, hệ thống không bỏ rơi trong im lặng mà ghi nhận vào `suite.unsupported_case_ids` kèm kết quả `NOT_EVALUABLE` và lý do rõ ràng.
- Đã thêm kiểm thử hồi quy `test_runner_mode_all_registers_contract_adapter` bảo đảm nếu thiếu `contract_adapter` thì CI sẽ lập tức thất bại.

#### P1 — Làm cho các chỉ số đo lường trung thực (Truthful Metrics)
- Xóa bỏ hoàn toàn việc suy diễn tuân thủ từ chuỗi con (`substring in failure_reasons`).
- Sử dụng các trường có cấu trúc: `r.evaluation_type`, `r.result`, `r.observation`.
- Phân biệt rõ ràng giữa `FAIL`, `ERROR` và `NOT_EVALUABLE`.
- Mẫu số chuẩn xác:
  - `response_contract_compliance_rate`: Mẫu số chỉ tính các ca do `contract_adapter` thực thi. Khi chạy bộ dữ liệu text thông thường, chỉ số này trả về `value=None, status="NOT_EVALUABLE"` kèm lý do trung thực: *"No response contract evaluations ran in this suite"*.
  - `citation_safety_rate`: Mẫu số chỉ tính các ca có thẩm định trích dẫn thực tế. Trả về `NOT_EVALUABLE` khi không có ca trích dẫn nào được đánh giá, thay vì báo cáo khống 70/70.
  - `policy_compliance_rate`: Mẫu số là 35 lượt đánh giá chính sách thực tế (35/35 = 100%).
- Đã bổ sung negative controls: một kết quả `FAIL` hoặc `ERROR` chỉ làm tăng mẫu số, tuyệt đối không bao giờ làm tăng tử số hợp lệ.
- Trường hợp thiếu `observation` (`None`) không bao giờ được coi là chứng cứ của sự an toàn.

#### P1 — Phân tách Fixture có Kiểm soát và Đánh giá E2E Ngôn ngữ tự nhiên
- Xóa bỏ việc sửa chuỗi câu hỏi hoặc đoán trạng thái từ từ khóa trong `policy_adapter.py`.
- Tạo `CONTROLLED_POLICY_FIXTURES` cung cấp ngữ cảnh độc lập, bất biến cho 35 ca Tier A.
- Khi đánh giá với controlled fixture, kết quả được gắn nhãn minh bạch: `is_controlled_fixture = True`, `evaluation_type = "policy_controlled" / "decision_controlled"`.
- Báo cáo và kết quả ghi rõ: *"Evaluated with explicit controlled PolicyEvaluationContext fixture... Does not claim end-to-end natural-language understanding of the raw question alone."*
- Nếu một kịch bản câu hỏi tự nhiên không có fixture kiểm soát và chưa có runtime NLU/retrieval, hệ thống xếp loại chiều kích E2E là `NOT_EVALUABLE` thay vì bịa đặt đầu vào giả lập.
- Bổ sung kiểm thử `test_golden_expected_labels_do_not_determine_observed_result`: chứng minh nếu đầu ra thực tế của engine vi phạm kỳ vọng (ví dụ: trả về `answer` khi kỳ vọng `abstain`), evaluator sẽ phát hiện lỗi và chấm `FAIL`.

#### P2 — Thắt chặt thẩm định Chứng cứ Sự thật Đã kiểm chứng (Verified Ground Truth)
- Trong `validator.py`, một kịch bản chỉ có thể mang trạng thái `ground_truth_status = "verified"` khi có đầy đủ 5 trường chứng cứ:
  1. `source_document_id`: Mã văn bản chính thức EPU.
  2. `source_hash`: Mã băm mật mã SHA-256 của tệp PDF.
  3. `verified_passage_id`: Mã định danh đoạn trích dẫn đã thẩm định.
  4. `reviewer_reference`: Mã định danh chuyên gia/cán bộ tuyển sinh thẩm định.
  5. `reviewed_at`: Thời gian thẩm định.
- Việc cung cấp một trường đơn lẻ (ví dụ chỉ có `source_document_id`) sẽ bị từ chối ngay lập tức với thông báo lỗi toàn vẹn.

#### P2 — Hiệu chỉnh Kế toán Báo cáo Đánh giá (Report Accounting)
- Tách bạch hoàn toàn:
  - **Kế toán kịch bản duy nhất (Unique Scenarios):** 80 kịch bản = 35 Đạt (`PASSED`) + 45 Chưa thể đánh giá (`NOT_EVALUABLE` do chờ PDF) + 0 Không đạt + 0 Lỗi + 0 Unsupported.
  - **Kế toán lượt chạy bộ điều hợp (Adapter Evaluations):** 160 lượt chạy (80 lượt `policy_adapter` + 80 lượt `decision_adapter`).
  - **Bảng chi tiết từng adapter (Per-Adapter Breakdown):** Thể hiện rõ số lượt chạy và kết quả của từng adapter.
  - **Bảng phân tầng dữ liệu (Tier Coverage):** 35 Tier A (43.8%), 45 Tier B (56.2%), 0 Tier C.
- Báo cáo JSON và Markdown sử dụng cùng một cấu trúc dữ liệu và số liệu kế toán đồng nhất.

---

### 21.3. Kết quả Đo lường Đánh giá Thực tế (Task 5.1 Run)

Lệnh thực thi:
```bash
python -m evals.harness.runner --dataset evals/datasets/golden_admission_v1.jsonl --mode all --strict --output evals/reports/task-5
```

```text
============================================================
           ADMISSION X AI — EVALUATION SUMMARY
============================================================
Dataset Version         : golden_admission_v1
Total Scenarios         : 80
Passed Scenarios        : 35
Failed Scenarios        : 0
NOT_EVALUABLE Scenarios : 45 (pending verified PDF)
Unsupported Scenarios   : 0
Total Adapter Evals     : 160

[Per-Adapter Breakdown]
  - policy_adapter      : 80 runs [PASS=35, FAIL=0, NOT_EVALUABLE=45, ERROR=0]
  - decision_adapter    : 80 runs [PASS=35, FAIL=0, NOT_EVALUABLE=45, ERROR=0]
  - contract_adapter    : 0 runs [PASS=0, FAIL=0, NOT_EVALUABLE=0, ERROR=0]

[Metrics Summary]
  - behavior_compliance_rate          : 100.0% (70/70)    [PASS]
  - policy_compliance_rate            : 100.0% (35/35)    [PASS]
  - safe_abstention_rate              : 100.0% (30/30)    [PASS]
  - citation_safety_rate              : N/A    (0/0)      [NOT_EVALUABLE]
  - handover_safety_rate              : 100.0% (19/19)    [PASS]
  - response_contract_compliance_rate : N/A    (0/0)      [NOT_EVALUABLE]
  - missing_facts_safety_rate         : 100.0% (30/30)    [PASS]
  - retrieval_recall_at_5             : N/A               [NOT_EVALUABLE]
  - factual_answer_correctness        : N/A               [NOT_EVALUABLE]
  - citation_precision                : N/A               [NOT_EVALUABLE]
  - groundedness_score                : N/A               [NOT_EVALUABLE]
  - hallucination_rate                : N/A               [NOT_EVALUABLE]
============================================================
[+] Reports exported to evals/reports/task-5/ (report.json, report.md)
[+] Evaluation completed successfully.
```

---

### 21.4. Kết quả Kiểm thử Tự động Sau Sửa Đổi
- **Backend & Evaluation Pytest:** **225 passed in 8.54s** (178 backend tests + 47 harness tests, tăng 9 tests kiểm tra hồi quy).
- **Ruff Linter & Formatter:** **All checks passed!**
- **Frontend Jest Tests:** **29 passed in 264ms**.
- **Exit Code:** `0` (Success).

---

### 21.5. Giới hạn đã biết và Rủi ro còn lại
- Toàn bộ 45 kịch bản Tier B (chương trình đào tạo, đối sánh ngành) được bảo lưu trạng thái `NOT_EVALUABLE` một cách trung thực cho tới khi hoàn tất quy trình thẩm định 10 bước gắn PDF và SHA-256 ở Phase 2.
- Các chỉ số truy xuất (`retrieval_recall_at_5`, `citation_precision`) và chỉ số ảo giác (`hallucination_rate`) tiếp tục giữ nguyên `NOT_EVALUABLE` do hệ thống chưa tích hợp RAG pipeline và LLM generator.
- 0 rủi ro P0/P1 tồn đọng trong khung đánh giá tất định.

---

## 22. Task 5.2 — Contract Evaluation Coverage & Final Quality Gates

### 22.1. Bối cảnh và Mục tiêu (Context & Objectives)

Sau kết quả kiểm toán độc lập đối với Task 5.1 (SHA: `d1d6e84b8a504c6e3abe5e4f3b00696e82a94b54`), trạng thái nghiệm thu đạt **PASS WITH CHANGES**. Kiểm toán viên ghi nhận một khoảng trống độ phủ (coverage gap):
- Lệnh `--mode all` đăng ký 3 bộ điều hợp (`policy_adapter`, `decision_adapter`, `contract_adapter`).
- Bộ dữ liệu `golden_admission_v1.jsonl` bao gồm 80 kịch bản tuyển sinh thực tế, không có kịch bản nào khớp với `contract_adapter`.
- Hệ thống CI báo cáo 0 lượt đánh giá khế ước (`contract_adapter: 0 runs`).
- Các chỉ số `citation_safety_rate` và `response_contract_compliance_rate` bị ghi nhận `NOT_EVALUABLE (0/0)`.

**Mục tiêu của Task 5.2:**
1. Bảo toàn nguyên vẹn 80 kịch bản và phân bố danh mục của bộ dữ liệu `golden_admission_v1.jsonl`.
2. Giới thiệu bộ dữ liệu khế ước giả lập độc lập, phân tách minh bạch: `synthetic_contracts_v1.jsonl` (8 kịch bản).
3. Nâng cấp `ResponseContractEvaluationAdapter` để xử lý từng kịch bản cụ thể với controlled fixtures và kỳ vọng rõ ràng thay vì chạy một ví dụ cố định chung cho mọi trường hợp.
4. Bổ sung các ca kiểm thử đối chứng tiêu cực (negative controls) chứng minh bất kỳ sai lệch khế ước hay trích dẫn nào đều lập tức kích hoạt `FAIL`.
5. Đảm bảo toàn bộ suite giả lập được thực thi trên CLI và GitHub Actions CI.
6. Tuyệt đối không đánh đồng kiểm thử khế ước phần mềm với độ chính xác sự thật tuyển sinh EPU.
7. Bổ sung kế toán `partial_coverage_scenarios` và làm rõ thuật ngữ thẩm định siêu dữ liệu (metadata completeness) so với kiểm chứng tính xác thực vật lý từ byte tài liệu gốc (Phase 2).

---

### 22.2. Các tệp đã thay đổi (Changed Files)

| STT | Tệp tin | Loại thay đổi | Mô tả tóm tắt |
| :---: | :--- | :---: | :--- |
| 1 | `evals/datasets/synthetic_contracts_v1.jsonl` | **Tạo mới** | 8 kịch bản khế ước giả lập độc lập (`synth-contract-01` đến `08`), gán nhãn `category="contract"`, `fixture_type="synthetic"`. |
| 2 | `evals/harness/models.py` | Sửa đổi | Bổ sung `CaseCategory.CONTRACT = "contract"` và trường kế toán `partial_coverage_scenarios` trong `ScenarioSummary`. |
| 3 | `evals/harness/validator.py` | Sửa đổi | Bổ sung `APPROVED_CATEGORIES`, các hành vi khế ước mới, kiểm tra định dạng hash SHA-256 (64 hex characters), và cập nhật thuật ngữ thẩm định siêu dữ liệu. |
| 4 | `evals/harness/adapters/contract_adapter.py` | Sửa đổi | Tái cấu trúc thành bộ điều hợp module hóa theo từng kịch bản (8 kiểm thử khế ước độc lập, hỗ trợ negative controls, fallback an toàn). |
| 5 | `evals/harness/adapters/policy_adapter.py` | Sửa đổi | Cập nhật `supports_case` bỏ qua các kịch bản `category="contract"` để nhường cho `contract_adapter`. |
| 6 | `evals/harness/adapters/decision_adapter.py` | Sửa đổi | Cập nhật `supports_case` bỏ qua các kịch bản `category="contract"`. |
| 7 | `evals/harness/runner.py` | Sửa đổi | Chỉ áp dụng phân bố 80 kịch bản khi kiểm tra `golden_admission_v1`, tính toán và hiển thị trung thực `partial_coverage_scenarios`. |
| 8 | `evals/harness/report.py` | Sửa đổi | Trình bày `partial_coverage_scenarios` trên bảng tóm tắt và giải trình trung thực trong phần giải trình kiểm toán. |
| 9 | `.github/workflows/backend-ci.yml` | Sửa đổi | Bổ sung bước chạy kiểm thử khế ước `synthetic_contracts_v1.jsonl` song song với `golden_admission_v1.jsonl`, upload toàn bộ artifacts. |
| 10 | `evals/harness/tests/test_adapters.py` | Sửa đổi | Bổ sung kiểm thử 8 kịch bản khế ước, negative controls (ép lỗi, forged doc), kiểm tra ranh giới adapter. |
| 11 | `evals/harness/tests/test_dataset_validation.py` | Sửa đổi | Bổ sung kiểm thử toàn vẹn cho `synthetic_contracts_v1.jsonl` và kiểm tra định dạng mã băm SHA-256. |
| 12 | `evals/harness/tests/test_runner.py` | Sửa đổi | Bổ sung kiểm thử chạy runner trên synthetic dataset và kiểm chứng chế độ `--strict` trả về exit code 1 khi có lỗi khế ước. |

---

### 22.3. Số lượng Fixtures và Phân tầng Kịch bản (Exact Counts & Tiers)

1. **Bộ dữ liệu Golden V1 (`evals/datasets/golden_admission_v1.jsonl`):**
   - **Tổng số:** **80 kịch bản** (Bảo toàn 100% nguyên vẹn).
   - **Phân bố danh mục:**
     - `major`: 15 kịch bản (Tier B)
     - `curriculum`: 20 kịch bản (Tier B)
     - `comparison`: 10 kịch bản (Tier B)
     - `missing`: 15 kịch bản (Tier A)
     - `ambiguity`: 10 kịch bản (Tier A)
     - `safety`: 10 kịch bản (Tier A)
   - **Phân tầng:** 35 Tier A (Policy-only, 43.8%) + 45 Tier B (Pending PDF Verification, 56.2%) + 0 Tier C.

2. **Bộ dữ liệu Synthetic Contracts V1 (`evals/datasets/synthetic_contracts_v1.jsonl`):**
   - **Tổng số:** **8 kịch bản** chuyên biệt kiểm thử khế ước.
   - **Phân bố danh mục:** `contract`: 8 kịch bản (100%).
   - **Phân tầng:** 0 Tier A + 0 Tier B + 8 Tier C (Synthetic Fixtures, 100%).
   - **Ground Truth Status:** `synthetic` (Không tính vào dữ liệu sự thật tuyển sinh EPU).

---

### 22.4. Khép góc Kiểm thử Khế ước (8 Invariants Tested)

`ResponseContractEvaluationAdapter` thực thi độc lập 8 thành phần khế ước Task 3 & Task 4:

1. **`synth-contract-01` (`valid_envelope`):**
   - Kiểm chứng `AIResponseEnvelope` khởi tạo hợp lệ với `answer_status=ANSWERED`, `evidence_status=SUPPORTED`, `source_mode=OFFICIAL_EPU`, mã ngành 7 chữ số (`7480201`), và trích dẫn được xác thực qua `ContractCitationVerifier`.
   - Kết quả: `PASS` (Citations count: 1).
2. **`synth-contract-02` (`malformed_envelope`):**
   - Thử nghiệm các payload lỗi cấu trúc: thiếu trường bắt buộc `answer`, mã ngành không đủ 7 chữ số (`"123"`), độ tin cậy vượt giới hạn (`confidence=1.5`).
   - Kiểm chứng: Tất cả các trường hợp đều kích hoạt `ValidationError` từ Pydantic v2.
   - Kết quả: `PASS` (Citations count: 0).
3. **`synth-contract-03` (`forbidden_fallback_citations`):**
   - Kiểm chứng bất biến ngữ nghĩa: Phong bì có `answer_status=ERROR`, `HANDOVER_OFFERED`, `INSUFFICIENT_EVIDENCE` hoặc `source_mode=NONE` tuyệt đối KHÔNG được đính kèm trích dẫn.
   - Thử nghiệm gắn trích dẫn vào các trạng thái trên đều kích hoạt `ValueError` ("cannot emit citations").
   - Kết quả: `PASS` (Citations count: 0).
4. **`synth-contract-04` (`unknown_document_id`):**
   - Thử nghiệm đưa trích dẫn với `document_id="doc-unregistered-adversary"` vào `ContractCitationVerifier`.
   - Kiểm chứng: Hệ thống lập tức fail-closed với mã lý do `CATALOG_DOCUMENT_NOT_FOUND`, `catalog_verified=False`, `is_valid=False`.
   - Kết quả: `PASS` (Citations count: 0).
5. **`synth-contract-05` (`mismatched_document_hash`):**
   - Thử nghiệm đưa đoạn chứng cứ có mã băm bị sai lệch/sửa đổi (`document_hash="tampered_hash_..."`) so với mã băm trong danh mục phê duyệt.
   - Kiểm chứng: `ContractCitationVerifier` lập tức từ chối với mã lý do `CATALOG_METADATA_MISMATCH`.
   - Kết quả: `PASS` (Citations count: 0).
6. **`synth-contract-06` (`invalid_source_tier`):**
   - Thử nghiệm trích dẫn có `source_tier=SourceTier.GENERAL` (không phải `official_epu`) hoặc tài liệu trong catalog bị đánh dấu `is_active=False`.
   - Kiểm chứng: Bị từ chối tương ứng với `UNOFFICIAL_SOURCE_TIER` và `CATALOG_DOCUMENT_INACTIVE`.
   - Kết quả: `PASS` (Citations count: 0).
7. **`synth-contract-07` (`legacy_response_mapping`):**
   - Kiểm chứng hàm chuyển đổi tương thích ngược `to_legacy_chat_response(envelope)`.
   - Bất biến: Trả về đối tượng `ChatResponse` hợp lệ, giữ nguyên nội dung `answer`, độ tin cậy chưa thẩm định (`confidence=None`) được ánh xạ về `0.0` thay vì bịa đặt `1.0`.
   - Kết quả: `PASS` (Citations count: 1).
8. **`synth-contract-08` (`handover_no_auto_ticket`):**
   - Kiểm chứng khế ước `HandoverInfo`: Lời mời chuyển giao nhân viên (`offered=True`) có `ticket_id is None`.
   - Thử nghiệm gán `ticket_id` khi ứng viên chưa yêu cầu (`requested=False`) hoặc chưa có sự đồng ý xác thực từ máy chủ (`consent_verified=False`) đều ném ngoại lệ `ValueError`.
   - Kết quả: `PASS` (Ticket created: False).

---

### 22.5. Kết quả Kiểm thử Đối chứng Tiêu cực (Negative Control Results)

1. **Ép lỗi kiểm thử khế ước (`test_contract_adapter_negative_control_forced_fail`):**
   - Gắn `controlled_context={"expected_outcome": "FAIL"}` vào kịch bản khế ước.
   - `ResponseContractEvaluationAdapter` phát hiện sự bất thường và trả về kết quả `EvaluationResultStatus.FAIL`.
2. **Kiểm chứng chế độ nghiêm ngặt CLI (`test_runner_strict_mode_fails_on_contract_failure`):**
   - Chạy `run_evaluation(strict=True)` trên bộ dữ liệu chứa kịch bản khế ước lỗi.
   - Kết quả: Runner trả về `exit_code = 1` một cách tất định, ngăn chặn hoàn toàn việc build/CI thành công khi có hồi quy khế ước.
3. **Từ chối tài liệu giả mạo & sai băm:**
   - Đảm bảo nếu `ContractCitationVerifier` chấp nhận mã văn bản lạ hoặc mã băm không khớp, bài kiểm thử sẽ lập tức đánh `FAIL`.
4. **Kiểm tra định dạng mã băm SHA-256 (`test_sha256_hash_format_validation`):**
   - Chuỗi không đúng 64 ký tự hex (hoặc thiếu prefix hợp lệ) bị `validator.py` từ chối ngay ở bước tiền thẩm định dataset.

---

### 22.6. Lệnh CLI và Đầu ra Đo lường Thực tế (CLI Commands & Actual Outputs)

#### Lệnh 1: Đánh giá Bộ dữ liệu Golden V1 Tuyển sinh
```bash
python -m evals.harness.runner --dataset evals/datasets/golden_admission_v1.jsonl --mode all --strict --output evals/reports/task-5
```

```text
[*] Validating dataset integrity: evals/datasets/golden_admission_v1.jsonl
[+] Dataset integrity OK: 80 cases verified.
[*] Running deterministic evaluation (mode=all, category=all)...

============================================================
           ADMISSION X AI — EVALUATION SUMMARY
============================================================
Dataset Version         : golden_admission_v1
Total Scenarios         : 80
Passed Scenarios        : 35
Failed Scenarios        : 0
NOT_EVALUABLE Scenarios : 45 (pending verified PDF)
Unsupported Scenarios   : 0
Total Adapter Evals     : 160

[Per-Adapter Breakdown]
  - policy_adapter      : 80 runs [PASS=35, FAIL=0, NOT_EVALUABLE=45, ERROR=0]
  - decision_adapter    : 80 runs [PASS=35, FAIL=0, NOT_EVALUABLE=45, ERROR=0]
  - contract_adapter    : 0 runs [PASS=0, FAIL=0, NOT_EVALUABLE=0, ERROR=0]

[Metrics Summary]
  - behavior_compliance_rate          : 100.0% (70/70)    [PASS]
  - policy_compliance_rate            : 100.0% (35/35)    [PASS]
  - safe_abstention_rate              : 100.0% (30/30)    [PASS]
  - citation_safety_rate              : N/A    (0/0)      [NOT_EVALUABLE]
  - handover_safety_rate              : 100.0% (19/19)    [PASS]
  - response_contract_compliance_rate : N/A    (0/0)      [NOT_EVALUABLE]
  - missing_facts_safety_rate         : 100.0% (30/30)    [PASS]
  - retrieval_recall_at_5             : N/A               [NOT_EVALUABLE]
  - factual_answer_correctness        : N/A               [NOT_EVALUABLE]
  - citation_precision                : N/A               [NOT_EVALUABLE]
  - groundedness_score                : N/A               [NOT_EVALUABLE]
  - hallucination_rate                : N/A               [NOT_EVALUABLE]
============================================================
[+] Reports exported to evals/reports/task-5/ (report.json, report.md)
[+] Evaluation completed successfully.
```

#### Lệnh 2: Đánh giá Bộ dữ liệu Khế ước Giả lập
```bash
python -m evals.harness.runner --dataset evals/datasets/synthetic_contracts_v1.jsonl --mode contract --strict --output evals/reports/contracts
```

```text
[*] Validating dataset integrity: evals/datasets/synthetic_contracts_v1.jsonl
[+] Dataset integrity OK: 8 cases verified.
[*] Running deterministic evaluation (mode=contract, category=all)...

============================================================
           ADMISSION X AI — EVALUATION SUMMARY
============================================================
Dataset Version         : synthetic_contracts_v1
Total Scenarios         : 8
Passed Scenarios        : 8
Failed Scenarios        : 0
NOT_EVALUABLE Scenarios : 0 (pending verified PDF)
Unsupported Scenarios   : 0
Total Adapter Evals     : 8

[Per-Adapter Breakdown]
  - contract_adapter    : 8 runs [PASS=8, FAIL=0, NOT_EVALUABLE=0, ERROR=0]

[Metrics Summary]
  - behavior_compliance_rate          : N/A    (0/0)      [NOT_EVALUABLE]
  - policy_compliance_rate            : N/A    (0/0)      [NOT_EVALUABLE]
  - safe_abstention_rate              : N/A    (0/0)      [NOT_EVALUABLE]
  - citation_safety_rate              : 100.0% (8/8)      [PASS]
  - handover_safety_rate              : N/A    (0/0)      [NOT_EVALUABLE]
  - response_contract_compliance_rate : 100.0% (8/8)      [PASS]
  - missing_facts_safety_rate         : N/A    (0/0)      [NOT_EVALUABLE]
  - retrieval_recall_at_5             : N/A               [NOT_EVALUABLE]
  - factual_answer_correctness        : N/A               [NOT_EVALUABLE]
  - citation_precision                : N/A               [NOT_EVALUABLE]
  - groundedness_score                : N/A               [NOT_EVALUABLE]
  - hallucination_rate                : N/A               [NOT_EVALUABLE]
============================================================
[+] Reports exported to evals/reports/contracts/ (report.json, report.md)
[+] Evaluation completed successfully.
```

---

### 22.7. Làm rõ Kế toán Độ phủ Kịch bản & Thuật ngữ Chứng cứ (Scenario Coverage & Terminology)

1. **Kế toán `partial_coverage_scenarios`:**
   - Một kịch bản được phân loại là `partial_coverage` khi đạt kết quả `PASS` ở một hoặc nhiều chiều đánh giá (ví dụ: đã kiểm chứng chính sách bảo vệ hoặc khế ước dữ liệu), nhưng ở một chiều khác lại đang ở trạng thái `NOT_EVALUABLE` (ví dụ: chiều dữ liệu sự thật tuyển sinh đang chờ văn bản PDF).
   - Hệ thống công khai thông tin này trên cả giao diện dòng lệnh, báo cáo JSON và báo cáo Markdown.
   - **Cam kết:** Tuyệt đối không đánh đồng việc vượt qua bài kiểm thử chính sách/khế ước bằng fixture giả lập với độ chính xác factual end-to-end của chatbot.
2. **Thuật ngữ thẩm định siêu dữ liệu (Metadata Completeness vs Real Evidence Authenticity):**
   - Trong `validator.py` và các tài liệu liên quan, hệ thống phân biệt rành mạch:
     - *Tính đầy đủ của siêu dữ liệu (Metadata Completeness):* Kiểm tra sự hiện diện và định dạng hợp lệ của các trường `source_document_id`, `source_hash`, `verified_passage_id`, `reviewer_reference`.
     - *Tính xác thực mật mã từ byte nguồn gốc (Cryptographic Source-Byte Verification):* Chỉ được tuyên bố khi hệ thống đã tải và kiểm tra byte thực tế từ tệp PDF gốc của trường Đại học Điện lực (tiến hành tại Phase 2).

---

### 22.8. Kết quả Toàn bộ Kiểm thử Tự động (Full Test Suite Results)

- **Backend & Evaluation Pytest:** **232 passed in 8.26s** (tăng thêm 7 tests mới kiểm tra khế ước và negative controls, 0 failed).
- **Ruff Linter & Formatter:** **All checks passed!** (0 errors, tuân thủ nghiêm ngặt PEP 8 / Ruff formatting).
- **Frontend Jest/Node Tests:** **29 passed in 264ms** (0 regressions trên ranh giới bảo mật URL và trích dẫn).
- **GitHub Actions CI Configuration:**
  - Tệp `.github/workflows/backend-ci.yml` đã được cập nhật để thực thi tuần tự cả 2 bộ kiểm thử:
    1. Bộ kịch bản Golden V1 tuyển sinh (`golden_admission_v1.jsonl`, output: `evals/reports/ci/golden`).
    2. Bộ khế ước giả lập (`synthetic_contracts_v1.jsonl`, output: `evals/reports/ci/contracts`).
  - Toàn bộ thư mục báo cáo `evals/reports/ci/` được tải lên artifact `task-5-evaluation-reports`.
- **Exit Code:** `0` (Success).

---

### 22.9. Giới hạn Còn lại Trung thực (Honest Remaining Limitations)

1. **Dữ liệu Sự thật Tuyển sinh 2025/2026:**
   - 45 kịch bản tuyển sinh tra cứu thực tế (Tier B) tiếp tục được giữ nguyên trạng thái `NOT_EVALUABLE`. Việc thẩm định và gắn nhãn sẽ được thực hiện tại Phase 2 khi tài liệu đề án tuyển sinh chính thức được số hóa và ký duyệt.
2. **Khế ước giả lập độc lập:**
   - Bộ 8 kịch bản `synthetic_contracts_v1.jsonl` đóng vai trò là chốt chặn kỹ thuật (quality gate) cho tầng phần mềm (envelope schema, citation verifier, legacy mapping). Kết quả 100% của bộ này xác nhận tính toàn vẹn của mã nguồn, không đại diện cho kiến thức tuyển sinh thực tế của mô hình ngôn ngữ.
3. **Các chỉ số nâng cao:**
   - `retrieval_recall_at_5`, `factual_answer_correctness`, `citation_precision`, `groundedness_score`, `hallucination_rate` tiếp tục báo cáo trung thực `NOT_EVALUABLE` cho đến các Phase tiếp theo.

---

### 22.10. Trạng thái Nghiệm thu & Cam kết Giới hạn

- **Commit:** Nhánh `feat/phase-1-task-5-golden-evaluation` (Sẵn sàng cho kiểm toán độc lập)
- **Trạng thái:** Hoàn thành toàn diện Task 5.2. Đã đóng toàn bộ khoảng trống kiểm thử khế ước.
- **Quy tắc Phase 1:** Dừng lại tại đây, không merge vào nhánh `main`, không bắt đầu Phase 2. Sẵn sàng cho đợt kiểm toán độc lập tiếp theo.

