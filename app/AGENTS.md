# Repository Guidelines

## Project Structure & Module Organization
`src/App.tsx` wires React Router plus the CRM, WhatsApp, and React Query providers. Views sit in `src/pages/*` (customers, interactions, tickets, rag, metrics, evaluations, semantic-flags) and should mirror routes. Shared UI lives in `src/components`, hooks in `src/hooks`, services in `src/services`, contexts in `src/contexts`, layouts in `src/layouts`, assets in `public/`, and styling tokens in `tailwind.config.js`/`src/index.css`. Tests stay in `tests/`, while helper automation and seeders live in `scripts/`.

## Build, Test & Development Commands
Use `npm run dev` for Vite on :5173, `npm run preview` for the built bundle, and `npm run build` (`tsc -b` + `vite build`) to publish `dist/`. Run `npm run lint` before committing. Playwright flows: `npm test`, `npm run test:ui`, `npm run test:headed`, plus targeted `npm run test:evaluations|test:flags|test:live`; open reports with `npm run test:report`. Seed demo data via `npm run seed:ui` and clean it with `npm run seed:ui:clean`.

## Coding Style & Naming
Strict TypeScript settings (`strict`, `noUnused*`, `noUncheckedSideEffectImports`) are non-negotiable—fix issues instead of suppressing them. Use 2-space indentation, PascalCase components, camelCase `use*` hooks, and named exports for shared utilities while preferring Tailwind utilities. Run `npm run lint -- --fix` only after reviewing the diff.

## Testing Guidelines
Playwright suites live in `tests/*.spec.ts` (see `tests/navigation.spec.ts`) and should mirror journeys from `TESTING_GUIDE.md`. Favor accessible selectors (`getByRole`, `text=`) and isolate each test. Artifacts land in `test-results/`; inspect screenshots, videos, and traces locally and keep large folders out of commits. After a run, open `npm run test:report` or load traces from `test-results/trace.zip` to debug flakes.

## Commit & Pull Request Guidelines
Follow the existing log style: optional emoji + lowercase type + concise Portuguese summary (`📝 docs: atualiza guia de testes`, `⚡ feat: otimiza métricas`). Keep commits focused, describe user impact, and run lint plus the relevant Playwright command before pushing; mention those checks in the PR body. Pull requests need context, screenshots for UI work, affected test list, and links to Jira/GitHub issues. Flag env or data migrations explicitly and update README/AGENTS when expectations change.

## Environment & Security Notes
Frontend env vars stay in `.env`; keep `VITE_API_URL` aligned with the backend gateway and never commit alternate endpoints. Seeding/report scripts (`npm run seed:ui`, `npm run seed:ui:clean`, `scripts/generate-interface-report.ts`) may touch Supabase data, so run them only against disposable environments. Review generated reports and Playwright artifacts for sensitive content before sharing.
