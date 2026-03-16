# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Username Generator — a front-end/back-end separated React web app that uses Doubao (豆包) API to generate meaningful Chinese usernames/nicknames. Users provide 1-3 keywords, optional meaning direction, and optional style preference to get 3 AI-generated names with explanations and style tags.

## Commands

- `npm run dev` — Start frontend dev server on port 3000 (proxies `/api` to backend)
- `npm run server` — Start backend Express server on port 3001
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Preview production build
- `npm run lint` — TypeScript type checking (`tsc --noEmit`)
- `npm run clean` — Remove `dist/` folder

Development requires both frontend and backend running simultaneously.

No test framework is configured. No ESLint configured.

## Architecture

Frontend: React SPA built with Vite + TypeScript + Tailwind CSS 4.
Backend: Express server calling Doubao API via OpenAI-compatible SDK.

### Key files

- `src/App.tsx` — Main component containing all UI logic and view state management (home → loading → results → favorites)
- `src/services/ai.ts` — Frontend API client; calls backend `/api/generate` endpoint
- `src/types.ts` — Core interfaces: `GeneratedName` and `GenerateParams`
- `src/index.css` — Tailwind imports + custom theme (brand colors, fonts)
- `server/index.ts` — Express backend; handles `/api/generate`, calls Doubao API
- `vite.config.ts` — React plugin, Tailwind plugin, `@` path alias, dev proxy to backend

### State & data flow

- View navigation managed via React `useState` (no router)
- Favorites persisted to `localStorage`
- AI flow: user inputs → frontend `fetch('/api/generate')` → backend Express → Doubao API (OpenAI-compatible) → JSON response → card display

### Styling

- Tailwind CSS 4 with `@tailwindcss/vite` plugin (no tailwind.config — uses CSS-based config in `index.css`)
- Fonts: Noto Serif SC (serif), Inter (sans-serif)
- Animation: `motion` library (Framer Motion successor)

## Environment

- Requires `DOUBAO_API_KEY` in `.env.local` (Volcengine Doubao API key)
- Optional `APP_URL` for self-referential links
- API Key is server-side only, never exposed to frontend

## Language

The app UI, AI prompts, and PRD are all in Chinese. Keep all user-facing strings in Chinese.

每次对话都在前面加上我的称呼Wayne
请用中文回复我
