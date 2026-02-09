# Meditation Audio System — Technical Reference

Complete documentation of how meditation audio playback works, from content definition through blob composition, playback, timer display, and text synchronization.

---

## System Overview

The meditation system plays guided meditations as a **single continuous MP3 blob** through one `<audio>` element. This design exists because iOS Safari keeps a single continuous audio stream playing through screen lock, but would interrupt multiple sequential audio loads.

**The stack (bottom to top):**

```
┌─────────────────────────────────────────────────────────┐
│  ModuleStatusBar        (displays timer: "2:30 / 10:00")│
├─────────────────────────────────────────────────────────┤
│  ActiveView             (wires onTimerUpdate callback)  │
├─────────────────────────────────────────────────────────┤
│  BodyScanModule         (builds timedSequence, renders) │
├─────────────────────────────────────────────────────────┤
│  useMeditationPlayback  (orchestrates everything)       │
├─────────────────────────────────────────────────────────┤
│  useAudioPlayback       (wraps <audio> element)         │
├─────────────────────────────────────────────────────────┤
│  audioComposerService   (builds the MP3 blob)           │
├─────────────────────────────────────────────────────────┤
│  content/meditations/   (prompt definitions)            │
├─────────────────────────────────────────────────────────┤
│  useSessionStore        (persisted playback state)      │
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1: Content Definitions

**Files:** `src/content/meditations/body-scan.js`, `open-awareness.js`, `self-compassion.js`, `simple-grounding.js`

Each meditation exports an object like:

```js
{
  id: 'body-scan',
  title: 'Body Scan',
  baseDuration: 517,      // ~8:37 base (all silence at 1x)
  minDuration: 600,       // 10 min minimum
  maxDuration: 900,       // 15 min maximum
  durationSteps: [10, 15],
  speakingRate: 150,       // words per minute for estimation
  audio: {
    basePath: '/audio/meditations/body-scan/',
    format: 'mp3',
  },
  prompts: [
    {
      id: 'settling-01',                    // Matches filename: settling-01.mp3
      text: 'Let yourself settle...',       // Displayed on screen
      baseSilenceAfter: 3,                  // Seconds of silence after clip
      silenceExpandable: false,             // true = silence scales with duration
      silenceMax: undefined,                // Cap for expanded silence (only if expandable)
    },
    // ... 54 total prompts for body scan
  ]
}
```

**Key detail:** The `id` field doubles as the MP3 filename. When `audioConfig` is provided, each prompt's audio source becomes `{basePath}{id}.{format}` — e.g., `/audio/meditations/body-scan/settling-01.mp3`.

---

## Layer 2: Timed Sequence Generation

**File:** `src/content/meditations/index.js`

### `calculateSilenceMultiplier(prompts, targetDurationSeconds)`

Uses binary search to find a multiplier (1.0–10.0) such that the total meditation duration hits the target within 5 seconds.

For each prompt, total time = speaking time + silence:
- **Speaking time** = `(wordCount / speakingRate) * 60` (estimated from text)
- **Silence** = `baseSilenceAfter` if not expandable, or `min(baseSilenceAfter * multiplier, silenceMax)` if expandable

### `generateTimedSequence(prompts, silenceMultiplier, { speakingRate, audioConfig })`

Produces an array of objects:

```js
[
  {
    id: 'settling-01',
    text: 'Let yourself settle...',
    speakingDuration: 2.4,          // Estimated from word count
    silenceDuration: 3,             // After silence expansion
    startTime: 0,                   // Relative to sequence start (NOT blob start)
    endTime: 5.4,                   // startTime + speakingDuration + silenceDuration
    audioSrc: '/audio/meditations/body-scan/settling-01.mp3',
  },
  // ...
]
```

**Critical:** These `startTime`/`endTime` values are relative to the sequence's own start at 0. They do NOT account for the gong preamble that gets added during composition. The composer handles offset.

---

## Layer 3: Module Component

**File:** `src/components/active/modules/BodyScanModule.jsx`

```
BodyScanModule receives: { module, onComplete, onSkip, onTimerUpdate }
```

### What the module does:

1. **Gets meditation content:** `getMeditationById('body-scan')` → the object from Layer 1
2. **Builds timed sequence in useMemo:**
   ```js
   const durationSeconds = selectedDuration * 60;  // e.g., 600 for 10 min
   const silenceMultiplier = calculateSilenceMultiplier(meditation.prompts, durationSeconds);
   const sequence = generateTimedSequence(meditation.prompts, silenceMultiplier, {
     speakingRate: meditation.speakingRate || 150,
     audioConfig: meditation.audio,
   });
   const total = sequence[sequence.length - 1].endTime;  // e.g., ~600 seconds
   ```
3. **Passes to orchestrator hook:**
   ```js
   const playback = useMeditationPlayback({
     meditationId: 'body-scan',
     moduleInstanceId: module.instanceId,
     timedSequence: sequence,
     totalDuration: total,       // ~600 seconds (the user-facing duration)
     onComplete, onSkip, onTimerUpdate,
   });
   ```
4. **Renders UI based on `playback` state:**
   - `playback.hasStarted` / `playback.isLoading` / `playback.isComplete` → which view to show
   - `playback.promptPhase` → CSS opacity class ('hidden'|'fading-in'|'visible'|'fading-out')
   - `playback.currentPrompt?.text` → the prompt text to display
   - `playback.getPrimaryButton()` → returns `{ label, onClick }` for the control bar

---

## Layer 4: Orchestrator Hook

**File:** `src/hooks/useMeditationPlayback.js` (359 lines)

This is the central piece. It takes the timed sequence from the module and handles everything.

### Constants

```js
const TEXT_FADE_IN_DELAY = 200;          // ms: delay before text appears after audio starts
const TEXT_FADE_OUT_INTO_SILENCE = 2000; // ms: text lingers 2s into silence after clip ends
const PROMPT_DISPLAY_DURATION = 8000;    // ms: fallback text display time if muted
const GONG_DELAY = 1;                    // seconds of silence before gong
const GONG_PREAMBLE = 8;                 // total seconds before first TTS prompt
```

### State

```js
// From Zustand store (NOT persisted — excluded via partialize)
const meditationPlayback = useSessionStore(state => state.meditationPlayback);
const isThisModule = meditationPlayback.moduleInstanceId === moduleInstanceId;
const hasStarted = isThisModule && meditationPlayback.hasStarted;
const isPlaying = isThisModule && meditationPlayback.isPlaying;

// Local state
const [isLoading, setIsLoading] = useState(false);
const blobUrlRef = useRef(null);             // The blob URL
const promptTimeMapRef = useRef([]);          // Maps elapsed time → prompt index
const composedDurationRef = useRef(0);        // Total blob duration including gong
const [currentPromptIndex, setCurrentPromptIndex] = useState(-1);
const [promptPhase, setPromptPhase] = useState('hidden');
const [elapsedTime, setElapsedTime] = useState(0);  // THE time source for everything
```

### The audio hook instance

```js
const audio = useAudioPlayback({
  onEnded: () => {
    if (blobUrlRef.current) pauseMeditationPlayback();
  },
  onTimeUpdate: (currentTime) => {
    setElapsedTime(currentTime);    // <-- THIS IS THE ONLY WAY elapsedTime GETS UPDATED
  },
  onError: (e) => { ... },
});
```

**`elapsedTime` is set from `audio.currentTime` via the `onTimeUpdate` callback.** This callback fires from two sources: the native `timeupdate` event on the `<audio>` element, and a 250ms `setInterval` polling fallback (added for iOS Safari reliability). Everything else (timer display, prompt progression, completion detection) derives from `elapsedTime`.

### handleStart flow (user clicks "Begin")

```
1. setIsLoading(true)
2. composeMeditationAudio(timedSequence, { gongDelay: 1, gongPreamble: 8 })
   → fetches all MP3s, builds blob, returns { blobUrl, composedBytes, promptTimeMap, totalDuration }
3. Store refs: blobUrlRef, promptTimeMapRef, composedDurationRef
4. audio.storeComposedBytes(composedBytes) → stores Uint8Array for iOS blob recreation on resume
5. Reset display: elapsedTime=0, promptIndex=-1, promptPhase='hidden'
6. startMeditationPlayback(moduleInstanceId) → store: hasStarted=true, isPlaying=true
7. audio.loadAndPlay(blobUrl) → sets <audio>.src, calls .load(), waits for canplay, calls .play()
8. setIsLoading(false)
```

### The blob structure

After composition, the blob contains:

```
[1s silence] [gong ~7.5s] [gap to fill 8s preamble] [prompt1.mp3] [silence] [prompt2.mp3] [silence] ... [1s silence] [gong ~7.5s]
|<-------------- GONG_PREAMBLE (8s) ------------->|<------- user-visible meditation ------->|<-- closing -->|
```

The `promptTimeMap` returned by the composer has absolute timestamps within the blob:

```js
[
  { promptIndex: 0, audioTimeStart: 8.0,  audioTimeEnd: 10.4, slotEnd: 13.4, text: '...', id: 'settling-01' },
  { promptIndex: 1, audioTimeStart: 13.4, audioTimeEnd: 17.2, slotEnd: 21.2, text: '...', id: 'settling-02' },
  // ...
]
```

**audioTimeStart** = when the TTS clip starts in the blob (includes 8s preamble offset)
**audioTimeEnd** = when the TTS clip ends (speech stops, silence begins)
**slotEnd** = when silence after this prompt ends (next prompt or closing gong starts)

### How elapsedTime drives everything

**Source:** The `<audio>` element fires native `timeupdate` events. The listener at `useAudioPlayback.js:95-97` calls `onTimeUpdateRef.current(audio.currentTime)`. This calls `setElapsedTime(currentTime)` in `useMeditationPlayback.js:90`.

**Timer display** (useEffect at line 201-217):
```js
const userElapsed = Math.max(0, elapsedTime - GONG_PREAMBLE);  // Subtract 8s preamble
onTimerUpdate({
  progress: (userElapsed / totalDuration) * 100,
  elapsed: userElapsed,        // What appears as "2:30" in the status bar
  total: totalDuration,        // What appears as "/ 10:00" in the status bar
  showTimer: hasStarted && !isComplete,
  isPaused: !isPlaying,
});
```

This fires up to ActiveView's `handleModuleTimerUpdate` callback, which sets state, which passes props to ModuleStatusBar, which renders `{formatTime(moduleElapsed)} / {formatTime(moduleTotal)}`.

**Prompt progression** (useEffect at line 146-197):
```js
// Guard: only runs when playing and we have a map
if (!hasStarted || !isPlaying || promptTimeMapRef.current.length === 0) return;

// Find which prompt we're in
let targetIndex = -1;
for (let i = 0; i < map.length; i++) {
  if (elapsedTime >= map[i].audioTimeStart) {
    targetIndex = i;
  }
}

// If new prompt detected, trigger text fade sequence
if (targetIndex !== currentPromptIndex && targetIndex >= 0) {
  setCurrentPromptIndex(targetIndex);
  if (targetIndex !== lastPromptRef.current) {
    lastPromptRef.current = targetIndex;
    // Phase: hidden → (200ms) → fading-in → (300ms) → visible
    // Then schedule: → (timeUntilClipEnd + 2000ms) → fading-out
  }
}
```

**Completion detection** (derived, line 307):
```js
const isComplete = elapsedTime >= composedTotal && composedTotal > 0 && hasStarted;
```

### handlePauseResume

```js
const handlePauseResume = useCallback(() => {
  if (!audio.isPaused()) {            // Reads <audio>.paused directly — never stale
    pauseMeditationPlayback();        // Updates store: isPlaying=false
    audio.pause();                    // Pauses <audio> element, saves position
  } else {
    resumeMeditationPlayback();       // Updates store: isPlaying=true
    audio.resume();                   // Restores position, then calls .play()
  }
}, [pauseMeditationPlayback, resumeMeditationPlayback, audio]);
```

Uses `audio.isPaused()` (reads DOM element directly) instead of `isPlaying` from the store closure. This prevents stale-closure bugs from rapid tapping or booster modal interference.

### Media Session API

Sets `navigator.mediaSession.metadata` with title/artist/album. Registers play/pause handlers using `audio.isPaused()` for lock screen controls. Calls `setPositionState({ duration, playbackRate, position })` via a separate effect to give iOS the total duration and current progress.

The handler registration effect depends on `[hasStarted, meditation, audio, pauseMeditationPlayback, resumeMeditationPlayback]`. `isPlaying` is intentionally excluded to prevent handler churn on every pause/resume.

### Stale-state recovery (line 103-107)

```js
useEffect(() => {
  if (hasStarted && !blobUrlRef.current && !isLoading) {
    resetMeditationPlayback();
  }
}, [hasStarted, isLoading, resetMeditationPlayback]);
```

If the store says playback is active but there's no blob (page reload), reset to idle. This works because `meditationPlayback` is excluded from localStorage persistence (store's `partialize` at line 2194).

---

## Layer 5: Audio Playback Hook

**File:** `src/hooks/useAudioPlayback.js` (~440 lines)

Wraps a single `new Audio()` element with React state. Handles iOS blob URL seeking limitations via a two-phase resume strategy with blob recreation fallback.

### Audio element lifecycle

- **Created lazily** via `getAudio()` — only when first needed
- **Listeners attached once** via `attachListeners()` — guarded by `listenersAttachedRef`
- **Cleaned up on unmount** — pause, clear src, null the ref, clear `composedBytesRef`

### Key refs

```js
savedTimeRef        // Last known absolute currentTime (persisted across pause/resume)
composedBytesRef    // Full composed MP3 Uint8Array (for blob recreation on iOS)
timeOffsetRef       // Added to audio.currentTime for absolute time after blob recreation
currentBlobUrlRef   // Current blob URL (for revocation when recreating blobs)
```

### Event listeners (attached once, never removed until unmount)

| Event | Handler |
|-------|---------|
| `ended` | Stops polling, `setIsPlaying(false)`, calls `onEndedRef.current()` |
| `error` | Ignores empty-src errors. Otherwise stops polling, sets error state, calls `onErrorRef.current()` |
| `canplaythrough` | `setIsLoaded(true)` |
| `play` | `setIsPlaying(true)`, calls `onPlayRef.current()` |
| `pause` | `setIsPlaying(false)`, calls `onPauseRef.current()` |
| `timeupdate` | Reports `audio.currentTime + timeOffsetRef.current` to `onTimeUpdateRef` |

**Time reporting:** Both the native `timeupdate` event and the 250ms polling fallback add `timeOffsetRef.current` to `audio.currentTime` before reporting upstream. This ensures orchestrator hooks always receive absolute position in the original composition, even after blob recreation where `audio.currentTime` restarts from 0.

### loadAndPlay(blobUrl)

```
1. Get/create Audio element
2. Attach listeners (once)
3. Reset: savedTimeRef=0, timeOffsetRef=0, currentBlobUrlRef=blobUrl, stop polling
4. Set audio.preload = 'auto', audio.src = blobUrl, audio.load()
5. Wait for canplay event (or 5s timeout, guarded by `settled` flag)
6. Call audio.play(), start polling
7. Return true/false
```

### storeComposedBytes(bytes)

Called by orchestrator hooks (`useMeditationPlayback`, `useSilenceTimer`) after composing audio. Stores the full `Uint8Array` in `composedBytesRef` and resets `timeOffsetRef` to 0. This data enables blob recreation on iOS resume.

### pause()

```js
savedTimeRef.current = audioRef.current.currentTime + timeOffsetRef.current;  // Save absolute position
audioRef.current.pause();
stopPolling();
```

Saves **absolute** position (including any offset from prior blob recreation) to `savedTimeRef` before pausing.

### resume() — Two-Phase Strategy

```
Phase 1 — Fast path (seek-before-play):
1. Read absoluteTarget from savedTimeRef
2. Convert to blob-local position: blobTarget = absoluteTarget - timeOffsetRef
3. Set audio.currentTime = blobTarget (seek while paused)
4. Call audio.play()
5. Check: did currentTime hold? (actualTime >= blobTarget - 1.0)
   → YES: start polling, return true (done)
   → NO: audio.pause(), fall through to Phase 2

Phase 2 — Blob recreation fallback (iOS):
1. If composedBytesRef has data, call resumeFromBytes()
2. Otherwise return false
```

The fast path works on desktop browsers and on iOS when the buffer hasn't been evicted. The fallback handles the case where iOS WebKit resets `currentTime` to 0 after `.play()`.

### resumeFromBytes() — Blob Recreation

When iOS can't seek within the current blob, this method creates a new blob from the remaining bytes:

```
1. Calculate byte offset: Math.floor(absoluteTime * CBR_BYTES_PER_SECOND)
2. Snap to MP3 frame boundary via findNextFrameBoundary()
3. Slice: bytes.subarray(frameAlignedOffset) — zero-copy (shares ArrayBuffer)
4. Create new Blob + URL, revoke old blob URL
5. Set timeOffsetRef = frameAlignedOffset / CBR_BYTES_PER_SECOND
6. Load and play new blob (canplay/3s-timeout pattern)
```

After blob recreation:
- `audio.currentTime` starts at 0 for the new blob
- `onTimeUpdate` reports `0 + timeOffsetRef = absolutePosition` — upstream hooks see no discontinuity
- Prompt progression, timer, completion detection all continue working because they receive absolute time

### stop()

```js
audioRef.current.pause();
audioRef.current.currentTime = 0;
savedTimeRef.current = 0;
timeOffsetRef.current = 0;
setIsPlaying(false);
```

### getCurrentTime()

Returns `audio.currentTime + timeOffsetRef.current` — always absolute position in the original composition.

### Return value

```js
{
  isPlaying,          // React state, driven by play/pause events
  isLoaded,           // React state, set on canplaythrough
  isMuted,            // React state, toggled by user
  error,              // React state
  loadAndPlay,        // async (blobUrl) => boolean — resets offset, starts fresh
  pause,              // () => void — saves absolute position, stops polling
  resume,             // async () => boolean — two-phase: seek-first, fallback to blob recreation
  stop,               // () => void — resets position and offset to 0
  seek,               // (time) => void — also updates savedTimeRef
  toggleMute,         // () => void
  setMuted,           // (bool) => void
  storeComposedBytes, // (Uint8Array) => void — stores bytes for blob recreation
  getCurrentTime,     // () => number — absolute position (includes timeOffset)
  getDuration,        // () => number
  isPaused,           // () => boolean — reads audioRef.current.paused directly (never stale)
}
```

---

## Layer 6: Audio Composer Service

**File:** `src/services/audioComposerService.js` (~432 lines)

### Exports

```js
export const CBR_BYTES_PER_SECOND = 16000;       // CBR 128kbps = 16000 bytes/sec
export function decomposeSilence(durationSeconds)  // → string[] of silence block URLs
export function findNextFrameBoundary(bytes, offset) // → byte offset of next MPEG frame
export function buildConcatenationPlan(timedSequence, options, bufferMap) // → { plan, promptTimeMap, totalDuration }
export async function composeMeditationAudio(timedSequence, options) // → { blobUrl, composedBytes, promptTimeMap, totalDuration }
export async function composeSilenceTimer(durationSeconds, options)  // → { blobUrl, composedBytes, totalDuration, preambleEnd }
export function revokeMeditationBlobUrl(blobUrl)
```

### decomposeSilence(durationSeconds)

Breaks a duration into pre-generated silence block files using a greedy algorithm.

Available blocks: 60s, 30s, 10s, 5s, 1s, 0.5s

Example: 45.5s → `[silence-30s.mp3, silence-10s.mp3, silence-5s.mp3, silence-0.5s.mp3]`

Rounds to nearest 0.5s. Re-rounds after each subtraction to prevent float drift.

### findNextFrameBoundary(bytes, offset)

Scans forward from a byte offset to find the next valid MPEG audio frame boundary. Looks for the sync word: first byte `0xFF`, second byte has top 3 bits set (`0xE0` mask). Scans at most 418 bytes (one CBR 128kbps/44100Hz frame). Returns the original offset if no sync word found.

Used by `useAudioPlayback.resumeFromBytes()` to ensure blob slicing happens on a clean MP3 frame boundary, preventing decoder artifacts.

### buildConcatenationPlan(timedSequence, options, bufferMap)

Two-pass function. Called first without bufferMap (to collect URLs), then with bufferMap (to compute real durations from byte lengths).

**Build order:**

1. **Opening gong preamble:**
   - `decomposeSilence(gongDelay)` → 1s silence
   - Gong file
   - `decomposeSilence(gongPreamble - gongDelay - gongDuration)` → gap to fill
   - Snap `currentTime = gongPreamble` (always 8s regardless of actual gong length)

2. **For each prompt in timedSequence:**
   - Record `promptAudioStart = currentTime`
   - Add TTS clip to plan
   - `clipDuration` = real duration from buffer if available, else `speakingDuration` estimate
   - `currentTime += clipDuration`
   - Record `promptAudioEnd = currentTime`
   - Add `decomposeSilence(prompt.silenceDuration)` to plan
   - `currentTime += silenceDuration`
   - Push to promptTimeMap: `{ audioTimeStart, audioTimeEnd, slotEnd: currentTime, text, id }`

3. **Closing gong:**
   - 1s silence
   - Gong file
   - `currentTime += gongDuration`

**Returns:** `{ plan, promptTimeMap, totalDuration: currentTime }`

### composeMeditationAudio(timedSequence, options)

```
1. Dry run: buildConcatenationPlan without bufferMap → get list of unique URLs
2. Fetch all URLs in parallel via Promise.allSettled
   - TTS clips: failure = throw (critical)
   - Silence blocks: failure = warn (non-critical)
3. Second pass: buildConcatenationPlan WITH bufferMap → real durations
4. Concatenate: new Uint8Array(totalBytes), copy each buffer sequentially
5. new Blob([composed], { type: 'audio/mpeg' })
6. URL.createObjectURL(blob)
7. Return { blobUrl, composedBytes, promptTimeMap, totalDuration }
```

**`composedBytes`:** The full concatenated `Uint8Array` is returned alongside the blob URL. This allows `useAudioPlayback` to store the bytes and use them for blob recreation on iOS resume (see Layer 5 — `resumeFromBytes()`). No extra memory allocation — this is the same array used to create the Blob.

**Duration calculation:** `totalDuration` from the second pass uses real MP3 byte lengths: `byteLength / 16000` (CBR 128kbps). This is the "composed total" stored in `composedDurationRef`.

### composeSilenceTimer(durationSeconds, options)

Same pattern as `composeMeditationAudio` but for simple timed modules. Returns `composedBytes` alongside `blobUrl` for the same iOS resume reason.

### estimateMp3Duration(buffer)

```js
return buffer.byteLength / CBR_BYTES_PER_SECOND;  // CBR_BYTES_PER_SECOND = 16000
```

All TTS clips and silence blocks are CBR 128kbps, so `bytes / 16000 = seconds`.

---

## Layer 7: Session Store

**File:** `src/stores/useSessionStore.js`

### meditationPlayback state (line 347-351)

```js
meditationPlayback: {
  moduleInstanceId: null,    // Which module owns playback
  isPlaying: false,          // Currently playing
  hasStarted: false,         // User clicked Begin
}
```

**NOT persisted** — excluded via `partialize` at line 2194. On page reload, this resets to defaults, and the stale-state recovery effect in `useMeditationPlayback` cleans up.

### Actions (lines 1257-1304)

**startMeditationPlayback(moduleInstanceId):**
```js
set({
  meditationPlayback: {
    moduleInstanceId,
    isPlaying: true,
    hasStarted: true,
    startedAt: Date.now(),      // Note: stored but never read by the hooks
    accumulatedTime: 0,          // Note: stored but never read by the hooks
  },
});
```

**pauseMeditationPlayback():**
```js
const currentSegment = pb.startedAt ? (Date.now() - pb.startedAt) / 1000 : 0;
set({
  meditationPlayback: {
    ...pb,
    isPlaying: false,
    startedAt: null,
    accumulatedTime: (pb.accumulatedTime || 0) + currentSegment,
  },
});
```

**resumeMeditationPlayback():**
```js
set({
  meditationPlayback: {
    ...state.meditationPlayback,
    isPlaying: true,
    startedAt: Date.now(),
  },
});
```

**resetMeditationPlayback():**
Resets everything to null/false/0.

**Note:** The store tracks `startedAt` and `accumulatedTime`, but these fields are never read by `useMeditationPlayback` or `useAudioPlayback`. The hooks use `audio.currentTime` exclusively for timing. These store fields appear to be vestigial or intended for future crash recovery.

### Booster modal interactions

Several store actions auto-pause/resume meditation playback when modals appear (e.g., booster prompt, check-in overlays). They call `pauseMeditationPlayback()` and `resumeMeditationPlayback()` directly, but **do not call `audio.pause()` or `audio.resume()`** — they only change the store state. The audio element continues playing or stays paused independently.

---

## Layer 8: Timer Display

**File:** `src/components/active/ModuleStatusBar.jsx`

Receives props from ActiveView:
```js
<ModuleStatusBar
  phase="come-up"
  progress={moduleTimerState.progress}
  moduleElapsed={moduleTimerState.elapsed}
  moduleTotal={moduleTimerState.total}
  showModuleTimer={moduleTimerState.showTimer}
  isPaused={moduleTimerState.isPaused}
/>
```

Displays: `{formatTime(moduleElapsed)} / {formatTime(moduleTotal)}`

Only shows when `showModuleTimer && moduleElapsed !== undefined && moduleTotal !== undefined`.

### The full timer data flow

```
audio element fires 'timeupdate' (native) OR polling interval fires (250ms fallback)
  → useAudioPlayback: onTimeUpdateRef.current(audio.currentTime)
    → useMeditationPlayback: setElapsedTime(currentTime)
      → useEffect [elapsedTime]: calculates userElapsed = max(0, elapsedTime - 8)
        → onTimerUpdate({ elapsed: userElapsed, total: totalDuration, ... })
          → ActiveView: handleModuleTimerUpdate → setModuleTimerState(timerState)
            → ModuleStatusBar re-renders: {formatTime(elapsed)} / {formatTime(total)}
```

---

## Layer 9: Silence Timer Hook (for non-TTS modules)

**File:** `src/hooks/useSilenceTimer.js` (300 lines)

Used by OpenSpaceModule and MusicListeningModule. Same architecture as useMeditationPlayback but simpler — no prompt text sync, just a gong-bookended silence blob.

### Key differences from useMeditationPlayback:
- Uses `composeSilenceTimer()` instead of `composeMeditationAudio()`
- `GONG_PREAMBLE = 3` (not 8)
- `onTimeUpdate` subtracts preamble inline: `Math.max(0, currentTime - preambleEndRef.current) + elapsedOffsetRef.current`
- Supports `resize()` for mid-session duration changes (recomposes blob without opening gong)
- No prompt progression or text fade logic

### Same patterns (all updated alongside useMeditationPlayback):
- `handlePauseResume` uses `audio.isPaused()` for stale-closure safety
- Media Session handlers use `audio.isPaused()`, `isPlaying` excluded from deps
- `setPositionState()` effect updates lock-screen duration/progress
- `resume()` restores position before `.play()` (via useAudioPlayback)
- `resize()` uses `!audio.isPaused()` instead of `isPlaying`

---

## Complete Data Flow: User Clicks "Begin" on Body Scan (10 min)

```
1. BodyScanModule: useMemo computes timedSequence (54 prompts, ~600s total)
2. User taps "Begin" → playback.handleStart()
3. composeMeditationAudio(timedSequence, { gongDelay: 1, gongPreamble: 8 })
   a. Dry run: collect unique URLs (54 TTS clips + silence blocks + gong)
   b. Fetch all in parallel (~60 fetches)
   c. Second pass with real durations: build plan + promptTimeMap
   d. Concatenate ~4MB of MP3 bytes into Uint8Array
   e. Create Blob, return blobUrl + promptTimeMap + totalDuration (~617s)
4. Store refs: blobUrl, promptTimeMap (54 entries), composedDuration (~617s)
5. startMeditationPlayback(moduleInstanceId) → store: hasStarted=true, isPlaying=true
6. audio.loadAndPlay(blobUrl) → <audio>.src = blob:..., .load(), wait canplay, .play()
7. Audio begins: 1s silence → gong rings → gap → first TTS starts at ~8s

8. <audio> fires timeupdate (browser-controlled, ~4Hz)
   → setElapsedTime(audio.currentTime)     e.g., currentTime = 8.5
   → timer effect: userElapsed = max(0, 8.5 - 8) = 0.5
     → onTimerUpdate({ elapsed: 0.5, total: 600, ... })
       → StatusBar shows "0:00 / 10:00"
   → prompt effect: finds targetIndex where 8.5 >= audioTimeStart
     → first prompt's audioTimeStart is 8.0, so targetIndex = 0
     → triggers text fade: hidden → fading-in → visible → (after clip ends + 2s) → fading-out

9. This cycle repeats every ~250ms as audio.currentTime advances

10. At ~617s, audio ends → 'ended' event → pauseMeditationPlayback()
    → isComplete = (617 >= 617 && 617 > 0 && true) = true
    → getPhase() returns 'completed' → button shows "Continue"
```

---

## Complete Data Flow: User Clicks "Pause" then "Resume"

```
PAUSE:
1. User taps Pause → handlePauseResume()
2. audio.isPaused() returns false (reads <audio>.paused directly) → enters pause branch
3. pauseMeditationPlayback() → store: isPlaying=false, accumulatedTime updated
4. audio.pause() → saves absolute position (currentTime + timeOffset) to savedTimeRef,
   calls <audio>.pause(), stops polling
   → 'pause' event fires → useAudioPlayback: setIsPlaying(false)
5. Polling stopped, timeupdate stops firing → elapsedTime freezes at last value

RESUME (Two-Phase Strategy):
1. User taps Resume → handlePauseResume()
2. audio.isPaused() returns true → enters resume branch
3. resumeMeditationPlayback() → store: isPlaying=true, startedAt=Date.now()
4. audio.resume() — Phase 1 (fast path):
   a. Reads absoluteTarget from savedTimeRef
   b. Converts to blob-local position: blobTarget = absoluteTarget - timeOffsetRef
   c. Sets audioRef.current.currentTime = blobTarget (seek while still paused)
   d. Calls audioRef.current.play()
   e. Checks: did currentTime hold near blobTarget?
      → YES (desktop, or iOS buffer not evicted): start polling, done ✓
      → NO (iOS reset currentTime to ~0): pause immediately, fall through

5. audio.resume() — Phase 2 (blob recreation fallback):
   a. Call resumeFromBytes()
   b. Calculate byte offset: absoluteTarget * 16000
   c. Snap to MP3 frame boundary via findNextFrameBoundary()
   d. Slice remaining bytes: composedBytesRef.subarray(frameOffset) — zero-copy
   e. Create new Blob + URL, revoke old blob URL
   f. Set timeOffsetRef = frameOffset / 16000
   g. Load new blob, wait canplay, call .play(), start polling
   h. onTimeUpdate now reports: audio.currentTime (starts at 0) + timeOffsetRef = absolute position
   → Upstream hooks see no discontinuity — timer, prompts, completion all work ✓
```

### Why the two-phase approach

**Phase 1 (seek-before-play)** works on all desktop browsers and sometimes on iOS when the media buffer hasn't been evicted. It has zero latency — no blob allocation, no loading. This handles the common case of brief foreground pauses.

**Phase 2 (blob recreation)** handles iOS WebKit's fundamental limitation: blob URLs don't support HTTP Range requests, so WebKit's internal media pipeline can silently reload the source and reset `currentTime` to 0 on `.play()`. Instead of fighting the seek, we create a new blob starting from the pause point. The `Uint8Array` is already in memory from initial composition — `subarray()` is zero-copy (shares the underlying ArrayBuffer). The only new allocation is the `Blob` wrapper (~200ms latency).

### Memory impact

A 10-min CBR 128kbps meditation ≈ 9.6MB `Uint8Array` kept in `composedBytesRef`. `subarray()` shares the `ArrayBuffer`. `new Blob([slice])` may copy. Worst case ~20MB briefly during fallback resume. Well within iOS limits.

---

## Bug Audit & Fixes (February 2025)

### Bugs Reported

| # | Symptom |
|---|---------|
| 1 | Timer shows "0 / 10" and never advances |
| 2 | Text prompts never fade in/out |
| 3 | Pause → background → resume restarts from beginning (gong replays) |
| 4 | Double gong on start (first gong cut off, second plays through) |
| 5 | Pause button doesn't pause / state desync with button text |
| 6 | Lock screen shows "0:01 / 0:00" instead of duration |

All bugs were iOS Safari specific — desktop Chrome/Firefox worked correctly.

---

### Root Cause Analysis

#### Issue A: `timeupdate` unreliable on iOS blob URLs (→ Bugs 1, 2)

The entire time-tracking chain depends on the native `timeupdate` event as its sole source. On iOS Safari with `blob:` URLs, `timeupdate` fires unreliably — it can stall for seconds or not fire at all. When `elapsedTime` stays at 0:
- Timer stays at "0 / 10:00" (Bug 1)
- Prompt lookup never finds a match past the 8s preamble (Bug 2)

**Fix:** Added a `setInterval` polling fallback at 250ms in `useAudioPlayback.js`. Uses `setInterval` instead of `requestAnimationFrame` because `rAF` stops when iOS backgrounds the page, while `setInterval` continues at reduced frequency (~1Hz).

The native `timeupdate` listener remains — duplicate calls with the same value are harmless (React batches identical setState). Polling starts on `loadAndPlay` and `resume`, stops on `pause`, `stop`, `ended`, `error`, and unmount.

#### Issue B: `currentTime` resets to 0 on resume (→ Bugs 3, 4)

Two separate mechanisms both cause playback to restart from position 0 (the gong):

**B1: iOS WebKit cannot reliably seek within blob URL audio**

iOS WebKit cannot seek within blob URLs because it requires HTTP Range request support, which blob URLs don't provide. When `.play()` is called on a paused `<audio>` element with a blob URL, WebKit may internally reload the media pipeline, issue range requests against the blob URL (which fail silently), and reset `currentTime` to 0. Both seek-before-play and seek-after-play approaches can fail — the `.play()` call itself can undo any seek, especially after the buffer has been evicted (backgrounding, screen lock).

**The fix — Two-phase resume with blob recreation fallback:**

**Phase 1 (fast path):** Try seek-before-play — set `currentTime` while paused, call `.play()`, then immediately check if `currentTime` held near the expected position. This works on desktop and may work on iOS when the buffer hasn't been evicted (brief foreground pauses).

**Phase 2 (fallback):** If `currentTime` reset to ~0 after `.play()`, detect the failure, pause, and create a NEW blob from the remaining bytes of the already-composed audio. The full composed `Uint8Array` (gong + all TTS clips + all silence) is kept in memory from initial composition. On fallback: `bytes.subarray(byteOffset)` to get everything from the pause point onward — no re-fetching, no re-composing. A `timeOffsetRef` added to all reported times makes upstream hooks (timer, prompts, completion) work without changes.

```js
// Phase 1: try seek-before-play
const blobTarget = absoluteTarget - timeOffsetRef.current;
audioRef.current.currentTime = blobTarget;
await audioRef.current.play();
if (audioRef.current.currentTime >= blobTarget - 1.0) {
  // Seek worked — done
  return true;
}
// Phase 2: blob recreation
audioRef.current.pause();
return resumeFromBytes();  // Slices composed bytes, loads new blob
```

Implementation details in Layer 5 (`useAudioPlayback` — `resume()` and `resumeFromBytes()`).

**B2: Double `.play()` call in `loadAndPlay` (→ Bug 4 specifically)**

The `loadAndPlay` function waits for the audio to be ready using two mechanisms:
1. A `canplay` event listener
2. A 5-second timeout fallback

Both call `attemptPlay()` which calls `audio.play()`. While a `settled` flag prevented double promise resolution, it did NOT prevent the second `play()` call from executing. On desktop, calling `.play()` on an already-playing element is harmless. On iOS Safari, calling `.play()` on an already-playing blob URL can restart it from position 0.

The symptom: gong starts playing (from `canplay`), gets cut off, then replays from the beginning (from the timeout).

**Fix:** The timeout now checks `if (!settled)` before calling `attemptPlay()`.

**Key iOS Safari research findings:**
- [Blob audio issues under iPadOS 15.4](https://developer.apple.com/forums/thread/702835): Blob URLs cause 416 errors, endless loading loops, and premature audio cutoff
- [Safari on iOS cannot play video from data uri or blob](https://bugs.webkit.org/show_bug.cgi?id=232076): iOS requires Range request support for seeking; blob URLs don't provide it
- [HTML5 Audio restart playback in iOS Safari](https://www.gurutechnologies.net/blog/html5-audio-restart-playback-in-ios-safari/): `currentTime` historically unreliable on iOS; workaround is DOM removal/re-addition
- iOS Safari treats blob URL media differently from HTTP-served media — it attempts byte-range requests (`bytes=0-*`) against blob URLs, which fail silently

#### Issue C: Stale `isPlaying` closure in `handlePauseResume` (→ Bug 5)

`handlePauseResume` captured `isPlaying` from the Zustand store via a `useCallback` closure. If the user tapped faster than React re-rendered, or if the booster modal changed `isPlaying` behind the hook's back, the closure held a stale value and the wrong branch executed.

**Fix:** Replaced `if (isPlaying)` with `if (!audio.isPaused())` — a new method that reads `audioRef.current.paused` directly from the DOM element. This is never stale because it's read at call time, not captured in a closure.

Applied to:
- `useMeditationPlayback.js` → `handlePauseResume`
- `useSilenceTimer.js` → `handlePauseResume` and `resize()`
- Media Session `play`/`pause` handlers in both hooks

#### Issue D: Media Session handler churn (→ exacerbated Bug 5)

The Media Session `useEffect` in both hooks included `isPlaying` in its dependency array. Every pause/resume tore down and re-registered the lock screen handlers, creating brief windows where iOS had no registered handler.

**Fix:** Removed `isPlaying` from the dependency array. Handlers use `audio.isPaused()` internally so they don't need re-registration on state changes. Added `eslint-disable-next-line react-hooks/exhaustive-deps` to document the intentional omission.

#### Issue E: Missing `setPositionState()` (→ Bug 6)

Both hooks set `MediaMetadata` (title/artist/album) but never called `navigator.mediaSession.setPositionState()`. Without it, iOS can't display duration or progress on the lock screen.

**Fix:** Added a new `useEffect` in both `useMeditationPlayback.js` and `useSilenceTimer.js` that calls `setPositionState({ duration, playbackRate: 1, position })` whenever `elapsedTime` changes. Wrapped in try/catch since iOS throws on invalid values.

Note: In `useMeditationPlayback`, `elapsedTime` IS the raw `audio.currentTime` (set directly), so `position = elapsedTime`. In `useSilenceTimer`, `elapsedTime` is user-visible (preamble subtracted, offset added), so the raw position is reverse-computed: `rawPosition = elapsedTime - offset + preamble`.

---

### Files Modified

| File | Changes |
|------|---------|
| `src/services/audioComposerService.js` | Exported `CBR_BYTES_PER_SECOND`. Added `findNextFrameBoundary()` for MP3 frame-aligned slicing. Both `composeMeditationAudio()` and `composeSilenceTimer()` now return `composedBytes` |
| `src/hooks/useAudioPlayback.js` | Added: `composedBytesRef` + `timeOffsetRef` + `currentBlobUrlRef` for blob recreation. New methods: `storeComposedBytes()`, `resumeFromBytes()`. Rewrote `resume()` with two-phase strategy (seek-first, blob recreation fallback). All time reporting adds `timeOffsetRef`. Earlier fixes retained: polling fallback, `savedTimeRef`, `isPaused()` getter, `settled` guard |
| `src/hooks/useMeditationPlayback.js` | `handleStart` destructures `composedBytes` from composer, calls `audio.storeComposedBytes()`. Earlier fixes retained: `audio.isPaused()` in handlers, `setPositionState` effect |
| `src/hooks/useSilenceTimer.js` | `handleStart` and `resize()` both destructure `composedBytes` and call `audio.storeComposedBytes()`. Earlier fixes retained: same as `useMeditationPlayback` |

---

### Known Remaining Issue: Booster Modal Store/Audio Desync

8 locations in `useSessionStore.js` and 1 in `BoosterConsiderationModal.jsx` call `pauseMeditationPlayback()` or `resumeMeditationPlayback()` without calling `audio.pause()` / `audio.resume()`. This causes the store to say "paused" while audio continues playing (or vice versa).

**Affected store actions:** `showBoosterModal`, `hideBoosterModal`, `takeBooster`, `skipBooster`, `snoozeBooster`, `maximizeBooster`, `expireBooster`

**Symptoms when triggered:** The prompt progression guard (`if (!isPlaying) return`) blocks text display even though audio is audibly playing. Timer shows as paused. `handlePauseResume` reads wrong state.

**Why this wasn't fixed:** The booster modal fires on a timer during longer sessions, not during the basic start/pause/resume testing that revealed the 6 reported bugs. It requires changes to `useSessionStore.js`, not the three hook files. Flagged for follow-up.

---

### Testing Checklist (iOS Safari, physical device)

1. **Timer advances:** Start Body Scan 10min → timer should count up from 0:00 to 10:00
2. **Text fades:** Prompts should fade in ~200ms after each audio clip starts, fade out ~2s after clip ends
3. **Single gong on start:** Only one gong at the beginning, no cut-off and replay
4. **Brief foreground pause/resume:** Start → play ~60s → Pause → wait 5s → Resume → audio continues from near pause point, no gong replay (tests Phase 1 seek-before-play)
5. **Background/screen-lock resume:** Start → play ~60s → lock screen for 30s+ → unlock → Resume → audio continues from near pause point, no gong replay (tests Phase 2 blob recreation fallback)
6. **No double gong on resume:** Resume should never replay the opening gong
7. **Play to completion after resume:** After resuming mid-meditation, closing gong should play and "Continue" button should appear at the correct time
8. **Rapid pause/resume:** Tap Pause/Resume rapidly 5+ times — button label and audio state should stay in sync, timer stays consistent
9. **Silence timer resume:** Test OpenSpace module — same pause/resume behavior should work
10. **Silence timer resize after resume:** In OpenSpace, pause → resume → change duration slider → timer should continue correctly
11. **Lock screen controls:** Start meditation → lock screen → should show title, correct duration, advancing progress
12. **Desktop regression:** Repeat all tests on Chrome/Firefox desktop — behavior should be identical
