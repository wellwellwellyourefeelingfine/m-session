/**
 * ModuleRenderer Component
 *
 * Routes module instances to the appropriate rendering component.
 * Uses the module registry pattern for clean, extensible routing.
 *
 * HOW IT WORKS:
 * 1. Looks up the module type from the library
 * 2. Checks the registry for a custom component
 * 3. Falls back to ModuleShell for capability-driven rendering
 *
 * ADDING A NEW MODULE TYPE:
 * - If it can use capabilities alone: Add to library.js with capabilities config
 * - If it needs custom logic: Create component and add to moduleRegistry.js
 */

import { Suspense } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { getModuleById } from '../../content/modules';
import { getModuleComponent } from './moduleRegistry';

export default function ModuleRenderer({ module, onTimerUpdate }) {
  const completeModule = useSessionStore((state) => state.completeModule);
  const skipModule = useSessionStore((state) => state.skipModule);

  if (!module) return null;

  // Get the library module info for type
  const libraryModule = getModuleById(module.libraryId);
  const moduleType = libraryModule?.type || module.type || 'open-space';

  // Get the component to render from the registry
  const ModuleComponent = getModuleComponent(moduleType);

  const handleComplete = () => {
    completeModule(module.instanceId);
  };

  const handleSkip = () => {
    skipModule(module.instanceId);
  };

  // Common props passed to all module components
  const commonProps = {
    module,
    onComplete: handleComplete,
    onSkip: handleSkip,
    onTimerUpdate, // Pass timer update callback to modules
  };

  return (
    <Suspense fallback={null}>
      <ModuleComponent key={module.instanceId} {...commonProps} />
    </Suspense>
  );
}
