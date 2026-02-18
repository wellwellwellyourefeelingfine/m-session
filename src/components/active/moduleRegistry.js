/**
 * Module Registry
 *
 * Maps module types to their rendering components.
 * This replaces the switch statement in ModuleRenderer with a clean lookup.
 *
 * ADDING A NEW MODULE TYPE:
 * 1. If it can be rendered with capabilities alone, add it to SHELL_MODULE_TYPES
 * 2. If it needs custom logic, create a component and add it to CUSTOM_MODULES
 *
 * The system will:
 * - Use custom components for types in CUSTOM_MODULES
 * - Use ModuleShell for types in SHELL_MODULE_TYPES
 * - Fall back to ModuleShell for unknown types
 */

import { lazy } from 'react';

// Lazy-load custom module components — each becomes its own chunk
const BreathMeditationModule = lazy(() => import('./modules/BreathMeditationModule'));
const JournalingModule = lazy(() => import('./modules/JournalingModule'));
const OpenAwarenessModule = lazy(() => import('./modules/OpenAwarenessModule'));
const BodyScanModule = lazy(() => import('./modules/BodyScanModule'));
const SelfCompassionModule = lazy(() => import('./modules/SelfCompassionModule'));
const SimpleGroundingModule = lazy(() => import('./modules/SimpleGroundingModule'));
const MusicListeningModule = lazy(() => import('./modules/MusicListeningModule'));
const OpenSpaceModule = lazy(() => import('./modules/OpenSpaceModule'));
const ProtectorDialoguePart1Module = lazy(() => import('./modules/ProtectorDialoguePart1Module'));
const ProtectorDialoguePart2Module = lazy(() => import('./modules/ProtectorDialoguePart2Module'));
const LeavesOnAStreamModule = lazy(() => import('./modules/LeavesOnAStreamModule'));

// Import the generic shell (small, stays in main chunk)
import { ModuleShell } from './capabilities';

/**
 * Custom module components
 * These are modules that have specialized logic beyond what capabilities can provide
 */
export const CUSTOM_MODULES = {
  // Breath meditation with orb animation and sequence support
  'breath-meditation': BreathMeditationModule,

  // Journaling needs journal store integration with custom save logic
  journaling: JournalingModule,
  'light-journaling': JournalingModule,
  'deep-journaling': JournalingModule,
  'letter-writing': JournalingModule,
  'parts-work': JournalingModule,
  'therapy-exercise': JournalingModule,
  // Note: 'closing-ritual' is now a transition flow, not a module

  // Open awareness has audio-text sync with variable duration
  'open-awareness': OpenAwarenessModule,

  // Body scan has audio-text sync with progressive body region scanning
  'body-scan': BodyScanModule,

  // Self-compassion has variation selection + audio-text sync
  'self-compassion': SelfCompassionModule,

  // Simple grounding has fixed-duration audio-text sync
  'simple-grounding': SimpleGroundingModule,

  // Music listening has duration picker, alarm prompt, and recommendations
  'music-listening': MusicListeningModule,

  // Open space has duration picker, AsciiMoon animation, and elapsed timer
  'open-space': OpenSpaceModule,

  // Protector Dialogue (IFS) — two-part linked module
  'protector-dialogue-p1': ProtectorDialoguePart1Module,
  'protector-dialogue-p2': ProtectorDialoguePart2Module,

  // Leaves on a Stream (ACT cognitive defusion) — meditation + reflection + journaling
  'leaves-on-a-stream': LeavesOnAStreamModule,
};

/**
 * Module types that should use the generic ModuleShell
 * These modules are fully defined by their capabilities configuration
 */
export const SHELL_MODULE_TYPES = [
  // Reserved for future capability-only modules
];

/**
 * Get the component to render for a given module type
 * @param {string} moduleType - The module type from library
 * @returns {React.Component} The component to render
 */
export function getModuleComponent(moduleType) {
  // Check for custom component first
  if (CUSTOM_MODULES[moduleType]) {
    return CUSTOM_MODULES[moduleType];
  }

  // Otherwise use the generic shell
  return ModuleShell;
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
 * Check if a module type should use the shell
 * @param {string} moduleType - The module type from library
 * @returns {boolean}
 */
export function usesShell(moduleType) {
  return SHELL_MODULE_TYPES.includes(moduleType) || !hasCustomComponent(moduleType);
}

/**
 * Get all registered module types
 * @returns {string[]} Array of all module types
 */
export function getAllModuleTypes() {
  const customTypes = Object.keys(CUSTOM_MODULES);
  const allTypes = new Set([...customTypes, ...SHELL_MODULE_TYPES]);
  return Array.from(allTypes);
}

/**
 * Module type categories for organization
 */
export const MODULE_CATEGORIES = {
  meditation: [
    'breath-meditation',
    'open-awareness',
    'body-scan',
    'self-compassion',
    'simple-grounding',
    'leaves-on-a-stream',
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
  ],
  open: [
    'open-space',
    'music-listening',
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
