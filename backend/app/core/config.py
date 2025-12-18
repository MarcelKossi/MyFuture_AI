from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="MYFUTURE_",
        env_file=(".env", ".env.local"),
        extra="ignore",
    )

    environment: str = "development"
    api_prefix: str = "/api"

    # Security
    jwt_secret_key: str = "CHANGE_ME"
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 30

    # Email verification
    # Used to build verification links like: https://<frontend-domain>/verify-email?token=...
    frontend_base_url: str = "https://localhost:5173"
    email_verification_token_hours: int = 24
    # Optional separate secret; defaults to jwt_secret_key when empty.
    email_verification_secret_key: str = ""

    # Password reset
    password_reset_token_minutes: int = 30
    password_reset_request_cooldown_seconds: int = 60
    # Optional separate secret; defaults to jwt_secret_key when empty.
    password_reset_secret_key: str = ""

    # Database
    database_url: str = "sqlite:///./myfuture.db"

    # Google OAuth token verification
    google_tokeninfo_url: str = "https://oauth2.googleapis.com/tokeninfo"


settings = Settings()
