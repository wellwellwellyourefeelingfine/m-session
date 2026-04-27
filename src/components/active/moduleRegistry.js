/**
 * Module Registry
 *
 * Maps module types to their rendering components.
 *
 * ADDING A NEW MODULE TYPE:
 * 1. For content-driven modules, use MasterModule (add content config + register type here)
 * 2. For highly interactive modules, create a custom component and add it to CUSTOM_MODULES
 */

import { lazy } from 'react';

// Lazy-load custom module components — each becomes its own chunk
const JournalingModule = lazy(() => import('./modules/JournalingModule'));
const OpenAwarenessModule = lazy(() => import('./modules/OpenAwarenessModule'));
const BodyScanModule = lazy(() => import('./modules/BodyScanModule'));
const SelfCompassionModule = lazy(() => import('./modules/SelfCompassionModule'));
const SimpleGroundingModule = lazy(() => import('./modules/SimpleGroundingModule'));
const MusicListeningModule = lazy(() => import('./modules/MusicListeningModule'));
const OpenSpaceModule = lazy(() => import('./modules/OpenSpaceModule'));
const LeavesOnAStreamModule = lazy(() => import('./modules/LeavesOnAStreamModule'));
const StayWithItModule = lazy(() => import('./modules/StayWithItModule'));
const ValuesCompassModule = lazy(() => import('./modules/ValuesCompassModule'));
const LetsDanceModule = lazy(() => import('./modules/LetsDanceModule'));
const FeltSenseModule = lazy(() => import('./modules/FeltSenseModule'));
const TheDescentModule = lazy(() => import('./modules/TheDescentModule'));
const TheCycleModule = lazy(() => import('./modules/TheCycleModule'));
const IntentionSettingActivity = lazy(() => import('../session/activities/IntentionSettingActivity'));
const LifeGraphActivity = lazy(() => import('../session/activities/LifeGraphActivity'));
const MappingTerritoryActivity = lazy(() => import('../session/activities/MappingTerritoryActivity'));
const PendulationModule = lazy(() => import('./modules/PendulationModule'));
const ShakingTheTreeModule = lazy(() => import('./modules/ShakingTheTreeModule'));
const LetterWritingModule = lazy(() => import('./modules/LetterWritingModule'));
const InnerChildLetterModule = lazy(() => import('./modules/InnerChildLetterModule'));
const FeelingDialogueModule = lazy(() => import('./modules/FeelingDialogueModule'));
const CommittedActionLetterModule = lazy(() => import('./modules/CommittedActionLetterModule'));
const MasterModule = lazy(() => import('./modules/MasterModule/MasterModule'));

/**
 * Custom module components
 * These are modules that have specialized logic beyond what capabilities can provide
 */
export const CUSTOM_MODULES = {
  // Journaling needs journal store integration with custom save logic
  journaling: JournalingModule,
  'light-journaling': JournalingModule,
  'deep-journaling': JournalingModule,
  'letter-writing': LetterWritingModule,
  'inner-child-letter': InnerChildLetterModule,
  'feeling-dialogue': FeelingDialogueModule,
  'committed-action': CommittedActionLetterModule,
  'integration-reflection-journal': JournalingModule,
  'relationships-reflection': JournalingModule,
  'lifestyle-reflection': JournalingModule,
  'spirit-meaning': JournalingModule,
  'body-somatic': JournalingModule,
  'nature-connection': JournalingModule,
  'parts-work': JournalingModule,
  'therapy-exercise': JournalingModule,
  'time-capsule': JournalingModule,
  // Note: 'closing-ritual' is now a transition flow, not a module

  // Open awareness has audio-text sync with variable duration
  'open-awareness': OpenAwarenessModule,

  // Body scan has audio-text sync with progressive body region scanning
  'body-scan': BodyScanModule,

  // Self-compassion has variation selection + audio-text sync
  'self-compassion': SelfCompassionModule,

  // Simple grounding has fixed-duration audio-text sync
  'simple-grounding': SimpleGroundingModule,

  // Basic grounding (short 5-min version) — reuses SimpleGroundingModule
  'short-grounding': SimpleGroundingModule,

  // Centering Breath — reuses SimpleGroundingModule (idle screen uses WaveLoop)
  'centering-breath': SimpleGroundingModule,

  // Music listening has duration picker, alarm prompt, and recommendations
  'music-listening': MusicListeningModule,

  // Open space has duration picker, AsciiMoon animation, and elapsed timer
  'open-space': OpenSpaceModule,

  // Protector Dialogue (IFS) — two-part linked module, MasterModule-driven.
  'protector-dialogue-p1': MasterModule,
  'protector-dialogue-p2': MasterModule,

  // Leaves on a Stream (ACT cognitive defusion) — meditation + reflection + journaling
  'leaves-on-a-stream': LeavesOnAStreamModule,

  // Stay With It (reconsolidation) — meditation + check-in + psychoeducation + journaling
  'stay-with-it': StayWithItModule,

  // Values Compass (ACT Matrix) — interactive quadrant mapping + journaling
  'values-compass': ValuesCompassModule,

  // Let's Dance — dance-focused music module (peak phase only)
  'lets-dance': LetsDanceModule,

  // Felt Sense (Focusing) — guided meditation + reflection + journaling
  'felt-sense': FeltSenseModule,

  // The Deep Dive (EFT Relationship) — guided meditation + journaling (Part 1 of linked pair)
  'the-descent': TheDescentModule,

  // The Cycle (EFT Relationship) — cycle mapping + diagram + closing meditation (Part 2 of linked pair)
  'the-cycle': TheCycleModule,

  // Intention Setting — pre-session guided intention refinement flow
  'intention-setting': IntentionSettingActivity,

  // Life Graph — pre-session lifeline exercise with PNG visualization
  'life-graph': LifeGraphActivity,

  // Mapping the Territory — pre-session educational orientation
  'mapping-territory': MappingTerritoryActivity,

  // Pendulation (Somatic Experiencing) — branching audio + checkpoints + adaptive debrief
  'pendulation': PendulationModule,

  // Shaking the Tree — somatic movement practice with 5 timed phases
  'shaking-the-tree': ShakingTheTreeModule,

  // MasterModule — content-driven universal module framework
  'routing-test-module': MasterModule,
};

/**
 * Get the component to render for a given module type
 * @param {string} moduleType - The module type from library
 * @returns {React.Component|null} The component to render
 */
export function getModuleComponent(moduleType) {
  return CUSTOM_MODULES[moduleType] || null;
}

/**
 * Check if a module type has a custom component
 * @param {string} moduleType - The module type from library
 * @returns {boolean}
 */
export function hasCustomComponent(moduleType) {
  return moduleType in CUSTOM_MODULES;
}

/**
 * Get all registered module types
 * @returns {string[]} Array of all module types
 */
export function getAllModuleTypes() {
  return Object.keys(CUSTOM_MODULES);
}

/**
 * Module type categories for organization
 */
export const MODULE_CATEGORIES = {
  meditation: [
    'open-awareness',
    'body-scan',
    'self-compassion',
    'simple-grounding',
    'short-grounding',
    'centering-breath',
  ],
  journaling: [
    'journaling',
    'light-journaling',
    'deep-journaling',
    'letter-writing',
    'parts-work',
    'therapy-exercise',
  ],
  activity: [
    'protector-dialogue-p1',
    'protector-dialogue-p2',
    'stay-with-it',
    'values-compass',
    'leaves-on-a-stream',
    'felt-sense',
    'intention-setting',
    'life-graph',
    'mapping-territory',
    'the-descent',
    'the-cycle',
    'pendulation',
    'shaking-the-tree',
    'routing-test-module',
  ],
  open: [
    'open-space',
    'music-listening',
    'lets-dance',
  ],
};

/**
 * Get the category for a module type
 * @param {string} moduleType - The module type
 * @returns {string} The category name
 */
export function getModuleCategory(moduleType) {
  for (const [category, types] of Object.entries(MODULE_CATEGORIES)) {
    if (types.includes(moduleType)) {
      return category;
    }
  }
  return 'other';
}
