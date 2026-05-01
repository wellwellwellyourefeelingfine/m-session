# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3.1] - 2026-05-01

### Added

- **Rachel voice ("relaxing" alternate)**: Second voice option recorded by Rachel, now available across fifteen meditations and transitions — Simple Grounding, Short Grounding, Leaves on a Stream, Open Awareness, Stay With It, Felt Sense, Body Scan, Self-Compassion, Protector Dialogue, The Cycle (closing), The Descent, Pendulation, Opening Transition, Centering Breath, and Closing Transition.
- **Voice selection setting**: New voice-alt UI surfaced in Settings to switch between Theo Silk and Relaxing Rachel; idle-screen `DurationPill` and audio-bound estimates now resolve durations per selected voice.
- **MasterModule custom blocks (Intention Setting)**: `StemIntentionBlock`, `IntentionWelcomeBlock`, `IntentionDisplayBlock`, `IntentionExampleBlock`, `IntentionPrepTextBlock`, `IntentionPromptBlock`, and `SelectionDisplayBlock` — all registered via `CUSTOM_BLOCKS` and used by the new Intention Setting content config.
- **MasterModule custom blocks (Protector Dialogue)**: `DialogueLoopBlock`, `MeditationTimePillBlock`, `ProtectorFieldBlock`, `ProtectorReconnectionBlock` — power the migrated Protector Dialogue Part 1 + Part 2 flows.
- **Dot separator feature** for MasterModule text paragraphs (V1) — supports inline structural separators in content configs.
- **`resolveAnimationKey` utility** in `MasterModule/utils/` — centralizes per-screen animation key resolution.
- **Hero leaves animation** (`hero-leaves.js`) added to landing page.
- **`MasterModuleStyleSheet.md`** — internal style/usage reference for the MasterModule renderer system.

### Changed

- **Intention Setting migrated to MasterModule**: `IntentionSettingMaster` now drives the flow via `intentionSettingV2.js` content config and the new intention custom blocks; legacy `IntentionSettingActivity` simplified.
- **Dialogue with a Protector migrated to MasterModule**: Replaces the standalone `ProtectorDialoguePart1Module` and `ProtectorDialoguePart2Module` components (~2,000 lines removed) with content configs `protectorDialogueP1.js`, `protectorDialogueP2.js`, and shared `protectorDialogueShared.js` powered by the new dialogue/protector custom blocks.
- **Pendulation, The Cycle, The Descent**: Updated to consume the unified meditation-section renderer with voice-aware audio resolution.
- **Idle screen `DurationPill` unified**: Voice-aware ceiling for fixed-duration meditations so the displayed estimate matches what playback actually plays for the selected voice.
- **Duration system consolidated**: `DurationPicker` shared component, `BreathMeditationModule`, and the `breath-awareness`, `calming-breath-15min`, and `guided-breath-orb` content meditations were retired in favor of the consolidated meditation-section + audio-duration manifest pipeline.
- **Module library polish**: Small icon updates and library-drawer copy tweaks; intake-main consistency pass.
- **FAQ + substance testing**: PMMA prominence increased in safety guidance.
- **Landing page**: Additional html/css polish (landing-page.html, landing.css, contribute.html, privacy.html), site icons updated.
- **Active view + ModuleLayout polish**: Minor structural updates to `ActiveView`, `ModuleLayout`, `ModuleControlBar`, `ModuleProgressBar`, and `ModuleStatusBar` to support the unified module pipeline.
- **`smoothScroll` utility**: Refined to fix scroll-height edge cases at the active/transition boundary.

### Fixed

- **Scroll height + smooth scroll bugs** at module/transition boundaries.
- **Transition module bug fixes** — minor regressions surfaced after the 1.3.0 transition rebuild.
- **Rachel meditation manifest keys**: Corrected `relaxing-rachel` → `rachel` mapping for Body Scan, Short Grounding, Leaves on a Stream, Open Awareness, Stay With It, Felt Sense, and Self-Compassion so the audio manifest resolves the right files.
- **Protector Dialogue audio basePath**: Corrected `protector` → `protector-dialogue`; relocated MP3s + script + manifest entries to match.

### Removed

- **Audit-driven cleanup** (`AUDIT_FINDINGS.md` sweep): Removed unused or superseded code — `PhaseHeader`, `Horizon` animation, `PreSessionView` (legacy), `SessionTimeline` (legacy), `PostCloseScreen`, `TransitionBuffer`, `TransitionTextarea`, `AISettingsTool`, `ComeUpTestTool`, `useSilenceTimer`, `useWakeLock`, `cryptoService`. Net: ~1,300 lines deleted.
- **Legacy breath system**: `BreathMeditationModule`, `breath-awareness`, `calming-breath-15min`, and `guided-breath-orb` meditation content removed.
- **Legacy Protector Dialogue components**: `ProtectorDialoguePart1Module.jsx` and `ProtectorDialoguePart2Module.jsx` removed (replaced by MasterModule content configs).
- **`date-fns`** removed from dependencies (already unused).

### Security / Maintenance

- **`npm audit fix`** — patched transitive dev dependencies.
- **Dependabot bumps** — `@vitejs/plugin-react` 5.1.2 → 5.2.0, `react-dom` 19.2.3 → 19.2.4, `eslint` 9.39.2 → 10.0.3.

[1.3.1]: https://github.com/wellwellwellyourefeelingfine/m-session/compare/v1.3.0...v1.3.1

## [1.3.0] - 2026-04-21

### Added

- **MasterModule framework**: Content-driven module system where a single engine renders any module from a content config. Supports four section types (screens, meditation, timer, generate) and seven screen types (text, prompt, selector, choice, animation, alarm, review). New modules can be built by writing a content config alone — no custom component code.
- **TransitionModule framework**: Parallel system to MasterModule designed for session transitions — the ceremonial arcs between phases (Opening Ritual, Peak Transition, Peak → Integration, Closing Ritual). Shares MasterModule's section/screen/block model and renderers but adds wall-clock persistence: transitions survive app closes and resume at the exact section, screen, and response state.
- **Detour routing system**: Transitions now support optional branching activities via `bookmark: true | 'section-id'` routing on choice blocks. Users can take a detour (a tailored journaling prompt, reflection, or meditation), then seamlessly return to the main transition flow via a routeStack bookmark — no nesting limits, survives app close/reopen.
- **Tailored transition meditations**: New audio-guided meditations written specifically for each transition — `transition-centering-breath` (Opening Ritual), `transition-opening`, `transition-peak-grounding` (Peak Transition), and `transition-closing` (Closing Ritual).
- **Five optional tailored detour activities**: Inner Dialogue, Letter (Unsent), Open Reflection, Release / Keep, Sitting with Mystery — reachable via detour routing from transition choice points.
- **Eleven transition custom blocks**: `ActionBlock`, `BodyCheckInBlock`, `DataDownloadBlock`, `EditableDoseBlock`, `ExpandableBlock`, `ExpandableStoreDisplayBlock`, `IngestionTimeBlock`, `PhaseRecapBlock`, `StoreDisplayBlock`, `TouchstoneArcBlock`, `TouchstonePromptBlock` — transition-specific interactive elements registered via `TRANSITION_CUSTOM_BLOCKS`.
- **Touchstone system**: Dedicated peak and synthesis touchstone capture during transitions, surfaced later in the closing ritual and AI context.
- **Helper Modal v5**: Complete rewrite of the in-session help system. Category-based decision trees (`src/content/helper/categories.js`), phase-aware resolvers, emergency contact flow with contact card display, decision-tree triage orchestrator, and journal entry formatter for help interactions.
- **Emergency contact details flow**: Captured during intake + substance checklist, surfaced by the helper modal's emergency flow and a dedicated `EmergencyContactView`.
- **Readable font mode**: Optional Lora serif body font as an alternative to Azeret Mono uppercase. Token-based system in `html.font-readable` maps all size and tracking utilities to serif-appropriate values; chrome elements (buttons, tabs, status pills) stay pinned to Azeret Mono for consistency. Toggle in Settings.
- **Font-size adjustment**: User preference for bumping body text up to ±2 steps via `--font-size-adjust`; feeds into every `text-*` token via `calc()`.
- **New DM Serif Text default for headers**: Serif display font across completion screens, idle screens, modals, and follow-up countdowns.
- **New animations**: `Sunrise`, `Sunset`, `Moonrise`, `FullSun`, `WaveLoop` — ASCII/generative animations for transition overlays and idle pages.
- **Glass effect header + tab bar**: Translucent, backdrop-blurred chrome with `color-mix` fallback — toggleable in Settings.
- **Module library drawer — favorites and search**: Star any library module to favorite it; full-text search across titles, descriptions, and tags.
- **Pre-session & follow-up edit mode**: Timeline editing now available during pre-session and follow-up phases, with completed module cards sorted to the top and locked from further edits.
- **Auto-update feature**: Foreground detection of new builds with in-app reload prompt (`AppUpdaterContext`).
- **Transition progress bar and control panel animations**: Progress bar fades in on mount, control panel transitions match module boundary fades.
- **Scroll-behind-status-bar behavior**: Content in active, pre-session, follow-up, transition, and check-in views now scrolls behind the transparent status bar and clips at the header edge (rather than clipping at the status-bar boundary).
- **Debug Mode follow-up test**: Simulates a completed session 49 hours ago with the 8-hour phase lock already elapsed and `integration-reflection-journal` auto-added.
- **Open MDMA resource** referenced in safety / about sections.
- **"Give Feedback" button** on the landing page.

### Changed

- **All four transitions redesigned**: Opening Ritual, Peak Transition, Peak → Integration, and Closing Ritual rebuilt on the TransitionModule framework with new content configs, tailored meditations, and detour branches. Each uses a standardized `AsciiMoon` entrance/exit overlay with matched 700ms fade and 1500ms/1000ms hold timings.
- **Substance checklist redesigned**: Multi-step flow with editable dose, ingestion time confirmation, safety gates, and integrated pre-session ritual entry.
- **Follow-up system consolidated**: The legacy `FOLLOW_UP_MODULES` content + dedicated `FollowUpCheckIn`/`FollowUpRevisit`/`FollowUpIntegration`/`FollowUpValuesCompass` screens + `FollowUpModuleModal` + `FollowUpSection` are all removed. Follow-up activities now run exclusively as regular library modules (`isFollowUpModule: true`) through `JournalingModule`, opened via `AltSessionModuleModal` in `mode="follow-up"`. The 8-hour phase-wide lock (`followUp.phaseUnlockTime`) is the only follow-up state; per-module unlock times and statuses are gone.
- **Session store schema v29**: Migration strips legacy `followUp.modules.*`, `followUp.unlockTimes.*`, and `activeFollowUpModule`; collapses `followUp` to `{ phaseUnlockTime }`. Runs on both live state and archived sessions at restore time.
- **Modal system unification**: Backdrop and sheet are now siblings (not parent/child) in all bottom-sheet modals so the backdrop can fade while the sheet slides independently — no cross-fade on the sheet. Applied to `ClosingCheckIn`, `DataDownloadModal`, `FollowUpModuleModal`, and `AltSessionModuleModal`.
- **Modal header styling**: All sheet modals now use accent-colored SVG icons (size 28, strokeWidth 2.5) at the top-left, `DM Serif Text` header at `text-lg`, and `CircleSkipIcon` for the close button — consistent pattern across Closing Check-In, Download Session Data, and follow-up modals.
- **Follow-up modal lock icon**: Flips between `LockIcon` (time-locked) and `LeafIcon` (available) based on state.
- **Modal description font adapts to font mode**: Descriptions drop the `uppercase` class so they render in Azeret Mono uppercase in mono mode and Lora lowercase in serif mode.
- **DataDownloadModal portaling**: Now portals to `document.body` so the z-50 backdrop escapes the `TransitionModule` fixed-wrapper stacking context and properly covers the header + tab bar.
- **"Before You Go" download button**: Now uses the black-fill primary button style to match the modal's Download Session Record button.
- **AI assistant mode updates**: Refined system prompt construction and context settings.
- **About, FAQ, and landing page**: Full rewrites of the about section, FAQ entries, and landing page copy; polished landing page icons and leafdraw animation.
- **Empty active-tab state**: Animated reveal when the user first lands on an empty active tab.
- **Tutorial timing**: Improved reveal timing and skip-button behavior in the timeline tutorial.
- **Intake form**: Polished transitions between questions, button styling, helper modal always visible during intake.
- **Duration picker**: Additional fixes to duration stepping and commit behavior.
- **Preview activity**: Improved preview flow, reduced max-height of detail modal on mobile.
- **Intensity ratings**: Unified across timeline, detail modal, and library drawer.
- **Idle pages**: Felt Sense and Self-Compassion idle pages updated.
- **Privacy notice popup**: Tweaked display logic.
- **Safety info**: Updated with current harm-reduction guidance and Open MDMA resource.

### Fixed

- **Opening ritual overlay timing**: Entrance and exit overlay fade/hold sequence refined so the content swap happens while the overlay is fully opaque (no stale-state flash).
- **Detour routing loop**: Fixed a bug where bookmarked detours could re-enter themselves if visited from multiple choice points.
- **Open Awareness module**: Audio cue alignment fix.
- **Intake form transitions**: Smoother step-to-step animation.
- **Follow-up timeline edit**: Edit mode now correctly enables/disables per module state in the completed session view.
- **Helper Modal lazy-load**: Modal is lazy-imported so it doesn't impact initial bundle size.
- **Stray crash path in ActiveView**: Removed reference to non-existent `FollowUpIntegration` component (latent crash if the code path were hit).
- **Sitemap**: Removed stale `/app` entry.

[1.3.0]: https://github.com/wellwellwellyourefeelingfine/m-session/compare/v1.2.0...v1.3.0

## [1.2.0] - 2026-04-02

### Added

- **Letter Writing module**: Guided letter to anyone with education, recipient + 3 prompts, full review with salutation, closing reflection
- **Inner Child Letter module**: Letter to younger self with age selection and guided prompts
- **Dialogue with a Feeling module**: Back-and-forth conversation with a named feeling (Gestalt/IFS)
- **Committed Action module**: ACT-based value → barrier → willingness → commitment flow
- **Time Capsule module**: Message to your future self from the clarity of this moment
- **6 follow-up integration modules** based on the MAPS Psychedelic Integration Workbook and Bathje et al. (2022) Synthesized Model of Integration: Integration Reflection, Relationships Reflection, Lifestyle Reflection, Spirit & Meaning, Body & Somatic Awareness, Nature & Connection
- **SVG icon system**: Accent-colored icons on module cards (category-based with per-module overrides)
- **CircleCheck/CircleSkip icons** for completed/skipped modules (replaces text symbols)
- **Collapsible completed phases**: Minus/plus toggle with smooth animation, phase timestamps shown when collapsed
- **Session complete stats**: Timestamps, duration, activity counts, longest activity, journal entries, export status with AwardIcon
- **Reconstructed timeline in session export**: Chronological view with per-activity timestamps
- **Session journal entries inlined in export**: Rendered within their phase section instead of duplicated in journal section
- **Life Graph milestones in export**: Included in pre-session activities section
- **`useSyncedDuration` hook**: Two-way duration sync between module UI and timeline cards for all 9 modules with duration pickers
- **LockIcon for follow-up phase lock**: Displayed on module cards when phase is time-locked
- **Active countdown clock**: HH:MM:SS countdown on follow-up landing page and modals
- **"Not yet exported" action**: Clickable link in session complete stats triggers export directly

### Changed

- **JournalingModule framework**: Rebuilt with configurable screen types (text, prompt, selector) via `content.screens` array; supports education pages, selector grids, and prompts in any order
- **Journaling module content extracted**: From inline in library.js to separate files in `src/content/modules/journaling/` (library.js reduced from ~1,900 to ~1,200 lines)
- **Intensity system**: Replaced gentle/moderate/deep strings with 1-5 numeric scale; displayed as filled dots
- **Phase access rules**: Removed intensity-based blocking; replaced with explicit phase gating via `VALID_PHASES`
- **Follow-up phase lock**: Single 8-hour phase-level lock replaces per-module unlock delays
- **Module card titles**: Changed from Azeret Mono uppercase to DM Serif normal case (18px)
- **Phase headers**: Bumped to 22px with phase sub-names at 15px
- **Module detail modal**: Redesigned with DM Serif section headers, SVG icon, intensity dots, pill-shaped tags, circular duration buttons, removed dividers
- **DurationPicker**: Redesigned with DM Serif font, circular buttons, open/close animations, removed dividers
- **Follow-up modals**: Redesigned with DM Serif titles, accent-bordered lock info box, grayed Begin button when locked, smooth close animation
- **Library drawer**: Defaults to Recommended tab instead of All
- **Pre-session active tab**: Completing a module returns to landing page (matches follow-up pattern)
- **Follow-up active tab**: Landing page with countdown when locked, "Continue Follow-Up Activity" button when unlocked
- **Idle screen animation**: Changed from MorphingShapes to AsciiMoon across all shared idle screens
- **Completion screen**: Removed periods from "Well done" and "Take a moment before moving on"
- **Idle screen description**: Left-aligned with more horizontal padding
- **Duration stepper**: Now available during active session (not just pre-session)
- **Light Journaling, Deep Journaling, Gratitude Reflection**: Added intro and closing education screens
- **Journaling entry format**: Prompts always included in saved entries (even without user text)
- **Session data export**: Activities interleaved chronologically with transitions; added stats to header

### Fixed

- **Double-opacity on completed modules**: Completed modules in completed phases no longer double-dim
- **Pre-session cards**: Now use shared ModuleCard component (eliminating inline card rendering duplication)
- **Follow-up module activation**: Library follow-up modules now render correctly in Active tab via ModuleRenderer
- **Completed session timeline padding**: Removed double px-6 padding that squeezed content
- **Module card icon alignment**: CircleCheck/CircleSkip icons properly aligned with timestamp text
- **Fade transitions**: Smooth fade in/out on first and last screens of journaling modules (header + body)

[1.2.0]: https://github.com/wellwellwellyourefeelingfine/m-session/compare/v1.1.0...v1.2.0

## [1.1.0] - 2026-03-14

### Added

- **Shaking the Tree module**: Somatic shaking practice for releasing held tension
- **SE Pendulation module**: Somatic Experiencing pendulation exercise with audio guidance
- **Map the Territory module**: Pre-session mapping activity with CompassV2 visualization
- **Welcome preview feature**: Preview session modules from the library modal before adding them
- **LeafDrawBig animation**: New generative leaf animation on the home tab
- **Gong sound option**: Configurable gong sound in settings for meditation transitions
- **Timeline generation matrix config**: Expanded configuration for automated timeline generation

### Changed

- Refined pendulation module interactions and timing
- Updated library modal with preview integration
- Rewritten About section in tools

### Fixed

- Preview excluded modules now correctly filtered
- ESLint config updates and unused variable cleanup
- Globe.js animation fix

[1.1.0]: https://github.com/wellwellwellyourefeelingfine/m-session/compare/v1.0.0...v1.1.0

## [1.0.0] - 2026-03-07

### Added

- **Full session flow**: 4-section intake questionnaire, personalized timeline generation, customizable timeline editor, substance checklist with dosage safety gates, pre-session ritual with intention setting
- **3-phase active session**: Come-up, peak, and integration phases with human-driven transitions
- **8-step closing ritual**: Self-gratitude, future messages, and commitment capture
- **Time-locked follow-up modules**: Integration check-ins at 12h, 24h, and 48h post-session, plus Values Compass follow-up
- **11 audio-synced meditations**: Open Awareness, Body Scan, Self-Compassion (3 variations), Felt Sense, Leaves on a Stream, Stay With It, Protector Dialogue (Parts 1 & 2), Simple Grounding, Short Grounding, The Descent, The Cycle Closing
- **Breath meditation** with animated BreathOrb visualization and customizable patterns
- **6 journaling types**: Light, deep, letter-writing, parts-work, therapy-exercise, and general
- **Values Compass** (ACT Matrix): Interactive four-quadrant drag-and-drop with PNG export
- **EFT relationship exploration**: The Descent and The Cycle as a linked module pair
- **Music listening and dance modules** with alarm integration
- **Open space** freeform rest module
- **Therapeutic frameworks**: IFS (Protector Dialogue), ACT (Leaves on a Stream, Values Compass), Coherence Therapy (Stay With It), EFT (The Descent, The Cycle), Focusing (Felt Sense), Self-Compassion (Kristin Neff)
- **Audio system**: Pre-recorded ElevenLabs TTS with audio-text synchronization (200ms audio lead), single-blob composition for iOS screen-lock resilience, wall-clock timers
- **Session history**: Archive and restore past sessions with full state preservation
- **Optional AI assistant**: Supports Anthropic, OpenAI, and OpenRouter APIs with granular privacy controls
- **Privacy-first architecture**: All data on-device via localStorage and IndexedDB, no accounts, no cloud sync, no analytics
- **PWA support**: Installable on iOS, Android, and desktop with full offline capability
- **Dark/light mode** with monospace + serif typography system
- **Life Graph**: Interactive pre-session activity for charting life milestones
- **Intention Setting**: Guided pre-session intention exploration
- **Body check-in**: Sensation grid for tracking physical awareness during sessions
- **"I Need Help" tool**: Quick reassurance and grounding accessible from any point in the session

[1.0.0]: https://github.com/wellwellwellyourefeelingfine/m-session/releases/tag/v1.0.0
