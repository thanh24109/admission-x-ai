import re
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.exc import SQLAlchemyError

_REPO_ROOT = Path(__file__).resolve().parents[4]



class Settings(BaseSettings):
    app_env: str = "development"
    log_level: str = "INFO"
    api_cors_origins: str = "http://localhost:3000"

    # Supabase credentials & URLs
    supabase_url: str | None = None
    supabase_publishable_key: str | None = None
    supabase_anon_key: str | None = None
    supabase_secret_key: str | None = None
    supabase_service_role_key: str | None = None
    database_url: str | None = None

    # Connection pooling configuration (SQLAlchemy + asyncpg)
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800  # 30 minutes
    db_connect_timeout: int = 10

    model_config = SettingsConfigDict(
        env_file=(".env", str(_REPO_ROOT / ".env")),
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [x.strip() for x in self.api_cors_origins.split(",") if x.strip()]

    @property
    def effective_publishable_key(self) -> str | None:
        return self.supabase_publishable_key or self.supabase_anon_key

    @property
    def effective_secret_key(self) -> str | None:
        return self.supabase_secret_key or self.supabase_service_role_key

    @property
    def async_database_url(self) -> str | None:
        """Convert database_url to postgresql+asyncpg://, normalize password encoding,

        and automatically route IPv4-only networks to the Supabase pooler if needed.
        """
        if not self.database_url:
            return None
        url = self.database_url.strip()
        prefix = ""
        for s in ("postgresql+asyncpg://", "postgresql://", "postgres://"):
            if url.startswith(s):
                prefix = s
                break
        if not prefix:
            return url
        rest = url[len(prefix):]
        if "@" in rest:
            userinfo, hostinfo = rest.rsplit("@", 1)
            if ":" in userinfo:
                from urllib.parse import quote_plus, unquote_plus

                user, password = userinfo.split(":", 1)
                raw_password = unquote_plus(password)
                encoded_password = quote_plus(raw_password)
                userinfo = f"{user}:{encoded_password}"

                # Handle direct Supabase host on IPv4-only networks
                m = re.match(r"^db\.([a-z0-9]+)\.supabase\.co(?::(\d+))?(.*)$", hostinfo)
                if m:
                    import socket

                    ref = m.group(1)
                    port = m.group(2) or "5432"
                    suffix = m.group(3) or ""
                    try:
                        socket.getaddrinfo(f"db.{ref}.supabase.co", int(port))
                    except socket.gaierror:
                        # Direct IPv6 endpoint unreachable; route to Supabase pooler (IPv4)
                        pooler_host = "aws-0-ap-northeast-1.pooler.supabase.com"
                        if user == "postgres":
                            userinfo = f"postgres.{ref}:{encoded_password}"
                        hostinfo = f"{pooler_host}:{port}{suffix}"

            rest = f"{userinfo}@{hostinfo}"
        return "postgresql+asyncpg://" + rest



    @property
    def masked_database_url(self) -> str:
        """Return database URL with password masked to prevent credential leaks in logs."""
        if not self.database_url:
            return "None (not configured)"
        try:
            from sqlalchemy.engine.url import make_url

            parsed = make_url(self.async_database_url or self.database_url)
            return parsed.render_as_string(hide_password=True)
        except (SQLAlchemyError, ValueError):
            return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", self.database_url)



settings = Settings()

