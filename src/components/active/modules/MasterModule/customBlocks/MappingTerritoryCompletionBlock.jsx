/**
 * MappingTerritoryCompletionBlock
 *
 * Intercepts the final MasterModule primary action so Mapping the Territory
 * preserves its legacy completion side effects before MasterModule finalizes.
 */

import { useCallback, useEffect } from 'react';
import { useSessionStore } from '../../../../../stores/useSessionStore';
import { collectMappingTerritoryCaptures } from './mappingTerritoryCaptureUtils';

export default function MappingTerritoryCompletionBlock({ context }) {
  const updateMappingTerritoryCapture = useSessionStore((s) => s.updateMappingTerritoryCapture);
  const completePreSubstanceActivity = useSessionStore((s) => s.completePreSubstanceActivity);
  const allBlocksWithPromptIndex = context?.allBlocksWithPromptIndex;
  const responses = context?.responses;
  const selectorValues = context?.selectorValues;
  const advanceSection = context?.advanceSection;
  const setPrimaryOverride = context?.setPrimaryOverride;

  const complete = useCallback(() => {
    const captures = collectMappingTerritoryCaptures({
      allBlocksWithPromptIndex,
      responses,
      selectorValues,
    });
    Object.entries(captures).forEach(([field, value]) => {
      updateMappingTerritoryCapture(field, value);
    });
    updateMappingTerritoryCapture('completedAt', new Date().toISOString());
    completePreSubstanceActivity('mapping-territory');
    advanceSection?.();
  }, [
    allBlocksWithPromptIndex,
    responses,
    selectorValues,
    updateMappingTerritoryCapture,
    completePreSubstanceActivity,
    advanceSection,
  ]);

  useEffect(() => {
    if (!setPrimaryOverride) return undefined;
    setPrimaryOverride({ label: 'Complete', onClick: complete });
    return () => setPrimaryOverride(null);
  }, [complete, setPrimaryOverride]);

  return null;
}
