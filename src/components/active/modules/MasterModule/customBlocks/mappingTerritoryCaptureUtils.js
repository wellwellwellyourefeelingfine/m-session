export function collectMappingTerritoryCaptures({
  allBlocksWithPromptIndex = [],
  responses = {},
  selectorValues = {},
} = {}) {
  const captures = {};

  for (const block of allBlocksWithPromptIndex) {
    const field = block.mappingTerritoryField;
    if (!field) continue;

    if (block.type === 'selector') {
      const value = selectorValues?.[block.key];
      if (value) captures[field] = value;
    }

    if (block.type === 'prompt') {
      const value = responses?.[block.promptIndex]?.trim();
      if (value) captures[field] = value;
    }
  }

  return captures;
}
