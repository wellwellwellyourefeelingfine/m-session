# Notes

The `/notes` page on the marketing site is a single-page, hand-authored notes. No CMS, no markdown source, no build step — every post is plain HTML inside `notes.html`. This doc explains how to write new posts and the parts of the design that are easy to trip on.

---

## File layout

```
mdma-session-guide/
├── notes.html                   ← the page + ALL post content (single source of truth)
├── notes.css                    ← page-specific styles (sidebar, dropdown, articles, preview grid)
├── public/notes/                ← hero images
│   ├── hello-world-hero.svg
│   └── on-non-directiveness-hero.svg
├── landing-page.html           ← "Latest from the notes" preview cards (hand-curated copy of latest posts)
├── about.html                  ← same preview cards as landing
├── public/sitemap.xml          ← lists /notes with a lastmod date
├── shared.js                   ← /notes registered in pageMap for PJAX
└── privacy.html                ← documents the 4 notes-specific Plausible events
```

The marketing site lives outside the React PWA (`src/` and `/app/`). Don't touch those when publishing.

---

## How posts are stored

Each post is an `<article id="post-{slug}">` block inside `notes.html`, stacked newest-first. There is no separate markdown file, no JSON manifest, no data layer — the HTML *is* the post.

There are **two parallel structures** that must stay in sync per post:

1. **The `<article>`** in the posts stream (the actual content).
2. **An `<li>` in each archive list** — one in the desktop sidebar (`<aside class="notes-archive">`) and one in the mobile dropdown (`<div class="notes-archive-mobile-panel-inner">`). Both `<ol class="notes-archive-list">`s must mirror each other.

The `id` on the `<article>` and the `data-slug` on the archive `<a>` connect them. They must match exactly: `<article id="post-funding-update">` ↔ `<a href="#post-funding-update" data-slug="funding-update">`. This linkage drives:

- Smooth-scroll on click (browser native, via the `#` anchor).
- Active-post highlighting as you scroll (`IntersectionObserver` watches each `<article>`, then toggles `.active` on archive `<a>`s whose `data-slug` matches).
- The `/notes#post-{slug}` deep links used by the home/about preview cards.

---

## Anatomy of one post

Template:

```html
<article
  id="post-{slug}"
  class="notes-article"
  aria-labelledby="post-{slug}-title"
>
  <img
    class="notes-article-hero"
    src="/notes/{slug}-hero.{ext}"
    alt="Description for screen readers"
    loading="lazy"        <!-- use "eager" only for the newest (first) post -->
  />
  <div class="notes-meta">May 21, 2026 · 3 min read</div>
  <h2 class="notes-article-title" id="post-{slug}-title">
    Post title
  </h2>
  <div class="prose">
    <p>Body text.</p>
    <h3>Optional subheading</h3>
    <p>More body. <a href="...">Links</a> work normally.</p>
    <ul><li>Lists work.</li></ul>
  </div>
</article>
```

The `.prose` class is shared with FAQ / About / Privacy and lives in `pages.css`. It applies: mono body text, serif headings, 1.85 line-height, 720px max-width (overridden to fill the column on `/notes`). Inside it, use plain HTML — no special syntax.

Reading-time string in `.notes-meta` is hand-written. There's no auto-calculator yet.

---

## Hero images

- **Directory:** `public/notes/`
- **Naming:** `{slug}-hero.{jpg|webp|svg|png}` — example: `funding-update-hero.jpg`
- **Reference in HTML:** absolute path `/notes/{filename}` (Vercel serves `public/*` at the root)
- **Aspect ratio:** CSS forces 16:9 (`aspect-ratio: 16 / 9; object-fit: cover;`). Any input ratio works; it'll be center-cropped.
- **Recommended source size:** 1600×900 or 2400×1350.
- **Format:** JPEG/WebP for photos, SVG for vector illustration. The two existing placeholders are simple CSS-color gradient SVGs — easy to duplicate as a stand-in if you don't have a real image yet.
- **No build step.** Images are copied to `dist/notes/` verbatim by `npm run build`.

---

## Archive sidebar (desktop)

`<aside class="notes-archive">` is a sticky-positioned (`position: sticky; top: 96px;`) glass-style sidebar that lives next to the posts stream in a CSS grid layout (`260px` + `1fr`). It uses `rgba(var(--bg-elevated-rgb), 0.55)` + `backdrop-filter: blur(20px)` for the floating-glass look.

Hidden on viewports ≤900px (`display: none` inside the mobile media query).

Active-post highlighting is driven by `IntersectionObserver` with `rootMargin: '-15% 0px -65% 0px'` — only the band near the top of the viewport counts as "active." Inline IIFE at the bottom of `notes.html` handles this.

---

## Archive dropdown (mobile)

For viewports ≤900px, the sidebar is replaced by a compact "Archive ↓" button sticky-positioned under the header (`top: 64px`), right-aligned. Tapping it expands a dropdown panel below.

**The collapse uses the modern `grid-template-rows: 0fr → 1fr` pattern**, not `max-height`:

```css
.notes-archive-mobile-panel {
  display: grid;
  grid-template-rows: 0fr;       /* closed */
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1), margin-top 0.35s ...;
}
.notes-archive-mobile-panel.open {
  grid-template-rows: 1fr;       /* opens to natural content size */
}
.notes-archive-mobile-panel-inner {
  min-height: 0;
  overflow: hidden;              /* clips content when row is 0fr */
}
```

Why grid instead of `max-height`: `max-height: 0 → 60vh` overshoots the actual content size, which makes the visible expansion happen in the first ~10% of the animation (looks abrupt opening). Closing happened to align the slow tail with the visible shrink (looked smooth) — but it was asymmetric. The grid pattern animates the *actual* content height, so open and close are mirror-image smooth.

The background + border + padding live on `.notes-archive-list` (inside the inner wrapper), **not** on the outer panel. This guarantees zero visual presence when closed — subpixel-rounding can't paint a 1–2px sliver of background because the styled element is fully clipped by `overflow: hidden`.

HTML structure for the mobile panel:

```html
<div class="notes-archive-mobile-panel" id="notes-archive-mobile-panel">
  <div class="notes-archive-mobile-panel-inner">   <!-- required wrapper for the grid pattern -->
    <ol class="notes-archive-list">
      <li>...</li>
    </ol>
  </div>
</div>
```

---

## Floating seek arrows

`<div class="notes-seek">` is a `position: fixed` pair of round buttons in the bottom-right corner. Down → smooth-scrolls to the next-older `<article>`. Up → smooth-scrolls back to the newest.

State is JS-driven:
- `opacity: 0.32` when there's no eligible target (e.g. up arrow at the top).
- `opacity: 1` + accent color + `.active` class when eligible.
- `disabled` attribute set when not eligible (prevents pointer events).

The "current" article is the one with `getBoundingClientRect().top < 120` closest to the viewport top. Inline IIFE recalculates on every `scroll` event (passive listener).

---

## Preview cards on home + about

Both [landing-page.html](../landing-page.html) and [about.html](../about.html) have a `<section class="notes-previews">` that shows the latest 2–3 posts as cards. These are **hand-curated duplicates** — not auto-generated from `notes.html`.

This is deliberate:
- Preserves real HTML for SEO crawlers (vs JS-rendered previews that would be blank in static analysis).
- Avoids a build step or data manifest.
- Cost: when publishing, you edit 3 files (notes.html + landing-page.html + about.html). Acceptable for an infrequent notes.

The grid uses `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`, so 2 cards render as 2-column and 3 cards render as 3-column without code changes.

A `<!-- KEEP IN SYNC: ... -->` comment sits above each preview grid as a reminder.

Card differences between landing and about:
1. The `onclick` Plausible call uses `location: 'landing'` vs `location: 'about'`.
2. The about section has `class="notes-previews has-top-rule"` adding a hairline top border, because both neighbors there happen to be default-bg sections.

Background alternation is intentional: on landing, the preview section is default `--bg` between elevated `install-section` and default `.cta`. On about, the preview section is default `--bg` before the elevated Contact section.

---

## PJAX integration

The marketing site uses PJAX (in [shared.js](../shared.js)) for in-page navigation between HTML pages. `/notes` is registered in `pageMap` at [shared.js:133](../shared.js#L133):

```js
var pageMap = { '/': 'home', '/about': 'about', '/notes': 'notes', '/faq': 'faq', '/contribute': 'contribute', '/privacy': 'privacy' };
```

The notes's inline IIFE re-runs automatically on PJAX nav because PJAX re-executes inline `<script>` tags from the new page body. No `__ms.initNotes` hook is needed.

The hash-deep-link handler (`if (window.location.hash && document.querySelector(window.location.hash))` near the end of the IIFE) smooths the scroll on initial load when arriving via `/notes#post-slug`.

---

## The build pipeline

The marketing site is **not** built by Vite — Vite only builds the React app into `dist/app/`. The marketing pages are copied into `dist/` by [scripts/build-pages.mjs](../scripts/build-pages.mjs), which is called by the `build` script in `package.json`:

```json
"build": "rm -rf dist && vite build && node scripts/build-pages.mjs && node scripts/stamp-sitemap.mjs"
```

`build-pages.mjs` encodes the rules for what ships:

1. All `*.html` at repo root → `dist/` (auto-globbed). `landing-page.html` is additionally copied as `dist/index.html`.
2. All `*.css` at repo root → `dist/` (auto-globbed).
3. All browser `*.js` at repo root → `dist/`, **excluding `*.config.js`** which are Node tooling configs (`vite.config.js`, `eslint.config.js`, etc.).
4. A short enumerated list of files from `public/` (constant `PUBLIC_ROOT_ASSETS` in the script) → `dist/`. Enumerated because `public/` mixes marketing assets with PWA-only assets like `audio/`, `pwa-*.png`, `splash-*.png` that must **not** land at the marketing root.
5. `public/notes/` → `dist/notes/` (recursive copy).

**When adding a new marketing asset:**

| Adding… | Action |
| --- | --- |
| New HTML page (e.g. `changelog.html`) | Nothing — auto-picked up by rule 1. |
| New stylesheet (e.g. `changelog.css`) | Nothing — auto-picked up by rule 2. |
| New browser script (e.g. `analytics-handler.js`) | Nothing — auto-picked up by rule 3 (just don't name it `*.config.js`). |
| New file at `public/` that needs to ship at the marketing root | Add it to the `PUBLIC_ROOT_ASSETS` constant in [scripts/build-pages.mjs](../scripts/build-pages.mjs). |
| New asset *directory* under `public/` (like `public/notes/`) | Add one `cp(...)` call at the bottom of [scripts/build-pages.mjs](../scripts/build-pages.mjs). |

**Two relevant dev scripts:**
- `npm run dev:pages` — uses `browser-sync` to serve the repo root + `public/` as static. Picks up new files automatically because nothing is enumerated.
- `npm run preview:full` — runs `npm run build` then `serve dist`. Reflects the production build, so use this to verify a new asset actually ships before pushing.

If a marketing asset 404s on the deployed site, [scripts/build-pages.mjs](../scripts/build-pages.mjs) is the first place to look — most likely a new directory under `public/` was added but a `cp()` call wasn't.

---

## Plausible analytics

Four categorical events are tracked on the notes. All are documented in [privacy.html](../privacy.html) alongside the existing app events.

| Event                          | Props                                     | Fires when                                            |
| ------------------------------ | ----------------------------------------- | ----------------------------------------------------- |
| `notes-archive-click`           | `{ post: '<slug>' }`                      | Sidebar or mobile-dropdown archive item clicked.      |
| `notes-arrow-click`             | `{ direction: 'up' \| 'down' }`           | Floating seek arrow clicked.                          |
| `notes-mobile-archive-toggle`   | `{ state: 'open' \| 'closed' }`           | Mobile dropdown opened or closed.                     |
| `notes-preview-click`           | `{ post: '<slug>', location: 'landing' \| 'about' }` | Home/about preview card clicked.        |

No event ever contains free-text content. Slugs are categorical (a finite list of post identifiers), which matches the project's blanket "no PII in analytics" rule documented in privacy.html.

---

## Publishing checklist

For a new post with slug `funding-update`:

| Step | Action | File |
|------|--------|------|
| 1 | Drop hero image | `public/notes/funding-update-hero.{jpg\|webp\|svg}` |
| 2 | Add `<article id="post-funding-update">` at top of posts stream | `notes.html` |
| 3 | Add `<li>` with `data-slug="funding-update"` to **both** archive lists (desktop + mobile) | `notes.html` (×2) |
| 4 | Replace oldest preview card with new post (or add a third) | `landing-page.html` |
| 5 | Same preview card update — remember `location: 'about'` in the `onclick` | `about.html` |
| 6 | Bump `<lastmod>` for /notes to today's date | `public/sitemap.xml` |
| 7 | Commit and push — Vercel auto-builds and deploys | — |

There's no automated check that catches a missed step (no test, no linter rule). If a `<li>` references a slug with no matching `<article>`, the archive link just scroll-jumps to nothing. If the `<article>` has no archive `<li>`, the post still renders but won't appear in the sidebar.

---

## Known limitations and future work

- **Triplicate edits.** Each new post requires touching `notes.html`, `landing-page.html`, and `about.html`. Acceptable while publishing cadence is low. The natural upgrade path is a small `notes-posts.js` data file + JS render for the preview cards on home/about — keeping `notes.html` canonical for SEO. Not worth the complexity until the cadence demands it.
- **No per-post URLs.** Deep links use `/notes#post-slug` (anchor scroll), not `/notes/post-slug` (clean URL). Anchors work fine for SEO since the full content is on `/notes` already. To upgrade later: add a `vercel.json` rewrite, and either generate per-post HTML files (so each has its own `<title>`/OG image) or use JS to update document.title/meta tags on hash change.
- **No RSS feed.** Worth adding once there are ≥3 real posts. Easiest path: a small script that parses `<article>` blocks from `notes.html` and writes an RSS XML file at deploy time.
- **No search or filtering.** Defer until the archive has enough posts (~10+) to need it.
- **No reading-time estimator.** The "3 min read" string in `.notes-meta` is hand-written. Could auto-calculate from word count in `.prose` at runtime if desired.
- **No comments.** Out of scope. Adding any third-party (Disqus, giscus) would require a privacy.html update.
- **Archive scroll cap on mobile.** The grid-template-rows pattern doesn't currently cap dropdown height — if the archive grows past viewport height, the dropdown will be taller than the screen. To fix later: add `max-height: 60vh; overflow-y: auto;` on the wrapper when open, but mind that overflow transitions can look janky.

---

## Related files (quick reference)

| Surface                    | File                                                |
| -------------------------- | --------------------------------------------------- |
| Page + all posts           | [notes.html](../notes.html)                           |
| Page-specific styles       | [notes.css](../notes.css)                             |
| Hero images                | [public/notes/](../public/notes/)                     |
| Home preview cards         | [landing-page.html](../landing-page.html) (search `notes-previews`) |
| About preview cards        | [about.html](../about.html) (search `notes-previews`) |
| Sitemap                    | [public/sitemap.xml](../public/sitemap.xml)         |
| PJAX page map              | [shared.js:133](../shared.js#L133)                  |
| Analytics disclosure       | [privacy.html](../privacy.html)                     |
| Build allowlist (the gotcha) | [package.json](../package.json) `build` script    |
