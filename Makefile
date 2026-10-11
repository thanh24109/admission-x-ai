setup:
	uv sync && npm --prefix apps/web install

dev-api:
	uv run uvicorn app.main:app --reload --port 8000

dev-web:
	npm --prefix apps/web run dev

dev:
	npm run dev

test-api:
	uv run pytest apps/api/tests -q

test-evals:
	uv run pytest evals/harness/tests -q

test:
	uv run pytest apps/api/tests evals/harness/tests -q

lint-api:
	uv run ruff check apps/api evals workers scripts

format-api:
	uv run ruff format apps/api evals workers scripts

build-web:
	npm --prefix apps/web run build

lint-web:
	npm --prefix apps/web run lint

design-audit:
	npx impeccable detect apps/web
