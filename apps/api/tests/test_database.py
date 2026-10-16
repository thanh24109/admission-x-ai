import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, settings
from app.db.session import check_db_connection, sanitize_message
from app.main import app

client = TestClient(app)


def test_environment_configuration_masking() -> None:
    """Test 1: Verify environment variables and credential masking."""
    dummy_settings = Settings(
        database_url="postgresql://myuser:super_secret_password@db.supabase.co:5432/postgres"
    )
    assert dummy_settings.async_database_url.startswith("postgresql+asyncpg://")
    assert "super_secret_password" not in dummy_settings.masked_database_url
    assert "***" in dummy_settings.masked_database_url


def test_sanitize_message_strips_passwords() -> None:
    """Test 1: Verify sanitize_message strips passwords from raw errors."""
    raw_error = "connection failed to postgresql+asyncpg://postgres:my_secret_pwd@localhost:5432/postgres"
    cleaned = sanitize_message(raw_error)
    assert "my_secret_pwd" not in cleaned
    assert "postgres:***@" in cleaned


def test_health_endpoints() -> None:
    """Test 5: Verify existing /health and new /health/db endpoints."""
    # Existing /health must remain functional and return 200
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json() == {"status": "ok"}

    # /health/db returns 200 if connected, or 503 if unconfigured / error
    res_db = client.get("/health/db")
    assert res_db.status_code in (200, 503)
    data = res_db.json()
    assert "connected" in data
    assert "database_url" in data
    # Ensure credentials are not exposed
    assert "@" not in data["database_url"] or ":***@" in data["database_url"]


@pytest.mark.anyio
async def test_failure_handling_and_no_credential_leak() -> None:
    """Test 4: Verify invalid credentials produce a controlled error without leaking secrets."""
    from sqlalchemy.ext.asyncio import create_async_engine

    secret = "SuperSecretPassword987!"
    bad_url = f"postgresql+asyncpg://fake_user:{secret}@127.0.0.1:59999/dummy_db"

    # Engine with 1s timeout to invalid port
    engine = create_async_engine(bad_url, connect_args={"timeout": 1})
    try:
        from sqlalchemy import text

        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1;"))
    except Exception as exc:  # noqa: BLE001
        err_msg = sanitize_message(str(exc))

        # Ensure the secret password was not exposed in the sanitized error message
        assert secret not in err_msg
    finally:
        await engine.dispose()


@pytest.mark.anyio
@pytest.mark.skipif(
    not settings.async_database_url,
    reason="DATABASE_URL not configured. Skipping live PostgreSQL test.",
)
async def test_real_postgresql_connectivity() -> None:
    """Test 2 & 3: Real PostgreSQL connection test with SELECT 1 and version."""
    result = await check_db_connection()
    assert result["connected"] is True
    assert result["select_1"] == 1
    assert result["database"] is not None
    assert result["version"] is not None
