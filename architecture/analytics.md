# Analytics (Plausible)

m-session uses [Plausible](https://plausible.io) for privacy-first, cookie-free, GDPR-compliant usage analytics. Every event in the app flows through a single wrapper at [src/services/analyticsService.js](../src/services/analyticsService.js) so there is one auditable place to see exactly what leaves the device. The user can disable all analytics at any time via Settings → Usage Data.

The user-facing disclosure lives at [privacy.html](../privacy.html). **If you add, rename, or remove an event, you must update privacy.html in the same PR** — the policy lists every event by name and is the legal basis on which users have agreed to be counted.

---

## Privacy stance

Three rules govern what is sent:

1. **No PII.** No names, emails, IPs, device IDs, journal content, intake free-text, contact details, or anything user-entered.
2. **Categorical values only.** Properties must be short strings or numbers from a finite, predictable set. Buckets (e.g. `dosageRange: 'moderate'`) over raw values (e.g. `dosageMg: 125`).
3. **No content.** Module names, category ids, voice ids, post slugs — all fine because they come from a fixed code-level enum. Anything the user typed — never.

If you're not sure whether a property is safe, ask: *"could two users be uniquely distinguished by this combined with their pageviews?"* If yes, don't send it.

---

## The `track()` wrapper

All events flow through [src/services/analyticsService.js](../src/services/analyticsService.js):

```js
import { track } from '../services/analyticsService';

track('event-name');                              // no props
track('event-name', { someProp: 'categorical' }); // with props
```

The wrapper:
- No-ops if `window.plausible` is undefined (offline, ad-blocker, opt-out).
- Wraps the call in a `try/catch` so analytics can never break the app.
- Honors `localStorage.plausible_ignore = 'true'` automatically — Plausible's own script checks this flag and suppresses every event when set. The opt-out toggle in Settings calls `syncAnalyticsOptOut(false)` to set it.

**Never call `window.plausible(...)` directly from app code.** Two exceptions exist in the marketing HTML pages where there is no JS bundle to import from: inline `onclick="plausible('event-name', …)"` handlers in [landing-page.html](../landing-page.html) and [about.html](../about.html). New events in HTML pages should follow the same inline pattern.

---

## Event catalog

All events currently in the app. Update this table when you add or remove one.

### App / session lifecycle (PWA)

| Event | Fires at | Props |
|---|---|---|
| `intake-start` | [useSessionStore.js:561](../src/stores/useSessionStore.js#L561) | — |
| `intake-complete` | [useSessionStore.js:687](../src/stores/useSessionStore.js#L687) | `sessionMode`, `guidanceLevel`, `duration`, `primaryFocus` |
| `intake-abandoned` | [useSessionStore.js:3001](../src/stores/useSessionStore.js#L3001) — `resetSession()` only if intake started but not completed | `lastStep` (e.g. `B-2`) |
| `session-start` | [useSessionStore.js:1809](../src/stores/useSessionStore.js#L1809) | `dosageRange` (bucketed via `getDoseBucket`) |
| `booster-decision` | [useSessionStore.js:1597, 1639](../src/stores/useSessionStore.js#L1597) | `decision: 'taken' \| 'skipped'`, `boosterRange` (if taken) |
| `phase-peak` | [useSessionStore.js:2037](../src/stores/useSessionStore.js#L2037) | — |
| `phase-integration` | [useSessionStore.js:2117](../src/stores/useSessionStore.js#L2117) | — |
| `session-complete` | [useSessionStore.js:2413](../src/stores/useSessionStore.js#L2413) | `durationBucket` |
| `module-complete` | [useSessionStore.js:2609](../src/stores/useSessionStore.js#L2609) | `libraryId`, `phase` |
| `voice-selected` | [useSessionStore.js:2594](../src/stores/useSessionStore.js#L2594) (`source: 'module'`, fired by `beginModule(instanceId, voiceId)` when a meditation actually starts) and [SettingsTool.jsx:65](../src/components/tools/SettingsTool.jsx#L65) (`source: 'settings'`, fired when a new default voice is committed on tab-leave) | `voice`, `source` |
| `tool-used` | [ToolsView.jsx:45](../src/components/tools/ToolsView.jsx#L45) — open only, not close | `tool` |
| `helper-category-click` | [HelperModal.jsx:189, 262, 268](../src/components/helper/HelperModal.jsx#L189) — category card selection only, opening the modal is not tracked | `category` |
| `emergency-support` | [HelperModal.jsx:240](../src/components/helper/HelperModal.jsx#L240) | `action` (action-type enum, never the actual contact name) |
| `pwa-installed` | [main.jsx](../src/main.jsx) — first launch in standalone display mode, gated by `localStorage['m-session-install-tracked']` so it fires once per device | — |

### Marketing pages (static HTML)

| Event | Fires at | Props |
|---|---|---|
| `launch-app` | [landing-page.html](../landing-page.html) — 5 CTA buttons (header / menu / hero / cta / footer) | `location` |
| `blog-preview-click` | [landing-page.html:827, 852](../landing-page.html#L827) and [about.html:628, 653](../about.html#L628) — preview cards linking to the blog/notes page | `post` (slug), `location` (`landing` \| `about`) |

### Naming note: "blog" vs "Notes"

The blog page is surfaced to users as **"Notes"** (the page is [notes.html](../notes.html)). In analytics, we use **`blog-`** prefixed event names to keep them clearly distinct from the user's private **journal notes**, which are never tracked. The [privacy.html](../privacy.html) policy explicitly explains this naming choice.

---

## Adding a new event

A recipe for future devs.

1. **Decide if you actually need it.** Plausible automatically tracks pageviews. If you just want to know "did anyone visit page X", you already have that. Custom events should answer a question pageviews can't.

2. **Pick a kebab-case name** that reads naturally as a sentence: `tool-used`, `voice-selected`, `pwa-installed`. Avoid past tense unless the event represents a definitive completion.

3. **Pick props.** Re-check the [Privacy stance](#privacy-stance) section. Categorical strings only. If you need to send a number, send a bucket label instead.

4. **Fire from the right point in the code.** Prefer the canonical action that already happens at that moment — a store action, a button click handler. Avoid firing from React effects (rerender = duplicate fires) and avoid firing from intermediate UI states (e.g. cycling through options, hovering, etc.) — those are noise. The `voice-selected` event is a worked example of this: it fires only when a meditation actually begins, not every time the user cycles the voice picker.

5. **Import and call `track()`** from `analyticsService` (or use the inline pattern in marketing HTML pages):

   ```js
   import { track } from '../services/analyticsService';
   // ...
   track('your-event-name', { someProp: 'value' });
   ```

6. **Update [privacy.html](../privacy.html).** Add the event to the list. Include what it tracks, when it fires, and which props are sent (with their categorical values where useful). This is non-negotiable — the policy is the user's basis for opting in.

7. **Update this doc.** Add a row to the [Event catalog](#event-catalog) table with the file:line. Future devs read this to know what's already covered.

8. **Add the goal in the Plausible dashboard** (see [Dashboard setup](#dashboard-setup) below).

---

## Opt-out flow

The opt-out is controlled by [useAppStore](../src/stores/useAppStore.js)'s `analyticsEnabled` preference (default `true`). When the user toggles it in Settings:

1. The store calls `syncAnalyticsOptOut(enabled)` from [src/services/analyticsService.js](../src/services/analyticsService.js).
2. When disabled: `localStorage.setItem('plausible_ignore', 'true')`.
3. Plausible's own script checks this flag before sending any request. The wrapper does not need additional logic.
4. When re-enabled: `localStorage.removeItem('plausible_ignore')`.

Effect: a disabled user produces **zero** network traffic to Plausible — not even pageviews. There is no client-side queue or buffer; events are dropped at the Plausible script layer.

---

## Dashboard setup

Plausible auto-detects new events and properties as soon as they fire — they appear in the **Custom Events** report and as filterable breakdowns automatically. **No manual registration is required for an event to be counted.**

However, two dashboard areas DO need manual setup:

### Goals

Anything you want to use as a funnel step, conversion target, or first-class filter needs to exist as a Goal:

**Site Settings → Goals → + Add Goal → Custom event → enter the event name.**

Whenever you add a new event in code, add a matching Goal in the dashboard. Don't pre-create goals for events that aren't shipping yet — Plausible will complain about zero-volume goals.

### Funnels

Funnels are a Business-plan feature that chain Goals together. Examples worth keeping configured:

- **Onboarding**: landing pageview → `launch-app` → `intake-start` → `intake-complete` → `session-start`
- **Intake drop-off**: `intake-start` → `intake-complete` (compare against the `intake-abandoned` raw count)
- **Install conversion**: landing pageview → `pwa-installed`

### Cleanup when renaming or removing events

If you rename or remove an event in code, remember to delete the obsolete Goal from the dashboard. Otherwise it will sit at zero forever and clutter the goal list. Historical data under the old name remains queryable via the Custom Events report.

---

## Related files

| File | Purpose |
|------|---------|
| [src/services/analyticsService.js](../src/services/analyticsService.js) | `track()` wrapper, dose-bucket helper, opt-out sync |
| [src/stores/useAppStore.js](../src/stores/useAppStore.js) | Owns `analyticsEnabled` preference, calls `syncAnalyticsOptOut` on change |
| [privacy.html](../privacy.html) | User-facing event disclosure — must stay in sync with this doc |
| [index.html](../index.html), [landing-page.html](../landing-page.html), [about.html](../about.html), [notes.html](../notes.html), [faq.html](../faq.html), [privacy.html](../privacy.html), [contribute.html](../contribute.html) | Each loads the Plausible script. The PWA index gets the full event suite; static pages get pageviews plus the marketing events above. |
