# Technical Spec: Glass Effect for Helper Modal Top Bar

**Author:** Implementation review
**Status:** Draft — awaiting approval
**Surface affected:** `src/components/helper/HelperTopBar.jsx`, `src/components/helper/HelperModal.jsx`

---

## 1. Overview

Add a translucent backdrop-blur ("glass") effect to the helper modal's "What's happening?" top bar so that scrolled content visibly diffuses behind it, matching the language of the main app's `Header` and `TabBar` while reading as slightly more transparent. This requires both a visual change (the glass styles) and a small structural change (so content actually scrolls behind the bar rather than below it).

## 2. Goals

- The "What's happening?" top bar appears as glass: ~60% bg-primary tint + `blur(24px)`, with a hairline bottom border
- Scrolled content visibly diffuses behind the bar (a real glass effect, not a fake one)
- Visual treatment is consistent with `Header.jsx` and `TabBar.jsx`, gated by the same `useAppStore.preferences.glassEffect` toggle
- No regression to layout, button behavior, animations, notch handling, or the rubber-band scroll fix

## 3. Non-goals

- No changes to button icons, button positions, the headline text, or the headline's font/spacing
- No changes to the modal's outer panel, height transition logic, animation choreography, or backdrop
- No changes to any other view (initial categories, triage, emergency contact, intention, pre-session) other than the top bar's visual treatment and the structural reshuffle described in §5

## 4. Current state

### 4.1 `HelperTopBar.jsx`

Plain flex container, no background, no border, no blur. Renders three slots: back button (left), centered headline `<h2>` (middle), close button (right). All three slots remain unchanged in this spec.

Internal spacing today (must be preserved verbatim):

- Wrapper: `flex items-start justify-between px-5 pt-2 pb-0`
- Headline `<h2>` margins: `marginTop: 14px`, `marginBottom: 26px`, `lineHeight: 1`, font `DM Serif Text serif`, size `text-3xl`

### 4.2 `HelperModal.jsx` panel layout (lines 385–421)

```jsx
<panel
  className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px]
             bg-[var(--bg-primary)] rounded-b-2xl flex flex-col overflow-hidden ..."
  style={{
    height: modalHeightCss,
    paddingTop: 'env(safe-area-inset-top, 0px)',
    transition: 'height 350ms cubic-bezier(0.65, 0, 0.35, 1)',
  }}
>
  <div style={{ marginBottom: '-2px' }}>          {/* topbar wrapper */}
    <HelperTopBar ... />
  </div>
  <div className="flex-1 px-5 pt-0 pb-6 [overflow-y-auto overflow-x-hidden | overflow-y-hidden]">
    <div className="transition-opacity duration-200" style={{ opacity: ... }}>
      {renderContent()}
    </div>
  </div>
</panel>
```

Key observations that drive the design:

- **The notch is handled at the panel level**, not at the top bar — via `paddingTop: env(safe-area-inset-top, 0px)` on the panel. Everything inside the panel sits below the notch automatically. The top bar does not need its own safe-area handling.
- **The top bar and scroll container are flex siblings**, not overlapping — content cannot currently scroll "behind" the bar. To produce a real glass effect, the bar must overlay the scroll area.
- **`marginBottom: '-2px'`** on the top bar wrapper is a long-standing sub-pixel adjustment (present since the v1 commit `2d40a7c`). It pulls the scroll container up 2px to eliminate a visible hairline gap. **This must be preserved** to satisfy the "no content position change" requirement.
- **The fade transition** (`isContentVisible` opacity) wraps only `renderContent()` — the top bar does not fade between view changes. This must remain true.
- **The rubber-band fix** (`overflow-x-hidden` added to the scroll container) must remain.

### 4.3 The reference pattern (main app)

`Header.jsx:46` and `TabBar.jsx:22` both use:

```js
background: glassEffect ? 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' : 'var(--bg-primary)'
backdropFilter: glassEffect ? 'blur(24px)' : 'none'
WebkitBackdropFilter: glassEffect ? 'blur(24px)' : 'none'
borderBottom (or borderTop): '1px solid var(--color-border)'
```

Gated by `useAppStore((s) => s.preferences?.glassEffect ?? true)`.

## 5. Design

### 5.1 Visual treatment (HelperTopBar)

Apply the main app's glass recipe to the top bar's existing wrapper, with one deliberate deviation:

| Property | Header / TabBar | HelperTopBar (this spec) | Rationale |
|---|---|---|---|
| Background | `color-mix(... 80%, transparent)` | `color-mix(... 60%, transparent)` | User asked for "more transparent" |
| Backdrop blur | `blur(24px)` | `blur(24px)` | Same — weaker blur with more transparency would muddy the headline |
| Bottom border | `1px solid var(--color-border)` | `1px solid var(--color-border)` | At 60% opacity, the border becomes the clearest demarcation |
| `glassEffect` gate | `useAppStore` preference | Same preference | Three surfaces, one toggle |

All other internal styles of `HelperTopBar` (the `px-5 pt-2 pb-0`, the headline, the buttons) are unchanged.

### 5.2 Structural change (HelperModal)

Move the top bar from "sibling above the scroll container" to "sticky child at the top of the scroll container." Sticky positioning is chosen over absolute positioning because:

- It auto-sizes to the bar's intrinsic height — no measurement, no height variable to keep in sync
- The bar's height already changes nothing (no responsive variation) but sticky is robust if it ever does
- It coexists with the panel's existing flex layout — no need to introduce `position: relative` plumbing
- When content scrolls, it stays put while content slides up behind — exactly what we want, by definition

```jsx
<panel className="... flex flex-col overflow-hidden"
  style={{ ..., paddingTop: 'env(safe-area-inset-top, 0px)' }}>

  <div className={`flex-1 pb-6 ${
    currentStep === 'triage' || currentStep === 'emergency-contact'
      ? 'overflow-y-auto overflow-x-hidden'
      : 'overflow-y-hidden'
  }`}>

    <div className="sticky top-0 z-10" style={{ marginBottom: '-2px' }}>
      <HelperTopBar ... />
    </div>

    <div className="px-5 transition-opacity duration-200"
         style={{ opacity: isContentVisible ? 1 : 0 }}>
      {renderContent()}
    </div>

  </div>
</panel>
```

Changes summarized:

1. The standalone `<div style={{ marginBottom: '-2px' }}>` wrapper around `HelperTopBar` (currently outside the scroll container) is removed
2. `HelperTopBar` is re-wrapped inside the scroll container as `<div className="sticky top-0 z-10" style={{ marginBottom: '-2px' }}>` — the `-2px` is preserved in the new location
3. `px-5` is moved off the scroll container and onto the inner content wrapper, so the sticky top bar spans the full panel width (the bar has its own `px-5` internally for its content)
4. `pt-0` is dropped from the scroll container — no longer meaningful once the sticky bar handles its own top spacing

## 6. Risk analysis — every way this could break

This is the section the spec exists for. Each risk is examined and addressed.

### 6.1 iPhone notch

**Risk:** Glass bar could render under the notch or fail to respect `env(safe-area-inset-top)`.

**Why this is safe:** The notch is handled at the panel level by `paddingTop: env(safe-area-inset-top, 0px)` on the modal panel. Everything inside the panel — including the new sticky bar — already sits below the notch automatically. The sticky bar sticks to `top: 0` of its scroll-ancestor (the `flex-1` scroll container), which itself begins below the safe-area padding. **No safe-area inset is needed inside `HelperTopBar` itself.**

**Verification:** Open on an iPhone with a notch (or simulator with notched device + display cutout). Confirm the bar's top edge sits flush at the bottom of the notch inset, headline is fully visible, back/close buttons are not under the notch.

### 6.2 Back button (top left) functionality

**Risk:** Sticky positioning + backdrop-filter could create a stacking context that swallows pointer events, or the button could become unclickable behind the blur layer.

**Why this is safe:**
- `backdrop-filter` does NOT intercept pointer events — it only filters the visual layer behind the element. Click events pass through to the element with the filter and to its children normally
- The back button is a child of the sticky wrapper. Sticky positioning does not affect children's interactivity
- `z-10` on the sticky wrapper ensures it sits above the scrolling content for hit-testing, which is correct — the button should be on top
- The button's `onClick={onBack}` prop is unchanged; the `handleBack` handler in `HelperModal.jsx` is unchanged
- The button's `opacity` and `pointer-events` gating based on `canGoBack` is unchanged

**Verification:** Tap the back button at every depth in the modal: from `triage` to `initial`, from `emergency-contact` to `initial`, from `intention` to `initial`, and from inside `triage` step depth back to the rating step. Tap with `canGoBack={false}` (initial view) — confirm it is non-interactive as today (opacity 0.3, pointer-events none).

### 6.3 Close button (top right) functionality

**Risk:** Same potential issues as the back button — pointer events, hit testing, stacking.

**Why this is safe:** Identical reasoning to §6.2. The close button's `onClick={onClose}` triggers the panel's existing `handleClose` (with the 350ms close animation), which is also unchanged. No close-related state lives in `HelperTopBar`.

**Verification:** Tap the close button from every view state (initial, triage pre-rating, triage post-rating expanded, emergency-contact, emergency-contact while editing, intention, intention while editing). Confirm the modal closes with the same slide-up + fade-out as today.

### 6.4 Content positioning — "no resize" requirement

**Risk:** The structural change shifts the headline, the back button, the close button, or the first row of content by any number of pixels.

**Why this is safe — analyzed slot by slot:**

| Slot | Current visual position | After change | Same? |
|---|---|---|---|
| Back button (top-left) | Inside `HelperTopBar` at `px-5 pt-2`, panel top + safe-area-inset-top + 8px | Same — `HelperTopBar` internal layout is untouched | ✅ |
| Headline `<h2>` ("What's happening?") | Inside `HelperTopBar`, with `marginTop: 14px`, `marginBottom: 26px` | Same — `HelperTopBar` internal layout is untouched | ✅ |
| Close button (top-right) | Inside `HelperTopBar` at `px-5 pt-2`, top-right | Same — `HelperTopBar` internal layout is untouched | ✅ |
| First row of body content | Top of scroll container, currently flush against `HelperTopBar` bottom edge with `-2px` overlap (-2px set on the wrapper outside the scroll container) | Top of scroll container, sticky bar above, with `-2px` overlap (-2px set on the sticky wrapper inside the scroll container) | ✅ — `-2px` is preserved in the new wrapper |
| Horizontal padding of body content | `px-5` from scroll container | `px-5` from inner content wrapper | ✅ — same 20px each side |
| Body content vertical start position | scroll container top = panel top + safe-area + topbar height − 2px | scroll container top + sticky bar height − 2px = panel top + safe-area + topbar height − 2px | ✅ — algebraically identical |

**Net result: zero pixel shift on any slot.** Every position is preserved.

### 6.5 Backdrop-filter inside `overflow: hidden` ancestor

**Risk:** Some older Safari versions had bugs where `backdrop-filter` on a `position: sticky` element inside an `overflow: hidden` ancestor sampled the wrong layer or rendered as solid.

**Why this is safe in practice:** This bug was resolved in iOS Safari 14 (released 2020). The app already uses `backdrop-filter` on `Header.jsx` and `TabBar.jsx` and ships to the same audience. If those work on the user's iOS targets, this will too. The panel's `overflow-hidden` is on the **outer** panel (sibling-grandparent of the sticky bar) — not on the immediate scroll container. The scroll container itself has `overflow-y-auto` (or `-hidden` for non-scrolling views), which is the normal sticky-with-blur pattern and is the documented working case.

**Verification:** Open the modal on a real iOS device (or Safari with iOS user agent) and confirm the bar renders blurred content behind it once content is scrolled. Toggle dark mode — confirm the blur reads correctly in both themes.

### 6.6 Panel transform creating a containing block

**Risk:** The panel uses `-translate-x-1/2` (CSS transform). Transforms create new containing blocks for fixed-positioned descendants, which can sometimes interact unexpectedly with sticky descendants.

**Why this is safe:** Per the CSSWG spec, `position: sticky` is constrained by its **scrolling container**, not by its containing block. The scrolling container here is the `flex-1` div, which is not transformed. The panel's transform affects the panel's own positioning relative to the viewport (centering it horizontally), and creates a containing block for any hypothetical `position: fixed` descendants — but there are none in this subtree.

**Verification:** Confirm the bar remains stuck at the top of the scroll container during vertical scrolling, including on viewports where the panel is narrower than `max-w-[800px]` (i.e., mobile).

### 6.7 Modal height transition (350ms)

**Risk:** Sticky element behavior could glitch when the parent scroll container's height changes (during the rating-committed expansion).

**Why this is safe:** Sticky positioning recalculates on each layout. A height change on the scroll container changes how much room there is for scrolling, but does not move the sticky bar — it stays at `top: 0` of the scroll container's viewport throughout. The bar will stay visually pinned during the 350ms height transition. No re-layout flicker is expected.

**Verification:** Inside the triage flow, commit a rating (9 or 10) and watch the modal expand. Confirm the bar stays pinned to the top of the modal with no jitter or movement during the height transition.

### 6.8 Modal slide-in/slide-out animations

**Risk:** `animate-slideDownIn` / `animate-slideUpOut` might interact with sticky bar positioning.

**Why this is safe:** The animation is applied to the **outer panel**. The sticky bar is a great-grandchild of the panel and rides along with it. Sticky positioning is computed within the scroll container's coordinate space, which moves as a single unit with the panel. The bar will animate in/out smoothly with the panel.

**Verification:** Open and close the modal repeatedly. Confirm no flicker, no flash of the bar mis-positioning, and no visual artifact during the 350ms close animation.

### 6.9 Fade transition on view changes

**Risk:** The `isContentVisible` opacity fade currently wraps `renderContent()`. Moving the top bar inside the scroll container could accidentally place it inside the fade wrapper, causing the bar to fade with content changes.

**Why this is safe:** In the new structure (§5.2), the sticky bar wrapper and the fade wrapper are **siblings** inside the scroll container, not nested. The fade wrapper wraps only `renderContent()`. The bar remains stable across `pushStep` / `handleBack` transitions — same as today.

**Verification:** Navigate between views (initial → triage → back → emergency-contact → back). Confirm only the body content fades; the bar stays at full opacity throughout.

### 6.10 Rubber-band scroll fix preserved

**Risk:** Restructuring the scroll container could accidentally undo the `overflow-x-hidden` fix from the previous task.

**Why this is safe:** The scroll container's classnames in the new structure explicitly include `overflow-x-hidden` alongside `overflow-y-auto` in the triage/emergency-contact branch. The `overflow-y-hidden` branch (for non-scrolling views) does not need x-hidden because nothing is scrollable there.

**Verification:** Re-run the regional scroll regression check on the 8 affected regions (NL, CH, ZA, AR, SG, KR, US, INTL). Confirm no horizontal rubber-band.

### 6.11 Initial step / pre-session views (non-scrolling)

**Risk:** Sticky positioning requires a scrollable ancestor to behave meaningfully. On views where `overflow-y-hidden` is set, sticky might render unexpectedly.

**Why this is safe:** `position: sticky` with `top: 0` simply behaves as `relative` until the element would otherwise be scrolled out of view. On a non-scrolling container, the element stays at its natural position (top of container). No visual difference from current behavior on these views. The bar still gets its glass background; the content behind it is just static rather than scrolled, so the glass effect reads more like a subtle tint than diffusion — which is fine and expected.

**Verification:** Open the modal in `not-started` / `intake` phase (PreSessionContent view). Confirm the bar looks correct and content positioning is unchanged.

### 6.12 Glass effect at scroll-top (no content behind)

**Risk:** When scroll position is 0, there is no content "behind" the sticky bar — only the panel's solid `var(--bg-primary)` background. The glass will look identical to the solid background, defeating the visual.

**Why this is acceptable:** This is exactly the same behavior as the main app's `Header` — when no content has scrolled under it, it renders as solid bg-primary. As soon as the user scrolls, content diffuses behind the glass. This is a feature, not a bug — the glass effect is meant to indicate "there's content underneath." Matches user expectation from elsewhere in the app.

### 6.13 `useAppStore` import in HelperTopBar

**Risk:** Adding a `useAppStore` subscription to `HelperTopBar` introduces a re-render trigger.

**Why this is safe:** The selector `(s) => s.preferences?.glassEffect ?? true` returns a primitive (boolean), so Zustand's default shallow comparison will only re-render when the value actually changes. Toggling glass effect is a rare user action (settings menu); the re-render cost is negligible. The same pattern is already used by `Header.jsx` and `TabBar.jsx` without issue.

### 6.14 Build / lint

**Risk:** New imports or unused code triggering ESLint warnings.

**Why this is safe:** Only one new import in `HelperTopBar` (`useAppStore`), used immediately. No dead code. The `react-hooks/exhaustive-deps` rule is already downgraded in this project per CLAUDE.md memory.

## 7. Files to modify

- `src/components/helper/HelperTopBar.jsx` — add `useAppStore` import; apply glass styles to the existing wrapper div (background, backdrop-filter, webkit-backdrop-filter, border-bottom); read `glassEffect` from preferences
- `src/components/helper/HelperModal.jsx` (lines 393–421) — restructure the panel children: move `HelperTopBar` inside the scroll container as a `sticky top-0 z-10` child with `marginBottom: -2px`; relocate `px-5` from the scroll container to the inner content wrapper; remove `pt-0` from the scroll container; remove the standalone `marginBottom: -2px` wrapper that was a flex sibling

## 8. Verification plan

In order — each step must pass before moving to the next:

1. **Visual:** Open the modal in active session, no scrolling required. Bar renders with subtle glass tint, hairline bottom border. Headline + buttons all visible.
2. **Layout (the critical check):** Open in active session. Take a screenshot. Mentally diff against the same screenshot pre-change. Every position of every element should be byte-identical. Pay particular attention to the back button's top-left position, the close button's top-right position, and the headline's vertical position.
3. **Notch:** Open on a notched iPhone (simulator or real). Bar sits below the notch; headline and buttons are not occluded.
4. **Back button:** Navigate `initial → triage → triage step 2 → back → back → back`. Each tap goes back one level. The back button shows `opacity: 0.3` and is non-interactive when `canGoBack=false`.
5. **Close button:** From every view (initial, triage pre-rating, triage post-rating, emergency-contact, emergency-contact-editing, intention, intention-editing), tap the close button. Modal closes with the standard 350ms slide-up + fade-out.
6. **Glass effect in action:** Inside `triage`, rate 9 or 10 to expose the scrollable emergency content. Scroll the content up. The bar should remain pinned at the top with visibly blurred content sliding underneath.
7. **Height transition:** From the same triage view, commit a rating and watch the modal expand. Bar stays pinned, no jitter.
8. **View transitions / fade:** Push and pop between views. Only the body content fades; the bar stays full opacity.
9. **Rubber-band regression check:** With region set to each of NL, CH, ZA, AR, SG, KR, US, INTL — confirm no horizontal scroll. (This validates §6.10.)
10. **Toggle glass off:** In settings, disable `glassEffect`. Re-open the modal. Bar becomes solid `var(--bg-primary)`, no blur. Re-enable, confirm bar returns to glass.
11. **Dark mode:** Toggle dark mode. Bar reads correctly in both themes (glass tint adapts via the `var(--bg-primary)` reference).
12. **iOS Safari only:** On a real iOS device, repeat steps 6 and 7. Confirm no flicker, no solid-fallback rendering, no stale-blur artifacts.

## 9. Rollback plan

Both files are isolated changes with no cross-file coupling beyond what already exists. To roll back:

1. Revert `HelperTopBar.jsx` to remove the glass styles and the `useAppStore` import
2. Revert `HelperModal.jsx` lines 393–421 to restore the original sibling structure (standalone topbar wrapper above, scroll container below with `px-5 pt-0 pb-6`)

No state, no migrations, no persisted data is affected. Rollback is a pure code revert.

## 10. Out of scope (deferred)

- Adjusting the `60%` transparency value based on user feedback — easy to tune post-merge
- Refactoring the `CopyablePhone` `float-right` pattern in `EmergencyFlow.jsx` (the underlying cause of why some regions had content overflow in the rubber-band issue) — symptom is fixed by `overflow-x-hidden`; the float pattern is fragile but not broken
- Applying a similar glass treatment to the booster modal or module library drawer — separate consideration
