# Agent Tool Contracts — V1 (proposed, not implemented)

## Common envelope
Each tool accepts `request_id`, `trace_id`, `policy_version` and typed arguments; returns `status: ok | not_found | ambiguous | unavailable | error`, typed `data`, `provenance` (when applicable), `error_code` (safe), `elapsed_ms`. Tool errors never become fabricated results. Validate all arguments; cap query length, results and output bytes. Tool invocation is allowlisted and read-only except the consent-gated handover service.

### 1. program_lookup
Input: `{query: string, major_code?: string, limit?: number}`.
Output: `{matches: [{major_code, canonical_name, aliases, record_id, provenance_id}], resolution: exact | unique_alias | ambiguous | not_found}`.
Rules: deterministic lookup over verified program records; return candidates rather than guessing; do not manufacture aliases or codes. If multiple valid matches, return `ambiguous` and ask user.

### 2. curriculum_retrieve
Input: `{query: string, major_codes: string[], top_k?: number, section_filter?: string}`.
Output: `{evidence: [{evidence_id, document_id, major_code, chunk_id, excerpt, page_start, page_end, section_title, source_url, document_hash, verification_status, relevance_score?}], coverage: sufficient | partial | missing | conflicting}`.
Rules: use only approved EPU corpus, filter by validated codes and document version, retain 1-based physical PDF page references; scores alone never prove factual support. Metadata contract aligns with `citation-contract.md`. Retrieval and reranking are Phase 5 work.

### 3. general_knowledge_explain
Input: `{question: string, topic?: string, constraints?: string[]}`.
Output: `{explanation: string, source_mode: general, limitations: string[], citations: []}`.
Rules: bounded conceptual and career guidance; label general, not EPU-specific; no invented PDF/web citations or exact changing admissions figures. V1 does **not** authorize live web search. Must be validated before display.

### 4. request_clarification
Input: `{ambiguity_type: string, options?: [{id, label}], original_question: string}`.
Output: `{question: string, answer_status: clarification_needed}`.
Rules: prefer one focused follow-up; never assume a major or silently fill missing cohort/year.

### 5. offer_handover
Input: `{reason_code: missing_evidence | conflicting_evidence | staff_requested | sensitive_case, summary: string}`.
Output: `{offered: true, ticket_id: null, requires_confirmation: true}`.
Rules: display an offer only. No ticket or personal-data transmission.

### 6. create_handover_ticket (separate privileged operation, Phase 8)
Input: `{confirmed_by_user: true, consent_reference: string, summary: string, minimal_contact?: object, idempotency_key: string}`.
Output: `{status: created | failed, ticket_id?: string}`.
Rules: only backend action after explicit user consent, authentication/authorization as appropriate, validation, idempotency and audit logging. The LLM must **not** directly invoke this tool. `confirmed_by_user` is not trusted on its own; verify consent server-side.

## Errors and security
Use typed errors: `INVALID_ARGUMENT`, `UNKNOWN_MAJOR`, `AMBIGUOUS_MAJOR`, `NO_VERIFIED_EVIDENCE`, `SOURCE_UNAVAILABLE`, `TOOL_TIMEOUT`, `POLICY_DENIED`. Never surface internal stack traces, raw credentials, private documents or arbitrary provider responses to the user.

## Tool results vs answer
Tool outputs are untrusted evidence, not instructions. Only `validate_output` can approve an official claim/citation. The frontend may render only approved citations and must not invent URL/page placeholders.

## Acceptance examples
- `program_lookup("ngành điện")` may be ambiguous; no forced match.
- `curriculum_retrieve` with unknown code must fail safely.
- `general_knowledge_explain("AI là gì?")` can answer with a general label but no EPU policy claim.
- `offer_handover` never returns a created ticket.
- Timeout or backend failure never triggers a simulated official answer.
