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
│   │   ├── modules/               # Custom module components (8 types)
│   │   ├── capabilities/          # Composable UI building blocks
│   │   │   ├── animations/        # BreathOrb, AsciiMoon, AsciiDiamond, MorphingShapes
│   │   │   ├── hooks/             # useBreathController
│   │   │   ├── ModuleLayout.jsx   # Consistent layout wrapper
│   │   │   ├── ModuleControlBar.jsx
│   │   │   └── ModuleShell.jsx    # Generic capability-based renderer
│   │   ├── moduleRegistry.js      # Module type → component mapping
│   │   └── ActiveView.jsx         # Main orchestrator
│   ├── session/                   # Session flow & transition components
│   │   ├── SubstanceChecklist.jsx  # Pre-session preparation (5 steps)
│   │   ├── PreSessionIntro.jsx     # Pre-session ritual (6 steps + intention sub-flow)
│   │   ├── TransitionBuffer.jsx    # Reusable transition screen (quote + animation)
│   │   ├── ComeUpCheckIn.jsx       # Come-up phase check-in modal
│   │   ├── PeakTransition.jsx      # Come-up → peak transition (6 steps)
│   │   ├── PeakPhaseCheckIn.jsx    # Peak phase end-of-phase check-in
│   │   ├── BoosterConsiderationModal.jsx # Optional booster dose check-in
│   │   ├── IntegrationTransition.jsx # Peak → integration transition (5-9 steps)
│   │   ├── ClosingCheckIn.jsx      # Prompts user to begin closing ritual
│   │   ├── ClosingRitual.jsx       # 8-step closing ritual
│   │   ├── DataDownloadModal.jsx   # Session data download (text/JSON)
│   │   ├── PostCloseScreen.jsx     # Post-session animation
│   │   └── transitions/           # Transition step content & shared components
│   ├── followup/                  # Follow-up modules (24-48h post-session)
│   │   ├── FollowUpCheckIn.jsx    # How-are-you check-in (24h)
│   │   ├── FollowUpRevisit.jsx    # Revisit session writings (24h)
│   │   ├── FollowUpIntegration.jsx # Integration reflection (48h)
│   │   └── content/              # Follow-up step content
│   ├── ai/                        # AI Assistant components
│   │   ├── AIAssistantModal.jsx   # Main chat interface
│   │   ├── ChatWindow.jsx
│   │   └── ChatSidebar.jsx
│   ├── home/                      # Intake, timeline editor
│   ├── journal/                   # Entry list + editor
│   ├── tools/                     # FAQ, dosage, settings, data download
│   ├── intake/                    # Questionnaire components
│   ├── timeline/                  # Timeline editor components
│   └── layout/                    # AppShell, Header, TabBar
├── stores/
│   ├── useSessionStore.js         # Core session logic (~2250 lines)
│   ├── useAppStore.js             # Global state (tabs, dark mode)
│   ├── useJournalStore.js         # Journal entries
│   ├── useAIStore.js              # AI assistant state + conversations
│   └── useToolsStore.js           # Tools panel state
├── services/
│   ├── aiService.js               # AI provider API integration
│   ├── audioComposerService.js    # Composes TTS clips + silence + gong into single MP3 blob
│   ├── audioCacheService.js       # Caches fetched audio files (IndexedDB)
│   └── cryptoService.js           # API key encryption
├── hooks/
│   ├── useAudioPlayback.js        # Single <audio> element lifecycle (play/pause/resume)
│   ├── useMeditationPlayback.js   # Shared TTS meditation playback orchestration
│   ├── useSilenceTimer.js         # Gong-bookended silence timer (for non-TTS modules)
│   └── useWakeLock.js             # Screen Wake Lock API wrapper
├── content/
│   ├── modules/library.js         # All module definitions
│   ├── meditations/               # Meditation content + audio mappings
│   └── intake/                    # 4-section questionnaire
├── utils/
│   ├── buildSystemPrompt.js       # AI context builder
│   └── downloadSessionData.js     # Session data export (text + JSON)
└── App.jsx                        # Tab routing (views kept mounted)

public/
└── audio/
    └── meditations/
        ├── open-awareness/        # 26 TTS audio files
        ├── body-scan/             # 54 TTS audio files
        ├── self-compassion/       # 70 TTS audio files
        └── protector/             # 16 TTS audio files
```

---

## Session Flow

```
1. INTAKE (4 sections: Experience, Intention, Preferences, Safety)
   └── Generates personalized module timeline based on responses

2. PRE-SESSION (Timeline Editor)
   └── User customizes module order, durations, adds/removes activities

3. SUBSTANCE CHECKLIST (5 steps)
   ├── Substance ready
   ├── Substance testing
   ├── Dosage input (real-time feedback with safety gates at 151mg+ and 300mg+)
   ├── Prepare your space (checklist)
   ├── Supplemental dose prep (conditional — if booster selected in intake)
   └── Trusted contact & session helper

4. PRE-SESSION INTRO (6 steps + intention sub-flow)
   ├── Arrival
   ├── Intention menu (review intention / centering breath / skip)
   │   └── Intention sub-flow: focus reminder → touchstone → intention text
   ├── Letting Go
   ├── Take substance → records ingestion time
   ├── Confirm ingestion time (with adjustment option)
   └── Begin session → TransitionBuffer → startSession()

5. ACTIVE SESSION — COME-UP PHASE
   ├── Modules begin (grounding, breathing, music, etc.)
   ├── Come-up check-in overlay (minimizable, non-blocking)
   │   └── "Nothing yet" / "Starting to feel something" / "Fully arrived"
   └── "Fully arrived" → end-of-phase choice → PeakTransition

6. PEAK TRANSITION (6 steps)
   ├── "You've Arrived" — acknowledgment
   ├── One Word — capture current experience (text input)
   ├── Body Sensations — multi-select grid (8 options)
   ├── Tune In — reassurance
   ├── Let It Unfold — permission statement
   └── Begin → TransitionBuffer → enter peak phase

7. ACTIVE SESSION — PEAK PHASE
   ├── Peak-appropriate modules (meditation, music, journaling, open awareness)
   ├── Booster check-in (conditional — triggers 30 min after "fully arrived" or 90 min floor)
   │   └── Take / Skip / Snooze — expires silently at 150 min, hard cutoff at 180 min
   └── Peak phase check-in → IntegrationTransition

8. INTEGRATION TRANSITION (5-9 steps, dynamic)
   ├── "The Peak Is Softening" — acknowledgment
   ├── Intention check-in — revisit + optional edit
   ├── Focus confirmation — keep or change primary focus
   │   └── (conditional) Focus selector + relationship sub-type
   ├── Tailored activity offer — journaling/compassion/reflection based on focus
   ├── Hydration reminder
   └── Begin → TransitionBuffer → enter integration phase

9. ACTIVE SESSION — INTEGRATION PHASE
   ├── Integration modules (deep journaling, parts work, letter writing, etc.)
   └── Closing check-in → ClosingRitual

10. CLOSING RITUAL (8 steps)
    ├── "Honoring This Experience" — acknowledgment
    ├── Self-gratitude — textarea capture
    ├── Message to future self — textarea capture
    ├── Commitment — textarea capture (with collapsible examples)
    ├── "This Session Is Complete"
    ├── "Before You Go" — data download prompt (text / JSON)
    ├── "Integration Takes Time" — encouragement to return for follow-up
    └── "Take Care" → Close Session → PostCloseScreen animation → Home

11. FOLLOW-UP (time-locked, available on Home screen)
    ├── Check-In (24h) — feeling selector + optional note
    ├── Revisit (24h) — re-read intention, future message, commitment + reflection
    └── Integration Reflection (48h) — what's emerged + commitment status check
```

---

## Module System

### Two-Tier Architecture

**1. Custom Components** (for complex logic):
- `BreathMeditationModule` - BreathOrb + breath sequences
- `OpenAwarenessModule` - Audio-synced guided meditation (shared `useMeditationPlayback` hook)
- `BodyScanModule` - Audio-synced body scan (shared `useMeditationPlayback` hook)
- `SelfCompassionModule` - Audio-synced self-compassion with variation selector (shared `useMeditationPlayback` hook)
- `JournalingModule` - Journal store integration (handles all journaling types: light, deep, letter-writing, parts-work, therapy-exercise)
- `SimpleGroundingModule` - Sequential grounding steps with audio prompts
- `MusicListeningModule` - Duration picker, alarm prompt, recommendations
- `OpenSpaceModule` - Freeform rest with silence timer (`useSilenceTimer` hook)

**2. ModuleShell** (capability-driven, no custom code):
- Reads module's `capabilities` config
- Composes: timer, prompts, animation, controls
- Used for: any future capability-only modules

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

### Adding a Meditation Module (with Audio)

For modules that use the shared `useMeditationPlayback` hook with pre-recorded TTS audio:

**Step 1: Define the content** in `src/content/meditations/<name>.js`:

```javascript
export const myMeditation = {
  id: 'my-meditation',
  title: 'My Meditation',
  description: 'Brief description for the idle screen.',
  speakingRate: 150,          // words per minute (use 90 for slower-paced scripts)
  minDuration: 600,           // 10 min in seconds (for variable-duration)
  maxDuration: 1800,          // 30 min in seconds
  durationSteps: [10, 15, 20, 25, 30],  // minutes
  defaultDuration: 10,
  audio: {
    basePath: '/audio/meditations/my-meditation/',
    format: 'mp3',
  },
  prompts: [
    {
      id: 'intro-1',                // also the audio filename: intro-1.mp3
      text: 'Begin by finding a comfortable position.',
      baseSilenceAfter: 5,          // 5 seconds of silence after this prompt
      silenceExpandable: true,      // silence scales with longer durations
      silenceMax: 15,               // never exceed 15 seconds even at max duration
    },
    {
      id: 'core-1',
      text: 'Bring awareness to your breath.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 30,
    },
    // ... more prompts
  ],
};
```

**Step 2: Register in the meditation library** in `src/content/meditations/index.js`:

```javascript
import { myMeditation } from './my-meditation';

export const meditationLibrary = {
  ...existing,
  'my-meditation': myMeditation,
};

export { myMeditation };
```

**Step 3: Create the component** in `src/components/active/modules/MyMeditationModule.jsx`:

```javascript
import { useState, useMemo } from 'react';
import { getModuleById } from '../../../content/modules';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { MuteButton } from '../capabilities/ModuleControlBar';
import DurationPicker from '../../shared/DurationPicker';

export default function MyMeditationModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const libraryModule = getModuleById(module.libraryId);
  const meditation = getMeditationById('my-meditation');

  const [selectedDuration, setSelectedDuration] = useState(
    module.duration || libraryModule?.defaultDuration || 10
  );
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Build timed sequence — this is the only part unique to each meditation
  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];
    const durationSeconds = selectedDuration * 60;
    const silenceMultiplier = calculateSilenceMultiplier(meditation.prompts, durationSeconds);
    const sequence = generateTimedSequence(meditation.prompts, silenceMultiplier, {
      speakingRate: meditation.speakingRate || 150,
      audioConfig: meditation.audio,
    });
    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : durationSeconds;
    return [sequence, total];
  }, [meditation, selectedDuration]);

  // Shared hook handles timer, audio-text sync, prompt progression, etc.
  const playback = useMeditationPlayback({
    meditationId: 'my-meditation',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete,
    onSkip,
    onTimerUpdate,
  });

  if (!meditation) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] text-center">
            Meditation content not found.
          </p>
        </ModuleLayout>
        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Continue', onClick: onComplete }}
          showSkip={false}
        />
      </>
    );
  }

  return (
    <>
      <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
        {!playback.hasStarted && (
          <div className="text-center animate-fadeIn">
            <IdleScreen title={meditation.title} description={meditation.description} />
            <button
              onClick={() => setShowDurationPicker(true)}
              className="mt-6 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                hover:border-[var(--color-text-tertiary)] transition-colors"
            >
              <span className="text-2xl font-light">{selectedDuration}</span>
              <span className="text-sm ml-1">min</span>
            </button>
          </div>
        )}
        {playback.hasStarted && !playback.isComplete && (
          <div className="text-center px-4">
            {!playback.isPlaying && (
              <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mb-4 animate-pulse">
                Paused
              </p>
            )}
            <p className={`text-[var(--color-text-secondary)] text-sm leading-relaxed transition-opacity duration-300 ${
              playback.promptPhase === 'visible' || playback.promptPhase === 'fading-in' ? 'opacity-100' : 'opacity-0'
            }`}>
              {playback.currentPrompt?.text || ''}
            </p>
          </div>
        )}
        {playback.isComplete && <CompletionScreen />}
      </ModuleLayout>
      <ModuleControlBar
        phase={playback.getPhase()}
        primary={playback.getPrimaryButton()}
        showSkip={!playback.isComplete}
        onSkip={playback.handleSkip}
        skipConfirmMessage="Skip this meditation?"
        rightSlot={
          playback.hasStarted && !playback.isComplete ? (
            <MuteButton isMuted={playback.audio.isMuted} onToggle={playback.audio.toggleMute} />
          ) : null
        }
      />
      <DurationPicker
        isOpen={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        onSelect={setSelectedDuration}
        currentDuration={selectedDuration}
        durationSteps={meditation.durationSteps}
        minDuration={meditation.minDuration / 60}
        maxDuration={meditation.maxDuration / 60}
      />
    </>
  );
}
```

**Step 4: Register the component** in `src/components/active/moduleRegistry.js`:

```javascript
import MyMeditationModule from './modules/MyMeditationModule';
export const CUSTOM_MODULES = { ...existing, 'my-meditation': MyMeditationModule };
```

**Step 5: Add to the module library** in `src/content/modules/library.js`:

```javascript
{
  id: 'my-meditation',
  type: 'my-meditation',    // matches moduleRegistry key
  title: 'My Meditation',
  defaultDuration: 10,
  allowedPhases: ['peak', 'integration'],
}
```

**Step 6: Generate audio** — create `scripts/generate-my-meditation-audio.mjs` following the pattern of existing scripts. Use `--dry-run` first, then generate with `ELEVENLABS_API_KEY`.

**Step 7: Build and test** — `npm run build`, then verify the full flow: idle screen → begin → prompts with audio → pause/resume → mute toggle → completion.

---

## Audio Meditation System

Three meditation modules use pre-recorded TTS audio with synchronized text display, all sharing a unified playback architecture.

### Meditations

| Meditation | Audio Files | Duration | Unique Feature |
|------------|:-----------:|----------|----------------|
| Open Awareness | 26 | 10-30 min (variable) | Conditional prompts for longer sessions (20+ min) |
| Body Scan | 54 | 10-15 min (variable) | Silence expansion concentrated in later body regions |
| Self-Compassion | 70 | ~11-15 min (fixed per variation) | 3 variations assembled from shared core + variation clips |
| Protector Dialogue | 16 | 8-12 min (fixed) | Part of 2-part IFS activity; expandable silences for peak state |

### Architecture

```
Content Definition (src/content/meditations/<name>.js)
  ↓ prompts[] with baseSilenceAfter, silenceExpandable, silenceMax
  ↓
Component useMemo → builds [timedSequence, totalDuration]
  ↓ uses generateTimedSequence() from content/meditations/index.js
  ↓
useMeditationPlayback hook (src/hooks/useMeditationPlayback.js)
  ↓ orchestrates timer, audio-text sync, prompt progression, pause/resume
  ↓
audioComposerService (src/services/audioComposerService.js)
  ↓ fetches TTS clips, composes gong + clips + silence into single MP3 blob
  ↓ returns blobUrl + promptTimeMap for audio-text sync
  ↓
useAudioPlayback hook (src/hooks/useAudioPlayback.js)
  ↓ plays the single composed blob via <audio> element
  ↓ iOS screen-lock resilient (single continuous audio keeps session alive)
  ↓
Audio source files (public/audio/meditations/<name>/<promptId>.<format>)
```

### Audio-Text Sync

- Audio leads text by **200ms** — text fades in after audio starts
- Text fades out **2s into silence** after audio finishes
- **Fallback**: If audio fails or is muted, text displays for 8s then fades out
- Prompt phases: `hidden` → `fading-in` → `visible` → `fading-out`

### Content Property Reference

Every meditation prompt uses these properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique prompt ID, also used as audio filename |
| `text` | string | Yes | Display text shown to user |
| `baseSilenceAfter` | number | Yes | Base silence duration in seconds after this prompt |
| `silenceExpandable` | boolean | No | Whether silence can scale with duration selection |
| `silenceMax` | number | No | Maximum silence in seconds (caps expansion) |
| `conditional` | object | No | e.g. `{ minDuration: 20 }` — only include for sessions >= 20 min |

### Meditation-Level Properties

Each meditation object in `src/content/meditations/<name>.js` exports:

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique meditation ID (matches registry key) |
| `title` | string | Display title |
| `description` | string | Brief description shown on idle screen |
| `speakingRate` | number | Words per minute for duration estimation (e.g. 150 or 90) |
| `prompts` | array | Array of prompt objects (see above) |
| `audio` | object | `{ basePath: '/audio/meditations/<name>/', format: 'mp3' }` |
| `minDuration` | number | Minimum duration in seconds (for variable-duration meditations) |
| `maxDuration` | number | Maximum duration in seconds |
| `durationSteps` | array | Available duration steps in minutes (e.g. `[10, 15, 20, 25, 30]`) |

Self-Compassion also uses: `variations`, `defaultVariation`, `assembleVariation()`, and shared clip segments instead of a flat `prompts` array.

### Shared Hook: `useMeditationPlayback`

All TTS meditation components delegate playback to this shared hook. It handles:

1. Session store integration (start/pause/resume/reset via Zustand)
2. Single-blob audio composition (gong + TTS clips + silence via `audioComposerService`)
3. Prompt progression based on `audio.currentTime` (iOS-resilient, survives screen lock)
4. Audio-text synchronization (audio leads text by 200ms, fade in/out)
5. Media Session API for iOS lock-screen play/pause controls
6. Store-to-audio sync (bridges booster modal pause/resume to audio element)
7. Timer reporting to parent via `onTimerUpdate`
8. Phase derivation (`idle` / `loading` / `active` / `completed`) and primary button state

**Parameters:**
```javascript
useMeditationPlayback({
  meditationId,       // 'open-awareness' | 'body-scan' | 'self-compassion'
  moduleInstanceId,   // module.instanceId
  timedSequence,      // pre-computed by component's useMemo
  totalDuration,      // total duration in seconds
  onComplete,         // callback when user clicks Continue after completion
  onSkip,             // callback when user confirms skip
  onTimerUpdate,      // optional callback for ModuleStatusBar
})
```

**Returns:**
```javascript
{
  hasStarted, isPlaying, isComplete,    // state booleans
  elapsedTime, currentPrompt,           // playback position
  promptPhase,                          // 'hidden' | 'fading-in' | 'visible' | 'fading-out'
  audio,                                // useAudioPlayback instance (isMuted, toggleMute)
  handleStart, handlePauseResume,       // control handlers
  handleComplete, handleSkip,
  getPhase, getPrimaryButton,           // UI helpers
}
```

### Audio Generation

Audio files are generated using ElevenLabs TTS via scripts in `scripts/`. Each meditation has its own generation script that imports prompts from the content definition and outputs MP3 files to the corresponding `public/audio/meditations/<name>/` directory.

| Script | Voice | Prompts | Output Directory |
|--------|-------|:-------:|------------------|
| `generate-body-scan-audio.mjs` | Oliver Silk | 54 | `public/audio/meditations/body-scan/` |
| `generate-self-compassion-audio.mjs` | Oliver Silk | 70 | `public/audio/meditations/self-compassion/` |
| `generate-protector-audio.mjs` | Theo Silk | 16 | `public/audio/meditations/protector/` |
| `generate-simple-grounding-audio.mjs` | Oliver Silk | — | `public/audio/meditations/simple-grounding/` |
| `generate-silence-blocks.mjs` | — | — | Pre-rendered silence MP3 blocks for blob composition |

**Voices:**

| Voice | ID | Typical Settings |
|-------|----|------------------|
| Oliver Silk | `jfIS2w2yJi0grJZPyEsk` | stability 0.88, similarity 0.88, speed 0.70 |
| Theo Silk | `UmQN7jS1Ee8B1czsUtQh` | stability 0.75, similarity 0.70, speed 0.69, speaker_boost on |

**Usage:**
```bash
# Dry run — preview prompts and filenames, no API calls
node scripts/generate-<name>-audio.mjs --dry-run

# Generate all audio files
ELEVENLABS_API_KEY=your_key node scripts/generate-<name>-audio.mjs

# Resume from a specific prompt index (0-based) — skips earlier prompts
ELEVENLABS_API_KEY=your_key node scripts/generate-<name>-audio.mjs --start 5

# Regenerate a single prompt by ID
ELEVENLABS_API_KEY=your_key node scripts/generate-<name>-audio.mjs --only settling-01

# List all voices on your ElevenLabs account
ELEVENLABS_API_KEY=your_key node scripts/generate-<name>-audio.mjs --list-voices
```

**Creating a new generation script:**

1. Define prompts in `src/content/meditations/<name>.js` (each prompt needs an `id` and `text`)
2. Copy an existing script (e.g. `generate-protector-audio.mjs`) as a template
3. Update: `VOICE_ID`, `VOICE_SETTINGS`, `SPEECH_SPEED`, `OUTPUT_DIR`, and the content import
4. Run `--dry-run` first to verify prompt count and text, then generate
5. Each prompt's `id` becomes its filename (e.g. `settling-01` → `settling-01.mp3`)
6. The content file's `audio.basePath` must match the output directory path relative to `public/`

**Audio spec:** 44100 Hz, mono, 128 kbps CBR MP3 (`mp3_44100_128` format in ElevenLabs API). The `audioComposerService` composes these clips with silence gaps and a gong into a single playback blob at runtime.

---

## AI Assistant

An optional AI assistant for session support:

- **Providers**: Supports Anthropic, OpenAI, and OpenRouter APIs
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

  intake: { currentSection, currentQuestionIndex, responses, isComplete },
  substanceChecklist: { plannedDosageMg, ingestionTime, ... },
  preSubstanceActivity: { touchstone, completedActivities, ... },

  timeline: {
    currentPhase: 'come-up' | 'peak' | 'integration',
    targetDuration, phases: { comeUp, peak, integration }
  },

  modules: {
    items: [/* module instances */],
    currentModuleInstanceId: string | null,
    history: [/* completed/skipped modules */]
  },

  comeUpCheckIn: { responses, currentResponse, hasIndicatedFullyArrived, ... },

  booster: {
    considerBooster, status: 'pending' | 'prompted' | 'taken' | 'skipped' | 'snoozed' | 'expired',
    checkInResponses: { experienceQuality, physicalState, trajectory }
  },

  phaseTransitions: {
    activeTransition: 'come-up-to-peak' | 'peak-to-integration' | 'session-closing' | null
  },

  transitionCaptures: {
    peak: { bodySensations, oneWord },
    integration: { editedIntention, newFocus, tailoredActivityResponse },
    closing: { selfGratitude, futureMessage, commitment }
  },

  session: { closedAt, finalDurationSeconds },

  followUp: {
    unlockTimes: { checkIn, revisit, integration },
    modules: {
      checkIn: { status, feeling, note },
      revisit: { status, reflection },
      integration: { status, emerged, commitmentStatus, commitmentResponse }
    }
  }
}
```

**Key Actions:**
- `startSession()`, `completeModule()`, `skipModule()`
- `beginPeakTransition()`, `transitionToPeak()`, `transitionToIntegration()`
- `recordCheckInResponse()`, `recordIngestionTime()`, `confirmIngestionTime()`
- `setSubstanceChecklistSubPhase()`, `completePreSubstanceActivity()`
- `updateTransitionCapture()`, `updateClosingCapture()`, `completeSession()`
- `completeFollowUpModule()`, `updateFollowUpModule()`

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
| Meditation playback | `src/hooks/useMeditationPlayback.js` |
| Meditation content registry | `src/content/meditations/index.js` |
| Design tokens | `src/index.css` |
| Pre-session flow | `src/components/session/PreSessionIntro.jsx` |
| Substance checklist | `src/components/session/SubstanceChecklist.jsx` |
| Come-up check-in | `src/components/session/ComeUpCheckIn.jsx` |
| Peak transition | `src/components/session/PeakTransition.jsx` |
| Booster check-in | `src/components/session/BoosterConsiderationModal.jsx` |
| Integration transition | `src/components/session/IntegrationTransition.jsx` |
| Closing ritual | `src/components/session/ClosingRitual.jsx` |
| Closing ritual content | `src/components/session/transitions/content/closingRitualContent.js` |
| Data download modal | `src/components/session/DataDownloadModal.jsx` |
| Data export utility | `src/utils/downloadSessionData.js` |
| Follow-up: Check-in | `src/components/followup/FollowUpCheckIn.jsx` |
| Follow-up: Revisit | `src/components/followup/FollowUpRevisit.jsx` |
| Follow-up: Integration | `src/components/followup/FollowUpIntegration.jsx` |
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

## Data Export

Session data can be downloaded in two places:
1. **Closing Ritual** (Step 6: "Before You Go") — via `DataDownloadModal`
2. **Settings tool** (Tools tab) — via download buttons with confirmation

### Formats

- **Text (.txt)**: Human-readable session record with divider-separated sections
- **JSON (.json)**: Structured data for backup or import

### Data Included

| Section | Source |
|---------|--------|
| Session metadata | Timestamps, duration, dosage, booster status |
| Intention & touchstone | Intake + pre-session intro |
| Peak transition captures | One-word, body sensations |
| Integration transition captures | Edited intention, focus changes, tailored activity |
| Closing reflections | Self-gratitude, future message, commitment |
| Come-up check-in responses | Timestamped feeling responses |
| Booster check-in responses | Experience quality, physical state, trajectory |
| Module completion history | All completed/skipped activities with timestamps |
| Follow-up reflections | Check-in, revisit, integration (if completed) |
| All journal entries | Both session-created and personal/manual entries |

Follow-up data is included only if those modules have been completed. Downloads during the closing ritual will gracefully omit follow-up sections since they unlock 24-48 hours later.

### Implementation

`src/utils/downloadSessionData.js` reads directly from Zustand stores via `getState()` (no React hooks needed) and generates the export at download time.

---

## Architecture Decisions

1. **All views kept mounted** (hidden with CSS, not unmounted)
   - Why: Meditation timers must survive tab switches

2. **Phase transitions as components** (PeakTransition, IntegrationTransition, ClosingRitual)
   - Why: Supportive, personalized experience between phases with user captures

3. **Capability system for modules**
   - Why: 80% of modules need no custom code

4. **Registry pattern for module routing**
   - Why: Clean separation between module types and components

5. **Audio-text sync with audio leading**
   - Why: More natural experience; text confirms what user hears

6. **Time-locked follow-up modules**
   - Why: Integration benefits from distance; 24-48h delay encourages reflection

7. **Local-only data with export**
   - Why: Privacy-first; no accounts or cloud sync; user owns their data via download

---

## Timer Strategy

### PWA Limitation Context

PWAs cannot reliably fire notifications or alarms when backgrounded or screen-locked. JavaScript execution is suspended, `setTimeout`/`setInterval` don't fire, and there is no Web Alarm API. This is a platform limitation, not a solvable code problem.

### Two-Layer Approach

#### Layer 1: Native Alarm Prompt (Primary)

For timed modules (music breaks, extended meditations), prompt users to set a backup alarm using their phone's native clock app before beginning:

> "Set an alarm for 20 minutes, then return here to begin."

```
[ Open Clock App ]      [ I've Set My Alarm ]
```

Deep links (best-effort, not universally supported):
- **iOS**: `clock-alarm://` — opens Clock app
- **Android**: Intent varies by device; fallback to instruction text

#### Layer 2: Internal Timestamp Timer (Secondary)

Track elapsed time using `Date.now()` comparisons, not intervals:

```javascript
const startTime = Date.now();
const duration = 20 * 60 * 1000;

// On visibility change or user return:
const elapsed = Date.now() - startTime;
const remaining = Math.max(0, duration - elapsed);
const isComplete = elapsed >= duration;
```

This allows graceful reconciliation when the user returns—whether early, on time, or late.

**Graceful Completion States:**
- **Early return**: Show remaining time, option to continue waiting or proceed
- **On-time return**: "Your rest is complete. Continue when ready."
- **Late return**: "Welcome back. Take your time—continue when ready."

### Wake Lock Usage

Use the Screen Wake Lock API only for modules requiring continuous visual attention:

| Module Type | Wake Lock | Rationale |
|-------------|-----------|-----------|
| Breathing exercises | Yes | User follows visual animation |
| Audio meditations | Yes | Keeps audio session alive |
| Music/rest breaks | No | User is away from screen |
| Journaling | No | User interaction keeps screen awake |

```javascript
// Request wake lock for visual modules
const wakeLock = await navigator.wakeLock.request('screen');

// Release when module completes
wakeLock.release();
```

### Philosophy Alignment

This approach aligns with the app's non-directive philosophy. Rigid timing isn't essential—the app guides rather than dictates. Users are trusted to manage their own experience, with the app providing supportive structure that adapts to however they return.

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
