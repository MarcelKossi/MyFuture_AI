# API Specs (stub)

## Status

This document is a **stub**: the API is not implemented yet (`backend/` is currently empty).

## Goal

Define the contract between:

- `my-future-vision/` (clients)
- `backend/` (API)
- `ai-model/` (scoring/recommendations)

## Versioning

- Use a version prefix (e.g. `/v1`).

## Candidate endpoints (to validate)

- Auth: signup/login/refresh/logout
- Profile: GET/PUT
- Grades: POST/GET
- Orientation: POST compute + GET history
- Upload: presign + file management (if storage is externalized)

## References

- `my-future-vision/docs/cahier-des-charges.md`
