# MDMA Session Guide - Technical Specification

> **Last Updated:** January 2026
> **Version:** 0.1.0
> **Status:** Active Development

This document provides a comprehensive technical overview of the MDMA Session Guide meditation app for developers who want to contribute to or extend the project.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Architecture Overview](#architecture-overview)
5. [State Management](#state-management)
6. [Module System](#module-system)
7. [The Breath Meditation System](#the-breath-meditation-system)
8. [Design System](#design-system)
9. [Adding New Features](#adding-new-features)
10. [Key Patterns & Conventions](#key-patterns--conventions)
11. [Known Limitations & TODOs](#known-limitations--todos)

---

## Project Overview

A React-based progressive web app designed to guide users through therapeutic MDMA sessions with structured meditation modules, breathing exercises, journaling, and phase-based session management.

### Core Features
- **Intake Questionnaire:** Pre-session assessment (4 sections)
- **Timeline Management:** Customizable session phases (come-up, peak, integration)
- **Modular Meditation System:** Pluggable meditation/breathing/journaling modules
- **Breathing Meditation with Orb Animation:** Fully reusable breathing component
- **Journal System:** Session-integrated journaling with multiple entry types
- **Come-Up Check-Ins:** Automated user comfort monitoring during onset phase

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| State Management | Zustand | 5.0.10 |
| Styling | Tailwind CSS | 4.1.18 |
| PWA | vite-plugin-pwa | 1.2.0 |
| Date Utilities | date-fns | 4.1.0 |

### Why These Choices
- **Zustand:** Minimal boilerplate, great performance, built-in persistence
- **Vite:** Fast HMR, modern ES modules, excellent dev experience
- **Tailwind CSS v4:** CSS-first configuration, excellent utility classes
- **React 19:** Latest features, improved performance

---

## Directory Structure

```
src/
├── components/
│   ├── active/                    # Active session (meditation playback)
│   │   ├── modules/               # Custom module components
│   │   │   ├── BreathMeditationModule.jsx   # Orb breathing (REUSABLE)
│   │   │   ├── BreathingModule.jsx          # Simple breathing cycles
│   │   │   ├── GroundingModule.jsx          # Sequential grounding steps
│   │   │   ├── JournalingModule.jsx         # Text input modules
│   │   │   ├── GuidedMeditationModule.jsx   # Timed prompts
│   │   │   └── CheckInModule.jsx            # User check-ins
│   │   ├── capabilities/          # Composable UI building blocks
│   │   │   ├── hooks/             # useModuleTimer, useModuleState
│   │   │   ├── animations/        # BreathOrb component
│   │   │   ├── TimerCapability.jsx
│   │   │   ├── PromptsCapability.jsx
│   │   │   ├── ModuleControlBar.jsx
│   │   │   └── ModuleShell.jsx    # Generic capability-based renderer
│   │   ├── hooks/
│   │   │   └── useBreathController.js  # Core breath timing engine
│   │   ├── moduleRegistry.js      # Module type → component mapping
│   │   ├── ModuleRenderer.jsx     # Routes to correct component
│   │   └── ActiveView.jsx         # Main active tab view
│   ├── home/                      # Home tab (intake, pre-session)
│   ├── journal/                   # Journal tab
│   ├── tools/                     # Tools tab (FAQ, dosage, settings)
│   ├── layout/                    # AppShell, Header, TabBar
│   └── shared/                    # Button, Input, Modal, etc.
├── stores/
│   ├── useAppStore.js             # Global app state (tabs, dark mode)
│   ├── useSessionStore.js         # Session state (~1250 lines)
│   ├── useJournalStore.js         # Journal entries
│   └── useToolsStore.js           # Tools panel state
├── content/
│   ├── modules/
│   │   ├── library.js             # All module definitions
│   │   └── index.js               # Module utilities
│   ├── meditations/
│   │   ├── index.js               # Meditation registry
│   │   ├── guided-breath-orb.js   # Adjustable duration meditation
│   │   ├── breath-awareness.js
│   │   └── calming-breath-15min.js  # Fixed 15-min structured meditation
│   └── intake/                    # Intake questionnaire sections
├── App.jsx                        # Tab routing, main layout
├── App.css                        # Root container styles
├── index.css                      # Tailwind + design system
└── main.jsx                       # React DOM entry
```

---

## Architecture Overview

### Tab-Based Navigation

The app uses a 4-tab structure with **all views kept mounted** to preserve state:

```jsx
// App.jsx - Views hidden/shown, never unmounted
<div className={currentTab === 'home' ? '' : 'hidden'}>
  <HomeView />
</div>
<div className={currentTab === 'active' ? '' : 'hidden'}>
  <ActiveView />
</div>
// ... journal, tools
```

**Why:** Meditation timers and playback state must persist across tab switches.

### Component Hierarchy

```
App
└── AppShell (layout wrapper)
    ├── Header
    ├── Main Content
    │   ├── HomeView → Intake, Timeline Editor, Substance Checklist
    │   ├── ActiveView → ModuleRenderer → [Module Components]
    │   ├── JournalView → Entry List, Editor
    │   └── ToolsView → FAQ, Dosage, Resources, Settings
    ├── ModuleStatusBar (fixed, shows progress)
    └── TabBar
```

### Session Flow

```
1. Intake (4 sections) → generates timeline preferences
2. Pre-Session → customize module order, durations
3. Substance Checklist → record dosage, ingestion time
4. Active Session:
   ├── Come-Up Phase → modules + check-ins → "fully arrived" triggers transition
   ├── Peak Phase → deeper modules
   └── Integration Phase → journaling, closing
5. Session Complete → summary
```

---

## State Management

### Zustand Stores

All stores use `persist` middleware for localStorage backup.

#### useAppStore (Global)
```javascript
{
  currentTab: 'home',           // home | active | journal | tools
  darkMode: false,
  preferences: {
    autoAdvance: false,
    notificationsEnabled: false,
    reduceMotion: false,
    timerSound: false
  }
}
```

#### useSessionStore (Session Data - ~1250 lines)
The main state store. Key sections:

```javascript
{
  // Phase tracking
  sessionPhase: 'not-started' | 'intake' | 'pre-session' |
                'substance-checklist' | 'active' | 'paused' | 'completed',
  activePhase: 'come-up' | 'peak' | 'integration',

  // Intake responses
  intake: {
    currentSection: 0,
    responses: { /* questionnaire answers */ },
    isComplete: false,
    showWarnings: false
  },

  // Timeline configuration
  timeline: {
    scheduledStartTime: null,
    actualStartTime: null,
    targetDuration: 240, // minutes
    phases: {
      comeUp: { min: 45, max: 90, allocated: 60 },
      peak: { min: 90, max: 180, allocated: 120 },
      integration: { min: 30, max: 60, allocated: 60 }
    }
  },

  // Module instances
  modules: {
    items: [/* module instances */],
    currentModuleInstanceId: null,
    history: []
  },

  // Come-up check-in state
  comeUpCheckIn: {
    isVisible: false,
    responses: [],
    currentResponse: ''
  },

  // Meditation playback tracking
  meditationPlayback: {
    moduleInstanceId: null,
    isPlaying: false,
    startedAt: null
  }
}
```

**Key Actions:**
- `startIntake()`, `completeIntake()`
- `generateTimelineFromIntake()`
- `addModule(libraryId, phase)`, `removeModule()`, `reorderModule()`
- `startSession()`, `completeModule()`, `skipModule()`
- `transitionToPeak()`, `transitionToIntegration()`
- `recordCheckInResponse()`

#### useJournalStore
```javascript
{
  entries: [],
  navigation: { currentView: 'editor' | 'list', activeEntryId: null },
  settings: { fontSize, fontFamily, lineHeight }
}
```

---

## Module System

### Module Data Flow

```
1. Library Definition (content/modules/library.js)
   ↓
2. Module Instance (created during session setup)
   ↓
3. ModuleRenderer (routes to component)
   ↓
4. Module Component (renders UI)
```

### Library Definition Structure

```javascript
// content/modules/library.js
{
  id: 'breathing-4-7-8',
  type: 'breathing',                    // Routing key
  title: '4-7-8 Breathing',
  description: 'Calming breath pattern...',
  defaultDuration: 10,
  minDuration: 5,
  maxDuration: 15,
  intensity: 'gentle',                  // gentle | moderate | deep
  allowedPhases: ['come-up', 'peak', 'integration'],
  recommendedPhases: ['come-up'],
  content: {
    // Module-specific content (breathing patterns, prompts, etc.)
    breathPattern: { inhale: 4, hold: 7, exhale: 8 }
  },
  capabilities: {
    // UI configuration for ModuleShell
    timer: { type: 'countdown' },
    prompts: { type: 'static', text: '...' }
  },
  tags: ['breathing', 'beginner', 'calming']
}
```

### Module Instance Structure

```javascript
// Created per-session, stored in useSessionStore.modules.items
{
  instanceId: 'uuid-123',              // Unique per session
  libraryId: 'breathing-4-7-8',        // References library
  phase: 'come-up',
  title: '4-7-8 Breathing',
  duration: 10,                        // User-configured
  status: 'upcoming' | 'active' | 'completed' | 'skipped',
  order: 0,
  content: { /* merged from library */ },
  startedAt: null,
  completedAt: null
}
```

### Module Registry (moduleRegistry.js)

Two-tier routing system:

```javascript
// Custom components (need specialized logic)
CUSTOM_MODULES = {
  'breathing': BreathingModule,
  'breath-meditation': BreathMeditationModule,
  'journaling': JournalingModule,
  'grounding': GroundingModule,
  'check-in': CheckInModule,
  // ... journaling variants
}

// Generic shell types (use capabilities config)
SHELL_MODULE_TYPES = [
  'meditation', 'body-scan-light', 'body-scan-deep',
  'open-awareness', 'self-compassion', 'open-space',
  'gentle-movement', 'music-listening', 'break'
]
```

### Adding a New Module Type

**Option 1: Capability-Based (No Custom Code)**
1. Add definition to `content/modules/library.js`
2. Set `type` to a shell-compatible type or add to `SHELL_MODULE_TYPES`
3. Configure `capabilities` object

**Option 2: Custom Component**
1. Create component in `components/active/modules/`
2. Import and add to `CUSTOM_MODULES` in `moduleRegistry.js`
3. Add definition to library

---

## The Breath Meditation System

The breathing module is designed to be **fully reusable** in other meditation modules.

### Architecture

```
BreathMeditationModule (main component)
├── useBreathController (hook) - All timing logic
├── BreathOrb (component) - Visual animation
├── ModuleControlBar - Play/pause/skip controls
└── DurationPicker - Duration selection
```

### useBreathController Hook

The core engine for breath timing. Supports three sequence types:

```javascript
const controller = useBreathController({
  sequences: [
    // Type 1: Cycle-based (repeat N times)
    { type: 'cycles', count: 6, pattern: { inhale: 4, exhale: 4 } },

    // Type 2: Duration-based (run for X seconds)
    { type: 'duration', seconds: 60, pattern: { inhale: 5, hold: 2, exhale: 7 } },

    // Type 3: Idle (free breathing period)
    { type: 'idle', duration: 150, label: 'Free Breathing' }
  ],
  onComplete: () => console.log('Meditation complete'),
  onSequenceChange: (index) => console.log('New sequence:', index)
});

// Returns:
{
  // Current breath state
  phase: 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale',
  phaseProgress: 0.5,           // 0-1 within current phase
  phaseDuration: 4,             // Seconds for this phase
  phaseSecondsRemaining: 2,     // Countdown

  // Orbit animation
  moonAngle: 270,               // 0-360 degrees

  // Cycle tracking
  currentCycle: 2,
  totalCyclesInSequence: 6,
  currentSequenceIndex: 0,

  // Overall progress
  overallProgress: 15,          // 0-100 across all sequences

  // Playback state
  isRunning: true,
  isComplete: false,
  hasStarted: true,

  // Controls
  start(), pause(), resume(), stop(), reset()
}
```

### BreathOrb Component

Visual representation with orbital animation:

```jsx
<BreathOrb
  phase="inhale"
  progress={0.5}
  moonAngle={180}
  size="medium"              // small | medium | large
  showRing={true}
  countdown={3}
  label="Inhale"
/>
```

**Layers:**
1. SVG orbital ring with markers
2. Moon dot (position from moonAngle)
3. Main orb (scales with breath)
4. Center text (phase label + countdown)

**Animations:**
- Active: Orb scales smoothly with phaseProgress
- Idle: Gentle 4s pulse animation
- Moon: Position updated every 50ms (no CSS transition)

### Configuration Modes

```javascript
// 1. Adjustable Duration (user picks 10-30 min)
const sequences = generateBreathSequences(15); // 15 minutes

// 2. Fixed Duration (pre-built meditation)
import { calmingBreath15Min } from '../content/meditations/calming-breath-15min';
const sequences = convertSegmentsToSequences(calmingBreath15Min.segments);

// 3. Custom Sequences (from module.content)
const sequences = module.content?.breathSequences;
```

### Timed Prompts

Prompts fade in/out during meditation:

```javascript
prompts: [
  { timeSeconds: 5, text: "Follow the orb with your breath." },
  { timeSeconds: 30, text: "Let each exhale release tension." },
  { timeSeconds: 60, text: "Notice the space between breaths." }
]
// Each prompt displays for ~8 seconds when its time is reached
```

### Web API Integration

- **WakeLock API:** Keeps screen awake during meditation
- **Visibility API:** Pauses when tab is hidden (optional)
- **Performance:** Uses `requestAnimationFrame` for smooth updates

---

## Design System

### CSS Variables (index.css)

```css
/* Light Mode */
--bg-primary: #F5F5F0;
--bg-secondary: #ECECEC;
--bg-tertiary: #E5E5E5;
--text-primary: #3A3A3A;
--text-secondary: #666666;
--text-tertiary: #999999;
--border: #D0D0D0;
--accent: #E8A87C;              /* Warm orange */
--accent-muted: #E8A87C80;
--accent-bg: #E8A87C20;

/* Dark Mode */
--bg-primary: #1A1A1A;
--accent: #9D8CD9;              /* Soft purple */
```

### Typography
- **Font:** Azeret Mono (monospace)
- **Style:** All caps, tracking-wide
- **Sizes:** text-[10px] to text-3xl

### Tailwind Patterns

```jsx
// CSS variable integration
<p className="text-[var(--color-text-tertiary)]">

// Custom animations
<div className="animate-fadeIn">
<div className="animate-breath-idle">

// Dark mode
<div className="bg-app-white dark:bg-app-black">
```

### Custom Animations

Defined in `index.css`:
- `fadeIn`, `fadeOut`
- `slideUp`, `slideDown`, `slideUpSmall`
- `slideInFromLeft/Right`, `slideOutToLeft/Right`
- `orb-glow`, `breathe-pulse`, `breath-idle`

---

## Adding New Features

### Adding a New Meditation Module

1. **Define in Library:**
```javascript
// content/modules/library.js
{
  id: 'my-new-meditation',
  type: 'breath-meditation',  // Use existing type or create new
  title: 'My Meditation',
  defaultDuration: 15,
  content: {
    meditationId: 'my-meditation-content'  // Reference to meditation content
  }
}
```

2. **Create Content (if needed):**
```javascript
// content/meditations/my-meditation.js
export const myMeditation = {
  id: 'my-meditation-content',
  title: 'My Meditation',
  duration: 900,
  segments: [
    { type: 'idle', duration: 10, label: 'Settle In' },
    { type: 'breath', cycles: 6, pattern: { inhale: 4, exhale: 6 } },
    // ...
  ],
  prompts: [
    { timeSeconds: 5, text: 'Begin to notice your breath.' }
  ]
};
```

3. **Register in Meditation Index:**
```javascript
// content/meditations/index.js
import { myMeditation } from './my-meditation';
export const MEDITATIONS = { ...existing, [myMeditation.id]: myMeditation };
```

### Adding a New Custom Module Component

1. **Create Component:**
```javascript
// components/active/modules/MyModule.jsx
export default function MyModule({ module, onComplete }) {
  // Your custom logic here
  return (
    <ModuleLayout>
      {/* Your UI */}
      <ModuleControlBar
        onComplete={onComplete}
        onSkip={() => onComplete(true)}
      />
    </ModuleLayout>
  );
}
```

2. **Register in moduleRegistry.js:**
```javascript
import MyModule from './modules/MyModule';

export const CUSTOM_MODULES = {
  ...existing,
  'my-module-type': MyModule
};
```

### Adding a New Store

```javascript
// stores/useMyStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useMyStore = create(
  persist(
    (set, get) => ({
      // State
      myValue: null,

      // Actions
      setMyValue: (value) => set({ myValue: value }),
    }),
    {
      name: 'mdma-guide-my-store',
      version: 1,
    }
  )
);
```

---

## Key Patterns & Conventions

### State Updates
- Always use Zustand actions, never mutate state directly
- Use `set()` for simple updates, `get()` to read current state in actions

### Component Naming
- Views: `*View.jsx` (HomeView, ActiveView)
- Modules: `*Module.jsx` (BreathingModule, JournalingModule)
- Capabilities: `*Capability.jsx`
- Hooks: `use*.js`

### File Organization
- Keep related files together (module + its hooks + styles)
- Shared components go in `components/shared/`
- Module-specific components go in `components/active/modules/`

### Styling
- Prefer Tailwind utilities over custom CSS
- Use CSS variables for colors (enables dark mode)
- Animations in `index.css` with `@keyframes`

### Error Handling
- Use optional chaining (`?.`) extensively
- Provide fallbacks for missing data
- Stores handle edge cases in actions

---

## Known Limitations & TODOs

### Current Limitations
- [ ] No audio/sound support yet (AudioCapability stubbed)
- [ ] PWA offline mode not fully tested
- [ ] No user accounts or cloud sync
- [ ] Fixed to single session at a time

### Future Enhancements
- [ ] Audio integration for guided meditations
- [ ] Haptic feedback on mobile
- [ ] Session history and statistics
- [ ] More meditation content
- [ ] Customizable breathing patterns UI
- [ ] TypeScript migration (optional)

### Performance Notes
- Large session store (~1250 lines) could be split
- Consider lazy loading for tools tab
- Profile orb animation on low-end devices

---

## Quick Reference

### Key Files

| Purpose | File |
|---------|------|
| Main app entry | `src/App.jsx` |
| Session state | `src/stores/useSessionStore.js` |
| Module routing | `src/components/active/moduleRegistry.js` |
| Module definitions | `src/content/modules/library.js` |
| Breath controller | `src/components/active/hooks/useBreathController.js` |
| Orb animation | `src/components/active/capabilities/animations/BreathOrb.jsx` |
| Design tokens | `src/index.css` |

### Useful Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### localStorage Keys

| Key | Store |
|-----|-------|
| `mdma-guide-app-state` | useAppStore |
| `mdma-guide-session-state` | useSessionStore |
| `mdma-guide-journal-state` | useJournalStore |

---

*This document should be updated as the codebase evolves. When making significant architectural changes, please update the relevant sections.*
