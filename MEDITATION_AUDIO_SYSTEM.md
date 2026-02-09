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
- **`useMeditationPlayback`** — for TTS modules (BodyScan, OpenAwareness, SelfCompassion, SimpleGrounding). Handles audio-text sync, prompt progression, text fade animations.
- **`useSilenceTimer`** — for non-TTS modules (OpenSpace, MusicListening). Simpler: gong-bookended silence blob with elapsed timer. Supports mid-session `resize()`.

Both share `useAudioPlayback` as their audio engine and `useSessionStore.meditationPlayback` for state coordination.

---

## Content Definitions

**Files:** `src/content/meditations/body-scan.js`, `open-awareness.js`, `self-compassion.js`, `simple-grounding.js`

Each meditation exports:

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
    { id: 'settling-01', text: 'Let yourself settle...', baseSilenceAfter: 3, silenceExpandable: false },
    // ...
  ]
}
```

The `id` field doubles as the MP3 filename: `{basePath}{id}.{format}`.

---

## Timed Sequence Generation

**File:** `src/content/meditations/index.js`

- **`calculateSilenceMultiplier(prompts, targetDuration)`** — Binary search for a multiplier (1.0–10.0) so total duration hits target within 5 seconds. Expandable silences scale; non-expandable stay fixed.

- **`generateTimedSequence(prompts, multiplier, { speakingRate, audioConfig })`** — Produces an array with `startTime`/`endTime` relative to sequence start (NOT blob start — the composer adds the gong preamble offset).

---

## Module Components

**Files:** `src/components/active/modules/{BodyScan,OpenAwareness,SelfCompassion,SimpleGrounding}Module.jsx`

Each module:
1. Gets meditation content via `getMeditationById()`
2. Builds `timedSequence` in `useMemo` (computes silence multiplier → generates sequence)
3. Passes to `useMeditationPlayback` with `{ meditationId, moduleInstanceId, timedSequence, totalDuration, onComplete, onSkip, onTimerUpdate }`
4. Renders UI based on returned `playback` state (`hasStarted`, `isLoading`, `isComplete`, `promptPhase`, `currentPrompt`, `getPrimaryButton()`)

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

### handleStart flow

1. `composeMeditationAudio(timedSequence, { gongDelay: 1, gongPreamble: 8 })` — fetches all MP3s, builds blob
2. Store refs: `blobUrlRef`, `promptTimeMapRef`, `composedDurationRef`
3. `audio.storeComposedBytes(composedBytes)` — stores `Uint8Array` for iOS blob recreation
4. `startMeditationPlayback(moduleInstanceId)` — store: `hasStarted=true`, `isPlaying=true`
5. `audio.loadAndPlay(blobUrl)` — sets src, load, wait canplay, play

### Blob structure

```
[1s silence] [gong ~7.5s] [gap] [prompt1.mp3] [silence] [prompt2.mp3] [silence] ... [1s silence] [gong]
|<------ GONG_PREAMBLE (8s) --->|<---------- user-visible meditation ---------->|<-- closing -->|
```

The `promptTimeMap` has absolute timestamps within the blob (e.g., first prompt starts at 8.0s).

### How elapsedTime drives everything

`elapsedTime` is set from the wall-clock timer in `useAudioPlayback` via the `onTimeUpdate` callback. The wall-clock tracks real elapsed time via `Date.now()` instead of relying on `audio.currentTime`, which is broken for blob URLs on iOS Safari (see Known Issues). Everything derives from `elapsedTime`:

- **Timer:** `userElapsed = max(0, elapsedTime - GONG_PREAMBLE)` → reported to ModuleStatusBar
- **Prompts:** Linear scan of `promptTimeMap` to find active prompt → triggers text fade sequence (`hidden` → `fading-in` → `visible` → `fading-out`)
- **Completion:** `elapsedTime >= composedTotal && composedTotal > 0 && hasStarted`

### handlePauseResume

Uses `audio.isPaused()` (reads `<audio>.paused` directly) instead of store's `isPlaying` to avoid stale-closure bugs from rapid tapping or modal interference.

### Media Session API

Sets `navigator.mediaSession.metadata`, registers play/pause handlers (using `audio.isPaused()`), and updates `setPositionState()` for lock-screen duration/progress. `isPlaying` is intentionally excluded from the handler effect's deps to prevent handler churn.

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

### Same patterns
- `handlePauseResume` uses `audio.isPaused()`
- Media Session handlers, `setPositionState()`, stale-state recovery all work identically

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

Resets position tracking (including wall-clock refs `wallStartRef` and `wallAccumulatedRef`), sets `audio.src`, loads, waits for `canplay` (with 5s timeout guarded by `settled` flag to prevent double-play on iOS), calls `play()`, starts polling (which sets `wallStartRef = Date.now()`).

### pause()

Accumulates wall-clock elapsed time (`wallAccumulatedRef += (Date.now() - wallStartRef) / 1000`), zeroes `wallStartRef`, saves accumulated time to `savedTimeRef`, pauses element, stops polling.

### resume() — Two-Phase Strategy

**Phase 1 (fast path):** Set `currentTime` to saved position while paused, call `play()`, check if seek survived. Works on desktop and sometimes iOS when buffer hasn't been evicted.

**Phase 2 (blob recreation fallback):** If iOS reset `currentTime` to 0 after `play()`, call `resumeFromBytes()`: calculate byte offset from saved time, snap to MP3 frame boundary via `findNextFrameBoundary()`, slice remaining bytes with `subarray()` (zero-copy), create new Blob + URL, load and play. `timeOffsetRef` ensures upstream hooks see absolute position with no discontinuity.

### Why two phases

Phase 1 handles the common case (brief foreground pause) with zero latency. Phase 2 handles iOS WebKit's inability to seek blob URLs — instead of fighting the seek, it creates a new blob starting from the pause point. The `Uint8Array` is already in memory; `subarray()` is zero-copy.

### Memory

A 10-min CBR 128kbps meditation ≈ 9.6MB in `composedBytesRef`. `subarray()` shares the `ArrayBuffer`. Worst case ~20MB briefly during fallback resume.

---

## Audio Composer Service

**File:** `src/services/audioComposerService.js`

### Key exports

- `CBR_BYTES_PER_SECOND = 16000` — CBR 128kbps = 16000 bytes/sec
- `decomposeSilence(seconds)` — Breaks duration into pre-generated silence block files (60s, 30s, 10s, 5s, 1s, 0.5s) via greedy algorithm
- `findNextFrameBoundary(bytes, offset)` — Scans for next MPEG sync word (`0xFF 0xE0` mask) within 418 bytes
- `composeMeditationAudio(timedSequence, options)` — Two-pass: dry run to collect URLs, fetch all in parallel, second pass with real durations, concatenate into single `Uint8Array`, return `{ blobUrl, composedBytes, promptTimeMap, totalDuration }`
- `composeSilenceTimer(durationSeconds, options)` — Same pattern for silence-only blobs, supports `skipOpeningGong` option for resize
- `revokeMeditationBlobUrl(blobUrl)` — `URL.revokeObjectURL` wrapper

### Duration calculation

All TTS clips and silence blocks are CBR 128kbps: `bytes / 16000 = seconds`. Duration is computed from actual byte lengths in the second pass, not from estimates.

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

### Booster modal store/audio desync

Store actions that auto-pause/resume meditation during booster modals only update the store — they don't touch the audio element. This can cause prompt progression to stall (guarded by `isPlaying` from store) even though audio is playing.

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
