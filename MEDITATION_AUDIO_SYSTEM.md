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

**`elapsedTime` is set exclusively from `audio.currentTime` via the `onTimeUpdate` callback.** This callback fires when the native `timeupdate` event fires on the `<audio>` element. Everything else (timer display, prompt progression, completion detection) derives from `elapsedTime`.

### handleStart flow (user clicks "Begin")

```
1. setIsLoading(true)
2. composeMeditationAudio(timedSequence, { gongDelay: 1, gongPreamble: 8 })
   → fetches all MP3s, builds blob, returns { blobUrl, promptTimeMap, totalDuration }
3. Store refs: blobUrlRef, promptTimeMapRef, composedDurationRef
4. Reset display: elapsedTime=0, promptIndex=-1, promptPhase='hidden'
5. startMeditationPlayback(moduleInstanceId) → store: hasStarted=true, isPlaying=true
6. audio.loadAndPlay(blobUrl) → sets <audio>.src, calls .load(), waits for canplay, calls .play()
7. setIsLoading(false)
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

### handlePauseResume (line 275-283)

```js
const handlePauseResume = useCallback(() => {
  if (isPlaying) {                    // isPlaying comes from store state in closure
    pauseMeditationPlayback();        // Updates store: isPlaying=false
    audio.pause();                    // Pauses <audio> element
  } else {
    resumeMeditationPlayback();       // Updates store: isPlaying=true
    audio.resume();                   // Calls <audio>.play()
  }
}, [isPlaying, pauseMeditationPlayback, resumeMeditationPlayback, audio]);
```

### Media Session API (line 109-144)

Sets `navigator.mediaSession.metadata` with title/artist/album. Registers play/pause handlers for lock screen controls. **Does NOT call `setPositionState()`** — meaning iOS has no way to display total duration or playback progress on the lock screen.

The effect depends on `[hasStarted, isPlaying, meditation, audio, pauseMeditationPlayback, resumeMeditationPlayback]`. Because `isPlaying` is in the dependency array, the handlers are torn down and re-registered on every play/pause toggle.

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

**File:** `src/hooks/useAudioPlayback.js` (244 lines)

Wraps a single `new Audio()` element with React state.

### Audio element lifecycle

- **Created lazily** via `getAudio()` — only when first needed
- **Listeners attached once** via `attachListeners()` — guarded by `listenersAttachedRef`
- **Cleaned up on unmount** — pause, clear src, null the ref

### Event listeners (attached once, never removed until unmount)

| Event | Handler |
|-------|---------|
| `ended` | `setIsPlaying(false)`, calls `onEndedRef.current()` |
| `error` | Ignores empty-src errors. Otherwise sets error state, calls `onErrorRef.current()` |
| `canplaythrough` | `setIsLoaded(true)` |
| `play` | `setIsPlaying(true)`, calls `onPlayRef.current()` |
| `pause` | `setIsPlaying(false)`, calls `onPauseRef.current()` |
| `timeupdate` | Calls `onTimeUpdateRef.current(audio.currentTime)` |

**The `timeupdate` event** is the sole driver of elapsed time. It fires at browser-determined intervals (typically ~250ms, but varies by browser and is known to be unreliable on iOS Safari for blob: URLs).

### loadAndPlay(blobUrl)

```
1. Get/create Audio element
2. Attach listeners (once)
3. Set audio.preload = 'auto', audio.src = blobUrl, audio.load()
4. Wait for canplay event (or 5s timeout)
5. Call audio.play()
6. Return true/false
```

### pause()

```js
audioRef.current.pause();
// That's it. No position saving. No state tracking beyond the pause event listener.
```

### resume()

```js
await audioRef.current.play();
// That's it. No position verification. No check for currentTime reset.
```

### stop()

```js
audioRef.current.pause();
audioRef.current.currentTime = 0;
setIsPlaying(false);
```

### Return value

```js
{
  isPlaying,          // React state, driven by play/pause events
  isLoaded,           // React state, set on canplaythrough
  isMuted,            // React state, toggled by user
  error,              // React state
  loadAndPlay,        // async (blobUrl) => boolean
  pause,              // () => void
  resume,             // async () => boolean
  stop,               // () => void
  seek,               // (time) => void
  toggleMute,         // () => void
  setMuted,           // (bool) => void
  getCurrentTime,     // () => number
  getDuration,        // () => number
}
```

---

## Layer 6: Audio Composer Service

**File:** `src/services/audioComposerService.js` (408 lines)

### decomposeSilence(durationSeconds)

Breaks a duration into pre-generated silence block files using a greedy algorithm.

Available blocks: 60s, 30s, 10s, 5s, 1s, 0.5s

Example: 45.5s → `[silence-30s.mp3, silence-10s.mp3, silence-5s.mp3, silence-0.5s.mp3]`

Rounds to nearest 0.5s. Re-rounds after each subtraction to prevent float drift.

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
7. Return { blobUrl, promptTimeMap, totalDuration }
```

**Duration calculation:** `totalDuration` from the second pass uses real MP3 byte lengths: `byteLength / 16000` (CBR 128kbps). This is the "composed total" stored in `composedDurationRef`.

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
audio element fires 'timeupdate'
  → useAudioPlayback listener: onTimeUpdateRef.current(audio.currentTime)
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

### Same patterns:
- `handlePauseResume` reads `isPlaying` from store closure
- Media Session setup depends on `isPlaying` in deps array
- No `setPositionState()` call
- `resume()` calls `audio.resume()` with no position preservation

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
2. isPlaying is true (from store closure) → enters pause branch
3. pauseMeditationPlayback() → store: isPlaying=false, accumulatedTime updated
4. audio.pause() → <audio>.pause()
   → 'pause' event fires → useAudioPlayback: setIsPlaying(false)
5. timeupdate stops firing → elapsedTime freezes at last value

RESUME:
1. User taps Resume → handlePauseResume()
2. isPlaying is false → enters resume branch
3. resumeMeditationPlayback() → store: isPlaying=true, startedAt=Date.now()
4. audio.resume() → audioRef.current.play()
   → 'play' event fires → useAudioPlayback: setIsPlaying(true)
5. timeupdate resumes → elapsedTime continues from where it was
```

**What audio.resume() actually does (line 181-189):**
```js
const resume = useCallback(async () => {
  if (!audioRef.current) return false;
  try {
    await audioRef.current.play();
    return true;
  } catch {
    return false;
  }
}, []);
```

It calls `.play()` on the same audio element with the same `src`. There is no position saving, no position verification, and no seek-back logic. If the browser resets `currentTime` for any reason (e.g., iOS purging the blob buffer during backgrounding), the audio restarts from 0.
