# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (proxies /api to localhost:3000)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## Architecture

**ClinIQ** is an Azerbaijani medical case-based learning simulator. It has two parts:

- **Frontend** ([src/App.jsx](src/App.jsx)): Single-component React app. All UI, state, and case data lives here.
- **Backend** ([api/chat.js](api/chat.js)): Vercel serverless function. Receives a student's question + the case's expected Q&A pairs, calls Gemini 2.0 Flash to fuzzy-match the question to the best pre-stored answer, and returns that answer.

### Learning flow (6 steps)

1. **Anamnesis** — Student asks the patient up to 5 questions via AI chat (`/api/chat`)
2. **Examination** — Student selects physical exam findings from a list
3. **Investigations** — Student orders lab tests
4. **Diagnosis** — Student types a diagnosis
5. **Treatment** — Student types a treatment plan
6. **Results** — Score breakdown and AI-generated explanation shown

### Case data structure (in App.jsx)

Each case object contains: `id`, `title`, `difficulty`, `diagnosis`, `historyQuestions` (expected Q&A pairs for AI matching), `examFindings`, `investigations` (with `aliases` for fuzzy matching), `treatment`, and `explanation`.

### API integration

- Dev: Vite proxies `/api/*` → `http://localhost:3000` (see [vite.config.js](vite.config.js))
- Prod: Vercel routes `/api/*` to serverless functions in [api/](api/)
- Required env vars: `GEMINI_API_KEY` (used in [api/chat.js](api/chat.js))

### Tech stack

- React 19, Tailwind CSS v4 (via `@tailwindcss/vite` — no tailwind.config file needed), Vite 8
- All UI text and medical cases are in Azerbaijani
