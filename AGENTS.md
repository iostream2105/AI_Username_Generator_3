# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript frontend.
- `src/services/ai.ts`: client API wrapper for `/api/generate`.
- `src/types.ts`: shared frontend type definitions.
- `server/index.ts`: Express API server and Doubao/OpenAI-compatible integration.
- `index.html`, `vite.config.ts`, `tsconfig.json`: app entry and toolchain config.
- `supabase/`: reserved for backend data artifacts (currently minimal/empty).
- No dedicated `tests/` directory exists yet.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite frontend at `http://localhost:3000`.
- `npm run server`: start Express backend at `http://localhost:3001`.
- `npm run build`: create production bundle in `dist/`.
- `npm run preview`: preview production build locally.
- `npm run lint`: TypeScript type check (`tsc --noEmit`).
- `npm run clean`: remove `dist/`.

Run frontend and backend together during development (`npm run dev` + `npm run server`).

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`/`.tsx`) with React function components.
- Indentation: 2 spaces; keep imports grouped and sorted by external/internal when possible.
- Naming: `PascalCase` for components, `camelCase` for functions/variables, `UPPER_SNAKE_CASE` for constants.
- Prefer explicit types for API payloads and responses (`GenerateParams`, `GeneratedName`).
- Use path alias `@` from project root when it improves readability.

## Testing Guidelines
- No test runner is configured yet. Minimum quality gate is `npm run lint` and manual API/UI verification.
- When adding tests, use `*.test.ts` or `*.test.tsx` naming and colocate with source or in a new `tests/` folder.
- For API changes, verify `POST /api/generate` success and failure paths (400/500 handling).

## Commit & Pull Request Guidelines
- Existing history uses concise Chinese subjects (examples: `优化：...`, `重构：...`, `初始化`).
- Keep commit messages short, imperative, and scope-first (e.g., `修复：处理空关键词提交`).
- PRs should include:
  - purpose and key changes,
  - related issue/task link,
  - local verification steps (`npm run lint`, manual flow),
  - UI screenshots/GIFs for frontend changes.

## Security & Configuration Tips
- Keep secrets in `.env.local`; never commit real keys.
- Required backend key: `DOUBAO_API_KEY`.
- Optional runtime settings should be documented in `.env.example` when introduced.
