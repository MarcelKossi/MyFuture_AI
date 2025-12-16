# MyFuture AI – Improvement Roadmap

## 0. Goals

- Make recommendations credible (user inputs → transparent guidance engine).
- Fix i18n/UX to avoid raw keys and inconsistencies.
- Frame security and uploads (limits, validation, clear messaging).
- Improve quality tooling (tests, lint, CI) and document decisions.

## 1. Immediate hygiene (highest priority)

1. i18n
   - Align keys: harmonize `file_upload.*` vs `fileUpload.*`, `shareResults.*`, `errors.*`, `consultation.*`, `toast.*`.
   - Complete all supported languages (fr, en, es, pt, ee) or reduce the list if not translated.
2. UI/UX
   - Adjust copy to state recommendations are simulated (until the real engine exists).
   - External links: add “opens in a new window” and ensure `target` uses `rel="noopener"`.
3. Frontend security
   - Document limitations (no backend ⇒ limited protection).
   - Disable/relax the MutationObserver if it causes false positives; keep a minimal CSP meta.

## 2. Guidance engine (realistic MVP)

1. Data model
   - Normalize subjects by level (reference + aliases) and normalize grading scales (4/10/20/100 → 0–100 score).
   - Add per-subject weights and admission thresholds by track.
2. Algorithm
   - Compute a weighted average + track “fit” (e.g., weighted sum of key subjects / 100, penalty if a key subject is missing).
   - Expose an explainable score (show how each subject contributes).
3. UI integration
   - Replace hard-coded recommendations in `ResultsPage` with the engine.
   - Show details: normalized grades, weights, ranking reasons.
4. Persistence
   - Store profile and results in lightweight encrypted localStorage (or global state) to prevent loss on refresh.

## 3. Transcript upload (protect before promising)

1. UX/Validation
   - Limit types/sizes (shared config with `securityConfig`), localized error messages.
   - Until OCR exists, state analysis is simulated and offer manual input.
2. Technical (optional for MVP)
   - Wire a simple CSV/JSON parser if available, or use a clear stub.
   - Prepare an interface for a future OCR service (API contract, `useTranscriptBulletin` hook).

## 4. Sharing & PDF

1. i18n and errors
   - Add missing keys (`shareResults.*`, `errors.rateLimit`, `errors.invalidUrl`, etc.).
2. PDF
   - Replace static content with real engine data (profile, scores, tracks).
   - Option: capture a section via `captureElementToPDF` or generate 100% data-driven.
3. Social sharing
   - Centralize URL building (WhatsApp, Instagram, Snapchat) with validation.
   - Display rate-limit status (cooldown in seconds).

## 5. Consultation / Config

- Move `consultationConfig` to an env-dependent JSON file (dev/prod) or load via fetch.
- Hide contact details when `enabled=false`; neutral UI fallback.
- Add a default i18n “message” field.

## 6. Types, consistency, cleanup

- Align level types: remove unused levels or support them in the UI.
- Deduplicate subjects (case-insensitive) and clean empty entries.
- Remove dead code (unused React Query, mock URLs) or integrate it properly.

## 7. Accessibility & trustworthy UX

- Dialogs/Toasts: focus trap, ARIA announcements, explicit labels.
- Buttons opening external links: icon + “(opens in a new window)”.
- Clear loading states (PDF, upload, result generation).

## 8. Tests & quality

- Unit tests:
  - Grade normalization, per-track scoring, subject/URL validation.
  - i18n: ensure keys used by components exist.
- Component tests: `ResultsPage`, `ShareResults`, `GradeInput` (valid/invalid states, ≥6 subjects).
- Lint/CI: run `npm run lint` in CI, add a placeholder `npm run test`.

## 9. Security (frontend until a backend exists)

- Avoid overpromising: clearly state no data is sent to a server.
- Keep CSP meta minimal and documented; avoid removing legitimate nodes dynamically.
- Harden window opens (noopener/noreferrer) and validate all external URLs.

## 10. Deployment / next steps

- Choose: stay static (Vercel/Netlify) or add a micro-backend (OCR + server scoring + storage).
- If backend: define the API (POST /analyze, POST /upload, POST /share) and data policy (retention, PII).

## Recommended order (actionable summary)

1) Fix i18n (missing keys, renames, at least fr/en completion).
2) Plug the MVP guidance engine and display it in `ResultsPage`.
3) Secure uploads: limit formats/sizes, “simulated analysis” banner until OCR exists.
4) Rework sharing/PDF with real data and localized messages.
5) Clean types/levels + remove obsolete mocks.
6) Add unit tests for scoring and input validation.
7) Improve UX (ARIA, focus, loading states, external link hints).
8) Decide and document the backend trajectory (optional but recommended).
