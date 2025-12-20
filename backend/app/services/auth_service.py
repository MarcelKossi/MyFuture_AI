from __future__ import annotations

import uuid
import secrets
import re
from datetime import datetime, timedelta, timezone
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
from app.services.google_id_token import verify_google_id_token


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

    def login_with_google(self, *, id_token: str) -> User:
        claims = verify_google_id_token(id_token)

        # If present and explicitly false, do not accept.
        if claims.email_verified is False:
            raise ValueError("Google email is not verified")

        now = datetime.now(timezone.utc)
        user = self._db.scalar(select(User).where(User.email == claims.email))

        if user is None:
            username = self._derive_username_from_name(claims.name) or self._generate_default_username()
            user = User(
                id=str(uuid.uuid4()),
                username=username,
                email=claims.email,
                password_hash=None,
                auth_provider="google",
                is_verified=True,
                verified_at=now,
                email_verification_token_hash=None,
                email_verification_expires_at=None,
                password_reset_token_hash=None,
                password_reset_expires_at=None,
                password_reset_requested_at=None,
            )
            self._db.add(user)
            self._db.commit()
            self._db.refresh(user)
            return user

        # Link existing account to Google (Option A).
        if user.auth_provider != "google":
            user.auth_provider = "google"

        # Google users must not have a local password.
        if user.password_hash is not None:
            user.password_hash = None

        # Google OAuth is considered verified.
        if not user.is_verified:
            user.is_verified = True
            user.verified_at = now

        # Clear any email verification / reset tokens.
        user.email_verification_token_hash = None
        user.email_verification_expires_at = None
        user.password_reset_token_hash = None
        user.password_reset_expires_at = None
        user.password_reset_requested_at = None

        # Ensure username exists.
        if not user.username:
            user.username = self._derive_username_from_name(claims.name) or self._generate_default_username()

        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def _derive_username_from_name(self, name: str | None) -> str | None:
        if not name:
            return None

        # Convert to allowed charset: letters/numbers/underscore; collapse runs.
        cleaned = re.sub(r"[^A-Za-z0-9]+", "_", name.strip())
        cleaned = cleaned.strip("_")
        if not cleaned:
            return None

        candidate = cleaned[:30]
        if _USERNAME_RE.fullmatch(candidate) is None:
            return None

        existing = self._db.scalar(select(User).where(User.username == candidate))
        if existing is None:
            return candidate

        # If taken, append a short suffix while keeping constraints.
        suffix = secrets.token_hex(2)
        base = candidate[: max(0, 30 - (1 + len(suffix)))]
        candidate2 = f"{base}_{suffix}" if base else f"user_{suffix}"
        if _USERNAME_RE.fullmatch(candidate2) is None:
            return None

        existing2 = self._db.scalar(select(User).where(User.username == candidate2))
        return candidate2 if existing2 is None else None

    def issue_access_token(self, *, user: User) -> str:
        return create_access_token(
            subject=user.id,
            extra_claims={
                "user_id": user.id,
                "email": user.email,
                "provider": user.auth_provider,
            },
        )

    def get_auth_provider_for_email(self, *, email: str) -> str | None:
        user = self._db.scalar(select(User).where(User.email == email))
        return user.auth_provider if user is not None else None

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
