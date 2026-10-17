# Chat Response Contract — V1 (proposal)

## Current repo
`apps/api/app/schemas/chat.py` currently exposes `answer`, `intent`, `confidence`, `handover`, `citations[{title,source}]`; frontend `apps/web/src/types/chat.ts` expects richer citations. Phase 1 specifies a **versioned migration**, not a breaking code change.

## Proposed response fields
- `response_id`: stable response identifier
- `session_id`: nullable conversation identifier
- `answer`: user-visible Vietnamese text
- `answer_status`: `answered | partial | clarification_needed | insufficient_evidence | handover_offered | handover_required | error`
- `evidence_status`: `supported | partially_supported | unsupported | conflicting | not_applicable`
- `source_mode`: `official | general | mixed | none`
- `intent`: normalized intent string
- `resolved_major_codes`: list of validated codes
- `citations`: list conforming to `citation-contract.md`
- `handover`: object `{offered, requested, ticket_id}`, with no automatic ticket creation
- `policy_version`, `prompt_version`: traceability identifiers

`confidence` is optional diagnostic metadata, not proof of grounding or a trigger for mandatory handover.

## Example — mixed answer (illustrative only)
```json
{
  "response_id": "example-response",
  "session_id": null,
  "answer": "Thông tin EPU: [chỉ chèn sau khi có evidence].\nGiải thích chung: ngành này có thể liên quan đến ...",
  "answer_status": "partial",
  "evidence_status": "partially_supported",
  "source_mode": "mixed",
  "intent": "program_and_career",
  "resolved_major_codes": [],
  "citations": [],
  "handover": {"offered": false, "requested": false, "ticket_id": null},
  "policy_version": "1.0",
  "prompt_version": "1.0"
}
```
The example deliberately contains no invented EPU fact or document citation.

## Compatibility
Do not silently replace `handover: bool` in a live API. Plan an additive V1.1 contract or versioned V2 endpoint with migration for FE and tests. No SSE event contract is implemented in Phase 1. Streaming must preserve the same terminal metadata and citation validation rules.
