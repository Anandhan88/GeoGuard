"""
GeoGuard AI - Database Configuration
Supports SQLite and PostgreSQL/PostGIS dynamically.
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Async SQLite requires check_same_thread=False
connect_args = {}
engine_kwargs = {}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # PostgreSQL: connection pooling
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_pre_ping"] = True

# Create asynchronous engine
engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DEBUG,
    **engine_kwargs,
)

# Async session factory
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Declarative base class for SQLAlchemy models
Base = declarative_base()


async def init_db():
    """Initializes the database schemas (creates all tables)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Dependency for obtaining a database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
