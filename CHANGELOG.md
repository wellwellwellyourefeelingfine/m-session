# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
