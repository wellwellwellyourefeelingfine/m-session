/**
 * Module Capabilities System
 *
 * This system provides composable UI building blocks for modules.
 * Instead of creating monolithic module components, modules declare
 * which capabilities they need, and the ModuleShell assembles them.
 *
 * CAPABILITY TYPES:
 *
 * 1. TIMER - Various timing displays and controls
 *    - 'elapsed'     : Shows elapsed/total time with progress bar
 *    - 'countdown'   : Counts down from a target
 *    - 'breathing'   : Phase-based breathing timer (inhale/hold/exhale)
 *    - 'hidden'      : Timer runs but isn't displayed
 *
 * 2. PROMPTS - Text content display
 *    - 'static'      : Shows all prompts at once
 *    - 'sequential'  : User advances through prompts manually
 *    - 'timed'       : Prompts fade in/out based on elapsed time
 *
 * 3. ANIMATION - Visual elements
 *    - 'breathing-circle' : Circle that expands/contracts with breath phases
 *    - 'glowing-orb'      : Animated glowing orb (future)
 *    - 'fade-pulse'       : Subtle pulsing fade effect
 *
 * 4. AUDIO - Sound capabilities (future)
 *    - 'voiceover'   : Spoken guidance
 *    - 'ambient'     : Background sounds/music
 *    - 'bells'       : Interval bells/chimes
 *
 * 5. INPUT - User input collection
 *    - 'journal'     : Text area for writing (saves to journal store)
 *    - 'checkin'     : Rating/response selection
 *
 * 6. CONTROLS - UI control elements
 *    - Button visibility, labels, and behavior are configured here
 *
 * CAPABILITY SCHEMA:
 *
 * {
 *   timer: {
 *     type: 'elapsed' | 'countdown' | 'breathing' | 'hidden',
 *     showProgress: boolean,      // Show progress bar at top
 *     showTimeDisplay: boolean,   // Show MM:SS display
 *     autoComplete: boolean,      // Auto-complete when timer ends
 *   },
 *
 *   prompts: {
 *     type: 'static' | 'sequential' | 'timed',
 *     fadeTransition: boolean,    // Fade between prompts
 *     showProgress: boolean,      // Show dot progress indicator
 *   },
 *
 *   animation: {
 *     type: 'breathing-circle' | 'glowing-orb' | 'fade-pulse' | null,
 *     color: string,              // Color for animation (future orb)
 *     size: 'small' | 'medium' | 'large',
 *   },
 *
 *   audio: {
 *     type: 'voiceover' | 'ambient' | 'bells' | null,
 *     src: string,                // Audio source path
 *     showMuteButton: boolean,    // Show mute/unmute control
 *   },
 *
 *   input: {
 *     type: 'journal' | 'checkin' | null,
 *     saveToJournal: boolean,     // For journal type
 *     placeholder: string,
 *   },
 *
 *   controls: {
 *     showBeginButton: boolean,   // Show "Begin" before starting
 *     beginButtonText: string,    // Custom begin button text
 *     showPauseButton: boolean,   // Show pause/resume during activity
 *     showSkipButton: boolean,    // Show skip option
 *     skipConfirmation: boolean,  // Require confirmation to skip
 *     continueButtonText: string, // Custom continue button text
 *     showBackButton: boolean,    // For sequential prompts
 *   },
 *
 *   layout: {
 *     centered: boolean,          // Center content vertically
 *     maxWidth: 'sm' | 'md' | 'lg',
 *     padding: 'normal' | 'compact',
 *   },
 * }
 */

// Export all capability components
export { default as TimerCapability } from './TimerCapability';
export { default as PromptsCapability } from './PromptsCapability';
export { default as AnimationCapability } from './AnimationCapability';
export { default as AudioCapability } from './AudioCapability';
export { default as InputCapability } from './InputCapability';
export { default as ControlsCapability } from './ControlsCapability';

// Export the new unified UI components
export { default as ModuleControlBar, MuteButton, SlotButton, ConfirmationModal } from './ModuleControlBar';
export { default as ModuleProgressBar, StepProgressIndicator, CycleProgressIndicator } from './ModuleProgressBar';

// Export the module shell that composes capabilities
export { default as ModuleShell } from './ModuleShell';

// Export layout components
export { default as ModuleLayout, ModuleHeader, ModuleContent, CompletionScreen, IdleScreen, PhaseIndicator } from './ModuleLayout';

// Export hooks
export { useModuleTimer } from './hooks/useModuleTimer';
export { useModuleState } from './hooks/useModuleState';

/**
 * Default capability configurations by module category
 * Used when a module doesn't specify full capabilities
 */
export const DEFAULT_CAPABILITIES = {
  // Simple display modules (open-space, music-listening)
  simple: {
    timer: null,
    prompts: { type: 'static' },
    animation: null,
    audio: null,
    input: null,
    controls: {
      showBeginButton: false,
      showPauseButton: false,
      showSkipButton: true,
      skipConfirmation: false,
      continueButtonText: 'Continue',
    },
    layout: {
      centered: true,
      maxWidth: 'md',
      padding: 'normal',
    },
  },

  // Timed meditation modules
  meditation: {
    timer: {
      type: 'elapsed',
      showProgress: true,
      showTimeDisplay: true,
      autoComplete: true,
    },
    prompts: {
      type: 'timed',
      fadeTransition: true,
    },
    animation: null,
    audio: null,
    input: null,
    controls: {
      showBeginButton: true,
      beginButtonText: 'Begin',
      showPauseButton: true,
      showSkipButton: true,
      skipConfirmation: true,
      continueButtonText: 'Continue',
    },
    layout: {
      centered: true,
      maxWidth: 'sm',
      padding: 'normal',
    },
  },

  // Breathing exercise modules
  breathing: {
    timer: {
      type: 'breathing',
      showProgress: false,
      showTimeDisplay: false,
      autoComplete: true,
    },
    prompts: null,
    animation: {
      type: 'breathing-circle',
      size: 'large',
    },
    audio: null,
    input: null,
    controls: {
      showBeginButton: true,
      beginButtonText: 'Begin',
      showPauseButton: false,
      showSkipButton: true,
      skipConfirmation: false,
      continueButtonText: 'Continue',
    },
    layout: {
      centered: true,
      maxWidth: 'md',
      padding: 'normal',
    },
  },

  // Journaling modules
  journaling: {
    timer: null,
    prompts: { type: 'static' },
    animation: null,
    audio: null,
    input: {
      type: 'journal',
      saveToJournal: true,
      placeholder: "What's on your mind?",
    },
    controls: {
      showBeginButton: false,
      showPauseButton: false,
      showSkipButton: true,
      skipConfirmation: false,
      continueButtonText: 'Save & Continue',
    },
    layout: {
      centered: false,
      maxWidth: 'lg',
      padding: 'normal',
    },
  },

  // Sequential step modules (grounding)
  sequential: {
    timer: null,
    prompts: {
      type: 'sequential',
      showProgress: true,
    },
    animation: null,
    audio: null,
    input: null,
    controls: {
      showBeginButton: false,
      showPauseButton: false,
      showSkipButton: true,
      skipConfirmation: false,
      showBackButton: true,
      continueButtonText: 'Continue',
    },
    layout: {
      centered: true,
      maxWidth: 'md',
      padding: 'normal',
    },
  },
};

/**
 * Merge user-provided capabilities with defaults
 * @param {object} provided - Capabilities from module library
 * @param {string} category - Default category to use ('simple', 'meditation', etc.)
 * @returns {object} Complete capabilities object
 */
export function mergeCapabilities(provided, category = 'simple') {
  const defaults = DEFAULT_CAPABILITIES[category] || DEFAULT_CAPABILITIES.simple;

  if (!provided) {
    return defaults;
  }

  // Deep merge each capability section
  return {
    timer: provided.timer !== undefined
      ? (provided.timer ? { ...defaults.timer, ...provided.timer } : null)
      : defaults.timer,
    prompts: provided.prompts !== undefined
      ? (provided.prompts ? { ...defaults.prompts, ...provided.prompts } : null)
      : defaults.prompts,
    animation: provided.animation !== undefined
      ? (provided.animation ? { ...defaults.animation, ...provided.animation } : null)
      : defaults.animation,
    audio: provided.audio !== undefined
      ? (provided.audio ? { ...defaults.audio, ...provided.audio } : null)
      : defaults.audio,
    input: provided.input !== undefined
      ? (provided.input ? { ...defaults.input, ...provided.input } : null)
      : defaults.input,
    controls: { ...defaults.controls, ...provided.controls },
    layout: { ...defaults.layout, ...provided.layout },
  };
}
