/**
 * Module Capabilities
 *
 * Shared UI components used by module renderers.
 */

// Unified UI components
export { default as ModuleControlBar, MuteButton, SlotButton, ConfirmationModal } from './ModuleControlBar';
export { default as ModuleProgressBar, StepProgressIndicator, CycleProgressIndicator } from './ModuleProgressBar';

// Layout components
export { default as ModuleLayout, ModuleHeader, ModuleContent, CompletionScreen, IdleScreen, PhaseIndicator } from './ModuleLayout';

// Hooks
export { useModuleTimer } from './hooks/useModuleTimer';
export { useModuleState } from './hooks/useModuleState';
