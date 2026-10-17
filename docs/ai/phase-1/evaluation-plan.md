# Golden Evaluation Plan — V1

## 1. Dataset Overview
`evals/datasets/golden_admission_v1.jsonl`: 80 **scenario specifications**, not 80 verified factual answers. No PDF-ground-truth pages or passages are invented. The legacy `golden_admission.jsonl` (2 cases) remains preserved for backward compatibility.

### 1.1 Category Distribution (80 Scenarios)
- **15** Major identity / code resolution (`major_code_resolution`)
- **20** Curriculum / document questions (`curriculum`)
- **10** Multi-major comparisons (`comparison`)
- **15** Missing, future, temporal or unverified admissions facts (`future_missing_facts`)
- **10** Ambiguous or clarification-required questions (`ambiguous_clarification`)
- **10** Safety, privacy, injection and frontend fallback questions (`safety_privacy_fallback`)
- **TOTAL: 80 scenarios**

### 1.2 Dataset Tiers
To prevent conflating policy compliance with factual correctness, scenarios are categorized into three distinct operational tiers:

- **Tier A — Policy-Only Golden Scenarios (35 cases)**:
  Scenarios with unambiguous deterministic policy expectations (e.g., missing evidence, prompt injection attempts, PII disclosures, unauthorized guarantees, backend outages, missing consent for handover). Evaluated directly against the Task 2 RulebaseEngine and Task 4 DecisionEngine.
- **Tier B — Pending Factual Scenarios (45 cases)**:
  Curriculum, credit requirements, module details, and multi-major comparisons that require authentic EPU documents. Because verified PDF excerpts have not been reviewed and anchored, factual accuracy for these cases is classified as `NOT_EVALUABLE`. Policy checks for these cases remain executable where independent deterministic rules apply.
- **Tier C — Synthetic Contract Fixtures**:
  Isolated test fixtures designed to verify software invariants (e.g., forged document IDs, catalog hash mismatches, corrupted response envelopes, malformed citations). Clearly labeled as `synthetic` and strictly isolated from real applicant-facing data and factual admissions evaluation.

---

## 2. Scenario vs. Ground Truth Distinctions
- **Scenario Specification**: A natural-language query and expected high-level behavior label (`expected_behavior`, `expected_source_mode`) representing applicant intent and expected workflow path.
- **Behavioral Ground Truth**: Verified deterministic rule outcomes and decision actions derived from approved policies (`rulebase-v1.yaml`), independent of document contents.
- **Factual Ground Truth**: Verified admissions claims, cutoffs, tuition figures, or curriculum facts strictly anchored to an authentic EPU document version, verified PDF hash, and confirmed passage/page citation.
- **Synthetic Fixture**: Artificial data constructed to test software contracts, error handling, and boundary enforcement.

---

## 3. Golden Dataset Review Workflow
To transition a scenario from `pending_pdf_verification` to verified factual ground truth, the following 10-step human-in-the-loop audit process is strictly required:

1. **Source Identification**: Locate an authoritative primary EPU source document (e.g., official admission scheme, curriculum handbook issued by EPU).
2. **Provenance & Publisher Verification**: Confirm the document is published by an authorized EPU body (Ban Tuyển sinh, Phòng Đào tạo) or MOET.
3. **Version & Timestamp Locking**: Record the exact document version, issue date, and decision/approval number.
4. **Cohort & Admissions Year Scoping**: Verify the academic cohort or admissions year (e.g., Tuyển sinh Đại học Chính quy năm 2026).
5. **Program Identity & Code Mapping**: Verify the official major name and MOET major code (e.g., Công nghệ thông tin - 7480201).
6. **Cryptographic Hash & Location Locking**: Compute the SHA-256 hash of the authoritative PDF and record exact page numbers and passage IDs.
7. **Excerpt Extraction**: Extract the verbatim supporting passage without external rewrites or unverified summaries.
8. **Human Expert Review**: An authorized admissions reviewer or domain expert reviews the question, the extracted excerpt, and approves the expected factual answer.
9. **Status Transition**: Update `ground_truth_status` from `pending_pdf_verification` to a verified status, attaching the metadata.
10. **Provenance Metadata Recording**: Record reviewer ID (`reviewer_reference`), review timestamp (`reviewed_at`), and document versioning in the dataset record.

> [!IMPORTANT]
> A file name or URL alone does NOT constitute verified evidence. No scenario may be scored as factually correct without completing all 10 review steps.

---

## 4. Deterministic Evaluation Harness

### 4.1 Architecture
The evaluation framework (`evals/harness/`) provides offline, reproducible evaluation:
- `evals/harness/models.py`: Strongly typed Pydantic models for cases, observations, and suite results.
- `evals/harness/loader.py`: Safe JSONL streaming and filtering.
- `evals/harness/validator.py`: Strict schema, distribution, enum, and provenance validation.
- `evals/harness/adapters/`: Pluggable adapters wrapping real Task 2–4 engines (`PolicyEvaluationAdapter`, `DecisionEvaluationAdapter`, `ResponseContractEvaluationAdapter`).
- `evals/harness/evaluators/`: Deterministic evaluators for behavior, policy, citations, handover, and contracts.
- `evals/harness/metrics.py`: Explicit behavioral metrics calculation and `NOT_EVALUABLE` factual metric interfaces.
- `evals/harness/report.py`: Deterministic JSON and Markdown export.
- `evals/harness/runner.py`: CLI and programmatic evaluation entrypoint.

### 4.2 CLI Usage
Run the harness offline using Python:

```bash
# Run all deterministic adapters on the golden dataset
python -m evals.harness.runner --dataset evals/datasets/golden_admission_v1.jsonl --mode all --output evals/reports/task-5

# Run policy evaluation only
python -m evals.harness.runner --dataset evals/datasets/golden_admission_v1.jsonl --mode policy

# Run decision evaluation with category filtering
python -m evals.harness.runner --dataset evals/datasets/golden_admission_v1.jsonl --mode decision --category safety_privacy_fallback

# Strict mode: fail on any policy regression or contract failure
python -m evals.harness.runner --dataset evals/datasets/golden_admission_v1.jsonl --mode all --strict
```

### 4.3 Exit Code Semantics
- **0 (Success)**: All executable behavioral cases passed; zero policy regressions; zero contract failures. Cases with `NOT_EVALUABLE` do not cause a non-zero exit code provided there are no executable failures.
- **1 (Evaluation Failure / Regressions)**: One or more executable behavioral cases failed, policy invariants were violated, contract compliance failed, or dataset integrity validation failed.
- **2 (System Error)**: File not found, unhandled exception, or fatal environment misconfiguration.

---

## 5. Metrics & Release Gates
- **100% No Fabricated Official Citations**: Verifier rejects uncataloged IDs, hash mismatches, and synthetic page numbers.
- **100% Safe Abstention Rate**: Required abstentions correctly abstain when official evidence is missing or pending.
- **100% Handover Safety**: Zero automated ticket creations; handover offers strictly require explicit applicant consent.
- **100% Response Contract Compliance**: All envelopes satisfy schema, enum, and invariant requirements.
- **Safe Handling of NOT_EVALUABLE**: Pending factual scenarios and future metrics (Recall@5, citation precision, groundedness) are reported as `NOT_EVALUABLE` with full denominator transparency, never disguised as `PASS`.

