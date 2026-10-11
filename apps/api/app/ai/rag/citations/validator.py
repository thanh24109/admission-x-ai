def validate_citations(answer: str, sources: list[dict]) -> bool:
    return bool(sources) if answer else True
