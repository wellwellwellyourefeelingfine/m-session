# Bundle Size & Current Limitations

## Bundle Size

The production build uses Vite's default 500 KB chunk size warning threshold. The main `index` chunk sits around ~700 KB minified (~197 KB gzipped) as of April 2026. This is above the threshold but acceptable for a PWA — the service worker caches all chunks after first load, so repeat visits are instant.

**What's in the main chunk:** Session store (~4,000 LOC), HomeView, IntakeFlow, TimelineEditor, all shared components/icons/utilities, and third-party deps (React, Zustand). These are all interconnected via shared imports and don't split cleanly.

**What's lazy-loaded:**
- ActiveView, JournalView, ToolsView (tab-level code splitting via `React.lazy`)
- HelperModal (entire helper subsystem: 17 components, 8 resolvers, 3 content files)
- All 24 session modules (via `moduleRegistry.js`)

**Guidelines for keeping the bundle in check:**
- New self-contained features (modals, overlays, drawers) that are user-initiated should use `React.lazy` — the HelperModal pattern in `AppShell.jsx` is the template
- New session modules get lazy-loading for free via the module registry
- Before lazy-loading a component, verify its imports are mostly unique to it — shared dependencies stay in the common chunk regardless, and excessive splitting can *increase* total payload through duplication
- Run `npm run build` and check the chunk sizes when adding substantial new code

## Current Limitations

- PWA offline mode not fully tested
- No user accounts or cloud sync
- Journal images (IndexedDB blobs) are not preserved when archiving sessions
