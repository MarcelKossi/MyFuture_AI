from __future__ import annotations

from dataclasses import dataclass

from app.core.config import settings


@dataclass(frozen=True)
class GoogleTokenClaims:
    email: str
    sub: str
    name: str | None
    email_verified: bool | None


def verify_google_id_token(id_token: str) -> GoogleTokenClaims:
    """Verify a Google ID token and return validated claims.

    This verifies (at minimum): signature, issuer, expiry, and audience.

    Raises:
        ValueError: if token is invalid or Google login is not configured.
    """

    client_id = (settings.google_client_id or "").strip()
    if not client_id:
        raise ValueError("Google login is not configured")

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token
    except Exception as exc:  # pragma: no cover
        raise ValueError("Google token verification is not available") from exc

    try:
        request = google_requests.Request()
        info = google_id_token.verify_oauth2_token(id_token, request, audience=client_id)
    except Exception as exc:
        raise ValueError("Invalid Google token") from exc

    email = info.get("email")
    sub = info.get("sub")
    if not email or not sub:
        raise ValueError("Invalid Google token")

    name = info.get("name")

    raw_email_verified = info.get("email_verified")
    email_verified: bool | None
    if raw_email_verified is None:
        email_verified = None
    elif isinstance(raw_email_verified, bool):
        email_verified = raw_email_verified
    elif isinstance(raw_email_verified, str):
        email_verified = raw_email_verified.lower() == "true"
    else:
        email_verified = None

    return GoogleTokenClaims(
        email=str(email).lower(),
        sub=str(sub),
        name=str(name) if isinstance(name, str) and name.strip() else None,
        email_verified=email_verified,
    )
