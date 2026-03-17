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

**ClinIQ** is an Azerbaijani medical case-based learning simulator with a React frontend and Vercel serverless backend. Cases and user data are stored in Supabase (PostgreSQL).

### Page flow (state-based routing — no React Router)

```
AuthScreen → FeaturesPage → CasesPage (specialty list → cases) → Case flow (6 steps)
```

Routing is controlled by three state variables in `App.jsx`:
- `session` — null = show AuthScreen
- `page` — `"features"` | `"cases"` — which top-level page to show
- `selectedCase` — null = show CasesPage, non-null = show case flow

### Frontend files

| File | Purpose |
|------|---------|
| [src/App.jsx](src/App.jsx) | Root component. All case-flow state, scoring logic, and step rendering. |
| [src/AuthScreen.jsx](src/AuthScreen.jsx) | Two-panel login/signup/forgot-password screen with animated ECG canvas. |
| [src/FeaturesPage.jsx](src/FeaturesPage.jsx) | Hub page (page 2) with bento grid of 5 feature cards. Only Kliniki hallar is active. |
| [src/CasesPage.jsx](src/CasesPage.jsx) | Two-level cases browser: specialty list → cases within specialty. |
| [src/ProfileDrawer.jsx](src/ProfileDrawer.jsx) | Slide-in drawer: profile edit, case history, bookmarks, per-case notes. |
| [src/components/ui/bento-grid.jsx](src/components/ui/bento-grid.jsx) | BentoGrid + BentoCard components used by FeaturesPage. |
| [src/components/ui/menu.jsx](src/components/ui/menu.jsx) | UserProfileSidebar used inside ProfileDrawer. |
| [src/lib/utils.js](src/lib/utils.js) | `cn()` class-merge helper (used via `@/` alias). |
| [src/supabase.js](src/supabase.js) | Supabase client — uses `sessionStorage` by default (session clears on browser close). "Məni yadda saxla" checkbox stores tokens in `localStorage` for persistence. |

### Case flow (6 steps)

Steps are rendered conditionally on `currentStep` (0–5) in `App.jsx`:

1. **Anamnez (0)** — Student picks up to 5 history questions from a list; AI chat via `/api/chat` returns stored answers. Tags/points hidden until selected.
2. **Müayinə (1)** — Interactive patient image with pulsing alert dots; clicking a dot reveals an exam finding.
3. **Analizlər (2)** — Student orders up to 5 lab investigations from a list.
4. **Diaqnoz (3)** — Two-stage: pick differential diagnoses (up to 3), then select final diagnosis from clickable chips or free-text input. Local normalization check runs before Gemini fallback.
5. **Müalicə (4)** — Select treatment options from a list; `submitTreatment()` awards 20 pts split across correct options.
6. **Nəticə (5)** — Score breakdown. Two exit buttons: "Başqa xəstəyə keç" (→ cases list) and "Ana səhifəyə qayıt" (→ features hub).

Completed step tabs are clickable — student can jump back to any previous step.

### Case data structure (Supabase `cases` table)

Each case row maps to: `id`, `title`, `specialty`, `difficulty`, `patient_summary`, `tags`, `vitals`, `patient_context`, `history_questions`, `examinations`, `investigations`, `differential_diagnosis`, `correct_diagnosis`, `diagnosis_keywords`, `explanation_points`, `treatment_points`, `treatment_options`.

`treatment_options`: `[{ text: string, correct: boolean }]` — text before ` — ` shown during selection; full text shown in results.

### Supabase tables

| Table | Purpose |
|-------|---------|
| `cases` | Case content (published cases only, `is_published = true`) |
| `case_attempts` | Per-user attempt history with score |
| `bookmarks` | User-bookmarked cases |
| `notes` | Per-user, per-case text notes |

All tables have RLS policies scoped to `auth.uid() = user_id`.

### API (Vercel serverless functions in [api/](api/))

| File | Purpose |
|------|---------|
| [api/chat.js](api/chat.js) | Anamnesis AI: fuzzy-matches student question to best stored Q&A pair via Gemini 2.0 Flash. |
| [api/diagnose.js](api/diagnose.js) | Diagnosis check: local normalization first, Gemini fallback. Returns `{ correct: boolean }`. |
| [api/delete-account.js](api/delete-account.js) | Edge function: deletes user via Supabase Admin API using `SUPABASE_SERVICE_ROLE_KEY`. |

### Required env vars

| Variable | Used in |
|----------|---------|
| `GEMINI_API_KEY` | `api/chat.js`, `api/diagnose.js` |
| `VITE_SUPABASE_URL` | `src/supabase.js` |
| `VITE_SUPABASE_ANON_KEY` | `src/supabase.js` |
| `SUPABASE_URL` | `api/delete-account.js` |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/delete-account.js` |

### Tech stack

- React 19, Tailwind CSS v4 (via `@tailwindcss/vite` — no tailwind.config file needed), Vite 8
- Framer Motion — page transitions, auth card animation, profile drawer
- Lucide React — icons throughout
- Supabase JS v2 — auth + database
- All UI text and medical cases are in Azerbaijani

### Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| Navy | `#122056` | Headlines, branding |
| Accent | `#5B65DC` | Buttons, links, active states |
| Lavender | `#EEEFFD` | Borders, subtle backgrounds |
| Ice | `#FAFAFD` | Page background |
| White | `#FFFFFF` | Cards, panels |

### Patient character images

Stored in `public/characters/`. Selected by `getCharacterImage(c)` based on case tags:
- `patient.child.jpg` — cases tagged "uşaq" / "körpə"
- `patient.adult.female.png` — cases tagged "qadın"
- `patient.adult.male.png` — default
