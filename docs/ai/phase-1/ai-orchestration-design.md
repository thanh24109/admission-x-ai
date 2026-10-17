# AI Orchestration Design — V1

## Existing scaffold
`app.ai.graph.builder.run_admission_graph` currently runs synchronous Python nodes in order. `retrieve` returns no context; `generate` is placeholder; `confidence_gate` auto-handoffs when ungrounded. This design preserves the modular-monolith boundary and proposes future LangGraph conversion **after** retrieval baseline is working.

## Target state fields
`message`, `session_id`, `candidate_id`, `intent`, `requested_major_names`, `resolved_major_codes`, `ambiguity`, `source_mode`, `retrieved_evidence`, `evidence_status`, `answer_status`, `draft_answer`, `validated_citations`, `policy_violations`, `handover_offer`, `trace_id`, `prompt_version`, `policy_version`.

## Nodes
1. `input_guard`: normalize/validate, detect malicious instructions and PII risk.
2. `understand_query`: intent and canonical major resolution; ambiguity decision.
3. `source_router`: official/general/mixed/restricted classification.
4. `retrieve_official`: metadata-filtered evidence retrieval (future Phase 5).
5. `assess_evidence`: verified support, partial support, conflicts, temporal relevance.
6. `generate_answer`: grounded and/or labeled general explanation, following decision matrix.
7. `validate_output`: citation-to-evidence alignment, no prohibited admissions guarantees.
8. `handover_decision`: offer only for suitable cases; separate user consent and ticket creation.
9. `serialize_response`: consistent API contract.

## Conditional transitions
- Ambiguous => clarify, no speculative retrieval.
- Pure general => general answer with clear source labeling, no official citation.
- Official/mixed => retrieval and evidence assessment.
- Missing evidence => abstain or supported partial answer.
- Conflict => no arbitrary source selection; possible human review offer.
- Failed output validation => safe fallback; do not silently send ungrounded draft.
- Handover offer => no automatic ticket.

## Interfaces and later phases
Phase 2: parser must retain source URL, document hash, program code, page range and section metadata. Phase 3–4: persist evidence/provenance. Phase 5: implement retriever and major resolver. Phase 6: LLM and validators. Phase 7–8: versioned API/UI migration. Preserve testability independent of FastAPI and keep ingestion separate from crawler.
