from evals.metrics.accuracy import accuracy
from evals.metrics.answer_rate import answer_rate

if __name__ == "__main__":
    print({"answer_rate": answer_rate(0, 0), "accuracy": accuracy(0, 0)})
