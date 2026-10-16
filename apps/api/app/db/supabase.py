from typing import Any

from app.core.config import settings


def get_supabase_client() -> dict[str, Any] | None:
    """Return Supabase configuration and client details if configured."""
    if not settings.supabase_url:
        return None
    return {
        "url": settings.supabase_url,
        "has_publishable_key": bool(settings.effective_publishable_key),
        "has_secret_key": bool(settings.effective_secret_key),
    }

