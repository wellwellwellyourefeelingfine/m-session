# Meditation Audio System — Technical Reference

How meditation audio playback works, from content definition through blob composition, playback, timer display, and text synchronization.

---

## Architecture

The meditation system plays guided meditations as a **single continuous MP3 blob** through one `<audio>` element. This design exists because iOS Safari keeps a single continuous audio stream playing through screen lock, but would interrupt multiple sequential audio loads.

**The stack (bottom to top):**

```
┌─────────────────────────────────────────────────────────┐
│  ModuleStatusBar        (displays timer: "2:30 / 10:00")│
├─────────────────────────────────────────────────────────┤
│  Module component       (builds timedSequence, renders) │
├─────────────────────────────────────────────────────────┤
│  useMeditationPlayback  (orchestrates TTS modules)      │
│  useSilenceTimer        (orchestrates non-TTS modules)  │
├─────────────────────────────────────────────────────────┤
│  useAudioPlayback       (wraps <audio> element)         │
├─────────────────────────────────────────────────────────┤
│  audioComposerService   (builds the MP3 blob)           │
├─────────────────────────────────────────────────────────┤
│  content/meditations/   (prompt definitions)            │
├─────────────────────────────────────────────────────────┤
│  useSessionStore        (playback state coordination)   │
└─────────────────────────────────────────────────────────┘
```

**Two orchestrator hooks:**
- **`useMeditationPlayback`** — for TTS modules (BodyScan, OpenAwareness, SelfCompassion, SimpleGrounding, ShortGrounding, FeltSense, LeavesOnAStream, StayWithIt). Handles audio-text sync, prompt progression, text fade animations.
- **`useSilenceTimer`** — for non-TTS modules (OpenSpace, MusicListening). Simpler: gong-bookended silence blob with elapsed timer. Supports mid-session `resize()`.

Both share `useAudioPlayback` as their audio engine and `useSessionStore.meditationPlayback` for state coordination.

---

## Content Definitions

**Files:** `src/content/meditations/body-scan.js`, `open-awareness.js`, `self-compassion.js`, `simple-grounding.js`, `short-grounding.js`, `felt-sense.js`, `leaves-on-a-stream.js`, `stay-with-it.js`

Each meditation exports a content object. There are two patterns:

### Variable-duration meditations (DurationPicker)

Body Scan, Open Awareness — user selects a target duration. Silence gaps scale via a multiplier.

```js
{
  id: 'body-scan',
  title: 'Body Scan',
  baseDuration: 517,
  minDuration: 600,
  maxDuration: 900,
  durationSteps: [10, 15],
  speakingRate: 150,
  audio: { basePath: '/audio/meditations/body-scan/', format: 'mp3' },
  prompts: [
    { id: 'settling-01', text: 'Let yourself settle...', baseSilenceAfter: 3, silenceExpandable: true, silenceMax: 15 },
    // ...
  ]
}
```

### Fixed-duration meditations (no DurationPicker)

Simple Grounding, Short Grounding — single fixed length. Self-Compassion, Felt Sense — variations with pre-calculated durations.

```js
// Simple fixed duration
{
  id: 'simple-grounding',
  isFixedDuration: true,
  fixedDuration: 561, // seconds, computed from actual MP3 + silence file durations
  // ...
}

// Variation-based fixed duration (Felt Sense, Self-Compassion)
{
  id: 'felt-sense',
  isFixedDuration: true,
  defaultVariation: 'default',
  variations: {
    default: { key: 'default', label: 'A Gentle Practice', duration: calculateVariationDuration('default') },
    'going-deeper': { key: 'going-deeper', label: 'Going Deeper', duration: calculateVariationDuration('going-deeper') },
  },
  assembleVariation, // filters prompts by variationOnly field, applies defaultSilenceAfter overrides
  // ...
}
```

Variation-based meditations use `assembleVariation(variationKey)` to filter and configure prompts. Prompts can have `variationOnly: 'going-deeper'` to be included only in that variation, and `defaultSilenceAfter` to override `baseSilenceAfter` for the default (shorter) variation.

### Prompt fields

Each prompt object has:
- `id` — doubles as the MP3 filename: `{basePath}{id}.{format}`
- `text` — displayed text and used for word-count fallback duration
- `baseSilenceAfter` — silence gap in seconds after this clip
- `silenceExpandable` (optional) — if true, silence scales with the multiplier
- `silenceMax` (optional) — cap on expanded silence
- `variationOnly` (optional) — only include in this variation
- `defaultSilenceAfter` (optional) — override `baseSilenceAfter` for the default variation

---

## Audio Duration Manifest

**Script:** `scripts/generate-audio-durations.mjs`
**Manifest:** `src/content/meditations/audio-durations.json`

All duration calculations use **actual MP3 file durations** from a pre-generated manifest, not word-count estimates. The manifest maps `meditationId → promptId → durationSeconds`, computed from file byte lengths (`audioBytes / 16000` for CBR 128kbps).

### Why not word-count estimates?

TTS output doesn't follow a constant words-per-minute rate — pauses for ellipses, commas, emphasis, and varying sentence structures make actual clip durations unpredictable. Testing showed WPM estimates drifted ±1–4 minutes from reality across meditations. The manifest eliminates this entirely.

### Regenerating the manifest

**Run after adding, replacing, or removing any audio clips:**

```bash
node scripts/generate-audio-durations.mjs
```

This scans all `public/audio/meditations/*/` directories, strips ID3 tag bytes from file sizes, computes `audioBytes / 16000`, and writes the JSON manifest. The script is fast (no network calls) and idempotent.

### How it's used

- **`getClipDuration(meditationId, prompt, speakingRate)`** in `index.js` — looks up the manifest, falls back to word-count estimate if no audio file exists (e.g., protector-dialogue which has no pre-recorded clips yet)
- **`calculateMeditationDuration()`** and **`calculateSilenceMultiplier()`** — accept `meditationId` to use real durations, ensuring the silence multiplier binary search calibrates against accurate totals
- **`self-compassion.js`** and **`felt-sense.js`** — their `calculateClipSpeakingDuration()` / `calculatePromptSpeakingDuration()` functions look up the manifest directly for variation duration calculation

### What happens if the manifest is stale

If audio files are added/changed without regenerating the manifest, the old durations remain in the JSON. The pre-composition estimate (timer on idle screen, silence multiplier calibration) will use stale values. The post-composition timer (`realContentDurationRef` in `useMeditationPlayback`) will still be accurate since it derives from actual fetched byte lengths. So playback works correctly — only the pre-composition estimates and silence calibration would be slightly off.

---

## Timed Sequence Generation

**File:** `src/content/meditations/index.js`

- **`calculateSilenceMultiplier(prompts, targetDuration, speakingRate, meditationId)`** — Binary search for a multiplier (1.0–10.0) so total duration hits target within 5 seconds. Expandable silences scale; non-expandable stay fixed. Uses manifest durations when `meditationId` is provided.

- **`generateTimedSequence(prompts, multiplier, { speakingRate, audioConfig, meditationId })`** — Produces an array with `startTime`/`endTime` relative to sequence start (NOT blob start — the composer adds the gong preamble offset). Derives `meditationId` from `audioConfig.basePath` if not passed explicitly.

---

## Module Components

**Files:** `src/components/active/modules/{BodyScan,OpenAwareness,SelfCompassion,SimpleGrounding,FeltSense,LeavesOnAStream,StayWithIt}Module.jsx`

Each module:
1. Gets meditation content from its content file (via import or `getMeditationById()`)
2. Builds `timedSequence` in `useMemo` (variable-duration: computes silence multiplier → generates sequence; fixed-duration: calls `assembleVariation()` → generates sequence with multiplier 1.0)
3. Passes to `useMeditationPlayback` with `{ meditationId, moduleInstanceId, timedSequence, totalDuration, onComplete, onSkip, onTimerUpdate }`
4. Uses `useTranscriptModal()` hook (`src/hooks/useTranscriptModal.js`) for transcript modal state — returns `{ showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript }`
5. Renders UI based on returned `playback` state (`hasStarted`, `isLoading`, `isComplete`, `promptPhase`, `currentPrompt`, `getPrimaryButton()`)
6. Wires seek controls to `ModuleControlBar`: `showSeekControls`, `onSeekBack={() => playback.handleSeekRelative(-10)}`, `onSeekForward={() => playback.handleSeekRelative(10)}`

---

## Silence Block Files

**Location:** `public/audio/silence/`

Pre-generated silence MP3 files at CBR 128kbps 44100Hz, used by `decomposeSilence()` to fill gaps between TTS clips:

| File | Nominal | Actual bytes (stripped) | Actual duration |
|------|---------|------------------------|-----------------|
| `silence-60s.mp3` | 60.0s | 960,887 B | ~60.06s |
| `silence-30s.mp3` | 30.0s | 481,070 B | ~30.07s |
| `silence-10s.mp3` | 10.0s | 160,913 B | ~10.06s |
| `silence-5s.mp3` | 5.0s | 81,083 B | ~5.07s |
| `silence-1s.mp3` | 1.0s | 17,135 B | ~1.07s |
| `silence-0.5s.mp3` | 0.5s | 9,194 B | ~0.57s |

Each file has a 44-byte ID3v2 tag (stripped at composition time). Actual durations are slightly longer than nominal (~0.07s per file) due to MP3 frame alignment — frames are 26ms each at 128kbps/44100Hz, so the encoder rounds up to the next complete frame. This overshoot is cumulative: a meditation with 86 silence blocks gains ~6 seconds of extra silence. The `actualSilenceDuration()` helper in `audioComposerService.js` accounts for this by computing real durations from byte lengths rather than using nominal values for `currentTime` tracking.

### Gong file

**File:** `public/audio/meditation-bell-soft.mp3` — 122,369 bytes (326-byte ID3 tag), ~7.63s after stripping. Used for opening and closing gongs in both `composeMeditationAudio` and `composeSilenceTimer`.

---

## Orchestrator: useMeditationPlayback

**File:** `src/hooks/useMeditationPlayback.js`

### Constants

```js
TEXT_FADE_IN_DELAY = 200;          // ms delay before text appears after audio starts
TEXT_FADE_OUT_INTO_SILENCE = 2000; // ms text lingers after clip ends
PROMPT_DISPLAY_DURATION = 8000;    // ms fallback text display if muted
GONG_DELAY = 1;                    // seconds silence before gong
GONG_PREAMBLE = 8;                 // total seconds before first TTS prompt
```

### Callback ref pattern (onTimerUpdate)

The `onTimerUpdate` callback from parent modules is stored in a ref (`onTimerUpdateRef`) and excluded from effect dependency arrays. This prevents infinite re-render loops: the parent creates a new function reference each render, which would cause the timer-reporting `useEffect` to fire → update parent state → re-render parent → new callback ref → fire again. The same pattern is used in `useAudioPlayback` for all event callbacks (`onEnded`, `onError`, `onPlay`, `onPause`, `onTimeUpdate`).

### handleStart flow

1. `composeMeditationAudio(timedSequence, { gongDelay: 1, gongPreamble: 8 })` — fetches all MP3s, builds blob
2. Store refs: `blobUrlRef`, `promptTimeMapRef`, `composedDurationRef`
3. `startMeditationPlayback(moduleInstanceId)` — store: `hasStarted=true`, `isPlaying=true`
4. `audio.loadAndPlay(blobUrl)` — sets src, load, wait canplay, play (clears stale `composedBytesRef`)
5. `audio.storeComposedBytes(composedBytes)` — stores `Uint8Array` for iOS blob recreation **after** loadAndPlay

**Important:** `storeComposedBytes` must be called AFTER `loadAndPlay` because `loadAndPlay` clears `composedBytesRef` to prevent stale bytes from a previous meditation being used on resume. If called before, the bytes are immediately wiped.

### Blob structure

```
[1s silence] [gong ~7.5s] [gap] [prompt1.mp3] [silence] [prompt2.mp3] [silence] ... [1s silence] [gong]
|<------ GONG_PREAMBLE (8s) --->|<---------- user-visible meditation ---------->|<-- closing -->|
```

The `promptTimeMap` has absolute timestamps within the blob (e.g., first prompt starts at 8.0s).

### How elapsedTime drives everything

`elapsedTime` is set from the wall-clock timer in `useAudioPlayback` via the `onTimeUpdate` callback. The wall-clock tracks real elapsed time via `Date.now()` instead of relying on `audio.currentTime`, which is broken for blob URLs on iOS Safari (see Known Issues). Everything derives from `elapsedTime`:

- **Timer:** `userElapsed = max(0, elapsedTime - GONG_PREAMBLE)` → reported to ModuleStatusBar
- **Prompts:** Forward-scan of `promptTimeMap` from last known index to find active prompt → triggers text fade sequence (`hidden` → `fading-in` → `visible` → `fading-out`)
- **Completion:** `elapsedTime >= composedTotal && composedTotal > 0 && hasStarted`

### handlePauseResume

Uses `audio.isPaused()` (reads `<audio>.paused` directly) instead of store's `isPlaying` to avoid stale-closure bugs from rapid tapping or modal interference.

### Media Session API

Sets `navigator.mediaSession.metadata`, registers play/pause handlers (using `audio.isPaused()`), and updates `setPositionState()` for lock-screen duration/progress. `setPositionState()` is throttled to ~1 call/sec (lock-screen doesn't update faster). `isPlaying` is intentionally excluded from the handler effect's deps to prevent handler churn.

### handleSeekRelative(deltaSeconds)

Seeks forward or backward relative to the current position (e.g., `handleSeekRelative(-10)` for skip-back, `handleSeekRelative(10)` for skip-forward). Used by the `ModuleControlBar` seek buttons.

**Logic:**
1. Guard: return if `!hasStarted || isLoading || isComplete || isSeekingRef.current`
2. Set `isSeekingRef.current = true` (prevents overlapping seeks from rapid taps)
3. Compute target: `Math.max(0, Math.min(currentTime + deltaSeconds, composedDurationRef.current))`
4. Clear any pending `textFadeTimeoutRef`
5. **Direct prompt computation** — scans `promptTimeMapRef` to find the correct prompt for the new position and immediately sets `lastPromptRef`, `setCurrentPromptIndex()`, `setPromptPhase('visible'|'hidden')`. This bypasses the forward-scan effect (which guards on `!isPlaying`) to give instant visual feedback, especially when seeking while paused.
6. `await audio.seekToTime(target)`
7. `setElapsedTime(target)`
8. `isSeekingRef.current = false` in `finally` block

### Stale-state recovery

If the store says playback is active but there's no blob URL (page reload), resets to idle. Works because `meditationPlayback` is excluded from localStorage persistence.

---

## Orchestrator: useSilenceTimer

**File:** `src/hooks/useSilenceTimer.js`

Used by OpenSpaceModule and MusicListeningModule. Same architecture as useMeditationPlayback but simpler — no prompt text sync.

### Key differences from useMeditationPlayback
- Uses `composeSilenceTimer()` instead of `composeMeditationAudio()`
- `GONG_PREAMBLE = 3` (not 8)
- Supports `resize()` for mid-session duration changes (recomposes blob without opening gong, preserves elapsed time via `elapsedOffsetRef`)
- No prompt progression or text fade logic

### handleSeekRelative(deltaSeconds)

Same pattern as `useMeditationPlayback.handleSeekRelative()` but simpler — no prompt tracking. Computes target clamped to `[0, composedTotalRef.current]`, calls `audio.seekToTime(target)`, then updates `setElapsedTime()` accounting for `preambleEndRef` and `elapsedOffsetRef`. Guarded by `isSeekingRef` to prevent overlapping seeks.

### Same patterns
- `handleStart` calls `loadAndPlay()` before `storeComposedBytes()` (same ordering constraint as useMeditationPlayback)
- `handlePauseResume` uses `audio.isPaused()`
- Media Session handlers, `setPositionState()` (throttled to ~1/sec), stale-state recovery all work identically

---

## Audio Playback Engine: useAudioPlayback

**File:** `src/hooks/useAudioPlayback.js`

Wraps a single `new Audio()` element. Uses a **wall-clock timer** (`Date.now()`) for all time reporting, bypassing iOS Safari's broken `audio.currentTime` for blob URLs. Handles iOS blob URL seeking limitations via a two-phase resume strategy.

### Key refs

```
savedTimeRef        — Last known absolute position in seconds (persists across pause/resume)
composedBytesRef    — Full composed MP3 Uint8Array (for blob recreation on iOS)
timeOffsetRef       — Added to audio.currentTime after blob recreation for absolute time
currentBlobUrlRef   — Current blob URL (for revocation on recreation)
wallStartRef        — Date.now() timestamp when playback started/resumed (0 when paused)
wallAccumulatedRef  — Seconds accumulated from prior play periods before current wallStartRef
```

### Time reporting (wall-clock timer)

All time reporting uses a wall-clock timer based on `Date.now()` instead of `audio.currentTime`. This completely bypasses iOS Safari's bug where `audio.currentTime` returns 0 for blob URLs on first play.

**How it works:**
- `wallStartRef` stores `Date.now()` when playback begins or resumes
- `wallAccumulatedRef` stores seconds from prior play periods (accumulated on each pause)
- `getWallTime()` = `wallAccumulatedRef + (Date.now() - wallStartRef) / 1000`

Both native `timeupdate` events and a 250ms `setInterval` polling fallback call `getWallTime()` and report it upstream via `onTimeUpdate`. The polling uses `setInterval` (not `rAF`) because `rAF` stops when iOS backgrounds the page, while `setInterval` continues at ~1Hz.

`getCurrentTime()` also returns `getWallTime()`, so all consumers get wall-clock time regardless of whether they use the callback or the getter.

### loadAndPlay(blobUrl)

Resets position tracking (including wall-clock refs `wallStartRef` and `wallAccumulatedRef`), clears `composedBytesRef` (caller must call `storeComposedBytes()` after this returns), sets `audio.src`, loads, waits for `canplay` (with 5s timeout guarded by `settled` flag to prevent double-play on iOS), calls `play()`, starts polling (which sets `wallStartRef = Date.now()`). Also revokes the previous blob URL if one exists.

### pause()

Accumulates wall-clock elapsed time (`wallAccumulatedRef += (Date.now() - wallStartRef) / 1000`), zeroes `wallStartRef`, saves accumulated time to `savedTimeRef`, pauses element, stops polling.

### resume() — Blob Recreation

Always uses `resumeFromBytes()` when composed bytes are available: calculate byte offset from saved time, snap to MP3 frame boundary via `findNextFrameBoundary()`, slice remaining bytes with `subarray()` (zero-copy), create new Blob + URL, load and play. `timeOffsetRef` ensures upstream hooks see absolute position with no discontinuity.

Direct seeking (`currentTime` assignment) is unreliable for composed blob URLs on both platforms — iOS resets `currentTime` to 0 (WebKit bug), and desktop browsers may accept the assignment while the decoder starts from byte 0 (headerless MP3 concatenation lacks a seek table). Blob recreation bypasses seeking entirely.

### seekToTime(absoluteTime)

Seeks to an arbitrary absolute position within the composed blob. Uses the same blob-recreation pattern as `resumeFromBytes()` — calculates byte offset from the target time, snaps to the next MP3 frame boundary via `findNextFrameBoundary()`, slices the remaining bytes, creates a new blob URL, and loads/plays it.

**Logic:**
1. Clamp target to `[0, composedBytesRef.current.length / CBR_BYTES_PER_SECOND]`
2. Read `wasPaused` from `audioRef.current.paused`
3. Stop polling, update wall-clock refs (`savedTimeRef`, `wallAccumulatedRef`, `wallStartRef`)
4. Calculate byte offset → find next frame boundary → create new blob from `subarray()`
5. Revoke old blob URL, load new one
6. If was paused: fire synthetic `onTimeUpdate` at the new position, do NOT play
7. If was playing: `await audio.play()`, start polling

Returns `false` if no composed bytes or audio element available. This method is called by `handleSeekRelative()` in the orchestrator hooks.

### Memory

A 10-min CBR 128kbps meditation ≈ 9.6MB in `composedBytesRef`. `subarray()` shares the `ArrayBuffer`. Worst case ~20MB briefly during fallback resume or seek.

---

## Audio Composer Service

**File:** `src/services/audioComposerService.js`

### Key exports

- `CBR_BYTES_PER_SECOND = 16000` — CBR 128kbps = 16000 bytes/sec
- `decomposeSilence(seconds)` — Breaks duration into pre-generated silence block files (60s, 30s, 10s, 5s, 1s, 0.5s) via greedy algorithm
- `findNextFrameBoundary(bytes, offset)` — Scans for next MPEG sync word (`0xFF 0xE0` mask) within 418 bytes
- `buildConcatenationPlan(timedSequence, options, bufferMap)` — Builds ordered plan of `{ type, url }` entries with real byte lengths for duration tracking.
- `composeMeditationAudio(timedSequence, options)` — Collects URLs via `collectAudioUrls()`, fetches all in parallel, strips ID3 tags, builds plan with real durations, concatenates into single `Uint8Array`, returns `{ blobUrl, composedBytes, promptTimeMap, totalDuration }`
- `composeSilenceTimer(durationSeconds, options)` — Same pattern for silence-only blobs, supports `skipOpeningGong` option for resize
- `revokeMeditationBlobUrl(blobUrl)` — `URL.revokeObjectURL` wrapper

### Internal helpers

- `getID3TagSize(buffer)` — Detects ID3v2 tag at start of buffer, returns total tag size (header + body) or 0
- `stripID3Tag(buffer)` — Returns new ArrayBuffer with ID3v2 tag removed; returns original if no tag found
- `isValidMp3Buffer(buffer)` — Checks first 3 bytes for MPEG sync word (`0xFF 0xE0`) or ID3v2 tag header (`"ID3"`). Used to validate cached entries and detect stale HTML responses.
- `actualSilenceDuration(blockUrls, nominalDuration, bufferMap)` — Computes real duration of decomposed silence blocks from fetched buffer byte lengths. Silence block files are slightly longer than their nominal values (~0.07s each due to MP3 frame alignment), so using nominal values for `currentTime` tracking would cause cumulative drift. Falls back to nominal if bufferMap is null.
- `estimateMp3Duration(buffer)` — `buffer.byteLength / CBR_BYTES_PER_SECOND`
- `concatenateBuffers(plan, bufferMap)` — Allocates a single `Uint8Array` and copies all plan entries' buffers into it sequentially. Shared by `composeMeditationAudio` and `composeSilenceTimer`.
- `collectAudioUrls(timedSequence, options)` — Lightweight URL collector that returns all unique audio URLs needed for a composition without building the full plan. Replaces the former dry-run pass.

### Composition pipeline

`composeMeditationAudio` uses a single-pass architecture:

1. **Collect URLs** — `collectAudioUrls(timedSequence, options)` extracts all unique URLs (gong, silence blocks, TTS clips) without building the full plan.

2. **Fetch + strip** — All unique URLs are fetched in parallel via `fetchAudioBuffer()`. Then all buffers are processed by `stripID3Tag()` to remove ID3v2 metadata headers that would corrupt mid-stream byte concatenation.

3. **Build plan** — `buildConcatenationPlan(timedSequence, options, bufferMap)` builds the plan with actual byte lengths for accurate `currentTime` tracking and `promptTimeMap` timestamps.

4. **Concatenate** — `concatenateBuffers(plan, bufferMap)` assembles the final `Uint8Array`.

### Duration calculation

All TTS clips and silence blocks are CBR 128kbps: `bytes / 16000 = seconds`. Duration is computed from actual byte lengths, not from estimates. The same formula is used by the audio duration manifest (`scripts/generate-audio-durations.mjs`) to pre-compute clip durations for the timed sequence generation, ensuring that the pre-composition estimates match the post-composition reality.

### Fetching and cache validation

`fetchAudioBuffer(url)` tries the browser Cache API first (`audio-cache`), then falls back to network `fetch()`. Cached entries are validated by `isValidMp3Buffer()` before being returned — if the cached bytes don't start with an MPEG sync word or ID3 header, the stale entry is evicted from the cache and a fresh network fetch is performed. This prevents stale HTML responses (from service worker SPA fallback caching) from being used as audio data. See "Stale cache entries" under Known Issues.

### ID3 stripping at composition time

After fetching all buffers and before the second pass, `composeMeditationAudio` strips ID3v2 tags from every buffer in the map. This is critical because:
- ID3 headers between audio frames in the concatenated blob cause `DEMUXER_ERROR_COULD_NOT_OPEN` errors in some decoders
- Non-audio bytes corrupt byte-offset-based duration calculations (`byteLength / 16000`)
- The `resumeFromBytes()` seek system calculates byte offsets from elapsed time — ID3 bytes in the stream would cause it to land inside metadata instead of at a valid frame boundary

All MP3 files in the project have small ID3 tags (44-45 bytes for TTS and silence files, ~326 bytes for the gong). The runtime stripping handles these transparently. For files with large ID3 tags (e.g., manually exported from audio editors), both the runtime stripping and the on-disk stripping scripts (see "MP3 files with ID3 metadata tags" under Known Issues) will handle them correctly.

---

## Session Store

**File:** `src/stores/useSessionStore.js`

### meditationPlayback state

```js
{ moduleInstanceId: null, isPlaying: false, hasStarted: false }
```

**NOT persisted** (excluded via `partialize`). On page reload, resets to defaults; stale-state recovery in the hooks handles cleanup.

### Actions
- `startMeditationPlayback(moduleInstanceId)` — Sets `hasStarted=true`, `isPlaying=true`
- `pauseMeditationPlayback()` — Sets `isPlaying=false`
- `resumeMeditationPlayback()` — Sets `isPlaying=true`
- `resetMeditationPlayback()` — Resets everything to defaults

### Booster modal interactions

Several store actions (booster show/hide/take/skip/snooze/maximize/expire) call `pauseMeditationPlayback()`/`resumeMeditationPlayback()` without calling `audio.pause()`/`audio.resume()`. This can desync store state from actual audio state. The hooks use `audio.isPaused()` for control decisions to mitigate this, but prompt progression still guards on `isPlaying` from the store.

---

## Timer Data Flow

```
Date.now() wall-clock (via native timeupdate OR 250ms setInterval polling)
  → useAudioPlayback: getWallTime() → reports to onTimeUpdate callback
    → useMeditationPlayback: setElapsedTime(wallClockTime)
      → useEffect: userElapsed = max(0, elapsedTime - GONG_PREAMBLE)
        → onTimerUpdate({ elapsed, total, progress, showTimer, isPaused })
          → ActiveView → ModuleStatusBar: "2:30 / 10:00"
```

Note: `audio.currentTime` is NOT used for timer display. It is only used by `resume()` for seek-before-play (fast path) and by `resumeFromBytes()` for byte-offset calculation.

---

## Known Issues

### iOS first-play `audio.currentTime` stuck at 0

On iOS Safari, `audio.currentTime` returns 0 for blob URLs on first play, despite audio being audible (gong + TTS clips play correctly). This is an iOS WebKit bug — `currentTime` never initializes for freshly-created Audio elements playing blob URLs.

**Status: SOLVED** via wall-clock timer in `useAudioPlayback`. All time reporting now uses `Date.now()` instead of `audio.currentTime`, completely bypassing the WebKit bug. The timer advances correctly on first play, text prompts appear at the right times, and pause/resume works from the first tap.

**Why the second play used to work (historical):** When the user paused (with timer stuck at 0), `savedTimeRef` was ~0. On resume, `resume()` took the early-position fast path (`absoluteTarget <= 0.5` → direct `play()` call). iOS handled this second `play()` on the same element correctly — `currentTime` started advancing normally. The wall-clock fix made this workaround unnecessary.

#### Failed fix attempts (historical — before wall-clock solution)

These approaches were all tested on iOS Safari with Simple Grounding before the wall-clock timer was implemented. None solved the first-play issue because they tried to work around `audio.currentTime` instead of bypassing it entirely.

**1. Wall-clock Date.now() fallback**
Added refs (`pollStartWallTimeRef`, `pollStartAudioTimeRef`, `getEffectiveTimeRef`) to derive elapsed time from `Date.now()` when `audio.currentTime` is stuck at 0. The idea: if `currentTime` hasn't advanced but wall time has, report wall time instead.
**Result:** Did not work. The fallback time was reported but did not fix the underlying issue of `currentTime` staying at 0 — the polling guard (`!audio.paused`) was also failing, so the fallback code never executed.

**2. Remove `!audio.paused` gate + wire start/stopPolling into event listeners**
Removed the `!audioRef.current.paused` check from the polling interval body, added `startPolling()` to the `'play'` event listener, and added `stopPolling()` to the `'pause'` event listener. Theory: the `paused` property reports `true` on iOS even while audio is playing.
**Result:** Did not work. Even with the gate removed, polling fires but `audio.currentTime` itself returns 0. The problem is at the WebKit media pipeline level, not in our polling logic.

**3. prime() with silent WAV data URL**
Added a `prime()` method that plays a minimal 44-byte silent WAV via data URL on the Audio element within the user gesture context (called at the top of `handleStart`, before the async `composeMeditationAudio` call). Theory: iOS requires the Audio element to be "activated" within a user gesture before it can play blob URLs properly.
**Result:** Did not work. The prime/play/pause cycle completed successfully, but subsequent `loadAndPlay` with the blob URL still had `currentTime` stuck at 0.

**4. Inline pause/play cycle on same blob URL**
After the first `play()` resolves in `loadAndPlay`, immediately called `audio.pause()` then `await audio.play()` on the same blob URL. Theory: iOS needs a pause/play cycle to reset its decoder state.
**Result:** Partially worked — timer advanced from 0:00 to 0:01 then froze. This is a key diagnostic clue: `currentTime` DID advance ~1 second during the first play (before our pause), but the second `play()` on the same blob URL caused the decoder to stall again. This confirms the issue is specific to blob URL playback initialization, not a general Audio element problem.

**5. Blob recreation inside loadAndPlay**
After the first `play()` resolves, pause, create a new `Blob` from `composedBytesRef`, create a new `URL.createObjectURL`, load and play the new blob. Theory: iOS needs a fresh blob URL, similar to how `resumeFromBytes()` works during pause/resume.
**Result:** Not tested — rejected as too much complexity added to the critical path. The approach would add latency to every start (not just iOS resume) and duplicate the blob recreation logic already in `resumeFromBytes()`.

**6. Pre-compose + pre-load (eliminate async gap between gesture and play)**
Moved `composeMeditationAudio()` into a background `useEffect` that runs when `timedSequence` is available. Added `preload(blobUrl)` (set src + load, no play) and `play()` (just `audio.play()`, no setup) to `useAudioPlayback`. When user taps Begin, blob is already composed and loaded — `audio.play()` fires within the user gesture with zero async gap. Theory: iOS Safari loses the user gesture context during the ~1-3s async composition, so `currentTime` never initializes.
**Result:** Did not work. Audio played correctly (gong + TTS audible), but `currentTime` still returned 0, timer stayed at 0, text prompts never appeared. Pause/resume still restarted from beginning. The gesture context hypothesis was wrong — iOS WebKit's `currentTime` bug with blob URLs is not related to gesture timing. Also introduced a cleanup race condition: the pre-compose `useEffect` cleanup ran when `hasStarted` changed, revoking the blob URL mid-playback (required a `hasStartedRef` workaround).

#### Key insights from failed attempts

- `audio.currentTime` itself returns 0 on iOS — no amount of polling or fallback timing can work around this at the reporting layer
- The `paused` property may also be unreliable on iOS during first play of blob URLs
- A pause/play cycle on the **same** blob URL does NOT fix the decoder (attempt 4 proved this)
- The existing `resumeFromBytes()` blob recreation DOES work — but only after a user-initiated pause/resume cycle, not programmatically during initial `loadAndPlay`
- Eliminating the async gap between gesture and play does NOT fix `currentTime` (attempt 6 proved this)
- **`audio.currentTime` is fundamentally broken for blob URLs on iOS Safari first play — the fix is to bypass it entirely with a wall-clock timer (`Date.now()`)**

### MP3 files with ID3 metadata tags

The audio composer calculates durations via `buffer.byteLength / CBR_BYTES_PER_SECOND` and the resume system (`resumeFromBytes`) slices the composed `Uint8Array` at byte offsets derived from elapsed time. Both assume the MP3 files contain **only audio frames** — no metadata.

**Status: SOLVED** at both runtime and build time.

**Runtime fix:** `composeMeditationAudio` strips ID3v2 tags from all fetched buffers before composition. This handles tags of any size transparently — small 44-byte TTS tags and large multi-KB editor tags alike. The stripping uses `getID3TagSize()` to parse the synchsafe integer from the ID3v2 header, then `buffer.slice(tagSize)` to return only the audio frames.

**Build-time fix:** The `generate-audio-durations.mjs` manifest script also strips ID3 tags when computing durations, ensuring pre-composition estimates match post-composition reality.

If neither fix were in place, ID3 tags would cause:
1. **Duration overestimation** — e.g., a 4.5s clip with 35KB of ID3 tags reports as ~6.7s
2. **Prompt timing drift** — text sync falls behind because `promptTimeMap` timestamps are wrong
3. **Pause/resume restart** — `resumeFromBytes` calculates the wrong byte offset, landing inside ID3 data instead of at a valid MP3 frame boundary
4. **DEMUXER_ERROR_COULD_NOT_OPEN** — ID3 headers between audio frames in the concatenated blob confuse some decoders (observed in Chrome)

**Detecting large on-disk ID3 tags:** Run from the project root:
```bash
python3 -c "
import os, glob
for d in sorted(os.listdir('public/audio/meditations')):
    for f in sorted(glob.glob(f'public/audio/meditations/{d}/*.mp3')):
        with open(f, 'rb') as fh:
            h = fh.read(10); fh.seek(0, 2); total = fh.tell()
        if h[:3] == b'ID3':
            sz = (h[6]<<21)|(h[7]<<14)|(h[8]<<7)|h[9] + 10
            if sz > 100: print(f'  {f}: {total:,}B, ID3 tag: {sz:,}B ({round(sz/total*100)}%)')
"
```

**Stripping large on-disk tags:** Lossless — only removes metadata, audio data is untouched:
```bash
python3 -c "
import os, glob
for d in sorted(os.listdir('public/audio/meditations')):
    for f in sorted(glob.glob(f'public/audio/meditations/{d}/*.mp3')):
        with open(f, 'rb') as fh:
            h = fh.read(10)
            if h[:3] != b'ID3': continue
            sz = (h[6]<<21)|(h[7]<<14)|(h[8]<<7)|h[9] + 10
            if sz <= 100: continue
            fh.seek(sz); data = fh.read()
        with open(f, 'wb') as fh: fh.write(data)
        print(f'  Stripped {os.path.basename(f)}')
"
```

**Prevention:** When replacing audio clips manually, always strip metadata before adding them to the project. The ElevenLabs API scripts (`scripts/generate-*-audio.mjs`) produce clean files with only tiny 44-45 byte ID3 tags, but manually downloaded/exported files typically carry ID3 tags with embedded artwork, encoder info, etc. (sometimes 30KB+). The runtime stripping handles both cases, but stripping on disk keeps file sizes accurate and consistent.

### Stale cache entries (audio-cache)

The `fetchAudioBuffer()` function checks the browser's Cache API (`audio-cache`) before making network requests. If a service worker or prior code cached a non-audio response for an audio URL (e.g., the Vite dev server's SPA fallback returning `index.html` with HTTP 200 for a path that didn't exist yet), that stale HTML will be returned as the "audio buffer."

**Symptoms:**
- Meditation audio doesn't play (silence where TTS clips should be)
- Timer shows a drastically wrong total duration (e.g., 9 min instead of 17 min)
- All clip buffers are the same tiny size (e.g., 6,095 bytes) — the size of the cached HTML page
- Silence files and gong play correctly (they were cached when valid files existed)
- Other meditations that were added to the project earlier work fine

**Status: SOLVED** — `fetchAudioBuffer()` now validates cached entries via `isValidMp3Buffer()` before returning them. Invalid entries (bytes that don't start with an MPEG sync word or ID3 header) are automatically evicted from the cache, and a fresh network fetch is performed. This is transparent to the rest of the system.

**Debugging tip:** If audio issues occur, check the browser's Cache Storage (DevTools → Application → Cache Storage → `audio-cache`) for entries that are suspiciously small or uniform in size. All MP3 clip buffers should be at least 10KB and vary in size. If many entries are the exact same size (especially a few KB), they're likely cached HTML pages.

**Manual cache clear:** DevTools → Application → Cache Storage → right-click `audio-cache` → Delete. Or in the console: `caches.delete('audio-cache')`

### Booster modal store/audio desync

Store actions that auto-pause/resume meditation during booster modals only update the store — they don't touch the audio element. This can cause prompt progression to stall (guarded by `isPlaying` from store) even though audio is playing.

---

## ElevenLabs TTS API Reference

**Scripts:** `scripts/generate-*-audio.mjs`

Each script calls the ElevenLabs `/v1/text-to-speech/{voice_id}` REST endpoint to generate MP3 clips from prompt text. Key formatting rules:

### Request structure

```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128
```

- **`output_format`** is a **query parameter** on the URL, NOT in the JSON body.
- **`speed`** goes **inside `voice_settings`**, NOT as a top-level body parameter. If placed at the top level, the API silently ignores it.

### Correct request body

```json
{
  "text": "Prompt text here.",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.85,
    "similarity_boost": 0.70,
    "style": 0.0,
    "use_speaker_boost": true,
    "speed": 0.81
  }
}
```

### Parameter ranges

| Parameter | Range | Notes |
|-----------|-------|-------|
| `speed` | 0.7–1.2 | 1.0 = normal. Values below 0.7 are clamped or ignored. |
| `stability` | 0.0–1.0 | Higher = more consistent delivery |
| `similarity_boost` | 0.0–1.0 | Higher = closer to original voice |
| `style` | 0.0–1.0 | Style exaggeration. 0.0 for meditation. |

### Common mistakes

1. **`speed` at top level** — The API ignores `speed` outside `voice_settings`. Always nest it inside.
2. **`output_format` in body** — The API expects this as a URL query parameter, not in the JSON body.
3. **`speed` below 0.7** — Values like 0.47 are outside the valid range and will be clamped or ignored.

### Voice: Theo Silk

All meditation scripts use the Theo Silk voice (`UmQN7jS1Ee8B1czsUtQh`) with `eleven_multilingual_v2`. Voice settings vary per meditation but `speed: 0.7` (slowest allowed) is the baseline for meditative delivery.

---

## Testing Checklist (iOS Safari, physical device)

1. **Timer advances:** Start a meditation → timer should count up after preamble
2. **Text syncs:** Prompts fade in ~200ms after each TTS clip starts, fade out ~2s after clip ends
3. **Single gong on start:** No cut-off and replay of the opening gong
4. **Brief foreground pause/resume:** Pause → wait 5s → Resume → continues from pause point
5. **Background/screen-lock resume:** Lock screen 30s+ → unlock → Resume → continues from pause point (tests blob recreation)
6. **Rapid pause/resume:** Tap 5+ times quickly — button label and audio state stay in sync
7. **Silence timer (OpenSpace):** Same pause/resume behavior, resize preserves elapsed time
8. **Lock screen controls:** Shows title, duration, advancing progress
9. **Desktop regression:** All tests pass on Chrome/Firefox
10. **Duration accuracy:** Timer total matches expected duration (within ~5s). Progress bar reaches 100% when audio ends, not before or after. For variable-duration meditations, selecting a duration (e.g., 10 min) should produce a meditation close to that length.
11. **Skip forward 10s:** Timer jumps forward, prompt text syncs to correct prompt for new position
12. **Skip back 10s:** Timer jumps backward, prompt text syncs to earlier prompt
13. **Seek while paused:** Stays paused at new position, prompt text updates immediately, resume plays from new position
14. **Seek near start:** Clamps to 0, plays from opening gong
15. **Seek near end:** Clamps to composed duration, triggers completion
16. **Rapid seek taps:** Tap skip-forward 5+ times quickly — no crash, advances correctly (`isSeekingRef` gate prevents overlapping seeks)

### After adding or replacing audio clips

1. Run `node scripts/generate-audio-durations.mjs` to regenerate the manifest
2. Verify the updated durations look reasonable in `src/content/meditations/audio-durations.json`
3. For fixed-duration meditations, update `fixedDuration` if needed (sum of clip durations + silences)
4. Run `npm run build` to verify no errors
5. Test that the idle screen shows the correct approximate duration
6. Test that the timer total during playback matches the idle screen estimate
7. If audio doesn't play for new clips but other meditations work, clear `audio-cache` (see "Stale cache entries" under Known Issues) — the browser may have cached SPA fallback HTML for those paths before the files existed

### After adding a new TTS meditation

1. Create content file in `src/content/meditations/` following existing patterns
2. Add audio files to `public/audio/meditations/{meditation-id}/`
3. Register in `src/content/meditations/index.js` (import, add to `meditationLibrary`, re-export)
4. Run `node scripts/generate-audio-durations.mjs`
5. Create module component in `src/components/active/modules/`
6. Register in `src/components/active/moduleRegistry.js` (lazy import, add to `CUSTOM_MODULES` and `MODULE_CATEGORIES`)
7. Add module definition in `src/content/modules/library.js`
