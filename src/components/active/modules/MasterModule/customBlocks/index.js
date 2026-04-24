/**
 * MasterModule custom block registry.
 *
 * Passed as `customBlockRegistry` prop to `ScreensSection` by `MasterModule`.
 * `ScreensSection` falls through to this map whenever a block's `type` doesn't
 * match one of the standard renderers (`text`, `prompt`, `selector`, `choice`,
 * `animation`, `alarm`, `review`). See the default case in
 * `../sectionRenderers/ScreensSection.jsx` for the fallthrough.
 *
 * This registry is intentionally empty — it's an extension point. Add blocks
 * here when a master module needs behavior the standard block types can't
 * express (e.g. inline-editable fields, action buttons, custom animations
 * tied to session-wide state).
 *
 * ────────────────────────────────────────────────────────────────────────────
 * HOW TO REGISTER A NEW BLOCK
 * ────────────────────────────────────────────────────────────────────────────
 *
 *   import RefineIntentionBlock from './RefineIntentionBlock';
 *
 *   const MASTER_CUSTOM_BLOCKS = {
 *     'refine-intention': RefineIntentionBlock,
 *   };
 *
 * Then in a content config, reference it by the string `type` key:
 *
 *   { type: 'refine-intention', storeField: 'sessionProfile.holdingQuestion' }
 *
 * ────────────────────────────────────────────────────────────────────────────
 * COMPONENT CONTRACT
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Custom blocks receive two props: `{ block, context }`.
 *
 *   `block`    — the content-config object verbatim (including any custom
 *                fields the block defines, like `storeField`, `placeholder`,
 *                `rows`, etc.).
 *
 *   `context`  — an object provided by `ScreensSection`:
 *
 *     State reads:
 *       responses, selectorValues, choiceValues, selectorJournals,
 *       visitedSections, conditionContext
 *
 *     State writers (module-local):
 *       setPromptResponse(index, value)
 *       toggleSelector(key, optionId, multiSelect)
 *       setSelectorJournal(key, value)
 *       setChoiceValue(key, optionId)
 *
 *     Navigation:
 *       advanceSection()             — complete the current section
 *       routeToSection(route)        — jump via a route object
 *
 *     Readiness gating:
 *       reportReady(blockKey, bool)  — disables Continue + Skip while any
 *                                      registered block reports `false`.
 *                                      Auto-clears on screen change.
 *
 *     Primary-button override:
 *       setPrimaryOverride({ label, onClick } | null)
 *                                    — intercept the Continue button (label
 *                                      and handler). Pass `null` to clear.
 *                                      Auto-clears on screen change.
 *
 *     Utility:
 *       accentTerms                  — the module's accent-term map for
 *                                      `{term}` markup in free text.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * SESSION-STORE ACCESS (sessionProfile + other slices)
 * ────────────────────────────────────────────────────────────────────────────
 *
 * MasterModule deliberately does NOT pass `storeState` or `sessionData` in
 * the context (that's a TransitionModule-specific extension). Custom blocks
 * that need session-wide state subscribe to `useSessionStore` directly via
 * selectors — the idiomatic Zustand pattern:
 *
 *   import { useSessionStore } from '../../../../../stores/useSessionStore';
 *
 *   // READ — select the specific field you need
 *   const holdingQuestion = useSessionStore((s) => s.sessionProfile.holdingQuestion);
 *
 *   // WRITE — always via updateSessionProfile (single atomic writer;
 *   // auto-derives dosageFeedback and other computed fields)
 *   const updateSessionProfile = useSessionStore((s) => s.updateSessionProfile);
 *   updateSessionProfile('holdingQuestion', value);
 *
 * `sessionProfile` (defined in `src/stores/useSessionStore.js`, search for
 * `sessionProfile:` in the initial state) is the single source of truth for
 * all user-entered identity, intent, and preferences data — intake answers,
 * `holdingQuestion`, `touchstone`, `primaryFocus`, `guidanceLevel`,
 * `plannedDosageMg`, safety fields, etc. Always write through
 * `updateSessionProfile(field, value)` — never `set({ sessionProfile: ... })`
 * directly — so auto-derivations stay consistent.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * CAVEATS / GOTCHAS
 * ────────────────────────────────────────────────────────────────────────────
 *
 * 1. No `storeValue`-based config conditions. MasterModule's condition
 *    evaluator runs without `storeState` — a custom block cannot declare
 *    `condition: { storeValue: 'sessionProfile.X' }` at the block-config
 *    level and have it pass. Subscribe to the store inside the component and
 *    branch in JSX instead.
 *
 * 2. Namespace your `reportReady` block keys. Keys collide if two blocks
 *    share one. Use a unique key per instance — e.g. for a block tied to a
 *    specific field: `` `refine-intention-${block.storeField}` ``. See
 *    TouchstonePromptBlock (`BLOCK_KEY` constant) for precedent.
 *
 * 3. `setPrimaryOverride` cleanup race. If your block overrides the primary
 *    button AND auto-saves on blur, clear the override with a short
 *    setTimeout (~250ms) when transitioning out of edit mode — otherwise a
 *    blur→click sequence fires the default advance instead of the saved
 *    handler. See TouchstonePromptBlock's `OVERRIDE_CLEAR_DELAY_MS` for
 *    precedent and the full explanation of the race.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * REFERENCE IMPLEMENTATIONS
 * ────────────────────────────────────────────────────────────────────────────
 *
 * The TransitionModule custom blocks are live, tested references:
 *
 *   src/components/session/TransitionModule/customBlocks/
 *     EditableDoseBlock.jsx       — simplest example. Reads
 *                                   `sessionProfile.plannedDosageMg`, writes
 *                                   via `updateSessionProfile` on save.
 *     TouchstonePromptBlock.jsx   — edit/display mode toggle. Uses
 *                                   `reportReady`, `setPrimaryOverride`, and
 *                                   writes to `sessionProfile` via a generic
 *                                   path-parsing `storeField`. A MasterModule
 *                                   block targeting one known field can skip
 *                                   the path parsing and call
 *                                   `updateSessionProfile('holdingQuestion',
 *                                   value)` directly.
 */

const MASTER_CUSTOM_BLOCKS = {};

export default MASTER_CUSTOM_BLOCKS;
