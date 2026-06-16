"""Configuración por entorno. El motor se elige con TIMON_ENGINE."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TIMON_", env_file=".env")

    # "mock" (default, sin GPU) | "gemma" (rol A, requiere GPU)
    engine: str = "mock"
    # SQLite en dev; en prod: postgresql+asyncpg://user:pass@host/db
    database_url: str = "sqlite+aiosqlite:///./timon.db"
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
