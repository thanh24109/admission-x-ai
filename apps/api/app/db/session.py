import asyncio
import logging
import re
from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

async_engine: AsyncEngine | None = None
AsyncSessionLocal: async_sessionmaker[AsyncSession] | None = None
_engine_loop: asyncio.AbstractEventLoop | None = None


def sanitize_message(msg: str) -> str:
    """Strip passwords or sensitive connection strings from error messages."""
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", msg)


def init_db() -> AsyncEngine | None:
    """Initialize SQLAlchemy async engine and session factory if DATABASE_URL is configured."""
    global async_engine, AsyncSessionLocal, _engine_loop

    db_url = settings.async_database_url
    if not db_url:
        logger.info(
            "DATABASE_URL is not set. Database connection skipped (operating in disconnected mode)."
        )
        return None

    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if async_engine is not None and _engine_loop is not None and _engine_loop is not current_loop:
        # Loop has changed (e.g., between pytest async tests)
        async_engine = None
        AsyncSessionLocal = None

    if async_engine is None:
        logger.info("Initializing database connection pool for %s", settings.masked_database_url)
        _engine_loop = current_loop
        async_engine = create_async_engine(
            db_url,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_timeout=settings.db_pool_timeout,
            pool_recycle=settings.db_pool_recycle,
            pool_pre_ping=True,
            connect_args={"timeout": settings.db_connect_timeout},
        )
        AsyncSessionLocal = async_sessionmaker(
            bind=async_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )

    return async_engine


async def close_db() -> None:
    """Gracefully close and dispose database engine connection pool."""
    global async_engine, AsyncSessionLocal, _engine_loop

    if async_engine is not None:
        logger.info("Closing database connection pool for %s", settings.masked_database_url)
        try:
            await async_engine.dispose()
        except Exception as exc:  # noqa: BLE001
            logger.debug("Error while disposing database engine: %s", exc)
        finally:
            async_engine = None
            AsyncSessionLocal = None
            _engine_loop = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency yielding an async database session."""
    if AsyncSessionLocal is None:
        raise RuntimeError("Database connection is not initialized or configured.")
    async with AsyncSessionLocal() as session:
        yield session


async def check_db_connection() -> dict[str, Any]:
    """Execute minimal read-only queries to test Supabase PostgreSQL connectivity."""
    if not settings.async_database_url:
        return {
            "status": "unconfigured",
            "connected": False,
            "message": "DATABASE_URL is not configured in environment.",
            "database_url": settings.masked_database_url,
        }

    engine = init_db()
    if engine is None:
        return {
            "status": "unconfigured",
            "connected": False,
            "message": "Could not initialize database engine.",
            "database_url": settings.masked_database_url,
        }

    try:
        async with engine.connect() as conn:
            # Test 2: SELECT 1
            res_one = await conn.execute(text("SELECT 1;"))
            select_1_val = res_one.scalar()

            # Test 3: Database Information
            res_db = await conn.execute(text("SELECT current_database();"))
            current_db = res_db.scalar()

            res_ver = await conn.execute(text("SELECT version();"))
            pg_version = res_ver.scalar()

            return {
                "status": "connected",
                "connected": True,
                "select_1": select_1_val,
                "database": current_db,
                "version": pg_version,
                "database_url": settings.masked_database_url,
            }
    except Exception as exc:  # noqa: BLE001
        safe_err = sanitize_message(str(exc))
        logger.error("Database connection check failed: %s", safe_err)
        return {
            "status": "error",
            "connected": False,
            "error": safe_err,
            "database_url": settings.masked_database_url,
        }
