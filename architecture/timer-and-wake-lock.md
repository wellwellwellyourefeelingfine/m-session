# Timer Strategy & Wake Lock

## PWA Timer Limitation

PWAs cannot reliably fire notifications or alarms when backgrounded or screen-locked. JavaScript execution is suspended, `setTimeout`/`setInterval` don't fire, and there is no Web Alarm API. This is a platform limitation, not a solvable code problem.

## Two-Layer Approach

**Layer 1: Native Alarm Prompt.** For timed modules (music breaks, extended meditations), prompt users to set a backup alarm using their phone's native clock app before beginning. Deep links (`clock-alarm://` on iOS) are best-effort. See `AlarmBlock` and `AlarmPrompt` for the implementation.

**Layer 2: Wall-Clock Timer.** Track elapsed time using `Date.now()` comparisons, not intervals. When the user returns — early, on time, or late — the app reconciles gracefully: show remaining time, "your rest is complete," or "welcome back." See `useSilenceTimer` for the canonical implementation.

## Wake Lock Usage

Use the Screen Wake Lock API (`navigator.wakeLock.request('screen')`) only for modules requiring continuous visual attention or audio playback:

| Module Type | Wake Lock | Rationale |
|-------------|-----------|-----------|
| Breathing exercises | Yes | User follows visual animation |
| Audio meditations | Yes | Keeps audio session alive |
| Music/rest breaks | No | User is away from screen |
| Journaling | No | User interaction keeps screen awake |
