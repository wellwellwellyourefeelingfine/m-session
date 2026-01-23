# MDMA Session Guide

A React-based progressive web app that guides users through therapeutic MDMA sessions with structured meditation modules, breathing exercises, journaling, and phase-based session management.

## Quick Start

```bash
npm install
npm run dev      # Start dev server at localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Core Philosophy

This app follows a **modular, capability-based architecture** where:

1. **~80% of modules require zero custom code** - they're defined entirely through configuration
2. **All views stay mounted** - meditation timers persist across tab switches
3. **Phase transitions are human-driven** - the app guides, not dictates
4. **Audio-text synchronization** - voice guidance with synced visual prompts

---

## Tech Stack

| Category | Technology | Why |
|----------|------------|-----|
| Framework | React 19 | Latest features, improved performance |
| Build | Vite 7 | Fast HMR, modern ES modules |
| State | Zustand | Minimal boilerplate, built-in persistence |
| Styling | Tailwind CSS 4 | CSS-first config, utility classes |
| PWA | vite-plugin-pwa | Offline capability |

---

## Directory Structure

```
src/
├── components/
│   ├── active/                    # Active session (meditation playback)
│   │   ├── modules/               # Custom module components (7 types)
│   │   ├── capabilities/          # Composable UI building blocks
│   │   │   ├── animations/        # BreathOrb, AsciiMoon, AsciiDiamond
│   │   │   ├── hooks/             # useBreathController
│   │   │   ├── ModuleLayout.jsx   # Consistent layout wrapper
│   │   │   ├── ModuleControlBar.jsx
│   │   │   └── ModuleShell.jsx    # Generic capability-based renderer
│   │   ├── moduleRegistry.js      # Module type → component mapping
│   │   └── ActiveView.jsx         # Main orchestrator
│   ├── session/                   # Session flow components
│   │   ├── SubstanceChecklist.jsx  # Pre-session preparation (5 steps)
│   │   ├── PreSessionIntro.jsx     # Pre-session ritual (6 steps + intention sub-flow)
│   │   ├── TransitionBuffer.jsx    # Reusable transition screen (quote + animation)
│   │   ├── ComeUpCheckIn.jsx       # Come-up phase check-in modal
│   │   └── PeakTransition.jsx      # Phase transition experience
│   ├── ai/                        # AI Assistant components
│   │   ├── AIAssistantModal.jsx   # Main chat interface
│   │   ├── ChatWindow.jsx
│   │   └── ChatSidebar.jsx
│   ├── home/                      # Intake, timeline editor
│   ├── journal/                   # Entry list + editor
│   ├── tools/                     # FAQ, dosage, settings, philosophy
│   ├── intake/                    # Questionnaire components
│   ├── timeline/                  # Timeline editor components
│   └── layout/                    # AppShell, Header, TabBar
├── stores/
│   ├── useSessionStore.js         # Core session logic (~1250 lines)
│   ├── useAppStore.js             # Global state (tabs, dark mode)
│   ├── useJournalStore.js         # Journal entries
│   ├── useAIStore.js              # AI assistant state + conversations
│   └── useToolsStore.js           # Tools panel state
├── services/
│   ├── aiService.js               # AI provider API integration
│   └── cryptoService.js           # API key encryption
├── hooks/
│   └── useAudioPlayback.js        # Audio playback management
├── content/
│   ├── modules/library.js         # All module definitions
│   ├── meditations/               # Meditation content + audio mappings
│   └── intake/                    # 4-section questionnaire
├── utils/
│   └── buildSystemPrompt.js       # AI context builder
└── App.jsx                        # Tab routing (views kept mounted)

public/
└── audio/
    └── meditations/
        └── open-awareness/        # Pre-recorded TTS audio files
```

---

## Session Flow

```
1. INTAKE (4 sections)
   └── Generates timeline preferences based on user responses

2. PRE-SESSION
   └── User customizes module order, durations, adds/removes activities

3. SUBSTANCE CHECKLIST & PRE-SESSION INTRO
   ├── SubstanceChecklist — Part 1: Preparation (5 steps)
   │   ├── Substance ready
   │   ├── Substance testing
   │   ├── Dosage input (with real-time feedback)
   │   ├── Prepare your space (checklist)
   │   └── Trusted contact & session helper
   └── PreSessionIntro — Part 2: Pre-Session Ritual (6 steps + intention sub-flow)
       ├── Arrival (BreathOrb idle)
       ├── Intention menu (review intention / centering breath / skip)
       │   └── Intention sub-flow: focus reminder → touchstone → intention text
       ├── Letting Go (BreathOrb idle)
       ├── Take substance ("I've Taken It")
       ├── Confirm ingestion time
       └── Begin session (AsciiMoon fade-out → TransitionBuffer → startSession())

4. ACTIVE SESSION
   ├── Come-Up Phase
   │   ├── First module starts immediately with check-in overlay
   │   ├── Check-in prompts between modules (non-blocking)
   │   └── "Fully arrived" → PeakTransition component
   ├── Peak Phase
   │   ├── Transition shows intention, hydration reminder
   │   └── Modules auto-advance (no check-ins)
   └── Integration Phase
       └── Journaling, closing rituals

5. SESSION COMPLETE
```

---

## Module System

### Two-Tier Architecture

**1. Custom Components** (for complex logic):
- `BreathingModule` - Phase-based breathing animation
- `BreathMeditationModule` - BreathOrb + breath sequences
- `OpenAwarenessModule` - Audio-synced guided meditation
- `JournalingModule` - Journal store integration
- `GroundingModule` - Sequential step flow
- `GuidedMeditationModule` - Timed prompts
- `CheckInModule` - User check-ins

**2. ModuleShell** (capability-driven, no custom code):
- Reads module's `capabilities` config
- Composes: timer, prompts, animation, controls
- Used for: meditation, body-scan, self-compassion, break modules

### Adding a New Module

**Option 1: Capability-Based (No Code)**

Just add to `content/modules/library.js`:

```javascript
{
  id: 'my-new-module',
  type: 'meditation',              // Uses ModuleShell
  title: 'My Module',
  defaultDuration: 15,
  allowedPhases: ['peak', 'integration'],
  content: {
    instructions: 'Follow the prompts...'
  },
  capabilities: {
    timer: { type: 'countdown', autoComplete: true },
    prompts: { type: 'sequential', fadeTransition: true },
    controls: { showBeginButton: true, showSkipButton: true }
  }
}
```

**Option 2: Custom Component**

1. Create `components/active/modules/MyModule.jsx`:
```javascript
export default function MyModule({ module, onComplete, onSkip, onTimerUpdate }) {
  return (
    <ModuleLayout>
      {/* Your UI */}
      <ModuleControlBar onComplete={onComplete} onSkip={onSkip} />
    </ModuleLayout>
  );
}
```

2. Register in `moduleRegistry.js`:
```javascript
import MyModule from './modules/MyModule';
export const CUSTOM_MODULES = { ...existing, 'my-type': MyModule };
```

---

## Audio System

### Open Awareness Meditation

The app includes pre-recorded TTS audio for the Open Awareness guided meditation:

- **Location**: `public/audio/meditations/open-awareness/`
- **Segments**: body-space, core, expansion, closing (multiple variations each)
- **Sync**: Audio leads text by 200ms; text fades in after audio starts
- **Fallback**: Graceful text-only mode if audio unavailable
- **Hook**: `useAudioPlayback.js` manages playback state

---

## AI Assistant

An optional AI assistant for session support:

- **Providers**: Supports OpenAI and Anthropic APIs
- **Key Storage**: Encrypted with session-based encryption (auto-expires)
- **Context**: Builds system prompts with session state awareness
- **Components**: `AIAssistantModal`, `ChatWindow`, `ChatSidebar`
- **Store**: `useAIStore.js` manages conversations, settings, streaming

---

## Breath Controller System

The `useBreathController` hook is the core timing engine for all breathing animations:

```javascript
const controller = useBreathController({
  sequences: [
    { type: 'cycles', count: 6, pattern: { inhale: 4, exhale: 4 } },
    { type: 'duration', seconds: 60, pattern: { inhale: 5, hold: 2, exhale: 7 } },
    { type: 'idle', duration: 150, label: 'Free Breathing' }
  ],
  onComplete: () => {},
  onSequenceChange: (index) => {}
});

// Returns: phase, phaseProgress, moonAngle, currentCycle, overallProgress,
//          isRunning, start(), pause(), resume(), stop()
```

---

## State Management

All stores use Zustand with `persist` middleware for localStorage backup.

### useSessionStore (Core)

```javascript
{
  sessionPhase: 'not-started' | 'intake' | 'pre-session' |
                'substance-checklist' | 'active' | 'paused' | 'completed',

  timeline: {
    currentPhase: 'come-up' | 'peak' | 'integration',
    actualStartTime: Date,
    phases: { comeUp: {...}, peak: {...}, integration: {...} }
  },

  modules: {
    items: [/* module instances */],
    currentModuleInstanceId: string | null
  },

  phaseTransitions: {
    activeTransition: 'come-up-to-peak' | 'peak-to-integration' | null
  }
}
```

**Key Actions:**
- `startSession()`, `completeModule()`, `skipModule()`
- `beginPeakTransition()`, `transitionToPeak()`, `transitionToIntegration()`
- `recordCheckInResponse()`, `recordIngestionTime()`, `confirmIngestionTime()`
- `setSubstanceChecklistSubPhase()`, `completePreSubstanceActivity()`

### localStorage Keys

| Key | Store |
|-----|-------|
| `mdma-guide-session-state` | useSessionStore |
| `mdma-guide-app-state` | useAppStore |
| `mdma-guide-journal-state` | useJournalStore |
| `mdma-guide-ai-state` | useAIStore |

---

## Design System

### CSS Variables (`index.css`)

```css
/* Light Mode */
--bg-primary: #F5F5F0;
--text-primary: #3A3A3A;
--accent: #E8A87C;        /* Warm orange */

/* Dark Mode (.dark) */
--bg-primary: #1A1A1A;
--accent: #9D8CD9;        /* Soft purple */
```

### Typography
- **Primary font:** Azeret Mono (monospace) — all body text, uppercase by default
- **Secondary font:** DM Serif Text (serif) — headers/titles, normal case
- **Pattern:** Use CSS variables for colors to enable dark mode

### Accent Button Style

For important, high-visibility UI elements, use the accent-colored button pattern:

```jsx
className="border border-[var(--accent)] bg-[var(--accent-bg)]"
```

**Use sparingly** - this style draws attention and should be reserved for:
- Primary call-to-action buttons (e.g., "Complete intake to begin")
- Currently selected options in choice lists
- Important status indicators

The accent color adapts to light/dark mode (orange in light, purple in dark).

### Circle Spacer

A small stroke-only circle used as a visual separator between content sections:

```jsx
<div className="flex justify-center mb-4">
  <div className="circle-spacer" />
</div>
```

- **Size:** 6px diameter
- **Stroke:** 1.5px, tertiary text color
- **Fill:** None (stroke only)
- **Usage:** Between paragraphs or content blocks to provide subtle visual rhythm
- **Class:** `.circle-spacer` defined in `index.css`

### Custom Animations

Keyframe animations defined in `index.css`: `fadeIn`, `fadeOut`, `slideUp`, `slideDown`, `breath-idle`, `orb-glow`

### Animation Components

#### BreathOrb (`capabilities/animations/BreathOrb.jsx`)

A breathing visualization with orbital moon animation:
- **Main orb** scales smoothly with breath phases (inhale expands, exhale contracts)
- **Orbital ring** with moon marker that travels the circumference
- **Center text** shows current phase label + countdown
- **Idle state** uses gentle 4-second pulse animation

Driven by `useBreathController` hook which manages all timing logic.

#### AsciiMoon (`capabilities/animations/AsciiMoon.jsx`)

A looping ASCII art moon animation displayed on the Active tab before session starts:
- **Characters**: Uses 'M', 'D', 'M', 'A' letters for dark areas, punctuation for lit areas
- **Animation**: 10-second cycle - waxing → full → waning → new
- **Rendering**: 50ms frame updates with staggered character changes for organic feel
- **Grid**: 20x20 character grid with eased phase transitions

#### AsciiDiamond (`capabilities/animations/AsciiDiamond.jsx`)

A compact looping ASCII art diamond animation for smaller visual accents:
- **Characters**: Uses 'L', 'O', 'V', 'E' for dense areas, punctuation for lit areas
- **Animation**: 8-second cycle - fills from center outward, empties from center outward
- **Grid**: 7x7 character grid (~1/3 the size of AsciiMoon)
- **Used in**: SubstanceChecklist Step 4, TransitionBuffer, HomeView welcome

#### MorphingShapes (`capabilities/animations/MorphingShapes.jsx`)

Three overlapping shapes (stroke only) that slowly morph with polyrhythmic timing:
- **Shape A**: circle → square → circle (CSS border-radius)
- **Shape B**: square → circle → square (CSS border-radius, opposite phase)
- **Shape C**: center point → full circle → center point (SVG, 2/3 duration ratio)
- **Color**: Always renders in accent color
- **Props**: `size`, `strokeWidth`, `duration`

#### TransitionBuffer (`session/TransitionBuffer.jsx`)

A reusable transition screen for smooth flow between sections:
- **Sequence**: blank (300ms) → fade in (800ms) → hold (2s) → fade out (800ms) → blank (300ms)
- **Content**: AsciiDiamond animation + randomly selected quote with attribution
- **Usage**: Pass `onComplete` callback; component calls it when animation finishes
- **Total duration**: ~4.2 seconds
- **Quotes**: 7 curated quotes (Rogers, Rilke, Krishnamurti, Marcus Aurelius, Saint-Exupéry, Pascal)

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Main entry | `src/App.jsx` |
| Session state | `src/stores/useSessionStore.js` |
| Module routing | `src/components/active/moduleRegistry.js` |
| Module definitions | `src/content/modules/library.js` |
| Breath engine | `src/components/active/capabilities/hooks/useBreathController.js` |
| Orb animation | `src/components/active/capabilities/animations/BreathOrb.jsx` |
| ASCII moon | `src/components/active/capabilities/animations/AsciiMoon.jsx` |
| ASCII diamond | `src/components/active/capabilities/animations/AsciiDiamond.jsx` |
| Transition buffer | `src/components/session/TransitionBuffer.jsx` |
| Audio playback | `src/hooks/useAudioPlayback.js` |
| Design tokens | `src/index.css` |
| Pre-session flow | `src/components/session/PreSessionIntro.jsx` |
| Substance checklist | `src/components/session/SubstanceChecklist.jsx` |
| Phase transitions | `src/components/session/PeakTransition.jsx` |
| AI assistant | `src/components/ai/AIAssistantModal.jsx` |

---

## Conventions

### Naming
- Views: `*View.jsx` (HomeView, ActiveView)
- Modules: `*Module.jsx` (BreathingModule)
- Hooks: `use*.js` (useBreathController)

### State Updates
- Always use Zustand actions, never mutate directly
- Use `set()` for updates, `get()` to read current state in actions

### Styling
- Prefer Tailwind utilities over custom CSS
- Use CSS variables for colors (enables dark mode)
- Animations defined in `index.css` with `@keyframes`

### Error Handling
- Use optional chaining (`?.`) extensively
- Provide fallbacks for missing data

---

## Architecture Decisions

1. **All views kept mounted** (hidden with CSS, not unmounted)
   - Why: Meditation timers must survive tab switches

2. **Phase transitions as components** (PeakTransition)
   - Why: Supportive, personalized experience between phases

3. **Capability system for modules**
   - Why: 80% of modules need no custom code

4. **Registry pattern for module routing**
   - Why: Clean separation between module types and components

5. **Audio-text sync with audio leading**
   - Why: More natural experience; text confirms what user hears

---

## Current Limitations

- PWA offline mode not fully tested
- No user accounts or cloud sync
- Single session at a time

---

## Contributing

When making changes:

1. For new modules, prefer the capability-based approach first
2. Update this README if you add significant architectural changes
3. Keep stores focused - consider splitting if they grow too large
4. Test on both light and dark modes
5. Verify tab switching doesn't break timer state
6. For audio modules, ensure graceful fallback to text-only
