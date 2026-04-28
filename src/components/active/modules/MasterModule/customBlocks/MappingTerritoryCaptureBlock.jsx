/**
 * MappingTerritoryCaptureBlock
 *
 * Invisible bridge from MasterModule-local responses/selectors into the
 * historical transitionCaptures.mappingTerritory export slot.
 */

import { useEffect } from 'react';
import { useSessionStore } from '../../../../../stores/useSessionStore';

function findPromptValue(block, context) {
  const promptBlock = context.allBlocksWithPromptIndex?.find((candidate) =>
    candidate.type === 'prompt' && candidate.promptKey === block.promptKey
  );
  if (!promptBlock) return '';
  return context.responses?.[promptBlock.promptIndex] || '';
}

function resolveValue(block, context) {
  if (block.source === 'selector') {
    return context.selectorValues?.[block.selectorKey || block.key] || null;
  }
  if (block.source === 'prompt') {
    return findPromptValue(block, context).trim();
  }
  return null;
}

export default function MappingTerritoryCaptureBlock({ block, context }) {
  const updateMappingTerritoryCapture = useSessionStore((s) => s.updateMappingTerritoryCapture);
  const value = resolveValue(block, context);

  useEffect(() => {
    if (value == null || value === '') return;
    updateMappingTerritoryCapture(block.field, value);
  }, [block.field, updateMappingTerritoryCapture, value]);

  return null;
}
