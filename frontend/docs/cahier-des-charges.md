# Requirements / Specification – MyFuture AI

## 1. Goals

- Provide AI-assisted academic guidance with history and explanations.
- Secure user data (auth, storage, uploads).
- Prepare a shared API (web + future mobile) and a swappable AI service.

## 2. Target architecture

- **Web frontend (Vite/React/TS)**: API client, i18n, guidance/sharing UI.
- **Backend API (Node/NestJS or Express)**: JWT+refresh auth, profile/grades/guidance endpoints, file handling, Postgres persistence.
- **AI service**: separate HTTP microservice (stub → trained model) called by the backend.
- **Database**: PostgreSQL (users, profiles, subjects, grades, orientation_requests, recommendations, files, audit_logs, sessions).
- **File storage**: S3-compatible for transcripts and exports, signed URLs.

## 3. User journey (target)

1) Signup/Login → JWT/refresh tokens.
2) Create/update profile (level, aspirations).
3) Enter or upload grades → backend stores → calls AI → persists recommendations.
4) View results + history (replayable, traceable).
5) Download/share PDF (short-lived signed URL or frontend generation, depending on the decision).

## 4. Backend – initial scope to validate

- Proposed stack: Node 20+, NestJS, Prisma (or TypeORM), PostgreSQL, pino logging, zod/class-validator for DTOs.
- Auth: signup/login, refresh, logout (refresh invalidation), auth rate limiting.
- Endpoints (v1):
  - `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
  - `GET/PUT /me/profile` (level, aspirations, metadata).
  - `POST /grades` (subjects+grades), `GET /grades` (latest / paginated).
  - `POST /orientation/compute` → calls AI Service → stores orientation_request + recommendations.
  - `GET /orientation/:id`, `GET /orientation` (paginated list/history).
  - `POST /files/presign` (type: pdf/jpg/png, max size) for client uploads → S3.
- Security: JWT + refresh, restricted CORS, rate limiting, strict validation, audit log (user, action, ts, ip), structured logs.

## 5. AI service – contract and phases

- HTTP contract: `POST /score` { level, grades:[{subject, grade, weight?}], aspiration?, locale? } → { generalAverage, recommendations:[{name,type,score,explanations[]}], improvementAdvice[], modelVersion }.
- Phase 1: deterministic stub for integration and tests.
- Phase 2: connect a trained model (configurable endpoint, timeouts, retries, circuit breaker).

## 6. Database (target schema)

- users(id, email, password_hash, created_at, updated_at)
- user_profiles(id, user_id FK, level, aspiration, locale, meta)
- subjects(id, code, label)
- grades(id, user_id, subject_id, value, scale, session_id, created_at)
- orientation_requests(id, user_id, profile_snapshot, input_method, created_at)
- recommendations(id, request_id FK, field_name, field_type, score, rationale, min_grade)
- files(id, user_id, kind, storage_key, mime, size, created_at)
- audit_logs(id, user_id, action, details, ip, created_at)
- refresh_tokens(id, user_id, token_hash, expires_at, revoked_at)

## 7. Frontend – planned evolutions

- Add authentication (forms + token storage + refresh).
- Replace mock logic with API calls: submit grades, trigger compute, display history.
- Upload: use pre-signed URL, localized messages, size/type limits.
- PDF/sharing: decide backend vs frontend; if backend, use a dedicated endpoint + signed URL.
- i18n: complete es/pt/ee for new strings.

## 8. Security & compliance

- Input/output validation, IP/route rate limits, restricted CORS, secure headers.
- Password hashing (argon2/bcrypt), refresh token rotation.
- Audit logs, no sensitive data in logs.
- Retention policies for files and logs.

## 9. Quality & CI

- Backend tests: unit services, e2e (auth, compute stub), AI stub contract tests.
- Frontend: unit tests for logic (grade normalization), optional lightweight e2e (Cypress/Playwright) later.
- CI: lint + tests + build (web + backend).

## 10. Deployment (beta)

- Environments: dev (local), staging (docker compose), prod (TBD: VM/container).
- Secrets via env/secret manager.
- S3-compatible storage (minio in dev).

## 11. Decisions to validate before coding

- Backend framework (NestJS vs Express) and ORM (Prisma vs TypeORM).
- API format (REST only or REST + GraphQL?).
- PDF generation: frontend vs backend.
- Supported levels/grading scales (canonical list) and per-subject weighting.
- Refresh token strategy (strict rotation vs sliding).

## 12. Proposed steps (order)

1) Validate backend stack, API format, DB schema, auth strategy.
2) Scaffold backend (auth, profiles, grades, compute stub) + DB migrations.
3) Adapt frontend: auth, API calls, history display, new i18n keys.
4) Add pre-signed uploads + storage.
5) Plug the real AI service (configurable) and handle timeouts/fallbacks.
6) Add tests/CI and harden security (rate limiting, audit, headers).

*(Each step or major change should be validated before execution.)*
