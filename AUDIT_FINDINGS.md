# M-SESSION Audit Findings — 2026-04-27

Read-only audit of cruft and technical debt across the m-session PWA. Every claim below is backed by a reproducible `grep`/`find`/`wc` command — no hand-waving, no "needs verification" fillers. Cleanup execution is a separate session.

**Risk legend:**
- **Safe** — delete/change with no behavior risk
- **Confirm** — low risk but worth a quick visual check before deleting
- **Discuss** — needs user judgment (intentionally retained, judgment call, etc.)
- **Deferred** — out of scope this round per user decision

---

## Summary

| Category | Items | Removable LOC | Highest risk found |
|----------|------:|--------------:|--------------------|
| 1. Orphan files & dead exports | 13 | ~2,140 | Confirm |
| 2. Debug `console.*` statements | 6 calls in 3 files | ~6 | Safe |
| 3. Audio generation script duplication | 15 scripts → 1 base | ~3,000 (if extracted) | Discuss |
| 4. Documentation drift | 9 doc claims | n/a | Safe |
| 5. Dependencies & temp directory | 1 dead dep + 1 dir + 1 stale ref | small | Safe |
| 6. Lint disables (deferred) | 30 disables, 13 unjustified | n/a | Deferred |

**Quick-win deletions (Safe):** 11 orphan files (~1,580 LOC) + 1 dead export + 6 console.log breadcrumbs + `date-fns` dep + `Technical-Spec-Docs-Temporary/` archive.

**Discussion items:** `BreathOrb.jsx` and `useBreathController.js` are deliberately retained per [ARCHITECTURE.md:1904](ARCHITECTURE.md#L1904) — see Category 1. Audio script consolidation is a judgment call (~3,000 LOC removable but dev-only code).

---

## Category 1 — Orphan files & dead exports

**Methodology:** for each candidate, run `grep -rn "<Name>" src/ scripts/ --include="*.js" --include="*.jsx" --include="*.mjs"` and confirm the only hits are the file's own definition. The repo-wide sweep used `find src -name "*.jsx"` then `grep -rln <basename>` excluding the file itself.

### 1a. Confirmed orphan components (.jsx)

| Path | LOC | Importers | Risk |
|------|----:|----------:|------|
| [src/components/session/PostCloseScreen.jsx](src/components/session/PostCloseScreen.jsx) | 132 | 0 | **Safe** — referenced only in [README.md:135](README.md#L135) flow diagram and [ARCHITECTURE.md:47](ARCHITECTURE.md#L47), not in code |
| [src/components/session/TransitionBuffer.jsx](src/components/session/TransitionBuffer.jsx) | 141 | 0 | **Safe** — referenced in [README.md:92,106,121](README.md#L92), [ARCHITECTURE.md:38,2230,2262](ARCHITECTURE.md#L38), not in code |
| [src/components/home/SessionTimeline.jsx](src/components/home/SessionTimeline.jsx) | 235 | 0 | **Safe** |
| [src/components/home/PreSessionView.jsx](src/components/home/PreSessionView.jsx) | 91 | 0 | **Safe** |
| [src/components/active/PhaseHeader.jsx](src/components/active/PhaseHeader.jsx) | 77 | 0 | **Safe** |
| [src/components/active/capabilities/animations/Horizon.jsx](src/components/active/capabilities/animations/Horizon.jsx) | 25 | 0 | **Safe** — header comment claims "shared horizontal line used by the four transition animations" but no consumer exists |
| [src/components/active/capabilities/animations/BreathOrb.jsx](src/components/active/capabilities/animations/BreathOrb.jsx) | 300 | 0 | **Discuss** — explicitly retained per [ARCHITECTURE.md:1904](ARCHITECTURE.md#L1904) ("kept as building blocks for any future breath-guided meditation"). User decision: delete or keep |
| [src/components/shared/TransitionTextarea.jsx](src/components/shared/TransitionTextarea.jsx) | 28 | 0 | **Safe** |
| [src/components/tools/ComeUpTestTool.jsx](src/components/tools/ComeUpTestTool.jsx) | 135 | 0 | **Safe** |
| [src/components/tools/AISettingsTool.jsx](src/components/tools/AISettingsTool.jsx) | 364 | 0 | **Safe** — superseded by [src/components/tools/SettingsTool.jsx](src/components/tools/SettingsTool.jsx) |

### 1b. Confirmed orphan hooks (.js)

| Path | LOC | Importers | Risk |
|------|----:|----------:|------|
| [src/hooks/useWakeLock.js](src/hooks/useWakeLock.js) | 59 | 0 | **Confirm** — listed in [ARCHITECTURE.md:104](ARCHITECTURE.md#L104) as the "Screen Wake Lock API wrapper" but no consumer. If wake lock is desired feature, this is the piece to wire up; if not, delete |
| [src/components/active/hooks/useBreathController.js](src/components/active/hooks/useBreathController.js) | 451 | 0 | **Discuss** — same retention note as `BreathOrb.jsx` ([ARCHITECTURE.md:1904](ARCHITECTURE.md#L1904)) |

### 1c. Dead exports

| Path | Symbol | Risk |
|------|--------|------|
| [src/services/cryptoService.js:153](src/services/cryptoService.js#L153) | `clearDeviceKey()` | **Safe** — function defined and exported but never imported. Other exports of this file are alive |

### Totals
- **Safe to delete now:** 9 files + 1 export → **1,378 LOC**
- **Confirm before delete:** `useWakeLock.js` → **59 LOC**
- **Discuss (intentionally retained per docs):** `BreathOrb.jsx` + `useBreathController.js` → **751 LOC**
- **Grand total recoverable: 2,188 LOC**

**Verification command (re-runnable):**
```sh
find src -name "*.jsx" -type f | while read f; do n=$(basename "$f" .jsx); c=$(grep -rln "$n" src/ --include="*.js" --include="*.jsx" | grep -v "^${f}$" | wc -l); [ "$c" -eq 0 ] && echo "ORPHAN: $f"; done
```

---

## Category 2 — Debug `console.*` statements

**Methodology:** `grep -rn "console\." src/ --include="*.js" --include="*.jsx" | grep -v __tests__` produced 54 hits. Each was read in context and classified.

### 2a. Cuttable debug breadcrumbs (Safe to remove)

These are dev-only `console.log` statements that announce handler entry/exit — pure breadcrumbs, no operational value. Six removals across three files:

| File:line | Statement | Why cuttable |
|-----------|-----------|-------------|
| [src/stores/useSessionStore.js:2674](src/stores/useSessionStore.js#L2674) | `console.log('[SessionStore] skipModule(%s) called', instanceId);` | Logs every skip call |
| [src/stores/useSessionStore.js:2681](src/stores/useSessionStore.js#L2681) | `console.log('[SessionStore] skipModule — phase=%s, module=%s', currentPhase, module.libraryId);` | Dev breadcrumb |
| [src/components/active/capabilities/ModuleControlBar.jsx:88](src/components/active/capabilities/ModuleControlBar.jsx#L88) | `console.log('[ModuleControlBar] confirmSkip — calling onSkip');` | Dev breadcrumb |
| [src/hooks/useSilenceTimer.js:266](src/hooks/useSilenceTimer.js#L266) | `console.log('[SilenceTimer] handleSkip called');` | Dev breadcrumb |
| [src/hooks/useSilenceTimer.js:274](src/hooks/useSilenceTimer.js#L274) | `console.log('[SilenceTimer] calling onSkip()...');` | Dev breadcrumb |
| [src/hooks/useSilenceTimer.js:276](src/hooks/useSilenceTimer.js#L276) | `console.log('[SilenceTimer] onSkip() done');` | Dev breadcrumb |

### 2b. Operational logging (KEEP)

The remaining ~48 calls are caught-exception handlers and operational warnings (encryption failure, audio fetch failure, image export failure, etc.). They're appropriate as-is. Sampling:
- All 7 calls in [useMeditationPlayback.js](src/hooks/useMeditationPlayback.js) are `console.error` for caught audio failures — KEEP
- All 4 calls in [audioComposerService.js](src/services/audioComposerService.js) are critical/non-critical fetch failure handlers — KEEP
- [useSessionStore.js:1755](src/stores/useSessionStore.js#L1755), [:2677](src/stores/useSessionStore.js#L2677) are `console.error`/`console.warn` for invalid state — KEEP
- [ErrorBoundary.jsx:20](src/components/shared/ErrorBoundary.jsx#L20) — KEEP

### 2c. Documentation-only (no action)

[src/hooks/useAudioPlayback.js:17-18](src/hooks/useAudioPlayback.js#L17) — these are JSDoc usage examples, not real `console.log` calls.

### 2d. Inside files about to be deleted (no separate action)

[src/hooks/useWakeLock.js:20](src/hooks/useWakeLock.js#L20), [:49](src/hooks/useWakeLock.js#L49) — `console.debug` calls inside the orphan file from Category 1. They go away when the file is deleted.

---

## Category 3 — Audio generation script duplication

**Methodology:** `wc -l scripts/generate-*-audio.mjs` and `diff` between two pairs.

### 3a. LOC inventory

| Script | LOC |
|--------|----:|
| `scripts/generate-body-scan-audio.mjs` | 282 |
| `scripts/generate-felt-sense-audio.mjs` | 287 |
| `scripts/generate-leaves-on-a-stream-audio.mjs` | 284 |
| `scripts/generate-open-awareness-audio.mjs` | 268 |
| `scripts/generate-pendulation-audio.mjs` | 305 |
| `scripts/generate-protector-audio.mjs` | 283 |
| `scripts/generate-self-compassion-audio.mjs` | 320 |
| `scripts/generate-short-grounding-audio.mjs` | 307 |
| `scripts/generate-simple-grounding-audio.mjs` | 339 |
| `scripts/generate-stay-with-it-audio.mjs` | 287 |
| `scripts/generate-the-cycle-closing-audio.mjs` | 225 |
| `scripts/generate-the-descent-audio.mjs` | 225 |
| `scripts/generate-transition-centering-breath-audio.mjs` | 306 |
| `scripts/generate-transition-closing-audio.mjs` | 290 |
| `scripts/generate-transition-opening-audio.mjs` | 285 |
| **Total** | **4,293** |

### 3b. Duplication evidence

`diff scripts/generate-stay-with-it-audio.mjs scripts/generate-leaves-on-a-stream-audio.mjs` returns 59 changed lines on a 287-line file (~80% identical body).

The differences are entirely **data**, not behavior:
1. Header comments (script name, prompt count, meditation description)
2. Voice preset values: `stability` (0.65–0.88), `similarity_boost`, `speed` (0.7–0.87), `use_speaker_boost`
3. Meditation import path (`../src/content/meditations/<id>.js`)
4. Output subfolder name (`'stay-with-it'` vs `'leaves-on-a-stream'`)

The shared body includes: CLI arg parser (`--dry-run`, `--voice`, `--start`, `--only`, `--list-voices`), `.env` loader, ElevenLabs API call, voice resolution, voice listing, file I/O, progress reporting, error handling, and a `sleep()` helper.

### 3c. Cleanup options

- **(a) Extract base** — `scripts/lib/audioGeneratorBase.mjs` exporting `generateAudio(meditationId, contentModule, voicePresets)`. Per-meditation script becomes a ~30-line CLI wrapper. Removes ~3,000 LOC.
- **(b) Leave alone** — these are dev-only scripts run rarely, and the duplication doesn't hurt prod. Maintenance burden is low if no new meditations are added.
- **(c) Defer** — flag as a future task.

**Risk: Discuss.** No production impact either way. Recommendation: extract whenever the next new meditation script is needed (then it's almost-free to do; until then the cost of consolidation > cost of duplication).

---

## Category 4 — Documentation drift

**Methodology:** grep for dead/changed names across `README.md` and `ARCHITECTURE.md`.

### 4a. References to orphan components

| Doc | Line | Claim | Reality |
|-----|------|-------|---------|
| [README.md:33](README.md#L33) | "Breath meditation with animated BreathOrb visualization" | `BreathMeditationModule` was retired (per ARCHITECTURE.md:1904); BreathOrb is unused |
| [README.md:92](README.md#L92) | "Begin session → TransitionBuffer → startSession()" | `TransitionBuffer` is dead code |
| [README.md:106](README.md#L106) | "Begin → TransitionBuffer → enter peak phase" | same |
| [README.md:121](README.md#L121) | "Begin → TransitionBuffer → enter synthesis phase" | same |
| [README.md:135](README.md#L135) | "Take Care → Close Session → PostCloseScreen animation → Home" | `PostCloseScreen` is dead code |
| [ARCHITECTURE.md:38](ARCHITECTURE.md#L38) | Directory tree lists `TransitionBuffer.jsx` as live | dead code |
| [ARCHITECTURE.md:47](ARCHITECTURE.md#L47) | Directory tree lists `PostCloseScreen.jsx` as live | dead code |
| [ARCHITECTURE.md:2219](ARCHITECTURE.md#L2219) | "Used in: SubstanceChecklist Step 4, TransitionBuffer, HomeView welcome" (BreathOrb usage list) | TransitionBuffer is dead |
| [ARCHITECTURE.md:2230](ARCHITECTURE.md#L2230) | Section "TransitionBuffer (`session/TransitionBuffer.jsx`)" describes it as live | dead code |

### 4b. Stale counts

| Doc | Line | Claim | Reality |
|-----|------|-------|---------|
| [README.md:31](README.md#L31) | "17+ Activity Modules" | `moduleRegistry.js` has 24 lazy-loaded entries; `src/components/active/modules/*.jsx` has 20 custom modules |
| [ARCHITECTURE.md:15](ARCHITECTURE.md#L15) | "25+ lazy-loaded custom module components" | actual: 20 custom + 4 MasterModule entries = 24 in registry |
| [ARCHITECTURE.md:2496](ARCHITECTURE.md#L2496) | "All 25+ session modules" | same — 24 in registry |
| [README.md:32](README.md#L32) | "11 audio-synced guided meditations" | `meditationLibrary` has 15 entries (3 transition meditations + 12 module meditations) |

### 4c. Cleanup approach

These are doc edits only — no code change. After the orphan deletions in Category 1, sweep README.md / ARCHITECTURE.md once and remove every reference. Update counts to current.

**Risk: Safe.**

---

## Category 5 — Dependencies & temp directory

### 5a. Unused dependency

`date-fns` (^4.1.0) is declared in [package.json:41](package.json#L41) but has zero imports in the entire repo:
```sh
grep -rn "date-fns" . --include="*.js" --include="*.jsx" --include="*.mjs" --include="*.json" 2>/dev/null | grep -v node_modules | grep -v package-lock
# → only hit: package.json:41
```
**Risk: Safe.** Remove with `npm uninstall date-fns`.

### 5b. Verified-in-use deps (no action — flagged because earlier audit pass questioned them)

| Dep | Used in |
|-----|---------|
| `puppeteer` | [scripts/capture-screenshots.mjs](scripts/capture-screenshots.mjs), [scripts/generate-og-images.mjs](scripts/generate-og-images.mjs) |
| `canvas` | [scripts/generate-icons.mjs](scripts/generate-icons.mjs) |
| `jsdom` | [vitest.config.js](vitest.config.js) (test environment string) |
| `@testing-library/jest-dom` | [src/test/setup.js](src/test/setup.js) |
| `@testing-library/react` | [src/components/__tests__/App.test.jsx](src/components/__tests__/App.test.jsx) |
| `autoprefixer` | [postcss.config.js](postcss.config.js) |

### 5c. Technical-Spec-Docs-Temporary/

Three meditation script-spec drafts at the repo root:
- `Technical-Spec-Docs-Temporary/Centering-breath-meditation-final` (12,155 bytes)
- `Technical-Spec-Docs-Temporary/transition-Closing-Meditation-V4` (12,326 bytes)
- `Technical-Spec-Docs-Temporary/transition-Opening-Meditation-Final` (10,150 bytes)

Each is a markdown spec for a now-implemented meditation in `src/content/meditations/`. The directory is referenced once, in a comment:
```sh
grep -rn "Technical-Spec" src/ scripts/ docs/ README.md ARCHITECTURE.md
# → src/stores/useSessionStore.js:103: //   Technical-Spec-Docs-Temporary/Session-Profile-Spec-V1.md (and the V2
```
That comment refers to a `Session-Profile-Spec-V1.md` file that doesn't even exist in the directory anymore (only the 3 meditation drafts remain), so the comment is itself stale.

**Cleanup options (Safe):**
- (a) Delete the directory + update the stale comment in [useSessionStore.js:103](src/stores/useSessionStore.js#L103).
- (b) Move to `docs/spec-archive/` and update the stale comment.
- (c) Move under `docs/` directly and rename to something non-temporary (these are historical spec records).

Recommendation: (a) delete + update comment. The drafts are duplicated by the actual implementations in `src/content/meditations/transition-{opening,closing,centering-breath}.js`; nothing is lost.

### 5d. ESLint config note (no change this round)

[eslint.config.js:34](eslint.config.js#L34) downgrades `react-hooks/exhaustive-deps` from `error` to `warn`. Per user decision (see Deferred section), no rule change this round.

---

## Category 6 — ESLint disables (deferred but tabulated)

**Methodology:** `grep -rn "eslint-disable" src/ --include="*.js" --include="*.jsx"`. 30 hits.

### 6a. By rule

| Rule | Count |
|------|------:|
| `react-hooks/exhaustive-deps` | 28 |
| `react-refresh/only-export-components` | 2 |

### 6b. By file (top offenders)

| File | Count |
|------|------:|
| [src/components/session/TransitionModule/useTransitionModuleState.js](src/components/session/TransitionModule/useTransitionModuleState.js) | 5 |
| [src/components/active/ActiveView.jsx](src/components/active/ActiveView.jsx) | 3 |
| [src/components/journal/JournalEditor.jsx](src/components/journal/JournalEditor.jsx) | 2 |
| [src/components/session/BoosterConsiderationModal.jsx](src/components/session/BoosterConsiderationModal.jsx) | 2 |
| ~10 single-disable files (mostly meditation modules) | 1 each |

### 6c. Disables WITHOUT inline justification (13 of 30)

These are higher priority for review because no one can tell if they're still needed:

- [src/components/journal/JournalEditor.jsx:122](src/components/journal/JournalEditor.jsx#L122)
- [src/components/journal/JournalEditor.jsx:154](src/components/journal/JournalEditor.jsx#L154)
- [src/components/shared/AppUpdaterContext.jsx:24](src/components/shared/AppUpdaterContext.jsx#L24)
- [src/components/active/modules/PendulationModule.jsx:169](src/components/active/modules/PendulationModule.jsx#L169)
- [src/components/active/modules/MasterModule/useMasterModuleState.js:402](src/components/active/modules/MasterModule/useMasterModuleState.js#L402)
- [src/components/session/BoosterConsiderationModal.jsx:68](src/components/session/BoosterConsiderationModal.jsx#L68)
- [src/components/session/BoosterConsiderationModal.jsx:93](src/components/session/BoosterConsiderationModal.jsx#L93)
- [src/components/session/TransitionModule/customBlocks/BodyCheckInBlock.jsx:141](src/components/session/TransitionModule/customBlocks/BodyCheckInBlock.jsx#L141)
- [src/components/session/TransitionModule/useTransitionModuleState.js:129](src/components/session/TransitionModule/useTransitionModuleState.js#L129)
- [src/components/session/TransitionModule/useTransitionModuleState.js:279](src/components/session/TransitionModule/useTransitionModuleState.js#L279)
- [src/components/session/TransitionModule/useTransitionModuleState.js:287](src/components/session/TransitionModule/useTransitionModuleState.js#L287)
- [src/components/session/TransitionModule/useTransitionModuleState.js:293](src/components/session/TransitionModule/useTransitionModuleState.js#L293)
- [src/components/session/TransitionModule/useTransitionModuleState.js:299](src/components/session/TransitionModule/useTransitionModuleState.js#L299)

### 6d. Disables WITH inline justification (17 of 30)

Examples include:
- "intentionally not re-running when selectedVoiceId changes locally" — repeated across ~10 meditation modules; legitimate pattern
- "render is a stable pure function, real dep is gridData" — AsciiMoon, AsciiDiamond
- "specific properties listed, full objects too broad" — ActiveView

**Risk: Deferred.** Per user decision, no rule changes or disable fixes this round. Recommended follow-up: review the 13 unjustified disables, add a `--` comment if intentional, or fix the underlying dep array.

---

## Deferred — out of scope this round

Per user decision (Q3 in plan-mode questionnaire: "Stay safe — no higher-risk categories"), the following are **recorded but not acted on** in the upcoming cleanup PR:

### D1. Session store migration trimming
- [src/stores/useSessionStore.js](src/stores/useSessionStore.js) currently runs cumulative migrations from v1 → v32.
- Very old migrations (v1–v5) could likely be collapsed, but trimming them resets any persisted user data still on those versions.
- **Rationale for deferring:** touches user-facing persistence, requires verifying minimum deployed version in the wild.

### D2. ESLint rule tightening + 30 disables
- Upgrade `react-hooks/exhaustive-deps` from `warn` → `error`, then triage the 30 inline disables.
- 13 of them lack inline justification (see Category 6c) and could mask real stale-closure bugs.
- **Rationale for deferring:** behavioral risk in hooks; needs a focused session, not a sweep.

### D3. Meditation module dedup refactor
- ~10 meditation modules ([BodyScanModule.jsx](src/components/active/modules/BodyScanModule.jsx), [OpenAwarenessModule.jsx](src/components/active/modules/OpenAwarenessModule.jsx), [SelfCompassionModule.jsx](src/components/active/modules/SelfCompassionModule.jsx), [SimpleGroundingModule.jsx](src/components/active/modules/SimpleGroundingModule.jsx), [FeltSenseModule.jsx](src/components/active/modules/FeltSenseModule.jsx), [LeavesOnAStreamModule.jsx](src/components/active/modules/LeavesOnAStreamModule.jsx), [StayWithItModule.jsx](src/components/active/modules/StayWithItModule.jsx), [TheCycleModule.jsx](src/components/active/modules/TheCycleModule.jsx), [TheDescentModule.jsx](src/components/active/modules/TheDescentModule.jsx), [PendulationModule.jsx](src/components/active/modules/PendulationModule.jsx)) are near-identical wrappers around `useMeditationPlayback`. Could extract a shared base.
- **Rationale for deferring:** architectural change; touches audio playback and selectedVoiceId effects (where most lint disables live); needs careful regression testing on real device.

### D4. Audio script consolidation (Category 3)
- Recorded above as "Discuss." Recommendation is to defer until next new meditation script is needed.

---

## Recommended bundled cleanup PR (next session)

When the user returns to execute, the safe single PR contains exactly these changes:

1. **Delete 9 orphan files** (1,378 LOC) — every file in Category 1a/1b marked Safe + the dead `clearDeviceKey()` export.
2. **Delete 6 debug `console.log` calls** (Category 2a) — one Edit per file (3 files).
3. **Remove `date-fns` dep** — `npm uninstall date-fns`, commit lockfile.
4. **Delete `Technical-Spec-Docs-Temporary/`** + update the stale comment in [useSessionStore.js:103](src/stores/useSessionStore.js#L103).
5. **Sweep doc references** — remove the 9 stale claims in Category 4 from README.md and ARCHITECTURE.md, fix the module/meditation counts.

Then bring back to user for two judgment calls:
- (Q1) Delete `useWakeLock.js` (Category 1b) or wire it up?
- (Q2) Delete `BreathOrb.jsx` + `useBreathController.js` (intentionally retained per ARCHITECTURE.md) or keep?

A second cleanup pass would then handle Q1/Q2 plus any of D1–D4 the user wants to tackle.
