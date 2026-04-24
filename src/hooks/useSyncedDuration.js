/**
 * useSyncedDuration Hook
 * Manages module duration state with two-way sync between the module's
 * local state and the session store. When the duration is changed from
 * the timeline card's ModuleDetailModal, the active-tab module reflects
 * the update. When changed from within the module's idle-screen pill
 * arrows, the store is updated.
 *
 * Usage:
 *   const duration = useSyncedDuration(module, { hasStarted });
 *   // duration.selected     — current duration in minutes
 *   // duration.setSelected  — set duration (also syncs to store)
 *   // duration.handleChange — alias for setSelected
 */

import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { getModuleById } from '../content/modules';

export default function useSyncedDuration(module, { hasStarted = false } = {}) {
  const libraryModule = getModuleById(module?.libraryId);
  const updateModuleDuration = useSessionStore((state) => state.updateModuleDuration);

  const [selected, setSelectedLocal] = useState(
    module.duration || libraryModule?.defaultDuration || 10
  );

  // Sync from store → local (when changed externally, e.g., ModuleDetailModal)
  useEffect(() => {
    if (!hasStarted && module.duration && module.duration !== selected) {
      setSelectedLocal(module.duration);
    }
  }, [module.duration, hasStarted]);

  // Change handler: updates local state + syncs to store.
  // setSelected and handleChange are aliases; kept for caller ergonomics.
  const setSelected = useCallback((newDuration) => {
    setSelectedLocal(newDuration);
    updateModuleDuration(module.instanceId, newDuration);
  }, [module.instanceId, updateModuleDuration]);

  return {
    selected,
    setSelected,
    handleChange: setSelected,
  };
}
