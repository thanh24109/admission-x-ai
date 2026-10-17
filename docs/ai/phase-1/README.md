# Admission X AI — Phase 1 Design Baseline (V1)

Status: **proposed for review**, not production-ready. Branch: `docs/phase-1-ai-behavior-policy-v1`.

## Approved decisions
- Dataset V1: 38 EPU undergraduate programs mapped to 38 curriculum PDFs; no other EPU admissions material assumed ingested.
- General educational/career knowledge is permitted **when clearly distinguished from EPU-specific verified claims**.
- Missing evidence: abstain or clarify; offer human handover only when justified, never automatically create a ticket.
- Modular system prompt; reuse `apps/api/app/ai/prompts/system.md`.
- Evaluation target: 80 scenarios; verified PDF page references require later dataset audit.

## Reading order
1. `scope-and-source-policy.md`
2. `prompt-architecture.md`
3. `rulebase-v1.yaml` and `decision-matrix.md`
4. `response-contract.md` and `citation-contract.md`
5. `ai-orchestration-design.md`
6. `evaluation-plan.md` and `evals/datasets/golden_admission_v1.jsonl`
7. `implementation-mapping.md`

## Explicitly out of scope
No prompt runtime replacement, RAG retrieval, parsing, embeddings, database migrations, API changes, frontend changes, or automatic handover. This is a **design and evaluation specification**.

## Review gates
Approve source-tier semantics, routing precedence, response contract migration, citation verification rules, handover consent, and evaluation gold-label verification before Phase 2. Existing code is a scaffold and may not implement these policies yet.
