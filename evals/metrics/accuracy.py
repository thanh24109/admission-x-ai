def accuracy(correct_answered: int, answered: int) -> float:
    return correct_answered / answered if answered else 0.0
