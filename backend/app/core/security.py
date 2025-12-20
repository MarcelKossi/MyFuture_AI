from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
import hashlib
import hmac
import secrets
import re

from jose import JWTError, jwt
import bcrypt

from app.core.config import settings

_BCRYPT_MAX_PASSWORD_BYTES = 72

_PASSWORD_SPECIAL_RE = re.compile(r"[^A-Za-z0-9]")


def validate_password_strength(password: str) -> None:
    # Backend must enforce rules (do not rely on frontend validation).
    # bcrypt only uses the first 72 bytes of the password (UTF-8).
    password_bytes = len(password.encode("utf-8"))
    if password_bytes > _BCRYPT_MAX_PASSWORD_BYTES:
        raise ValueError(
            "Password is too long for bcrypt (max 72 bytes, got "
            f"{password_bytes}). Remove emojis/hidden characters and try again."
        )
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if re.search(r"[A-Z]", password) is None:
        raise ValueError("Password must contain at least one uppercase letter")
    if re.search(r"[a-z]", password) is None:
        raise ValueError("Password must contain at least one lowercase letter")
    if re.search(r"[0-9]", password) is None:
        raise ValueError("Password must contain at least one number")
    if _PASSWORD_SPECIAL_RE.search(password) is None:
        raise ValueError("Password must contain at least one special character")


def hash_password(password: str) -> str:
    validate_password_strength(password)
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def create_access_token(*, subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    expires_delta = timedelta(minutes=settings.jwt_access_token_minutes)

    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc


def generate_email_verification_token() -> str:
    # URL-safe random token; never store this value.
    return secrets.token_urlsafe(32)


def hash_email_verification_token(token: str) -> str:
    # HMAC-SHA256 of the token using a server secret.
    secret = settings.email_verification_secret_key or settings.jwt_secret_key
    digest = hmac.new(secret.encode("utf-8"), token.encode("utf-8"), hashlib.sha256).hexdigest()
    return digest


def generate_password_reset_token() -> str:
    # URL-safe random token; never store this value.
    return secrets.token_urlsafe(32)


def hash_password_reset_token(token: str) -> str:
    secret = settings.password_reset_secret_key or settings.jwt_secret_key
    digest = hmac.new(secret.encode("utf-8"), token.encode("utf-8"), hashlib.sha256).hexdigest()
    return digest
