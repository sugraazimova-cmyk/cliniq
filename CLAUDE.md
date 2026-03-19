# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (frontend only, no API)
vercel dev        # Start full dev server (frontend + API functions + env vars)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

> **Note:** Always use `vercel dev` (not `npm run dev`) when working with any `/api` route. Vercel injects server-side env vars; Vite alone does not. The `api/_loadEnv.js` helper also reads `.env.local` as a fallback for vars not on the Vercel cloud project.

## Architecture

**ClinIQ** is an Azerbaijani medical case-based learning simulator with a React frontend and Vercel serverless backend. Cases and user data are stored in Supabase (PostgreSQL).

### Page flow (state-based routing — no React Router)

```
AuthScreen → FeaturesPage → CasesPage (specialty list → cases) → Case flow (6 steps)
                         → FlashcardsPage
                         → AdminPage (admin only)
```

Routing is controlled by state variables in `App.jsx`:
- `session` — null = show AuthScreen
- `page` — `"features"` | `"cases"` | `"flashcards"` | `"admin"`
- `selectedCase` — null = show CasesPage, non-null = show case flow
- `isAdmin` — `session.user.email === import.meta.env.VITE_ADMIN_EMAIL`

### Frontend files

| File | Purpose |
|------|---------|
| [src/App.jsx](src/App.jsx) | Root component. All case-flow state, scoring logic, and step rendering. |
| [src/AuthScreen.jsx](src/AuthScreen.jsx) | Two-panel login/signup/forgot-password screen with animated ECG canvas. |
| [src/FeaturesPage.jsx](src/FeaturesPage.jsx) | Hub page with bento grid of feature cards. Renders gear icon (admin) when `onEnterAdmin` prop is non-null. |
| [src/CasesPage.jsx](src/CasesPage.jsx) | Two-level cases browser: specialty list → cases within specialty. |
| [src/ProfileDrawer.jsx](src/ProfileDrawer.jsx) | Slide-in drawer: profile edit, case history, bookmarks, per-case notes. |
| [src/AdminPage.jsx](src/AdminPage.jsx) | 4-tab admin dashboard: Overview, Hallar, AI Generator, İstifadəçilər. |
| [src/admin/CaseEditor.jsx](src/admin/CaseEditor.jsx) | 6-step editable case form used in both Cases tab and AI Generator review. Shows unsaved-changes confirmation on back. |
| [src/admin/caseDefaults.js](src/admin/caseDefaults.js) | `EMPTY_CASE` template exported separately to keep CaseEditor HMR-compatible. |
| [src/components/ui/bento-grid.jsx](src/components/ui/bento-grid.jsx) | BentoGrid + BentoCard components used by FeaturesPage. |
| [src/components/ui/menu.jsx](src/components/ui/menu.jsx) | UserProfileSidebar used inside ProfileDrawer. |
| [src/lib/utils.js](src/lib/utils.js) | `cn()` class-merge helper (used via `@/` alias). |
| [src/supabase.js](src/supabase.js) | Supabase client — uses `sessionStorage` by default. "Məni yadda saxla" stores tokens in `localStorage`. |

### Case flow (6 steps)

Steps are rendered conditionally on `currentStep` (0–5) in `App.jsx`:

1. **Anamnez (0)** — Student picks up to 5 history questions from a list; answers come from stored case data. Tags/points hidden until selected.
2. **Müayinə (1)** — Interactive patient image with pulsing alert dots; clicking a dot reveals an exam finding.
3. **Analizlər (2)** — Student orders up to 5 lab investigations from a list.
4. **Diaqnoz (3)** — Two-stage: pick differential diagnoses (up to 3), then select final diagnosis from clickable chips. Local normalization check determines correct/wrong.
5. **Müalicə (4)** — Select treatment options from a list; `submitTreatment()` awards 20 pts split across correct options.
6. **Nəticə (5)** — Score breakdown. Two exit buttons: "Başqa xəstəyə keç" (→ cases list) and "Ana səhifəyə qayıt" (→ features hub).

Completed step tabs are clickable — student can jump back to any previous step.

### Case data structure (Supabase `cases` table)

Each case row maps to: `id`, `title`, `specialty`, `difficulty`, `patient_summary`, `tags`, `vitals`, `patient_context`, `history_questions`, `examinations`, `investigations`, `differential_diagnosis`, `correct_diagnosis`, `diagnosis_keywords`, `explanation_points`, `treatment_points`, `treatment_options`.

`treatment_options`: `[{ text: string, correct: boolean }]` — text before ` — ` shown during selection; full text shown in results.

### Supabase tables

| Table | Purpose |
|-------|---------|
| `cases` | Case content (`is_published = true` for student-facing, drafts have `is_published = false`) |
| `case_attempts` | Per-user attempt history with score |
| `bookmarks` | User-bookmarked cases |
| `notes` | Per-user, per-case text notes |
| `feature_events` | Lightweight usage tracking — one row per event, `feature` column (e.g. `flashcard_generate`, `flashcard_parse`) |

All tables except `feature_events` have RLS policies scoped to `auth.uid() = user_id`.

`feature_events` setup SQL:
```sql
create table feature_events (
  id bigserial primary key,
  user_id uuid references auth.users on delete set null,
  feature text not null,
  created_at timestamptz default now()
);
alter table feature_events enable row level security;
```

### API (Vercel serverless functions in [api/](api/))

| File | Purpose |
|------|---------|
| [api/_loadEnv.js](api/_loadEnv.js) | Shared helper: reads `.env.local` into `process.env` for vars not already set by Vercel runtime. Import as side-effect at top of any API file that needs server-side vars. |
| [api/admin.js](api/admin.js) | Multipurpose admin endpoint. Verifies admin JWT on every call. Actions: `stats`, `list`, `create`, `update`, `delete`, `duplicate`, `toggle_publish`, `users`. |
| [api/admin-generate-case.js](api/admin-generate-case.js) | Generates a full Azerbaijani medical case via Claude Sonnet. Requires admin JWT. |
| [api/flashcards.js](api/flashcards.js) | Generates 8 flashcards from text or image via Claude Haiku. Logs `flashcard_generate` event. |
| [api/flashcards-parse.js](api/flashcards-parse.js) | Parses uploaded PDF/DOCX/TXT/image into sections. Logs `flashcard_parse` event. |
| [api/delete-account.js](api/delete-account.js) | Deletes user via Supabase Admin API. |

### Admin security (two-layer)

- **Layer 1 (frontend gate):** `VITE_ADMIN_EMAIL` env var — controls whether the gear icon renders in the header. Soft gate, UX only.
- **Layer 2 (server-side):** Every admin API function calls `verifyAdmin(req)` which extracts the Bearer token, calls `db.auth.getUser(token)`, and checks the returned email against `ADMIN_EMAIL` (server-only, no `VITE_` prefix). Returns 403 if check fails.

### Required env vars

| Variable | Used in |
|----------|---------|
| `ANTHROPIC_API_KEY` | `api/flashcards.js`, `api/flashcards-parse.js`, `api/admin-generate-case.js` |
| `VITE_SUPABASE_URL` | `src/supabase.js` |
| `VITE_SUPABASE_ANON_KEY` | `src/supabase.js` |
| `VITE_ADMIN_EMAIL` | `src/App.jsx` (frontend admin gate) |
| `SUPABASE_URL` | `api/admin.js`, `api/admin-generate-case.js`, `api/delete-account.js` |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/admin.js`, `api/admin-generate-case.js`, `api/delete-account.js` |
| `ADMIN_EMAIL` | `api/admin.js`, `api/admin-generate-case.js` (server-side admin check) |

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
