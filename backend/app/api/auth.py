from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi import Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    MeResponse,
    RegisterRequest,
    ResetPasswordRequest,
    NeutralMessageResponse,
    TokenResponse,
)
from app.services.auth_service import AuthService
from app.services.email_service import ConsoleEmailService, PasswordResetEmail, VerificationEmail

router = APIRouter(prefix=f"{settings.api_prefix}/auth", tags=["auth"])


def _build_frontend_verify_link(*, token: str) -> str:
    base = settings.frontend_base_url.strip().rstrip("/")
    if not (base.startswith("http://") or base.startswith("https://")):
        scheme = "http" if settings.environment == "development" else "https"
        base = f"{scheme}://{base}"

    return f"{base}/verify-email?token={token}"


def _build_frontend_reset_link(*, token: str) -> str:
    base = settings.frontend_base_url.strip().rstrip("/")
    if not (base.startswith("http://") or base.startswith("https://")):
        scheme = "http" if settings.environment == "development" else "https"
        base = f"{scheme}://{base}"

    return f"{base}/reset-password?token={token}"


@router.post("/register", response_model=NeutralMessageResponse)
def register(
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> NeutralMessageResponse:
    service = AuthService(db)
    try:
        user, verification_token = service.register(
            email=str(payload.email).lower(),
            password=payload.password,
            username=payload.username,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    verify_link = _build_frontend_verify_link(token=verification_token)
    email_service = ConsoleEmailService()
    background_tasks.add_task(
        email_service.send_verification_email,
        VerificationEmail(to_email=user.email, verify_link=verify_link),
    )

    return NeutralMessageResponse(message="You will receive a confirmation email to activate your account.")


@router.get("/verify-email")
def verify_email(
    token: str = Query(min_length=10),
    db: Session = Depends(get_db),
) -> dict:
    service = AuthService(db)
    try:
        service.verify_email(token=token)
    except ValueError:
        # Do not leak whether a user exists; keep response generic.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    return {"status": "ok"}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    service = AuthService(db)
    try:
        user = service.login(email=str(payload.email).lower(), password=payload.password)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = service.issue_access_token(user=user)
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_access_token_minutes * 60,
    )


@router.post("/forgot-password", response_model=NeutralMessageResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> NeutralMessageResponse:
    # Always return a neutral message to prevent account enumeration.
    neutral = "If an account exists, a reset link has been sent."

    service = AuthService(db)
    email = str(payload.email).lower()
    token = service.request_password_reset(email=email)
    if token:
        reset_link = _build_frontend_reset_link(token=token)
        email_service = ConsoleEmailService()
        background_tasks.add_task(
            email_service.send_password_reset_email,
            PasswordResetEmail(to_email=email, reset_link=reset_link),
        )

    return NeutralMessageResponse(message=neutral)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> dict:
    service = AuthService(db)
    try:
        service.reset_password(token=payload.token, new_password=payload.new_password)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    return {"status": "ok"}


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    service = AuthService(db)
    try:
        user = service.login_with_google(id_token=payload.id_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    token = service.issue_access_token(user=user)
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_access_token_minutes * 60,
    )
