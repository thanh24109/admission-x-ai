from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import chat, conversations, handovers, metrics
from app.core.config import settings
from app.db.session import check_db_connection, close_db, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database connection pool if DATABASE_URL is configured
    init_db()
    yield
    # Shutdown: gracefully close connection pool
    await close_db()


app = FastAPI(title="Admission X AI API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
async def health_db(response: Response) -> dict[str, Any]:
    """Test Supabase PostgreSQL database connectivity."""
    result = await check_db_connection()
    if not result.get("connected"):
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return result


app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(conversations.router, prefix="/api/v1", tags=["conversations"])
app.include_router(handovers.router, prefix="/api/v1", tags=["handovers"])
app.include_router(metrics.router, prefix="/api/v1", tags=["metrics"])

