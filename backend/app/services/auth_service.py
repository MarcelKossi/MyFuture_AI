from __future__ import annotations

import uuid
import secrets
import re
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_email_verification_token,
    generate_password_reset_token,
    hash_email_verification_token,
    hash_password_reset_token,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.models.user import User


_USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,30}$")


class AuthService:
    def __init__(self, db: Session):
        self._db = db

    def register(self, *, email: str, password: str, username: str | None = None) -> tuple[User, str]:
        existing = self._db.scalar(select(User).where(User.email == email))
        if existing is not None:
            raise ValueError("Email already registered")

        validate_password_strength(password)

        normalized_username = (username or "").strip() or None
        if normalized_username is not None:
            if _USERNAME_RE.fullmatch(normalized_username) is None:
                raise ValueError("Username must be 3–30 characters (letters, numbers, underscore only)")
            existing_username = self._db.scalar(select(User).where(User.username == normalized_username))
            if existing_username is not None:
                raise ValueError("Username already taken")
        else:
            normalized_username = self._generate_default_username()

        raw_token = generate_email_verification_token()
        token_hash = hash_email_verification_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.email_verification_token_hours)

        user = User(
            id=str(uuid.uuid4()),
            username=normalized_username,
            email=email,
            password_hash=hash_password(password),
            auth_provider="password",
            is_verified=False,
            verified_at=None,
            email_verification_token_hash=token_hash,
            email_verification_expires_at=expires_at,
        )
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user, raw_token


    def _generate_default_username(self) -> str:
        # Generate a default display username when the user doesn't provide one.
        # Must be unique.
        for _ in range(20):
            candidate = f"user_{secrets.token_hex(3)}"  # 6 hex chars
            existing = self._db.scalar(select(User).where(User.username == candidate))
            if existing is None:
                return candidate
        raise ValueError("Unable to generate username. Please try again.")

    def login(self, *, email: str, password: str) -> User:
        user = self._db.scalar(select(User).where(User.email == email))
        if user is None or not user.password_hash:
            raise ValueError("Invalid credentials")
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")
        return user

    async def login_with_google(self, *, id_token: str) -> User:
        # Verify token with Google
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(settings.google_tokeninfo_url, params={"id_token": id_token})
        if resp.status_code != 200:
            raise ValueError("Invalid Google token")

        data = resp.json()
        email = data.get("email")
        if not email:
            raise ValueError("Google token missing email")

        user = self._db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                password_hash=None,
                auth_provider="google",
                is_verified=True,
                verified_at=datetime.now(timezone.utc),
                email_verification_token_hash=None,
                email_verification_expires_at=None,
            )
            self._db.add(user)
            self._db.commit()
            self._db.refresh(user)

        return user

    def issue_access_token(self, *, user: User) -> str:
        return create_access_token(subject=user.id, extra_claims={"email": user.email})

    def verify_email(self, *, token: str) -> None:
        token_hash = hash_email_verification_token(token)
        user = self._db.scalar(select(User).where(User.email_verification_token_hash == token_hash))
        if user is None:
            raise ValueError("Invalid or expired token")

        if user.is_verified:
            # Token should be single-use; treat as invalid once verified.
            raise ValueError("Invalid or expired token")

        expires_at = user.email_verification_expires_at
        if expires_at is None:
            raise ValueError("Invalid or expired token")

        # SQLite may return naive datetimes even when timezone=True; interpret as UTC.
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        if expires_at < now:
            raise ValueError("Invalid or expired token")

        user.is_verified = True
        user.verified_at = now
        user.email_verification_token_hash = None
        user.email_verification_expires_at = None
        self._db.add(user)
        self._db.commit()


    def request_password_reset(self, *, email: str) -> str | None:
        """Creates a password reset token for password accounts.

        Returns the raw token (to be emailed) or None.
        Caller must always return a neutral response to avoid account enumeration.
        """

        user = self._db.scalar(select(User).where(User.email == email))
        if user is None:
            return None

        # OAuth accounts cannot reset via password.
        if user.auth_provider != "password" or not user.password_hash:
            return None

        now = datetime.now(timezone.utc)
        if user.password_reset_requested_at is not None:
            requested_at = user.password_reset_requested_at
            if requested_at.tzinfo is None:
                requested_at = requested_at.replace(tzinfo=timezone.utc)

            cooldown = timedelta(seconds=settings.password_reset_request_cooldown_seconds)
            if now - requested_at < cooldown:
                return None

        raw_token = generate_password_reset_token()
        user.password_reset_token_hash = hash_password_reset_token(raw_token)
        user.password_reset_expires_at = now + timedelta(minutes=settings.password_reset_token_minutes)
        user.password_reset_requested_at = now

        self._db.add(user)
        self._db.commit()
        return raw_token


    def reset_password(self, *, token: str, new_password: str) -> None:
        validate_password_strength(new_password)
        token_hash = hash_password_reset_token(token)
        user = self._db.scalar(select(User).where(User.password_reset_token_hash == token_hash))
        if user is None:
            raise ValueError("Invalid or expired token")

        expires_at = user.password_reset_expires_at
        if expires_at is None:
            raise ValueError("Invalid or expired token")

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        if expires_at < now:
            raise ValueError("Invalid or expired token")

        # Token should only exist for password accounts.
        if user.auth_provider != "password":
            raise ValueError("Invalid or expired token")

        user.password_hash = hash_password(new_password)

        # Invalidate token immediately (single-use).
        user.password_reset_token_hash = None
        user.password_reset_expires_at = None
        user.password_reset_requested_at = None

        # Reset implicitly verifies email.
        if not user.is_verified:
            user.is_verified = True
            user.verified_at = now
            user.email_verification_token_hash = None
            user.email_verification_expires_at = None

        self._db.add(user)
        self._db.commit()
