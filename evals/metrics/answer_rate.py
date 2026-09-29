def answer_rate(answered: int, eligible: int) -> float:
    return answered / eligible if eligible else 0.0
