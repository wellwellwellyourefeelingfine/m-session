# Architecture Decisions

1. **Views kept mounted after first visit** (hidden with CSS, not unmounted)
   - Why: Meditation timers must survive tab switches
   - Home and Active are eagerly loaded on app launch; Journal and Tools are lazy-loaded on first tab visit via `React.lazy` + `Suspense`
   - HomeView was evaluated for lazy-loading but only saved ~4 KB gzipped from the initial bundle (most of its imports are shared with other eagerly-loaded code), while adding ~64 KB of duplicated code across chunk boundaries — not worth the trade-off

2. **Phase transitions as components** (PeakTransition, IntegrationTransition, ClosingRitual)
   - Why: Supportive, personalized experience between phases with user captures

3. **Capability system for modules**
   - Why: Extensible architecture where new modules can be added via config alone (custom components used when richer interaction is needed)

4. **Registry pattern for module routing**
   - Why: Clean separation between module types and components

5. **Audio-text sync with audio leading**
   - Why: More natural experience; text confirms what user hears

6. **Time-locked follow-up modules**
   - Why: Integration benefits from distance; 24-48h delay encourages reflection

7. **Local-only data with export**
   - Why: Privacy-first; no accounts or cloud sync; user owns their data via download

8. **Sheet modals use sibling backdrop+panel layout, not parent/child**
   - Why: CSS opacity is multiplicative, so a panel inside a fading backdrop wrapper inherits the fade. Slide keyframes animate transform only; the backdrop fades independently. See [design-system.md](design-system.md) "Modal Layout Pattern" for the full pattern and close-handler timing.

9. **Helper Modal trigger lives in Header, modal mounts in AppShell, bridged by `useHelperStore`**
   - Why: The button and the modal live in different component trees (Header is a Header child, the modal mounts at AppShell level so its `fixed` positioning and z-index don't get scoped under any particular tab view). They can't share local React state, so we use a tiny dedicated Zustand store as the bridge. This mirrors how the AI assistant uses `useAIStore.isModalOpen` for the same trigger-in-header / modal-elsewhere pattern. The helper modal is conditionally mounted (`{isHelperOpen && <HelperModal />}`) so each open is a fresh component mount with fresh state — no leftover-state bugs.

10. **Phase 3 terminology: "Synthesis" (UI) / `integration` (code)**

    In the MDMA therapy community, "integration" universally refers to the post-session therapeutic work — the non-drug sessions, journaling, and reflection that happen in the days and weeks *after* an experience. Our app originally used "Integration" for the third within-session phase (come-up → peak → integration), which created a terminology collision: users familiar with the clinical literature would see "Integration Phase" and think of post-session work, not the in-session wind-down.

    The phase was renamed to **"Synthesis"** in all user-facing content. The term captures what defines this phase: emotional openness from the peak is still present, but cognitive clarity is returning — the meeting of those two things is what makes the therapeutic work possible.

    **Internal code still uses `integration` everywhere.** Zustand persists session state to localStorage, so any user with an existing or archived session has `currentPhase: 'integration'` on their device. Renaming the internal key would break those sessions. The display-only approach avoids this entirely.

    **Practical guidance for developers:**

    | Context | Term to use | Examples |
    |---------|------------|---------|
    | User-facing strings (UI text, button labels, status bar, FAQ, export labels, journal headers) | **Synthesis** or **Synthesis Phase** | "Continue to Synthesis Phase", "PHASE 3 — SYNTHESIS", "Enter Synthesis Phase" |
    | Internal code (state keys, function names, variable names, filenames, component names, phase values in module configs) | **`integration`** | `currentPhase: 'integration'`, `transitionToIntegration()`, `IntegrationTransition.jsx`, `allowedPhases: ['peak', 'integration']` |
    | Post-session follow-up work (closing ritual encouragement, follow-up modules, FAQ about the general concept) | **Integration** (the community term) | "Integration Takes Time", "Integration Reflection", "What's integration and why does it matter?" |

    **Where the boundary lives:** Every file that maps an internal `'integration'` key to a display string has a lookup object or switch statement (e.g., `PHASE_NAMES`, `PHASE_CONFIG`, `getPhaseName()`). The key stays `'integration'`; the value says `'Synthesis'`. If you add a new place that displays the phase name, follow this same pattern.
