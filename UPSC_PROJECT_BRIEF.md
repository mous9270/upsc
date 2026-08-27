# UPSC PYQs — Project Brief (for interview prep)

## One-line pitch
A React + TypeScript web app (also shipped as an Android app via Capacitor) that lets
UPSC aspirants browse, filter, and practice ~4,800 Previous Year Questions with a quiz mode —
fully client-side, no backend.

## What it does (user-facing features)
- **Question browser** (`/`): view UPSC PYQs one at a time, submit an answer, see the
  correct option + explanation.
- **Filters**: by Paper, Subject, Topic, Year, direct ID search, and a random mode.
- **Quiz / test mode** (`/quiz`): score tracking, question shuffling (Fisher–Yates), and
  support for user-uploaded CSVs (practice on your own question sets).
- **About page** (`/about`): author info.
- **Export**: quiz/questions can be exported to PDF (jsPDF).
- **Responsive UI**: mobile hamburger nav; light theme default.
- **Monetization**: AdMob ads in the Android build.
- **Analytics**: Google Analytics (GA4).

## Tech stack
- **Frontend**: React 19, TypeScript (strict mode), Vite 6.
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/vite`).
- **Routing**: react-router-dom 7.
- **Data parsing**: PapaParse (CSV parsed in the browser at runtime).
- **PDF**: jsPDF. **HTTP**: axios.
- **Mobile**: Capacitor 8 (Android only) — plugins: AdMob, App, Filesystem, Share.
- **Tooling**: ESLint 9, typescript-eslint, patch-package.

## Architecture (key facts)
- **No backend / no API / no database.** All question data lives in a single static file
  `public/upscpyqs.csv` (~4,800 rows, ~5,100 lines) parsed client-side. This is a pure SPA.
- **CSV columns**: `Paper, Passage, Question, Option A–D, Correct Answer, Explanation,
  Subject, Topic, Year, Image Url`.
- **Routing** (`src/App.tsx`): `/` → `pyqs.tsx`, `/quiz` → `Quiz.tsx`, `/about` → `About.tsx`.
- **Main components**:
  - `src/components/pyqs.tsx` (~970 lines) — loads/filters CSV, search + filter state,
    single-question display, answer submission.
  - `src/components/Quiz.tsx` (~1,130 lines) — quiz mode, scoring, built-in + uploaded CSVs.
  - `src/components/Navigation.tsx` — responsive nav.
  - `src/components/MultiSelect.tsx` — reusable multi-select filter control.
- **`Question` interface** is defined per-component (not shared) — a known bit of duplication.
- **Images**: question images are static PNGs (`1-65.png`) in `public/`, referenced via
  the CSV `Image Url` column.
- **Capacitor config**: appId `com.upscpyqs.app`, appName "UPSC PYQs", webDir `dist`.

## How it's built / run
```bash
npm run dev       # dev server at localhost:5173
npm run build     # tsc -b type-check, then Vite build to /dist
npm run lint      # ESLint
npx cap sync android   # push web build into the Android project
npx cap open android   # open in Android Studio
```

## My role & what I built
- (Fill in) Designed and built the full frontend, data model, filtering/search, and quiz engine.
- Packaged the web app as a native Android app with Capacitor and integrated AdMob + analytics.
- Sourced/cleaned ~4,800 questions into a structured CSV schema.

## Talking points / trade-offs (likely interview questions)
- **Why CSV instead of a database?** Zero infra/hosting cost, works offline, trivial to ship
  inside the mobile app, dataset is read-only. Trade-off: no server-side search, whole file
  is loaded/parsed in the browser (~5k rows) — fine at this scale, wouldn't scale to millions.
- **Performance**: parsing 4,800 rows client-side; how would you handle 100k+ rows?
  (indexing, pagination, IndexedDB, or a real backend/search service).
- **Code duplication**: `Question` interface repeated per component — would extract a shared type.
- **Component size**: `pyqs.tsx` and `Quiz.tsx` are large (~1,000 lines) — refactor into hooks
  + smaller components, extract filtering logic into a custom hook.
- **State management**: currently local React state; when would you reach for context/a store?
- **One codebase, two targets** (web + Android) via Capacitor — pros/cons vs. React Native/native.
- **TypeScript strict mode** with `noUnusedLocals`/`noUnusedParameters` — enforced clean builds.

## Possible improvements to mention
Shared types, extract filter logic into custom hooks, virtualized lists, offline caching,
unit/integration tests (none currently), accessibility pass, i18n, a lightweight search index.
