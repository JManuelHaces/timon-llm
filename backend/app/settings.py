"""Configuración por entorno. El motor se elige con TIMON_ENGINE."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TIMON_", env_file=".env")

    # "mock" (default, sin GPU) | "gemma" (rol A, requiere GPU)
    engine: str = "mock"
    # SQLite en dev; en prod: postgresql+asyncpg://user:pass@host/db
    database_url: str = "sqlite+aiosqlite:///./timon.db"
    cors_origins: list[str] = ["http://localhost:3000"]

    # ── Google OAuth ──
    google_client_id: str = ""
    google_client_secret: str = ""

    # ── JWT ──
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24h


settings = Settings()
