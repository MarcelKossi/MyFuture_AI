from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class VerificationEmail:
    to_email: str
    verify_link: str


@dataclass(frozen=True)
class PasswordResetEmail:
    to_email: str
    reset_link: str


class EmailService:
    """Email sending abstraction.

    MVP implementation logs to stdout; production can swap to a real provider.
    """

    def send_verification_email(self, email: VerificationEmail) -> None:  # pragma: no cover
        raise NotImplementedError

    def send_password_reset_email(self, email: PasswordResetEmail) -> None:  # pragma: no cover
        raise NotImplementedError


class ConsoleEmailService(EmailService):
    def send_verification_email(self, email: VerificationEmail) -> None:
        # Minimal, provider-free implementation suitable for local development.
        print("\n--- MyFuture AI: Verification Email ---")
        print(f"To: {email.to_email}")
        print("Subject: Verify your email")
        print(f"Link: {email.verify_link}")
        print("--- end ---\n")

    def send_password_reset_email(self, email: PasswordResetEmail) -> None:
        print("\n--- MyFuture AI: Password Reset Email ---")
        print(f"To: {email.to_email}")
        print("Subject: Reset your password")
        print(f"Link: {email.reset_link}")
        print("--- end ---\n")
