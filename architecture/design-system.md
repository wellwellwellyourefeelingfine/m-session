# Design System

> For MasterModule-specific animation conventions (which animation goes where, header fades, idle-screen anatomy) — see the [MasterModule Style Sheet](../src/components/active/modules/MasterModule/MasterModuleStyleSheet.md). This chapter covers app-wide primitives.

**Desktop layout cap:** UI content is capped at `max-w-[1000px] mx-auto` on the inner row of `<main>`, Header, TabBar, ModuleStatusBar, ModuleProgressBar, and ModuleControlBar — fixed bar backgrounds stay full-bleed; no-op below 1000px viewport.

## CSS Variables (`index.css`)

```css
/* Light Mode */
--bg-primary: #F5F5F0;
--text-primary: #3A3A3A;
--accent: #E8A87C;        /* Warm orange */

/* Dark Mode (.dark) */
--bg-primary: #1A1A1A;
--accent: #9D8CD9;        /* Soft purple */
```

## Typography
- **Primary font:** Azeret Mono (monospace) — all body text, uppercase by default
- **Secondary font:** DM Serif Text (serif) — headers/titles, normal case
- **Pattern:** Use CSS variables for colors to enable dark mode

## Accent Button Style

For important, high-visibility UI elements:

```jsx
className="border border-[var(--accent)] bg-[var(--accent-bg)]"
```

**Use sparingly** — reserved for primary CTAs, selected options, important status indicators. Adapts to light/dark mode.

## Circle Spacer

A small stroke-only circle used as a visual separator between content sections:

```jsx
<div className="flex justify-center mb-4">
  <div className="circle-spacer" />
</div>
```

- **Size:** 6px diameter, **Stroke:** 1.5px tertiary text color, **Fill:** None
- **Class:** `.circle-spacer` defined in `index.css`

## Custom Animations

Keyframe animations defined in `index.css`:

| Keyframe | Purpose | Easing / duration |
|----------|---------|-------------------|
| `fadeIn` / `fadeOut` | Backdrop overlays for all sheet modals | `0.3s ease-out` |
| `slideUp` | Bottom-sheet modal entrance (`translateY(100%) → 0`) | `0.35s cubic-bezier(0.65, 0, 0.35, 1)` |
| `slideDownOut` | Bottom-sheet modal exit (`translateY(0) → 100%`) | `0.35s cubic-bezier(0.65, 0, 0.35, 1)` |
| `slideDownIn` | Top-anchored modal entrance — HelperModal (`translateY(-100%) → 0`) | `0.35s cubic-bezier(0.65, 0, 0.35, 1)` |
| `slideUpOut` | Top-anchored modal exit (`translateY(0) → -100%`) | `0.35s cubic-bezier(0.65, 0, 0.35, 1)` |
| `slideDown` | Small popover drop-in — AISettingsPanel | `0.3s ease-out` |
| `slideUpSmall` | Minimized check-in/booster status bar | `0.3s ease-out` |
| `slideInFromRight` / `slideOutToRight` / `slideInFromLeft` / `slideOutToLeft` | Horizontal slides for journal navigation and AI sidebar | `0.3s ease-out forwards` |
| `breath-idle`, `orb-glow` | BreathOrb visualization | varies |

The four full-slide keyframes animate **transform only — no opacity**. Modal panels feel like solid physical objects sliding into view. The backdrop fades independently via `fadeIn`/`fadeOut`.

The `cubic-bezier(0.65, 0, 0.35, 1)` curve is a symmetric ease-in-out used consistently across all full-slide keyframes.

## Scroll Reveal System

Scroll-triggered entrance animations ported from the landing page. Elements start invisible and shifted down 24px, then fade+slide into view.

**CSS classes** (in `index.css`):
- `.rv` — base: `opacity: 0; transform: translateY(24px)` with 0.9s expo-out transition
- `.rv.visible` — revealed: `opacity: 1; transform: translateY(0)`
- `.rv-d1` through `.rv-d5` — stagger delays in 80ms increments

**Hook** (`src/hooks/useScrollReveal.js`): single `IntersectionObserver` (threshold 0.08), hero elements revealed on mount, non-hero on scroll (one-shot).

**Currently used on**: `ActiveEmptyState.jsx` only.

**Altered-state UX note**: Use sparingly within the app. Works on the initial welcome page (user is sober). During active sessions, scroll-triggered motion is disorienting. The app's in-session design favors static layouts — reserve scroll reveal for pre-session contexts.

Respects `prefers-reduced-motion` via the existing global rule.

## Modal Layout Pattern (Sheet Modals)

All sheet modals follow the same structural template:

```jsx
<div className="fixed inset-0 z-50">                                     {/* outer wrapper */}
  <div                                                                   {/* backdrop — SIBLING */}
    className={`absolute inset-0 bg-black/25 ${
      isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
    }`}
    onClick={handleClose}
  />
  <div                                                                   {/* panel — SIBLING */}
    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md
      bg-[var(--color-bg)] rounded-t-2xl flex flex-col overflow-hidden ${
        isClosing ? 'animate-slideDownOut' : 'animate-slideUp'
      }`}
    style={{ height: modalHeight }}
  >
    {/* panel content */}
  </div>
</div>
```

**Critical: backdrop and panel must be SIBLINGS, not parent/child.** CSS opacity is multiplicative — a panel inside a fading backdrop inherits the fade.

For top-anchored modals (HelperModal), use `absolute top-0` and `animate-slideDownIn` / `animate-slideUpOut`.

**Close handler** — match the 0.35s animation:

```javascript
const [isClosing, setIsClosing] = useState(false);
const handleClose = () => {
  if (isClosing) return;
  setIsClosing(true);
  setTimeout(() => onClose(), 350);
};
```

## Animation Components

### BreathOrb (`capabilities/animations/BreathOrb.jsx`)

Breathing visualization with orbital moon animation:
- **Main orb** scales with breath phases (inhale expands, exhale contracts)
- **Orbital ring** with moon marker traveling the circumference
- **Center text** shows current phase label + countdown
- **Idle state** uses gentle 4-second pulse animation. Driven by `useBreathController` hook

### AsciiMoon (`capabilities/animations/AsciiMoon.jsx`)

Looping ASCII art moon animation:
- **Characters**: Uses 'M', 'D', 'M', 'A' letters for dark areas, punctuation for lit areas
- **Animation**: 10-second cycle — waxing → full → waning → new
- **Rendering**: 50ms frame updates with staggered character changes
- **Grid**: 20x20 character grid with eased phase transitions

### AsciiDiamond (`capabilities/animations/AsciiDiamond.jsx`)

Compact looping ASCII art diamond:
- **Characters**: Uses 'L', 'O', 'V', 'E' for dense areas, punctuation for lit areas
- **Animation**: 8-second cycle — fills from center outward, empties from center outward
- **Grid**: 7x7 character grid (~1/3 the size of AsciiMoon)
- **Used in**: SubstanceChecklist Step 4, HomeView welcome

### MorphingShapes (`capabilities/animations/MorphingShapes.jsx`)

Three overlapping shapes (stroke only) with polyrhythmic timing:
- **Shape A**: circle → square → circle (CSS border-radius)
- **Shape B**: square → circle → square (opposite phase)
- **Shape C**: center point → full circle → center point (SVG, 2/3 duration ratio)
- **Color**: Always renders in accent color
- **Props**: `size`, `strokeWidth`, `duration`
