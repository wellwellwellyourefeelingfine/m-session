/**
 * ModuleRenderer Component
 *
 * Routes module instances to the appropriate rendering component.
 * Uses the module registry pattern for clean, extensible routing.
 *
 * HOW IT WORKS:
 * 1. Looks up the module type from the library
 * 2. Checks the registry for a matching component (custom or MasterModule)
 *
 * ADDING A NEW MODULE TYPE:
 * - For content-driven modules: Use MasterModule (add content config + register type)
 * - For interactive modules: Create custom component and add to moduleRegistry.js
 */

import { Suspense } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { getModuleById } from '../../content/modules';
import { getModuleComponent } from './moduleRegistry';

export default function ModuleRenderer({ module, onProgressUpdate, onComplete: onCompleteOverride, onSkip: onSkipOverride }) {
  const completeModule = useSessionStore((state) => state.completeModule);
  const skipModule = useSessionStore((state) => state.skipModule);

  if (!module) return null;

  // Get the library module info for type
  const libraryModule = getModuleById(module.libraryId);
  const moduleType = libraryModule?.type || module.type || 'open-space';

  // Get the component to render from the registry
  const ModuleComponent = getModuleComponent(moduleType);

  const handleComplete = () => {
    if (onCompleteOverride) return onCompleteOverride();
    completeModule(module.instanceId);
  };

  const handleSkip = () => {
    if (onSkipOverride) return onSkipOverride();
    skipModule(module.instanceId);
  };

  // Common props passed to all module components
  const commonProps = {
    module,
    onComplete: handleComplete,
    onSkip: handleSkip,
    onProgressUpdate, // Pass timer update callback to modules
  };

  return (
    <Suspense fallback={null}>
      <ModuleComponent key={module.instanceId} {...commonProps} />
    </Suspense>
  );
}
