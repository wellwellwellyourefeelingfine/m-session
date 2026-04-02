/**
 * useSyncedDuration Hook
 * Manages module duration state with two-way sync between the module's
 * local state and the session store. When the duration is changed from
 * the timeline card modal, the module reflects the update. When changed
 * from within the module, the store is updated.
 *
 * Usage:
 *   const duration = useSyncedDuration(module, { hasStarted });
 *   // duration.selected       — current duration in minutes
 *   // duration.setSelected    — set duration (also syncs to store)
 *   // duration.showPicker     — boolean for duration picker visibility
 *   // duration.setShowPicker  — toggle duration picker
 *   // duration.handleChange   — change handler (sets local + syncs store)
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
  const [showPicker, setShowPicker] = useState(false);

  // Sync from store → local (when changed externally, e.g., timeline card modal)
  useEffect(() => {
    if (!hasStarted && module.duration && module.duration !== selected) {
      setSelectedLocal(module.duration);
    }
  }, [module.duration, hasStarted]);

  // Change handler: updates local state + syncs to store
  const handleChange = useCallback((newDuration) => {
    setSelectedLocal(newDuration);
    updateModuleDuration(module.instanceId, newDuration);
  }, [module.instanceId, updateModuleDuration]);

  // Direct setter that also syncs to store
  const setSelected = useCallback((newDuration) => {
    setSelectedLocal(newDuration);
    updateModuleDuration(module.instanceId, newDuration);
  }, [module.instanceId, updateModuleDuration]);

  return {
    selected,
    setSelected,
    showPicker,
    setShowPicker,
    handleChange,
  };
}
