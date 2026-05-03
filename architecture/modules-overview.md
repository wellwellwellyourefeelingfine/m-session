# Module System

> For UI conventions, copy rules, idle-screen anatomy, animation choices, and content authoring — see the [MasterModule Style Sheet](../src/components/active/modules/MasterModule/MasterModuleStyleSheet.md). This chapter covers the two-tier architecture at a system level.

## Two-Tier Architecture

**1. Custom Components** (17+ lazy-loaded modules):

*Meditation:*
- `OpenAwarenessModule` — Audio-synced guided meditation (shared `useMeditationPlayback` hook)
- `BodyScanModule` — Audio-synced body scan (shared `useMeditationPlayback` hook)
- `SelfCompassionModule` — Audio-synced self-compassion with variation selector
- `SimpleGroundingModule` — Fixed-duration grounding meditation with audio prompts (also reused as a short 5-min come-up variant and the Centering Breath module)

*Therapeutic Activities:*
- `FeltSenseModule` — Audio-synced felt sense meditation with variation selector (Focusing)
- `LeavesOnAStreamModule` — Audio-synced ACT defusion exercise
- `StayWithItModule` — Multi-phase: meditation → check-in → psychoeducation → journaling (Coherence Therapy)
- `ProtectorDialoguePart1Module` — 10-step IFS guided activity with embedded meditation (listen/read modes)
- `ProtectorDialoguePart2Module` — IFS protector work continuation with journaling
- `ValuesCompassModule` — Interactive ACT Matrix quadrant mapping with drag-and-drop + PNG export
- `TheDescentModule` — EFT relationship exploration: guided meditation + journaling (Part 1 of linked pair)
- `TheCycleModule` — EFT relationship cycle mapping with interactive diagram + closing meditation (Part 2)

*Journaling (shared framework):*
- `JournalingModule` — Flexible journaling framework with configurable screen types (text, prompt, selector). Supports `content.screens` array for any mix of education pages, writing prompts, and selector grids. Used by: light journaling, deep journaling, gratitude reflection, time capsule, parts work, therapy exercise, and 6 follow-up integration modules.

*Letter-Writing (custom modules):*
- `LetterWritingModule` — Guided letter to someone: education → recipient + 3 prompts → full review with salutation → closing reflection
- `InnerChildLetterModule` — Letter to younger self: age selection → 3 prompts → review → closing
- `FeelingDialogueModule` — Back-and-forth conversation with a named feeling (Gestalt/IFS): name feeling → 4 dialogue prompts → review → closing
- `CommittedActionLetterModule` — ACT-based value → barrier → willingness → commitment → review → closing

*Follow-Up Integration Modules (use JournalingModule framework):*
- `Integration Reflection` — What stayed, emotional check-in (selector), shifted perspectives, unresolved material
- `Relationships Reflection` — Who's on your mind, relationship shift (selector), patterns, communication
- `Lifestyle Reflection` — What's working, area for change (selector), boundaries, habits
- `Spirit & Meaning` — Ineffable experiences, spiritual experience (multi-select), purpose shifts, practices
- `Body & Somatic Awareness` — Body scan, physical changes (multi-select), somatic practices (multi-select)
- `Nature & Connection` — Nature relationship, elements (multi-select), nature practices (multi-select)

*Open-Ended:*
- `MusicListeningModule` — Duration picker, alarm prompt, genre recommendations
- `OpenSpaceModule` — Freeform rest with silence timer (`useSilenceTimer` hook)
- `LetsDanceModule` — Dance-focused music module with movement recommendations (peak phase)

*Pre-Session Activities:*
- `IntentionSettingActivity` — Guided intention refinement with self-inquiry prompts
- `LifeGraphActivity` — Lifecycle visualization exercise with PNG export

**2. MasterModule** (content-driven, no custom component code):

The MasterModule is a universal shared component that renders any module from a content configuration file. It supports the full range of module capabilities — meditation playback, education screens, journaling, interactive selection, timed activities, PNG generation, and conditional branching — all driven by content config alone.

All existing custom modules remain as-is. MasterModule is for new modules going forward. See [master-module-engine.md](master-module-engine.md) for the engine internals and [master-module-recipes.md](master-module-recipes.md) for how to add new modules.
