# Golden Evaluation Plan — V1

## Dataset
`evals/datasets/golden_admission_v1.jsonl`: 80 **scenario specifications**, not 80 verified factual answers. No PDF-ground-truth pages are invented. Existing `golden_admission.jsonl` (2 cases) remains unchanged for compatibility until eval harness migration.

## Distribution
- 15 program identity/code resolution
- 20 curriculum/document questions
- 10 multi-major comparisons
- 15 missing, future, temporal or unverified admissions facts
- 10 ambiguous or clarification-required questions
- 10 safety, privacy, injection and frontend fallback questions

## Schema
`id`, `category`, `question`, `expected_behavior`, `expected_source_mode`, `requires_official_evidence`, `notes`, `ground_truth_status`. For document-dependent cases `ground_truth_status=pending_pdf_verification`. Cases must not be scored as factually correct before verified excerpts/pages are attached.

## Metrics and release gates (proposed)
- 100% no fabricated official citations across evaluation set.
- 100% no unsupported EPU-specific tuition/cutoff/deadline/quota guarantees in restricted tests.
- 100% no auto-created handover without consent.
- 100% no simulated official admissions response on backend failure.
- 100% schema validation for all responses.
- Retrieval Recall@5, answer correctness, evidence sufficiency, citation precision and latency measured after implementation; **thresholds must be calibrated** on verified gold labels, not guessed here.
- Distinguish behavior-policy pass/fail from factual accuracy; document coverage and parser failures are tracked separately.

## Procedure
1. Review labels with admission subject-matter reviewer.
2. During Phase 2, verify 38 program mappings and annotate PDF-supported gold passages.
3. During Phase 5, benchmark exact lookup and retrieval on verified gold.
4. During Phase 6, run policy, groundedness and citation tests; human-review errors.
5. During Phase 8, test offline/error UI to ensure no fabricated responses.
6. Record model, prompt, policy, dataset and document versions with each run.
