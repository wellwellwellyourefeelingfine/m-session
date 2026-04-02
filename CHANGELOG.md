# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
