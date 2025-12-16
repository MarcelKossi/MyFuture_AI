# MyFuture AI – Architecture & Project Structure Guide

## 1. Document purpose

This document provides a **complete, technical, and structured** understanding of the **MyFuture AI** project, for:

* a **human developer** (backend, frontend, AI)
* a **coding assistant** (GitHub Copilot, AI pair-programming)

It explains **the role of each folder**, **each layer’s responsibilities**, and the **architectural rationale** behind decisions.

It also serves as a **long-term reference** for maintenance, evolution, and potential academic framing (report / thesis).

---

## 2. Project overview

**MyFuture AI** is an academic and career decision-support system.

Core features:

* Secure user authentication
* Academic transcript/grade analysis
* Guided Q&A intake (motivation, preferences)
* Recommendation scoring (tracks/fields/jobs)
* Explainable output

> ⚠️ The project is **not chat-first**. Interactions are **guided and structured**.

A future extension may add an **LLM advisory chatbot** without changing the existing architecture.

---

## 2.1 Current status (Dec 2025)

This repository is intentionally organized into **blocks** (frontend, backend, AI, mobile), but **only the web frontend is implemented** at this stage.

- `my-future-vision/`: web app (Vite + React + TypeScript + Tailwind/shadcn) – **active**
- `backend/`: **reserved** for API + persistence – currently empty
- `ai-model/`: **reserved** for AI models/pipelines – currently empty
- `mobile-app/`: **reserved** for the mobile app – currently empty
- `docs/`: repo-level documentation (this guide + incremental stubs)

Goal: **keep the repo as-is**, and **add missing files incrementally** while keeping a clean logical separation.

---

## 3. Global architecture (macro view)

The project is organized into **independent but connected blocks**.

### 3.1 Current view (actual)

```
MyFuture_AI/
│
├── my-future-vision/   # Frontend Web
├── backend/            # Reserved (API + business logic)
├── ai-model/           # Reserved (AI: training/inference)
├── mobile-app/         # Reserved (mobile app)
└── docs/               # Documentation
```

### 3.2 Target view (planned)

As the project matures, we will progressively add:

- a backend API (auth, profile, grades, history)
- an AI service/pipeline (stub → model)
- an infra layer (docker/compose, CI/CD) if needed

This separation provides:

* strong **scalability**
* clear **maintainability**
* **product + research** compatibility

---

## 4. Frontend – `my-future-vision/`

### Role

The frontend is responsible for:

* the user interface
* data collection (forms / uploads)
* result rendering
* client-side guardrails (validation, sanitization, “frontend” rate limiting)

Ideally, it does **not** contain the business “source of truth” nor final AI logic.

However, **in the current state (frontend-only MVP)**, some rules (e.g., mock recommendations, PDF generation, validation/normalization) live in the frontend out of necessity. They should be migrated to the backend/AI service once those blocks exist.

### Structure (current)

```
my-future-vision/
├── src/
│   ├── components/     # Components (domain + shadcn UI)
│   │   ├── orientation/  # Guidance flow
│   │   └── ui/           # shadcn design system (Radix wrappers)
│   ├── config/         # Frontend configuration (e.g. consultation)
│   ├── hooks/          # Hooks (i18n, security, perf, PDF)
│   ├── lib/            # Utilities (validation, security, storage, rate-limit)
│   ├── pages/          # Pages / routes (Index, NotFound)
│   ├── translations/   # i18n JSON (fr/en/es/pt/ee)
│   └── types/          # Types TypeScript
├── public/
├── index.html
└── vite.config.ts
```

### Structure (planned evolution)

When a backend exists, we may add (if useful):

- `src/services/`: HTTP clients (fetch/axios) + API contracts
- `src/store/`: global state if needed (Zustand/Redux) – optional

### Why it matters

* Strict UI / logic separation
* Future-proof for a mobile app
* Copilot-friendly component generation

---

## 5. Backend – `backend/`

### Role

The backend will be **the core of the system** (once implemented).

It provides:

* security (authn/authz, rate limiting, validation)
* business logic
* data persistence
* AI orchestration

### Status

The `backend/` folder exists but is currently **empty**. The exact structure (Python FastAPI vs Node/Nest/Express, ORM, migrations, etc.) will be added incrementally.

### Recommended structure (generic)

The goal is to keep a clean separation:

- `api/`: routes/controllers (no complex logic)
- `domain/`: domain models, rules, use-cases
- `infra/`: DB, caches, external providers, technical implementations
- `security/`: auth, permissions, rate limits, audits

(The concrete structure will be finalized once the backend stack is chosen.)

---

## 6. AI – `ai-model/`

### Role

This folder fully isolates **Artificial Intelligence** from the rest of the system.

```
ai-model/
├── training/   # (optionnel au début)
├── inference/  # service / lib d’inférence
└── registry/   # versionnage des modèles
```

---

### 6.1 `training/` (optional at first)

Contains the offline training pipeline.

* datasets
* feature engineering
* entraînement
* évaluation

May be empty for the MVP.

---

### 6.2 `inference/`

AI service used in production.

* chargement du modèle
* prédiction
* explicabilité

The backend **consumes** this service; it does not implement it.

---

### 6.3 `registry/`

Versioned storage for trained models.

* v1 / v2 / v3
* métriques associées

Essential for traceability and research.

---

## 7. Infrastructure – `infra/` (planned)

### Role

Allows running the project **outside the developer machine**.

Status: this folder does **not exist yet** in the repo (it will be added when we move to Docker/CI/CD).

```
infra/
├── docker/
├── docker-compose.yml
├── nginx/
└── ci-cd/
```

* Docker : reproductibilité
* Nginx : point d’entrée
* CI/CD : automatisation

---

## 8. Documentation – `docs/`

### Role

Technical and conceptual memory of the project.

Documentation is split into two areas:

- `docs/`: repo-level documentation (this architecture guide, stubs, conventions)
- `my-future-vision/docs/`: frontend-specific documentation (spec, roadmap)

In the current state, `docs/` contains this guide, and other documents will be added incrementally.

Useful for:

* maintenance
* onboarding
* academic justification

---

## 9. Conclusion

This architecture:

* is **modular**
* is **scalable**
* is **secure**
* is **understandable by humans and AI**

> MyFuture AI is designed as a **professional-grade system**, even if the current implementation is frontend-centric.

This document should be read as the project’s **official map**.
