# Implementation Mapping and Risk Register

## Existing paths (audited on main commit 586305a)
| Current component | Finding | Later phase |
|---|---|---|
| `apps/api/app/ai/prompts/system.md` | Short official-only prompt; expand modularly | 6 |
| `apps/api/app/ai/guardrails/commitment_guard.py` | Literal phrase matcher | 6 |
| `apps/api/app/ai/guardrails/pii.py` | Allowed field names only | 6–7 |
| `apps/api/app/ai/graph/nodes.py` | Keyword intents; empty context; placeholder generation; auto-handover | 5–7 |
| `apps/api/app/ai/graph/builder.py` | Deterministic runner, not compiled LangGraph | 6–7 |
| `apps/api/app/ai/rag/retrieval/hybrid_retriever.py` | Empty list stub | 5 |
| `apps/api/app/ai/rag/citations/validator.py` | Checks presence of sources, not claim alignment | 6 |
| `apps/api/app/schemas/chat.py` | Minimal citation fields and boolean handover | 7 |
| `apps/web/src/types/chat.ts` | Citation fields differ from BE | 8 |
| `apps/web/src/components/chat/CandidateChatWorkspace.tsx` | Backend failure can trigger fabricated simulated admissions claims and fake citation destinations | **P0 before user-facing deployment** |
| `apps/web/src/data/chatMockData.ts` | Mock 2026 admissions facts and source links; demo-only | **P0 before user-facing deployment** |
| `evals/datasets/golden_admission.jsonl` | Only 2 behavior cases | 6–9 |
| `data/crawled/metadata/programs.jsonl` and 38 PDFs | Candidate dataset, not independently parsed/verified | 2 |

## Phase 1 outputs
All new files under `docs/ai/phase-1/` plus a separate proposed 80-scenario dataset. No runtime code changes, no migrations, no PDF modifications.

## P0 requirements before real-user rollout
- Disable or explicitly isolate simulated admission/tuition/score responses; backend errors must show error state.
- Prevent frontend-created page labels and fake document URLs.
- Implement and test evidence/citation validation before presenting official factual claims.
- Ensure handover requires explicit user action/consent and successful backend ticket creation.

## Pending decisions for review
- Exact citation URL access policy (public PDF URL vs signed URL).
- Whether general explanations require external reference retrieval later.
- Response contract migration path (additive V1.1 vs V2).
- Major aliases and preferred names after metadata validation.
- Year/cohort applicability fields and handling older curricula.
