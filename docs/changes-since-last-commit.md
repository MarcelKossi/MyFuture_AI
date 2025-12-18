# Changes since last commit (working tree)

Date: 2025-12-18

This document summarizes **everything currently uncommitted** in the working tree (both modified tracked files and new untracked files).

## High-level summary

- Added a runnable **FastAPI backend** with auth (email/password + Google token verification), email verification, password reset, and minimal user-scoped Orientation/Result persistence.
- Added a production-ready **registration UX** on the frontend (username optional, strict password policy, confirm password, show/hide toggles) without auto-login; email verification remains required.
- Introduced a basic **authenticated app layout** and protected routes; public routes stay accessible.
- Added / updated i18n keys across all shipped locales.

## Backend changes (new files)

### Core application

- `backend/app/main.py`
  - FastAPI app factory + route registration.
  - `GET /api/health`.

- `backend/app/core/config.py`
  - Central settings with `MYFUTURE_` env prefix.
  - Added settings for JWT, database URL, frontend base URL, email verification TTL, password reset TTL/cooldown, Google tokeninfo URL.

- `backend/app/core/security.py`
  - Password hashing (`passlib[bcrypt]`), JWT create/decode.
  - Token generation + HMAC hashing for email verification and password reset tokens.
  - Server-side password policy enforcement via `validate_password_strength()`.

### Auth and email flows

- `backend/app/api/auth.py`
  - `POST /api/auth/register`: creates unverified user and sends verification email; returns neutral message (no access token).
  - `GET /api/auth/verify-email`: verifies email with expiring, single-use token.
  - `POST /api/auth/login`: issues JWT access token.
  - `POST /api/auth/forgot-password`: always neutral response; sends reset email if applicable.
  - `POST /api/auth/reset-password`: resets password; invalidates token; implicitly verifies email.
  - `POST /api/auth/google`: verifies Google id_token against tokeninfo endpoint and issues JWT.

- `backend/app/services/auth_service.py`
  - Implements the above auth business logic.
  - Username: optional; validated; uniqueness enforced; default generated when omitted.
  - Password policy is enforced in both register and reset flows.

- `backend/app/services/email_service.py`
  - Adds an email sending abstraction.
  - MVP implementation logs emails to console.

### Persistence + protection

- `backend/app/models/user.py`
  - Added `username` (nullable, unique) + auth-related fields for verification/reset.

- `backend/app/models/orientation.py`, `backend/app/models/result.py`
  - Minimal user-scoped models.

- `backend/app/schemas/*`
  - Auth schemas updated (register includes optional username; reset accepts token + new_password).
  - Added Orientation/Result schemas.

- `backend/app/dependencies/auth.py`
  - `get_current_user` (JWT bearer).
  - `get_verified_user` gate (requires verified email).

- `backend/app/api/protected/orientations.py`, `backend/app/api/protected/results.py`
  - Authenticated + verified endpoints:
    - `POST /api/orientations`, `GET /api/orientations/me`
    - `POST /api/results`, `GET /api/results/me`

- `backend/app/api/public.py`
  - Non-auth endpoints returning placeholder data:
    - `GET /api/public/careers`
    - `GET /api/public/fields`
    - `GET /api/public/trends`

### Migrations

- `backend/alembic/` + `backend/alembic.ini`
  - Alembic scaffold wired to `settings.database_url`.

- `backend/alembic/versions/20251218_0001_add_username_to_users.py`
  - Adds `users.username` column + unique index `ix_users_username`.

### Packaging

- `backend/pyproject.toml`
  - Declares dependencies: FastAPI, SQLAlchemy, Alembic, passlib[bcrypt], python-jose, httpx.

## Frontend changes

### Auth + routing (new files)

- `frontend/src/auth/*`
  - `AuthProvider` storing token in secure local storage.
  - `RequireAuth` route guard.

- `frontend/src/layouts/AppLayout.tsx`
  - Authenticated layout using the existing sidebar primitives.

- `frontend/src/pages/protected/*`
  - Placeholder protected pages: Dashboard, History, Results, Settings, StartOrientation.

### Public navigation and flows (new/modified)

- `frontend/src/components/PublicHeader.tsx`
  - Public header with app title, language selector, and login button.

- `frontend/src/pages/Login.tsx`
  - Email/password Sign in + Sign up in tabs.
  - Sign up: optional username, strict password rules, confirm password with immediate mismatch error, show/hide toggles.
  - Registration does not auto-login; shows confirmation message and returns to Sign in.
  - Inline backend error display on sign-up failures.

- `frontend/src/pages/ForgotPassword.tsx` and `frontend/src/pages/ResetPassword.tsx`
  - Forgot/reset password flows aligned with backend endpoints.

- `frontend/src/pages/Explore.tsx`
  - Advice page wrapper that redirects to login when starting orientation while unauthenticated.

- Modified tracked files:
  - `frontend/src/App.tsx`: added routes for login/explore/forgot/reset and protected routes under `RequireAuth + AppLayout`.
  - `frontend/src/pages/Index.tsx`: replaced local view-switching with navigation ("Start" routes to protected flow; "Advice" routes to Explore).
  - `frontend/src/components/AdviceSection.tsx`: now accepts `onStartOrientation` and uses `PublicHeader`.

### i18n updates (modified tracked files)

Updated locale files to include new auth strings (signup rules, verify note, forgot/reset pages, etc.):

- `frontend/src/translations/en.json`
- `frontend/src/translations/fr.json`
- `frontend/src/translations/es.json`
- `frontend/src/translations/pt.json`
- `frontend/src/translations/ee.json`

## Current uncommitted git status snapshot

### Modified (tracked)

- backend/README.md
- frontend/src/App.tsx
- frontend/src/components/AdviceSection.tsx
- frontend/src/pages/Index.tsx
- frontend/src/translations/en.json
- frontend/src/translations/fr.json
- frontend/src/translations/es.json
- frontend/src/translations/pt.json
- frontend/src/translations/ee.json

### Untracked (new files)

- backend/alembic.ini
- backend/alembic/
- backend/app/
- backend/pyproject.toml
- frontend/src/auth/
- frontend/src/components/PublicHeader.tsx
- frontend/src/layouts/
- frontend/src/pages/Explore.tsx
- frontend/src/pages/ForgotPassword.tsx
- frontend/src/pages/Login.tsx
- frontend/src/pages/ResetPassword.tsx
- frontend/src/pages/protected/

## Notes / follow-ups

- Before committing, ensure you do not accidentally include Python bytecode caches (e.g., `__pycache__/`, `*.pyc`) from inside `backend/app/`.
- The Alembic migration sets `down_revision = None` (first migration). If you later add a baseline migration or already have an existing Alembic history, link it accordingly.
