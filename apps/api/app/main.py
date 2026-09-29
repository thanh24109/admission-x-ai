from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.app.api.routes import chat, conversations, handovers, metrics
from apps.api.app.core.config import settings

app = FastAPI(title="Admission X AI API", version="0.1.0")
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

app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(conversations.router, prefix="/api/v1", tags=["conversations"])
app.include_router(handovers.router, prefix="/api/v1", tags=["handovers"])
app.include_router(metrics.router, prefix="/api/v1", tags=["metrics"])
