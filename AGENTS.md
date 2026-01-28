# Candidate Profiler - Agent Guidelines

## Project Overview
A browser-only tool for recruiters/hiring managers to organize candidate evaluations across multiple interviews. All data persisted in IndexedDB, no backend.

## Tech Stack
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS with @tailwindcss/forms
- **Database:** IndexedDB via Dexie.js
- **Routing:** React Router v7
- **Date handling:** date-fns
- **UUIDs:** uuid package

## Commands
```bash
npm run dev        # Start dev server (port 5173)
npm run build      # Production build
npm run typecheck  # TypeScript check (tsc --noEmit)
npm run lint       # ESLint
npm run preview    # Preview production build
```

## Project Structure
```
src/
├── components/    # Reusable UI components
├── pages/         # Route page components
├── db/            # Dexie database setup, hooks
├── hooks/         # Custom React hooks
├── types/         # TypeScript types/interfaces
└── utils/         # Helper functions
```

## Design System
- **Fonts:** DM Sans (headings), IBM Plex Sans (body)
- **Colors:**
  - Sidebar: `#0f172a` (slate-900)
  - Accent: `#10b981` (emerald-500)
  - Surface: `#f8fafc` (slate-50)
- **Patterns:**
  - Use `.nav-link` and `.nav-link.active` for sidebar navigation
  - Use `.btn-primary` and `.btn-secondary` for buttons
  - Cards: `rounded-xl border border-surface-border shadow-sm`

## Code Conventions
- Use named exports for components
- Place page components in `src/pages/`
- Place reusable components in `src/components/`
- Define types in `src/types/index.ts`
- Use Tailwind utility classes; avoid inline styles
- All timestamps as ISO 8601 strings
- Generate UUIDs with `crypto.randomUUID()` or uuid package

## Data Model
See `src/types/index.ts` for:
- `Candidate`, `Interview`, `Profile`, `Settings`
- `Axis`, `HireSignal`, `InterviewType` enums

## Testing Notes
- Verify UI changes in browser at http://localhost:5173
- Use agent-browser skill for automated verification
- Always run `npm run typecheck` before committing
