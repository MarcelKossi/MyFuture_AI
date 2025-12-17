<<<<<<< HEAD
# my-future-ai-vision

my-future-ai-vision is a project aimed at building a **structured, explainable academic & career guidance system**.

This repository is intentionally organized as a **modular monorepo** (web frontend, backend API, AI, mobile), but **only the web frontend is implemented so far**.

## Repository structure

```
my-future-ai-vision/
├── frontend/           # Web frontend (formerly `my-future-vision/`)
├── backend/            # Reserved for the backend API (currently empty)
├── ai-model/           # Reserved for AI training/inference/versioning (currently empty)
├── mobile-app/         # Reserved for the mobile app (currently empty)
├── infra/              # Reserved for infra (Docker/CI/CD) (may be empty)
└── docs/               # Repo-level documentation
```

## Current status

- Web frontend: implemented in `frontend/`.
- Backend/AI/Mobile: folders exist and are documented, but will be added **incrementally**.

## Run the web app

Prerequisites:
- Node.js 18+ (recommended)
- npm (or bun/pnpm)

From `frontend/`:

```sh
npm install
npm run dev
```

By default the dev server runs at:
- http://localhost:8080

## Documentation

Repo-level docs:
- `docs/project-architecture.md` (main architecture guide)
- `docs/api-specs.md`, `docs/security.md`, `docs/ai-design.md` (stubs, filled progressively)

Frontend-specific docs:
- `frontend/docs/cahier-des-charges.md` (requirements/spec)
- `frontend/docs/roadmap.md` (improvement roadmap)

## Conventions

- Documentation language: **English** (public GitHub).
- The frontend may temporarily contain “MVP-only” logic (mock recommendations, PDF generation) until the backend/AI blocks are implemented.

## License

TBD.
=======
# MyFuture_AI
>>>>>>> 675a38ec1e7f6aa29c2f80fa927040c8898ab4f7
