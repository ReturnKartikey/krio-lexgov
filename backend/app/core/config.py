from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "OpenGov Intelligence Explorer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:change_me_in_env@localhost:5432/opengov_db"
    SYNC_DATABASE_URL: str = "postgresql+psycopg://postgres:change_me_in_env@localhost:5432/opengov_db"
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Redis / Queue
    REDIS_URL: str = "redis://localhost:6379/0"

    # Scraping & Crawler Settings
    CRAWLER_USER_AGENT: str = "OpenGov-Bot/1.0 (+https://github.com/opengov/explorer; public registry compliance bot)"
    CRAWLER_DELAY_SECONDS: float = 1.0
    CRAWLER_MAX_RETRIES: int = 5
    CRAWLER_BACKOFF_FACTOR: float = 1.5
    CRAWLER_REQUEST_TIMEOUT: float = 30.0
    ENABLE_ROBOTS_TXT_CHECK: bool = True
    AUTO_SEED_FALLBACK: bool = True

    # Scheduler Settings
    SCHEDULE_INTERVAL_HOURS: int = 6
    ENABLE_SCHEDULER_ON_STARTUP: bool = True

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
