# API Specs

## Status (Dec 2025)

The API is implemented (initial MVP) under the prefix `/api`.

Notes:

- Authentication uses Bearer JWT access tokens.
- Registration does not auto-login; users must verify email to access sensitive features.

## Base URL and prefix

- Prefix: `/api`
- Health: `GET /api/health`

## Auth

- `POST /api/auth/register`
	- Body: `{ "username"?: string, "email": string, "password": string }`
	- Response: `{ "message": string }`
	- Behavior: creates an unverified user and triggers a verification email.

- `GET /api/auth/verify-email?token=...`
	- Response: `{ "status": "ok" }`
	- Behavior: verifies email using an expiring, single-use token.

- `POST /api/auth/login`
	- Body: `{ "email": string, "password": string }`
	- Response: `{ "access_token": string, "token_type": "bearer", "expires_in": number }`

- `POST /api/auth/forgot-password`
	- Body: `{ "email": string }`
	- Response: `{ "message": string }` (neutral to avoid account enumeration)

- `POST /api/auth/reset-password`
	- Body: `{ "token": string, "new_password": string }`
	- Response: `{ "status": "ok" }`

- `POST /api/auth/google`
	- Body: `{ "id_token": string }`
	- Response: `{ "access_token": string, "token_type": "bearer", "expires_in": number }`

## Public

These endpoints are intentionally public and return placeholder data for now:

- `GET /api/public/careers`
- `GET /api/public/fields`
- `GET /api/public/trends`

## Protected (authenticated + verified)

These endpoints require a Bearer token and verified email.

- `POST /api/orientations`
	- Body: `{ "level": string, "input_method": string }`
	- Response: orientation object

- `GET /api/orientations/me`
	- Response: list of orientations

- `POST /api/results`
	- Body: `{ "orientation_id"?: string, "payload_json": string }`
	- Response: result object

- `GET /api/results/me`
	- Response: list of results

## Versioning (planned)

If/when the API contract stabilizes or external clients are introduced, move to a versioned prefix such as `/api/v1`.

## References

- `frontend/docs/cahier-des-charges.md`
