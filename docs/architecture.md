# Architecture

## Status (Dec 2025)

The repository is now a 2-tier app in practice:

- `frontend/`: web client (React + Vite)
- `backend/`: FastAPI API with SQLAlchemy + Alembic

`ai-model/` and `mobile-app/` remain placeholders.

## Current state

### Frontend

- Public routes: landing page and exploration.
- Auth routes: login/sign-up, forgot password, reset password.
- Protected routes (require auth): dashboard, history, results, settings, start orientation.

### Backend

- Auth: email/password registration + login, email verification, password reset.
- Public endpoints: placeholder lists for careers/fields/trends.
- Protected endpoints: minimal Orientation/Result CRUD scoped to the authenticated user and gated behind verified email.

## Target state (planned)

- Backend becomes the “source of truth” for business rules, persistence and AI orchestration.
- AI block provides model inference (library or separate service) consumed by the backend.
- Infra layer (optional): containerization and CI/CD.

## References

- Product/spec (frontend): `frontend/docs/cahier-des-charges.md`
- Roadmap (frontend): `frontend/docs/roadmap.md`
