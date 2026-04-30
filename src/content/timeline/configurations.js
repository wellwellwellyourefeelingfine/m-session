/**
 * Timeline Configurations
 * Defines module compositions for each focus + guidance level combination.
 *
 * Structure:
 *   TIMELINE_CONFIGS[focus][guidanceLevel] = { comeUp, peak, integration }
 *   TIMELINE_CONFIGS.minimal              = { comeUp, peak, integration }
 *
 * Each phase array contains module specs: { libraryId }
 * Duration is pulled from the library's defaultDuration (single source of truth).
 * Linked modules add: { linkedGroup, linkedRole }
 */

export const TIMELINE_CONFIGS = {
  // ════════════════════════════════════════════════════════════
  // Self-Understanding — values, patterns, inner parts
  // ════════════════════════════════════════════════════════════
  'self-understanding': {
    full: {
      preSession: [
        { libraryId: 'intention-setting-v2' },
        { libraryId: 'life-graph' },
        { libraryId: 'mapping-territory' },
      ],
      comeUp: [
        { libraryId: 'simple-grounding' },
        { libraryId: 'leaves-on-a-stream' },
        { libraryId: 'music-listening' },
      ],
      peak: [
        { libraryId: 'body-scan' },
        { libraryId: 'felt-sense' },
        { libraryId: 'music-listening' },
        { libraryId: 'self-compassion' },
      ],
      integration: [
        { libraryId: 'values-compass' },
        { libraryId: 'open-awareness' },
      ],
    },
    moderate: {
      preSession: [
        { libraryId: 'intention-setting-v2' },
      ],
      comeUp: [
        { libraryId: 'simple-grounding' },
        { libraryId: 'leaves-on-a-stream' },
        { libraryId: 'music-listening' },
      ],
      peak: [
        { libraryId: 'felt-sense' },
        { libraryId: 'music-listening' },
        { libraryId: 'self-compassion' },
      ],
      integration: [
        { libraryId: 'values-compass' },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // Emotional Healing — self-compassion, processing, release
  // ════════════════════════════════════════════════════════════
  healing: {
    full: {
      preSession: [
        { libraryId: 'intention-setting-v2' },
        { libraryId: 'life-graph' },
        { libraryId: 'mapping-territory' },
      ],
      comeUp: [
        { libraryId: 'simple-grounding' },
        { libraryId: 'leaves-on-a-stream' },
        { libraryId: 'music-listening' },
      ],
      peak: [
        { libraryId: 'body-scan' },
        { libraryId: 'self-compassion' },
        { libraryId: 'shaking-the-tree' },
        { libraryId: 'music-listening' },
        { libraryId: 'stay-with-it' },
      ],
      integration: [
        { libraryId: 'protector-dialogue-p1', linkedGroup: 'protector', linkedRole: 'part1' },
        { libraryId: 'music-listening' },
        { libraryId: 'protector-dialogue-p2', linkedGroup: 'protector', linkedRole: 'part2' },
        { libraryId: 'values-compass' },
      ],
    },
    moderate: {
      preSession: [
        { libraryId: 'intention-setting-v2' },
      ],
      comeUp: [
        { libraryId: 'simple-grounding' },
        { libraryId: 'leaves-on-a-stream' },
        { libraryId: 'music-listening' },
      ],
      peak: [
        { libraryId: 'body-scan' },
        { libraryId: 'self-compassion' },
        { libraryId: 'shaking-the-tree' },
        { libraryId: 'music-listening' },
      ],
      integration: [
        { libraryId: 'protector-dialogue-p1', linkedGroup: 'protector', linkedRole: 'part1' },
        { libraryId: 'music-listening' },
        { libraryId: 'protector-dialogue-p2', linkedGroup: 'protector', linkedRole: 'part2' },
        { libraryId: 'values-compass' },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // Relationship Exploration — attachment, EFT linked pair
  // ════════════════════════════════════════════════════════════
  relationship: {
    full: {
      preSession: [
        { libraryId: 'intention-setting-v2' },
        { libraryId: 'mapping-territory' },
      ],
      comeUp: [
        { libraryId: 'simple-grounding' },
        { libraryId: 'leaves-on-a-stream' },
        { libraryId: 'music-listening' },
      ],
      peak: [
        { libraryId: 'body-scan' },
        { libraryId: 'self-compassion' },
        { libraryId: 'lets-dance' },
        { libraryId: 'the-descent-p1', linkedGroup: 'descent-cycle', linkedRole: 'part1' },
      ],
      integration: [
        { libraryId: 'the-cycle-p2', linkedGroup: 'descent-cycle', linkedRole: 'part2' },
        { libraryId: 'felt-sense' },
        { libraryId: 'music-listening' },
      ],
    },
    moderate: {
      preSession: [
        { libraryId: 'intention-setting-v2' },
      ],
      comeUp: [
        { libraryId: 'simple-grounding' },
        { libraryId: 'leaves-on-a-stream' },
        { libraryId: 'music-listening' },
      ],
      peak: [
        { libraryId: 'self-compassion' },
        { libraryId: 'lets-dance' },
        { libraryId: 'the-descent-p1', linkedGroup: 'descent-cycle', linkedRole: 'part1' },
      ],
      integration: [
        { libraryId: 'the-cycle-p2', linkedGroup: 'descent-cycle', linkedRole: 'part2' },
        { libraryId: 'music-listening' },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // Creativity & Insight — open flow, embodiment, play
  // ════════════════════════════════════════════════════════════
  creativity: {
    full: {
      preSession: [
        { libraryId: 'intention-setting-v2' },
        { libraryId: 'life-graph' },
        { libraryId: 'mapping-territory' },
      ],
      comeUp: [
        { libraryId: 'simple-grounding' },
        { libraryId: 'leaves-on-a-stream' },
        { libraryId: 'music-listening' },
      ],
      peak: [
        { libraryId: 'body-scan' },
        { libraryId: 'felt-sense' },
        { libraryId: 'shaking-the-tree' },
        { libraryId: 'lets-dance' },
        { libraryId: 'open-awareness' },
      ],
      integration: [
        { libraryId: 'values-compass' },
        { libraryId: 'self-compassion' },
      ],
    },
    moderate: {
      preSession: [
        { libraryId: 'intention-setting-v2' },
      ],
      comeUp: [
        { libraryId: 'simple-grounding' },
        { libraryId: 'leaves-on-a-stream' },
        { libraryId: 'music-listening' },
      ],
      peak: [
        { libraryId: 'felt-sense' },
        { libraryId: 'shaking-the-tree' },
        { libraryId: 'lets-dance' },
        { libraryId: 'open-awareness' },
      ],
      integration: [
        { libraryId: 'values-compass' },
        { libraryId: 'self-compassion' },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // Open Exploration — balanced mix (current default)
  // ════════════════════════════════════════════════════════════
  open: {
    full: {
      preSession: [
        { libraryId: 'intention-setting-v2' },
        { libraryId: 'life-graph' },
        { libraryId: 'mapping-territory' },
      ],
      comeUp: [
        { libraryId: 'simple-grounding' },
        { libraryId: 'leaves-on-a-stream' },
        { libraryId: 'music-listening' },
      ],
      peak: [
        { libraryId: 'body-scan' },
        { libraryId: 'felt-sense' },
        { libraryId: 'shaking-the-tree' },
        { libraryId: 'lets-dance' },
        { libraryId: 'self-compassion' },
      ],
      integration: [
        { libraryId: 'values-compass' },
        { libraryId: 'open-awareness' },
      ],
    },
    moderate: {
      preSession: [
        { libraryId: 'intention-setting-v2' },
      ],
      comeUp: [
        { libraryId: 'simple-grounding' },
        { libraryId: 'leaves-on-a-stream' },
        { libraryId: 'music-listening' },
      ],
      peak: [
        { libraryId: 'felt-sense' },
        { libraryId: 'shaking-the-tree' },
        { libraryId: 'lets-dance' },
        { libraryId: 'self-compassion' },
      ],
      integration: [
        { libraryId: 'values-compass' },
        { libraryId: 'open-awareness' },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // Minimal — lightweight structure, no pre-session activities
  // ════════════════════════════════════════════════════════════
  minimal: {
    comeUp: [
      { libraryId: 'simple-grounding' },
    ],
    peak: [
      { libraryId: 'music-listening' },
      { libraryId: 'felt-sense' },
      { libraryId: 'lets-dance' },
    ],
    integration: [
      { libraryId: 'open-awareness' },
    ],
  },
};
