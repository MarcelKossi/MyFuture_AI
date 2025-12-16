# Backend (reserved)

This folder is **reserved** for the MyFuture AI backend.

## Status

- Current: **empty** (no chosen stack / no code yet).
- Goal: progressively host the API, business logic, persistence, and AI orchestration.

## Boundaries

- The frontend (`my-future-vision/`) should not contain the business “source of truth” once the backend exists.
- AI (in `ai-model/`) should be consumed through a clear contract (internal library or separate service).

## Recommended structure (to be created incrementally)

- `api/`: routes/controllers (thin)
- `domain/`: business rules and use-cases
- `infra/`: DB, external providers, technical implementations
- `security/`: auth, permissions, rate limiting, audit
- `tests/`: unit / contract tests

## Related docs

- Target scope: `my-future-vision/docs/cahier-des-charges.md`
- Stabilization roadmap: `my-future-vision/docs/roadmap.md`
