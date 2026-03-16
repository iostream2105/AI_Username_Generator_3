# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Username Generator — a React web app (designed as a WeChat Mini Program concept) that uses Google Gemini API to generate meaningful Chinese usernames/nicknames. Users provide 1-3 keywords, optional meaning direction, and optional style preference to get 3 AI-generated names with explanations and style tags.

## Commands

- `npm run dev` — Start dev server on port 3000
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Preview production build
- `npm run lint` — TypeScript type checking (`tsc --noEmit`)
- `npm run clean` — Remove `dist/` folder

No test framework is configured. No ESLint configured.

## Architecture

Single-page React app built with Vite + TypeScript + Tailwind CSS 4.

### Key files

- `src/App.tsx` — Main component containing all UI logic and view state management (home → loading → results → favorites)
- `src/services/ai.ts` — Gemini API integration; sends structured prompts and parses JSON responses
- `src/types.ts` — Core interfaces: `GeneratedName` (id, name, meaning_title, meaning_desc, style_tags) and `GenerateParams` (keywords, meaning?, style?)
- `src/index.css` — Tailwind imports + custom theme (brand colors, fonts)
- `vite.config.ts` — React plugin, Tailwind plugin, `@` path alias (resolves to project root), GEMINI_API_KEY injection

### State & data flow

- View navigation managed via React `useState` (no router)
- Favorites persisted to `localStorage`
- AI flow: user inputs → `generateNames(GenerateParams)` → Gemini API with structured JSON schema → array of `GeneratedName` objects → card display

### Styling

- Tailwind CSS 4 with `@tailwindcss/vite` plugin (no tailwind.config — uses CSS-based config in `index.css`)
- Fonts: Noto Serif SC (serif), Inter (sans-serif)
- Animation: `motion` library (Framer Motion successor)

## Environment

- Requires `GEMINI_API_KEY` in `.env.local` (get from Google AI Studio)
- Optional `APP_URL` for self-referential links
- Vite injects `GEMINI_API_KEY` into client bundle via `define` in vite.config.ts

## Language

The app UI, AI prompts, and PRD are all in Chinese. Keep all user-facing strings in Chinese.
