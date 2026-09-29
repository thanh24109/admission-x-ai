dev-api:
	cd apps/api && uvicorn app.main:app --reload --port 8000

dev-web:
	cd apps/web && npm run dev

test-api:
	cd apps/api && pytest

lint-api:
	cd apps/api && ruff check .

test-evals:
	pytest evals/harness/tests
