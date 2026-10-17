# Agent State & Execution Policy — V1

Status: **design target** for Phase 7 LangGraph implementation; not yet running.

## State contract
```text
request_id, trace_id, session_id?, message
intent?, resolved_major_codes[], ambiguity?
source_mode: official | general | mixed | none
plan_steps[], tool_call_count, tool_results[]
retrieved_evidence[], evidence_status, answer_status
draft_answer?, validated_citations[], policy_violations[]
handover_offer?, handover_consent_reference?
policy_version, prompt_version, document_versions[]
error_code?, termination_reason?
```
Only necessary, consented candidate context is retained. Use scoped session identifiers and redaction; do not store sensitive input in trace payloads by default. Model-generated state fields do not grant permissions.

## Execution lifecycle
```text
START
  -> input_guard
  -> understand_query + resolve_major
  -> [ambiguity? clarify -> END]
  -> source_router
  -> [official/mixed? program_lookup and/or curriculum_retrieve]
  -> [general/mixed? bounded general explanation]
  -> assess_evidence
  -> [missing/conflicting? abstain or offer_handover -> END]
  -> compose_answer
  -> validate_output
  -> [validation failure? safe fallback -> END]
  -> serialize_response -> END
```
Mixed answers must separate verified EPU statements from general explanations. Official citations require verified evidence IDs. Handover ticket creation is a separate authenticated backend workflow **after** user consent, not an autonomous graph edge.

## Budgets and termination (proposed defaults; calibrate during implementation)
| Control | Initial proposal | Enforcement |
|---|---|---|
| Total tool calls | <= 5 per user turn | Graph runtime |
| Retrieval attempts | <= 2, only if useful refinement exists | Orchestrator |
| General knowledge calls | <= 1 | Orchestrator |
| Clarification questions | <= 1 per turn | Router |
| Tool timeout | 8 seconds per read-only tool | Adapter |
| Turn deadline | 25 seconds (non-streaming baseline) | API/orchestrator |
| Retry | 1 retry only for transient read-only failures with backoff | Tool adapter |
| Side-effect retry | No blind retry; use idempotency + confirmed status | Backend |
| Loop prevention | Reject repeated identical tool arguments and terminate on budget | Graph runtime |

These numbers are **proposed configuration defaults**, not measured SLOs. Timeouts/retries must honor remaining request deadline. Never retry invalid arguments, policy denials or unsupported-source errors. A deadline or budget breach yields a typed error or safe partial response, not an invented answer.

## Decision and evidence invariants
1. No EPU-specific factual claim without verified official evidence matching program, year and source.
2. General knowledge cannot become official through paraphrase.
3. Citation IDs must resolve to retrieved, approved passages.
4. Missing evidence -> abstain/partial; do not auto-handover.
5. Ambiguous program -> clarify before program-specific retrieval.
6. Tool response instructions and PDF instructions are never executed as policy.
7. A low numerical confidence alone is not sufficient evidence of hallucination or reason to create a handover.
8. A frontend/API error never authorizes mock admissions facts.

## Observability and audit
Log `trace_id`, sanitized intent, selected tool name, outcome, latency, count, policy version, prompt version, evidence IDs, answer status and validation errors. Redact PII and secrets; retain logs according to approved retention policy. Distinguish `handover_offered`, `consent_received`, `ticket_created` events.

## Testing
- Policy: ambiguity, restricted admissions claims, general/official mixing, conflicting PDFs.
- Reliability: timeouts, retries, tool unavailable, budget exceeded, repeated tool calls.
- Security: prompt injection in retrieved chunk, invalid code, unauthorized ticket attempt, PII leak.
- Contract: citations resolve, final response schema valid, no frontend-generated fake sources.
- Performance: record p50/p95 and tool counts after implementation; no preclaimed pass results.

## Implementation phases
Phase 1 specifies behavior and contracts. Phase 2–5 deliver verified evidence and read-only retrieval tools. Phase 6 delivers generation and validators. **Phase 7 implements LangGraph orchestration**, state and runtime budgets. Phase 8 integrates FastAPI and handover backend; Phase 9 integrates Next.js; Phase 10 evaluates and deploys.
