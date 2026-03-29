# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Type-check (tsc -b) then build to /dist
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

For Capacitor (mobile):
```bash
npx cap sync android    # Sync web build to Android
npx cap open android    # Open in Android Studio
```

## Architecture

This is a React + TypeScript + Vite SPA for browsing UPSC (Union Public Service Commission) Previous Year Questions, with Capacitor wrapping it for Android deployment.

**Routing** (`src/App.tsx`):
- `/` → `pyqs.tsx` — main question browser
- `/quiz` → `Quiz.tsx` — quiz/test mode
- `/about` → `About.tsx` — author info

**Data layer**: All question data lives in `public/upscpyqs.csv` (~4,800 rows). It is parsed at runtime in the browser using PapaParse. There is no backend or API. The CSV columns are: `Paper, Passage, Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation, Subject, Topic, Year, Image Url`.

**Key components**:
- `src/components/pyqs.tsx` (~987 lines) — loads and filters CSV data, handles search/filter state, displays questions one at a time with answer submission. Filters: Paper, Subject, Topic, Year, ID search, and random mode.
- `src/components/Quiz.tsx` (~957 lines) — quiz mode with score tracking, supports both the built-in CSV and user-uploaded CSVs. Uses Fisher-Yates shuffle for question ordering.
- `src/components/Navigation.tsx` — responsive nav header with mobile hamburger menu.

**The `Question` interface** is defined in each component (not shared):
```typescript
interface Question {
  id: number;
  paper, subject, topic, year, passage, question,
  option_a, option_b, option_c, option_d,
  correct_option, explanation, image_url: string | null;
}
```

**Static image assets** for question images are in `public/` (files `1-65.png`) and referenced via `image_url` in the CSV.

**Mobile**: Capacitor config (`capacitor.config.ts`) targets `dist/` as the web dir with appId `com.upscpyqs.app`. Only Android is configured. AdMob plugin is installed for ad monetization.

**Analytics**: Google Analytics (GA4, `G-F28XTLD222`) is loaded directly in `index.html`.

## TypeScript

Strict mode is on. `noUnusedLocals` and `noUnusedParameters` are enabled — unused variables will cause build failures.
