# Architecture

Developer documentation for M-SESSION. Broken into focused chapters for efficient context loading.

> **IMPORTANT — For master-module UI, copy, anatomy, animations, tokens, custom blocks, and conventions:** read the [MasterModule Style Sheet](../src/components/active/modules/MasterModule/MasterModuleStyleSheet.md) FIRST. This folder covers the **engine** (state machine, registries, persistence, recipes). The style sheet is the source of truth for anything user-facing.

> **Terminology note:** The within-session Phase 3 is called **"Synthesis"** in all user-facing content but **`integration`** in all internal code. See [decisions.md](decisions.md) #10 for the full rationale.

For an overview of the project, see the root [README.md](../README.md).

---

## Chapters

| Chapter | What's inside |
|---------|--------------|
| [directory-structure](directory-structure.md) | File layout reference |
| [modules-overview](modules-overview.md) | Two-tier system (custom components + MasterModule) |
| [master-module-engine](master-module-engine.md) | State machine, section runner, block registry, routing internals, journal assembly, visit tracking, persistence |
| [master-module-recipes](master-module-recipes.md) | Adding modules, branching example, custom component fallback, file structure, meditation engine wiring |
| [module-misc](module-misc.md) | Duration sync, intensity rating, follow-up lock, timeline editing, gating, booster card |
| [transition-module](transition-module.md) | TransitionModule engine — persistence, cross-store mirroring, custom blocks |
| [progress-bar](progress-bar.md) | Unified progress system, two modes, cumulative formula |
| [module-fades](module-fades.md) | Module boundary fades (distinct from intra-section fades in style sheet §6) |
| [timeline-generation](timeline-generation.md) | Focus areas, guidance levels, configuration structure |
| [audio-meditation](audio-meditation.md) | Playback architecture, voice system, audio generation scripts |
| [helper-modal](helper-modal.md) | Helper Modal V5 — decision tree, resolvers, emergency contact |
| [ai-assistant](ai-assistant.md) | AI assistant overview |
| [state-management](state-management.md) | Stores, sessionProfile, localStorage keys |
| [design-system](design-system.md) | CSS variables, typography, animations, modal pattern, scroll reveal |
| [key-files](key-files.md) | Quick-reference file → purpose table |
| [conventions](conventions.md) | Naming and styling conventions |
| [data-export](data-export.md) | Session data download formats |
| [session-history](session-history.md) | Archive and restore mechanism |
| [decisions](decisions.md) | Architecture decision rationale |
| [timer-and-wake-lock](timer-and-wake-lock.md) | PWA timer strategy and wake lock usage |
| [bundle-and-limits](bundle-and-limits.md) | Bundle size guidelines and current limitations |

---

## Reading Order

Most chapters are standalone — read whichever is relevant to your task. Cross-cutting dependencies:

- **Any MasterModule content work?** Read the [style sheet](../src/components/active/modules/MasterModule/MasterModuleStyleSheet.md) first, then [master-module-engine.md](master-module-engine.md) for internals.
- **TransitionModule?** Read [master-module-engine.md](master-module-engine.md) first — TransitionModule shares the same section/screen/block model.
- **Module boundary animations?** Read [module-fades.md](module-fades.md). For intra-section fades (screen-to-screen within MasterModule), see the [style sheet §6](../src/components/active/modules/MasterModule/MasterModuleStyleSheet.md#6-animations--transitions).
- **Design-system animations?** [design-system.md](design-system.md) covers app-wide animation primitives. The [style sheet](../src/components/active/modules/MasterModule/MasterModuleStyleSheet.md) covers how MasterModule uses them.
- **Adding a meditation with audio?** Read [master-module-recipes.md](master-module-recipes.md) for the step-by-step, then [audio-meditation.md](audio-meditation.md) for the playback architecture and generation scripts.

## Removed Chapters

- **Breath Controller System** — deprecated/unused. `BreathOrb.jsx` and `useBreathController.js` remain in the codebase as building blocks for future breath-guided meditation. Prior documentation is in git history.
