import urllib.parse
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

raw_db_url = settings.DATABASE_URL
engine_kwargs = {
    "echo": settings.DB_ECHO,
    "future": True,
}

if "sqlite" not in raw_db_url:
    # Clean unsupported query parameters for asyncpg (e.g. sslmode, channel_binding)
    parsed = urllib.parse.urlparse(raw_db_url)
    qs = urllib.parse.parse_qs(parsed.query)
    clean_qs = {k: v for k, v in qs.items() if k.lower() not in ["sslmode", "channel_binding"]}
    clean_query = urllib.parse.urlencode(clean_qs, doseq=True)
    db_url = urllib.parse.urlunparse(parsed._replace(query=clean_query))

    connect_args = {}
    if "sslmode=require" in raw_db_url or "ssl=require" in raw_db_url or "neon.tech" in raw_db_url:
        connect_args["ssl"] = "require"

    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "connect_args": connect_args,
    })
else:
    db_url = raw_db_url
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
