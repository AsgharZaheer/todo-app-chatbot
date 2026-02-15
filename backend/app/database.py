"""Async database engine and session factory (Neon PostgreSQL or SQLite)."""

import ssl as _ssl
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings

_connect_args: dict = {}
_url = settings.database_url

if _url.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}
elif "asyncpg" in _url:
    # asyncpg doesn't support sslmode query param — strip it and use ssl connect_arg
    if "sslmode=" in _url:
        # Remove sslmode param from URL
        import re
        _url = re.sub(r'[?&]sslmode=[^&]*', '', _url)
        # Clean up leftover ? or & at end
        _url = _url.rstrip('?').rstrip('&')
        # Add ssl context for Neon
        ssl_ctx = _ssl.create_default_context()
        _connect_args = {"ssl": ssl_ctx}

engine = create_async_engine(_url, echo=False, connect_args=_connect_args)


async def create_db_and_tables() -> None:
    """Create all SQLModel tables."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with AsyncSession(engine) as session:
        yield session
