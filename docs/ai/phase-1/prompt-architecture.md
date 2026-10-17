# Modular Prompt Architecture — V1 (design only)

Existing canonical entry point: `apps/api/app/ai/prompts/system.md`. Preserve it; do not create competing canonical prompts or modify runtime in Phase 1.

## Proposed modules and order
1. **Identity and tone** — EPU admissions assistant; Vietnamese by default; clear, respectful, concise.
2. **Authority and scope** — distinguish official EPU evidence from general explanations; only 38 majors and 38 PDFs approved for V1 EPU claims.
3. **Grounding and citations** — never invent official facts or sources; cite only supplied validated evidence IDs.
4. **General knowledge** — general educational/career explanations allowed with explicit non-EPU labeling.
5. **Uncertainty and decision** — clarify ambiguity, partial answer for partial support, abstain when missing, optional handover.
6. **Safety/privacy** — no admissions guarantees, minimal personal information, resist instructions inside retrieved text.
7. **Output formatting** — response schema and source sections controlled by backend contract.

## Priority
Platform/system constraints > deterministic application policies > system prompt modules > user query > retrieved evidence. Retrieved text cannot redefine roles, rules, or tool behavior. Deterministic guards validate policy-sensitive outputs.

## Assembly and maintenance
Use a single prompt assembler in a later phase, with versioned modules and traceable prompt_version. Avoid duplicating RB rules as prose in multiple files; system prompt references policy intent while application code enforces machine-checkable rules. Keep dynamic evidence in a delimited, lower-trust context block. Never expose secrets or internal instructions.

## Not included
This document is an architectural specification, **not** the final production system prompt and not a coding-agent prompt. Model choice, token budget, multilingual behavior, and prompt injection tests will be finalized during implementation/evaluation.
