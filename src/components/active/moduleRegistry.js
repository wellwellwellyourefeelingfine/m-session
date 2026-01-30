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

// Import custom module components (ones that need specialized logic)
import GroundingModule from './modules/GroundingModule';
import BreathingModule from './modules/BreathingModule';
import BreathMeditationModule from './modules/BreathMeditationModule';
import JournalingModule from './modules/JournalingModule';
import GuidedMeditationModule from './modules/GuidedMeditationModule';

import OpenAwarenessModule from './modules/OpenAwarenessModule';
import BodyScanModule from './modules/BodyScanModule';
import SelfCompassionModule from './modules/SelfCompassionModule';
import SimpleGroundingModule from './modules/SimpleGroundingModule';
import MusicListeningModule from './modules/MusicListeningModule';

// Import the generic shell
import { ModuleShell } from './capabilities';

/**
 * Custom module components
 * These are modules that have specialized logic beyond what capabilities can provide
 */
export const CUSTOM_MODULES = {
  // Grounding has a specific multi-step flow
  grounding: GroundingModule,

  // Breathing has complex phase-based animation timing
  breathing: BreathingModule,

  // Breath meditation 2.0 with orb animation and sequence support
  'breath-meditation': BreathMeditationModule,

  // Journaling needs journal store integration with custom save logic
  journaling: JournalingModule,
  'light-journaling': JournalingModule,
  'deep-journaling': JournalingModule,
  'letter-writing': JournalingModule,
  'parts-work': JournalingModule,
  'therapy-exercise': JournalingModule,
  // Note: 'closing-ritual' is now a transition flow, not a module

  // Guided meditation has complex timed prompt + playback logic
  'guided-meditation': GuidedMeditationModule,

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
};

/**
 * Module types that should use the generic ModuleShell
 * These modules are fully defined by their capabilities configuration
 */
export const SHELL_MODULE_TYPES = [
  // Open/passive types (just content + continue/skip)
  'open-space',
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
  grounding: ['grounding'],
  breathing: ['breathing', 'breath-meditation'],
  meditation: [
    'guided-meditation',
    'open-awareness',
    'body-scan',
    'self-compassion',
    'simple-grounding',
  ],
  journaling: [
    'journaling',
    'light-journaling',
    'deep-journaling',
    'letter-writing',
    'parts-work',
    'therapy-exercise',
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
