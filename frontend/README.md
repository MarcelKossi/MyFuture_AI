# MyFuture AI

Frontend app (Vite + React + TypeScript + Tailwind/shadcn) for academic guidance and advice.

## Prerequisites

- Node.js 18+ (recommended) and npm or bun/pnpm

## Installation
```sh
npm install
```

## Development
```sh
npm run dev
# opens http://localhost:8080 (configured in Vite)
```

## Build
```sh
npm run build
npm run preview
```

## Lint
```sh
npm run lint
```

## Quick structure

- src/pages: entry pages (Index, NotFound)
- src/components: domain components (guidance, advice, sharing, PDF)
- src/hooks: hooks (i18n, security, perf, PDF)
- src/lib: utilities (i18n, security, storage, rate limit)
- src/translations: i18n JSON files

## Notes
- The file `docs/roadmap.md` lists improvement steps and current workstreams.
