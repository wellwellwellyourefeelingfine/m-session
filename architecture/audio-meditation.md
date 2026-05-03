# Audio Meditation System

Eleven meditation modules use pre-recorded TTS audio with synchronized text display, all sharing a unified playback architecture. All support 10-second skip-back/skip-forward controls during playback.

## Meditations

| Meditation | Audio Files | Duration | Unique Feature |
|------------|:-----------:|----------|----------------|
| Open Awareness | 26 | 10-30 min (variable) | Conditional prompts for longer sessions (20+ min) |
| Body Scan | 54 | 10-15 min (variable) | Silence expansion concentrated in later body regions |
| Self-Compassion | 70 | ~11-15 min (fixed per variation) | 3 variations assembled from shared core + variation clips |
| Simple Grounding | ~20 | ~9 min (fixed) | Sequential grounding steps |
| Short Grounding | ~10 | ~5 min (fixed) | Compact grounding for come-up phase |
| Felt Sense | ~30 | ~10-15 min (fixed per variation) | 2 variations: gentle practice + going deeper |
| Leaves on a Stream | ~15 | ~8 min (fixed) | ACT defusion exercise |
| Stay With It | ~25 | 10-25 min (variable) | Multi-phase: meditation → check-in → psychoeducation → journaling |
| Protector Dialogue | 16 | 8-12 min (fixed) | Part of 2-part IFS activity; listen/read modes |
| The Descent | — | ~10 min (fixed) | EFT relationship exploration (Part 1 of linked pair) |
| The Cycle Closing | — | ~5 min (fixed) | EFT closing meditation after cycle mapping (Part 2) |

## Architecture

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

## Audio-Text Sync

- Audio leads text by **200ms** — text fades in after audio starts
- Text fades out **2s into silence** after audio finishes
- **Fallback**: If audio fails or is muted, text displays for 8s then fades out
- Prompt phases: `hidden` → `fading-in` → `visible` → `fading-out`

## Content Property Reference

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique prompt ID, also used as audio filename |
| `text` | string | Yes | Display text shown to user |
| `baseSilenceAfter` | number | Yes | Base silence duration in seconds after this prompt |
| `silenceExpandable` | boolean | No | Whether silence can scale with duration selection |
| `silenceMax` | number | No | Maximum silence in seconds (caps expansion) |
| `conditional` | object | No | e.g. `{ minDuration: 20 }` — only include for sessions >= 20 min |

## Meditation-Level Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique meditation ID (matches registry key) |
| `title` | string | Display title |
| `description` | string | Brief description for idle screen |
| `prompts` | array | Array of prompt objects |
| `audio` | object | `{ basePath, format, [defaultVoice, voices] }` |
| `isFixedDuration` | boolean | Optional. No `<`/`>` arrows when set |
| `fixedDuration` | number | Optional. Pre-measured composed duration in seconds |
| `minDuration` / `maxDuration` | number | For variable-duration meditations |
| `durationSteps` | array | Available duration steps in minutes |

There is **no `speakingRate` field** — clip durations are looked up exclusively from the `audio-durations.json` manifest. Regenerate via `node scripts/generate-audio-durations.mjs` after adding or replacing any clip.

**Variation-based meditations** (Self-Compassion, Felt Sense, The Descent, The Cycle Closing) replace flat `prompts` with: `variations`, `defaultVariation`, and `assembleVariation(variationKey)`. The `~N min` label comes from `estimateMeditationDurationSeconds()` at render time.

## Shared Hook: `useMeditationPlayback`

All TTS meditation components delegate playback to this shared hook. It handles:

1. Session store integration (start/pause/resume/reset via Zustand)
2. Single-blob audio composition (gong + TTS clips + silence via `audioComposerService`)
3. Prompt progression based on wall-clock time (iOS-resilient, survives screen lock)
4. Audio-text synchronization (audio leads text by 200ms, fade in/out)
5. 10-second skip-back/skip-forward seeking with instant prompt text sync
6. Media Session API for iOS lock-screen play/pause controls
7. Store-to-audio sync (bridges booster modal pause/resume to audio element)
8. Timer reporting to parent via `onProgressUpdate`
9. Phase derivation (`idle` / `loading` / `active` / `completed`) and primary button state

## Voice System

Meditations can offer multiple voice readings. Most TTS meditations ship both **Thoughtful Theo** (default) and **Relaxing Rachel**. The Descent, The Cycle Closing, Pendulation, and transition meditations are Theo-only.

**Content:** Each meditation's `audio` object declares `voices: [{ id, label, subfolder }]` plus `defaultVoice`. Alternate voices live in nested subfolders under `basePath`.

**Preference:** `useAppStore.preferences.defaultVoiceId` (persisted). Read by `precacheAudioForTimeline(modules, voiceId)` for cache warming.

**Settings UI:** Default Voice row with `<` / `>` cycler + Preview button. Uses a **commit-on-tab-leave** model — rapid toggling produces zero network work.

**Key helpers (in `src/content/meditations/index.js`):**
- `resolveVoiceBasePath(audioConfig, voiceId)` — returns `basePath + subfolder` for the voice
- `resolveEffectiveVoiceId(audioConfig, preferredVoiceId)` — preferred if present, else `defaultVoice`
- `getAvailableVoices()` — deduplicated voice list across the library
- `generateTimedSequence(prompts, multiplier, { audioConfig, meditationId, voiceId })` — threads `voiceId` into `audioSrc` resolution
- `estimateMeditationDurationSeconds(meditation, { voiceId, variationKey })` — voice-aware idle-screen pill driver

## Audio Generation

Audio files are generated using ElevenLabs TTS via scripts in `scripts/`. Each meditation has its own generation script. Scripts that ship multiple voices accept `--voice <preset>` and route output into the right subfolder.

| Script | Default voice | Alt voice | Output Directory |
|--------|---------------|-----------|------------------|
| `generate-body-scan-audio.mjs` | Oliver Silk | Relaxing Rachel | `public/audio/meditations/body-scan/[relaxing-rachel/]` |
| `generate-self-compassion-audio.mjs` | Oliver Silk | Relaxing Rachel | `public/audio/meditations/self-compassion/[relaxing-rachel/]` |
| `generate-simple-grounding-audio.mjs` | Oliver Silk | Relaxing Rachel | `public/audio/meditations/simple-grounding/[relaxing-rachel/]` |
| `generate-short-grounding-audio.mjs` | Theo Silk | Relaxing Rachel | `public/audio/meditations/short-grounding/[relaxing-rachel/]` |
| `generate-open-awareness-audio.mjs` | Theo Silk | Relaxing Rachel | `public/audio/meditations/open-awareness/[relaxing-rachel/]` |
| `generate-protector-audio.mjs` | Theo Silk | Relaxing Rachel | `public/audio/meditations/protector-dialogue/[relaxing-rachel/]` |
| `generate-felt-sense-audio.mjs` | Theo Silk | Relaxing Rachel | `public/audio/meditations/felt-sense/[relaxing-rachel/]` |
| `generate-leaves-on-a-stream-audio.mjs` | Theo Silk | Relaxing Rachel | `public/audio/meditations/leaves-on-a-stream/[relaxing-rachel/]` |
| `generate-stay-with-it-audio.mjs` | Theo Silk | Relaxing Rachel | `public/audio/meditations/stay-with-it/[relaxing-rachel/]` |
| `generate-the-descent-audio.mjs` | Theo Silk | — | `public/audio/meditations/the-descent/` |
| `generate-the-cycle-closing-audio.mjs` | Theo Silk | — | `public/audio/meditations/the-cycle-closing/` |
| `generate-pendulation-audio.mjs` | Theo Silk | — | `public/audio/meditations/pendulation/` |
| `generate-transition-opening-audio.mjs` | Theo Silk | — | `public/audio/meditations/transition-opening/` |
| `generate-transition-centering-breath-audio.mjs` | Theo Silk | — | `public/audio/meditations/transition-centering-breath/` |
| `generate-transition-closing-audio.mjs` | Theo Silk | — | `public/audio/meditations/transition-closing/` |
| `generate-audio-durations.mjs` | — | — | Regenerates `src/content/meditations/audio-durations.json` |
| `generate-silence-blocks.mjs` | — | — | Pre-rendered silence MP3 blocks |

**Voices:**

| Voice | ID | Typical Settings |
|-------|----|------------------|
| Oliver Silk | `jfIS2w2yJi0grJZPyEsk` | stability 0.88, similarity 0.88, speed 0.70 |
| Theo Silk | `UmQN7jS1Ee8B1czsUtQh` | stability 0.65, similarity 0.70, style 0, speed 0.87, speaker_boost on |
| Relaxing Rachel | `ROMJ9yK1NAMuu1ggrjDW` | stability 0.80, similarity 0.75, style 0.50, speed 0.81, speaker_boost on |

**Usage:**
```bash
node scripts/generate-<name>-audio.mjs --dry-run          # Preview, no API calls
ELEVENLABS_API_KEY=key node scripts/generate-<name>-audio.mjs  # Generate all
ELEVENLABS_API_KEY=key node scripts/generate-<name>-audio.mjs --start 5  # Resume
ELEVENLABS_API_KEY=key node scripts/generate-<name>-audio.mjs --only settling-01  # One prompt
```

**Audio spec:** 44100 Hz, mono, 128 kbps CBR MP3 (`mp3_44100_128` format in ElevenLabs API).
