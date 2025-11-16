# Repository Guidelines

## Project Structure & Module Organization
- Root `package.json` only proxies app builds; treat `app/` (React + Vite dashboard) and `server/` (Express/TypeScript API) as separate workspaces.
- UI code is grouped under `app/src` (`components/`, `pages/`, `layouts/`, `services/`, `contexts/`). Static assets belong in `app/public`, and build artifacts land in `app/dist`.
- Backend logic, import scripts, and Supabase/WhatsApp connectors live in `server/src`, while fixtures and helpers are under `server/test` and `server/scripts`.

## Build, Test, and Development Commands
- Front-end: `npm run dev` (root) starts the Vite dev server; `npm run build` creates `app/dist`; `npm --prefix app run preview` serves the production build.
- Back-end: `npm --prefix server run dev` watches the API, `npm --prefix server run build` compiles to `server/dist`, and `npm --prefix server run start` boots the compiled server for Vercel’s `server-app.js` proxy.
- Data and smoke flows: `npm --prefix server run import:example` exercises the RAG ingest path; `seed:*` scripts populate evaluation and audio fixtures for manual QA.

## Coding Style & Naming Conventions
- TypeScript everywhere with ES modules, 2-space indentation, single quotes, and trailing commas where ESLint requires; run `npm --prefix app run lint` or `npm --prefix server run lint` before pushing.
- React components/layouts are PascalCase files that return typed JSX; hooks and utilities stay camelCase and live under `app/src/hooks` or `app/src/services`.
- Server handlers export named functions, store validation schemas under `server/src/lib`, and keep DTOs next to their feature modules.

## Testing Guidelines
- UI: Playwright specs under `app/tests` follow the `{feature}.spec.ts` pattern. Use `npm --prefix app run test` headless in CI, `test:ui` when debugging, and `test:report` to view HTML reports in `app/reports`.
- API: Jest suites in `server/test` rely on Supertest; run `npm --prefix server run test` plus `test:coverage` for PRs affecting parsers or webhooks. Keep coverage for touched files ≥80% and document flaky cases in `TESTING.md`.

## Commit & Pull Request Guidelines
Follow the convention noted in `README.md`: `[AI]` for prompt-generated code (include the prompt in the commit body), `[MANUAL]` for human patches, and `[REFACTOR]` for mechanical cleanups. PRs must summarize scope, list test commands executed, mention touched directories (e.g., `app/src/pages`, `server/src/lib`), and add screenshots/GIFs when UI or WhatsApp tooling changes.

## Security & Configuration Tips
Store OpenRouter, Supabase, and Evolution API credentials in `.env.local` (app) or `.env` (server); never commit them. Sanitize incoming WhatsApp payloads before logging, verify signatures per `server/SECURITY.md`, and regularly purge temporary uploads from `server/uploads/` after reproducing issues.
