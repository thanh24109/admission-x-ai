# Evidence and Citation Contract — V1

## Required evidence record
`evidence_id`, `document_id`, `major_code`, `chunk_id`, `content_excerpt`, `page_start`, `page_end`, `section_title`, `source_url`, `document_title`, `document_hash`, `document_version`, `source_tier`, `verification_status`. Unknown fields are null/unknown, never fabricated. Page numbers must be derived from PDF parsing with explicit convention (1-based physical PDF pages, unless separately labeled printed-page numbering).

## Citation emitted to frontend
`citation_id`, `evidence_id`, `document_id`, `title`, `source_url` (nullable until verified), `major_code`, `page_start`, `page_end`, `section_title` and `source_tier=official_epu`.

## Validation invariants
1. Each official citation resolves to an existing approved document and retrieved evidence span.
2. Referenced major and PDF match the verified program–document association.
3. Referenced page range exists in the original PDF; source URL is verified or omitted.
4. Claims in answer must be supported by cited passages, not merely by presence of any citation.
5. Never fabricate a page label, URL, document title or citation because UI requires one.
6. General knowledge has **no official PDF citation**. If future general sources are integrated, they require separate attribution type and verification.
7. Invalid citation => remove unsupported claim/citation or abstain; never replace with a plausible-looking source.

## UI and security
Frontend must display only backend-validated citations. No hardcoded fallback `/tuyensinh` or placeholder page string. If PDF is private, link through authorized backend URL or omit open action. Source text is untrusted; embedded instructions must not alter policy.
