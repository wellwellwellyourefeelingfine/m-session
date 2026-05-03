# MasterModule Recipes

> For UI conventions, idle-screen anatomy, and copy rules — see the [MasterModule Style Sheet](../src/components/active/modules/MasterModule/MasterModuleStyleSheet.md). For engine internals — see [master-module-engine.md](master-module-engine.md).

## Adding a New Module with MasterModule

**Step 1: Create the content file** in `src/content/modules/master/myModule.js`:

```javascript
export const myModuleContent = {
  accentTerms: { key_concept: 'Key Concept' },
  idle: { animation: 'ascii-moon' },
  completion: { title: 'Well done', message: 'Take a moment.' },
  journal: { saveOnComplete: true, titlePrefix: 'MY MODULE' },

  sections: [
    {
      id: 'intro',
      type: 'screens',
      screens: [
        { type: 'text', header: 'Welcome', lines: ['Introduction with {key_concept}.'] },
        { type: 'prompt', prompt: 'What brings you here?', placeholder: 'Write freely...' },
      ],
    },
    {
      id: 'meditation',
      type: 'meditation',
      meditationId: 'open-awareness',
      animation: 'morphing-shapes',
      showTranscript: true,
    },
    {
      id: 'reflection',
      type: 'screens',
      screens: [
        { type: 'prompt', prompt: 'What stayed with you?', placeholder: '...' },
      ],
    },
  ],
};
```

**Step 2: Register in `library.js`**:

```javascript
import { myModuleContent } from './master/myModule';

// In MODULE_TYPES:
'my-module': { label: 'My Module', intensity: 3 },

// In moduleLibrary:
{
  id: 'my-module',
  type: 'my-module',
  category: 'activity',
  title: 'My Module',
  description: 'A guided activity with meditation and journaling.',
  defaultDuration: 20,
  allowedPhases: ['peak', 'integration'],
  tags: ['guided'],
  framework: ['general'],
  content: {
    instructions: 'Description for the idle screen.',
    masterModuleContent: myModuleContent,
  },
}
```

**Step 3: Register in `moduleRegistry.js`**:

```javascript
'my-module': MasterModule,
```

Done. No custom component code needed.

---

## Complex Example: Branching Meditation (Pendulation-Style)

A module with multiple meditation sections, checkpoint routing, and adaptive debrief:

```javascript
export const branchingModuleContent = {
  journal: { saveOnComplete: true, titlePrefix: 'BRANCHING MODULE' },

  sections: [
    { id: 'med-a', type: 'meditation', meditationId: 'section-a',
      composerOptions: { skipClosingGong: true } },

    { id: 'checkpoint', type: 'screens', hideTimer: true, screens: [
      { type: 'choice', prompt: 'How was that?', key: 'checkpoint1', options: [
        { id: 'settled', label: 'Settled', route: 'med-d' },
        { id: 'activated', label: 'Still activated', route: 'med-b' },
        { id: 'frozen', label: 'Heavy or frozen', route: 'med-c' },
      ] },
    ] },

    { id: 'med-b', type: 'meditation', meditationId: 'section-b',
      composerOptions: { skipOpeningGong: true, skipClosingGong: true } },

    { id: 'med-c', type: 'meditation', meditationId: 'section-c',
      composerOptions: { skipOpeningGong: true, skipClosingGong: true } },

    { id: 'med-d', type: 'meditation', meditationId: 'section-d',
      composerOptions: { skipOpeningGong: true } },

    { id: 'debrief', type: 'screens', screens: [
      { type: 'text', lines: ['Core debrief — always shown.'] },
      { type: 'text', condition: { visited: 'med-b' },
        lines: ['You went through the activation section...'] },
      { type: 'text', condition: { visited: 'med-c' },
        lines: ['You went through the freeze section...'] },
      { type: 'prompt', prompt: 'What did you notice?' },
    ] },
  ],
};
```

This produces: opening gong on section A only, no gongs on B/C, closing gong on D only. Checkpoint uses string routes (skip-ahead) so each path continues forward to debrief. Debrief screens adapt via `condition: { visited: '...' }`.

---

## Adding a Custom Component (Fallback)

For modules with highly interactive UIs that can't be expressed via content config (e.g., drag-and-drop, interactive diagrams):

1. Create `components/active/modules/MyModule.jsx`:
```javascript
export default function MyModule({ module, onComplete, onSkip, onProgressUpdate }) {
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

## MasterModule File Structure

```
src/components/active/modules/MasterModule/
  MasterModule.jsx              # Main orchestrator
  useMasterModuleState.js       # Central state (navigation, data, conditions)
  sectionRenderers/
    ScreensSection.jsx          # Step-through screens with block rendering
    MeditationSection.jsx       # Audio-synced meditation (variable duration, variations, back-nav)
    TimerSection.jsx            # Countdown timer + optional recommendations
    GenerateSection.jsx         # PNG generation + RevealOverlay orchestration
  blockRenderers/
    HeaderBlock.jsx             # Title + configurable animation
    TextBlock.jsx               # Paragraphs with markup
    PromptBlock.jsx             # Journaling textarea
    SelectorBlock.jsx           # Grid selection
    ChoiceBlock.jsx             # Routing checkpoint
    AnimationBlock.jsx          # Standalone animation
    AlarmBlock.jsx              # Set alarm prompt
    ReviewBlock.jsx             # Assembled response review
    MeditationAudioBlock.jsx    # Paused indicator + fading prompt text
  generators/
    registry.js                 # Generator ID → async PNG function
  customBlocks/
    index.js                    # Custom-block registry (empty extension point)
  utils/
    expandScreenToBlocks.js     # Shorthand → blocks conversion
    evaluateCondition.js        # Condition evaluation (choice, selector, visited)
    renderContentLines.jsx      # Shared text markup renderer
    journalAssembler.js         # Builds journal entry from collected data

src/content/modules/master/     # Content config files for MasterModule-based modules
```

---

## Adding a Meditation Module (with Audio)

For modules that use the shared `useMeditationPlayback` hook with pre-recorded TTS audio:

**Step 1: Define the content** in `src/content/meditations/<name>.js`:

```javascript
export const myMeditation = {
  id: 'my-meditation',
  title: 'My Meditation',
  description: 'Brief description for the idle screen.',
  minDuration: 600,
  maxDuration: 1800,
  durationSteps: [10, 15, 20, 25, 30],
  defaultDuration: 10,
  audio: {
    basePath: '/audio/meditations/my-meditation/',
    format: 'mp3',
  },
  prompts: [
    { id: 'intro-1', text: 'Begin by finding a comfortable position.',
      baseSilenceAfter: 5, silenceExpandable: true, silenceMax: 15 },
    { id: 'core-1', text: 'Bring awareness to your breath.',
      baseSilenceAfter: 8, silenceExpandable: true, silenceMax: 30 },
  ],
};
```

**Step 2: Register in the meditation library** in `src/content/meditations/index.js`. Then run `node scripts/generate-audio-durations.mjs` to populate the manifest. Consumers fetch via `getMeditationById('my-meditation')`; **do not add a named re-export**.

**Step 3: Create the component** in `src/components/active/modules/MyMeditationModule.jsx`. Copy an existing module as a template (e.g. `OpenAwarenessModule.jsx`). Update: the meditation ID, the `useMemo`-computed `[timedSequence, totalDuration]`, and optional slot content. Everything else — session-store integration, pause/resume, audio-text sync, seek, completion — is handled by `useMeditationPlayback`.

**Step 4: Register in `moduleRegistry.js`** and **add to `library.js`**.

**Step 5: Generate audio** — create `scripts/generate-my-meditation-audio.mjs` following the pattern of existing scripts. Use `--dry-run` first.

**Step 6: Build and test** — verify the full flow: idle screen → begin → prompts with audio → pause/resume → mute toggle → completion.

---

## Adding a Journaling Module (No Custom Component)

The `JournalingModule` framework supports configurable screen types:
- `text` — Education/reflection page with header and content lines (supports `§` spacers)
- `prompt` — DM Serif prompt question with textarea
- `selector` — Grid of selectable options with optional textarea

**Step 1: Create content file** in `src/content/modules/journaling/myContent.js`:

```javascript
export const myContent = {
  screens: [
    { type: 'text', header: 'Introduction', lines: ['First paragraph.', '§', 'Second paragraph.'] },
    { type: 'prompt', prompt: 'What do you notice?', context: 'Optional description.', placeholder: 'Write here...' },
    { type: 'selector', prompt: 'How do you feel?', key: 'feeling', columns: 2, multiSelect: false,
      options: [{ id: 'calm', label: 'Calm' }, { id: 'energized', label: 'Energized' }],
      journal: { prompt: 'Say more?', placeholder: 'Details...', rows: 3 } },
  ],
};
```

**Step 2: Add module definition** in `library.js` with `content: myContent` (imported).

**Step 3: Register** in `moduleRegistry.js` as `JournalingModule`.

**Legacy format** (still supported): `content.introScreens` + `content.prompts` + `content.closingScreens`.
