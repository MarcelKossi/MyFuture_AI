# Security

## Status (Dec 2025)

Backend security is now partially implemented (auth + token flows + basic abuse prevention). This document summarizes what exists today and what remains planned.

## Frontend (current)

- Auth token storage uses `useSecureLocalStorage` (see `frontend/src/auth/AuthProvider.tsx`).
- Route protection uses a guard (`RequireAuth`) for authenticated pages.
- Existing client-side validation/sanitization utilities remain (do not treat them as a source of truth).

## Backend (implemented)

### Authentication

- JWT access tokens are issued on login (`POST /api/auth/login`).
- Registration (`POST /api/auth/register`) creates a user but does **not** auto-login.
- Protected endpoints use a bearer token dependency (`get_current_user`).

### Email verification

- Verification uses a random, single-use token. Only a hash is stored server-side.
- Tokens are expiring and are invalidated after successful verification.
- Verified-only gate is enforced for sensitive features via `get_verified_user`.

### Password reset

- Password reset uses a random, single-use token; only a hash is stored.
- Reset request endpoint is neutral (prevents account enumeration).
- Basic cooldown is enforced to limit repeated reset requests.
- Reset invalidates the token and implicitly verifies email.

### Password policy

- The backend enforces a password complexity policy in both register and reset flows.

## Gaps / planned

- Server-side rate limiting beyond the password-reset cooldown (e.g., per-IP login throttling).
- Structured audit logging and retention policy.
- Email provider integration (current implementation logs emails to stdout).
- CSRF considerations if/when cookies are introduced (currently bearer token auth).

## References

- Product spec (frontend): `frontend/docs/cahier-des-charges.md`
