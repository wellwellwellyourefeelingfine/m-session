/**
 * Timeline Configurations
 * Defines module compositions for each focus + guidance level combination.
 *
 * Structure:
 *   TIMELINE_CONFIGS[focus][guidanceLevel] = { comeUp, peak, integration }
 *   TIMELINE_CONFIGS.minimal              = { comeUp, peak, integration }
 *
 * Each phase array contains module specs: { libraryId, duration }
 * Linked modules add: { linkedGroup, linkedRole }
 */

export const TIMELINE_CONFIGS = {
  // ════════════════════════════════════════════════════════════
  // Self-Understanding — values, patterns, inner parts
  // ════════════════════════════════════════════════════════════
  'self-understanding': {
    full: {
      preSession: [
        { libraryId: 'intention-setting', duration: 5 },
        { libraryId: 'life-graph', duration: 5 },
        { libraryId: 'mapping-territory', duration: 10 },
      ],
      comeUp: [
        { libraryId: 'simple-grounding', duration: 5 },
        { libraryId: 'leaves-on-a-stream', duration: 10 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      peak: [
        { libraryId: 'body-scan', duration: 10 },
        { libraryId: 'felt-sense', duration: 12 },
        { libraryId: 'music-listening', duration: 20 },
        { libraryId: 'self-compassion', duration: 11 },
      ],
      integration: [
        { libraryId: 'values-compass', duration: 25 },
        { libraryId: 'open-awareness', duration: 15 },
      ],
    },
    moderate: {
      preSession: [
        { libraryId: 'intention-setting', duration: 5 },
      ],
      comeUp: [
        { libraryId: 'simple-grounding', duration: 5 },
        { libraryId: 'leaves-on-a-stream', duration: 10 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      peak: [
        { libraryId: 'felt-sense', duration: 12 },
        { libraryId: 'music-listening', duration: 20 },
        { libraryId: 'self-compassion', duration: 11 },
      ],
      integration: [
        { libraryId: 'values-compass', duration: 25 },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // Emotional Healing — self-compassion, processing, release
  // ════════════════════════════════════════════════════════════
  healing: {
    full: {
      preSession: [
        { libraryId: 'intention-setting', duration: 5 },
        { libraryId: 'life-graph', duration: 5 },
        { libraryId: 'mapping-territory', duration: 10 },
      ],
      comeUp: [
        { libraryId: 'simple-grounding', duration: 5 },
        { libraryId: 'leaves-on-a-stream', duration: 10 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      peak: [
        { libraryId: 'body-scan', duration: 10 },
        { libraryId: 'self-compassion', duration: 11 },
        { libraryId: 'shaking-the-tree', duration: 15 },
        { libraryId: 'music-listening', duration: 20 },
        { libraryId: 'stay-with-it', duration: 15 },
      ],
      integration: [
        { libraryId: 'protector-dialogue-p1', duration: 25, linkedGroup: 'protector', linkedRole: 'part1' },
        { libraryId: 'music-listening', duration: 20 },
        { libraryId: 'protector-dialogue-p2', duration: 30, linkedGroup: 'protector', linkedRole: 'part2' },
        { libraryId: 'values-compass', duration: 25 },
      ],
    },
    moderate: {
      preSession: [
        { libraryId: 'intention-setting', duration: 5 },
      ],
      comeUp: [
        { libraryId: 'simple-grounding', duration: 5 },
        { libraryId: 'leaves-on-a-stream', duration: 10 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      peak: [
        { libraryId: 'body-scan', duration: 10 },
        { libraryId: 'self-compassion', duration: 11 },
        { libraryId: 'shaking-the-tree', duration: 15 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      integration: [
        { libraryId: 'protector-dialogue-p1', duration: 25, linkedGroup: 'protector', linkedRole: 'part1' },
        { libraryId: 'music-listening', duration: 20 },
        { libraryId: 'protector-dialogue-p2', duration: 30, linkedGroup: 'protector', linkedRole: 'part2' },
        { libraryId: 'values-compass', duration: 25 },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // Relationship Exploration — attachment, EFT linked pair
  // ════════════════════════════════════════════════════════════
  relationship: {
    full: {
      preSession: [
        { libraryId: 'intention-setting', duration: 5 },
        { libraryId: 'mapping-territory', duration: 10 },
      ],
      comeUp: [
        { libraryId: 'simple-grounding', duration: 5 },
        { libraryId: 'leaves-on-a-stream', duration: 10 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      peak: [
        { libraryId: 'body-scan', duration: 10 },
        { libraryId: 'self-compassion', duration: 11 },
        { libraryId: 'lets-dance', duration: 20 },
        { libraryId: 'the-descent-p1', duration: 25, linkedGroup: 'descent-cycle', linkedRole: 'part1' },
      ],
      integration: [
        { libraryId: 'the-cycle-p2', duration: 25, linkedGroup: 'descent-cycle', linkedRole: 'part2' },
        { libraryId: 'felt-sense', duration: 12 },
        { libraryId: 'music-listening', duration: 20 },
      ],
    },
    moderate: {
      preSession: [
        { libraryId: 'intention-setting', duration: 5 },
      ],
      comeUp: [
        { libraryId: 'simple-grounding', duration: 5 },
        { libraryId: 'leaves-on-a-stream', duration: 10 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      peak: [
        { libraryId: 'self-compassion', duration: 11 },
        { libraryId: 'lets-dance', duration: 20 },
        { libraryId: 'the-descent-p1', duration: 25, linkedGroup: 'descent-cycle', linkedRole: 'part1' },
      ],
      integration: [
        { libraryId: 'the-cycle-p2', duration: 25, linkedGroup: 'descent-cycle', linkedRole: 'part2' },
        { libraryId: 'music-listening', duration: 20 },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // Creativity & Insight — open flow, embodiment, play
  // ════════════════════════════════════════════════════════════
  creativity: {
    full: {
      preSession: [
        { libraryId: 'intention-setting', duration: 5 },
        { libraryId: 'life-graph', duration: 5 },
        { libraryId: 'mapping-territory', duration: 10 },
      ],
      comeUp: [
        { libraryId: 'simple-grounding', duration: 5 },
        { libraryId: 'leaves-on-a-stream', duration: 10 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      peak: [
        { libraryId: 'body-scan', duration: 10 },
        { libraryId: 'felt-sense', duration: 12 },
        { libraryId: 'shaking-the-tree', duration: 15 },
        { libraryId: 'lets-dance', duration: 20 },
        { libraryId: 'open-awareness', duration: 15 },
      ],
      integration: [
        { libraryId: 'values-compass', duration: 25 },
        { libraryId: 'self-compassion', duration: 11 },
      ],
    },
    moderate: {
      preSession: [
        { libraryId: 'intention-setting', duration: 5 },
      ],
      comeUp: [
        { libraryId: 'simple-grounding', duration: 5 },
        { libraryId: 'leaves-on-a-stream', duration: 10 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      peak: [
        { libraryId: 'felt-sense', duration: 12 },
        { libraryId: 'shaking-the-tree', duration: 15 },
        { libraryId: 'lets-dance', duration: 20 },
        { libraryId: 'open-awareness', duration: 15 },
      ],
      integration: [
        { libraryId: 'values-compass', duration: 25 },
        { libraryId: 'self-compassion', duration: 11 },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // Open Exploration — balanced mix (current default)
  // ════════════════════════════════════════════════════════════
  open: {
    full: {
      preSession: [
        { libraryId: 'intention-setting', duration: 5 },
        { libraryId: 'life-graph', duration: 5 },
        { libraryId: 'mapping-territory', duration: 10 },
      ],
      comeUp: [
        { libraryId: 'simple-grounding', duration: 5 },
        { libraryId: 'leaves-on-a-stream', duration: 10 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      peak: [
        { libraryId: 'body-scan', duration: 10 },
        { libraryId: 'felt-sense', duration: 12 },
        { libraryId: 'shaking-the-tree', duration: 15 },
        { libraryId: 'lets-dance', duration: 20 },
        { libraryId: 'self-compassion', duration: 11 },
      ],
      integration: [
        { libraryId: 'values-compass', duration: 25 },
        { libraryId: 'open-awareness', duration: 15 },
      ],
    },
    moderate: {
      preSession: [
        { libraryId: 'intention-setting', duration: 5 },
      ],
      comeUp: [
        { libraryId: 'simple-grounding', duration: 5 },
        { libraryId: 'leaves-on-a-stream', duration: 10 },
        { libraryId: 'music-listening', duration: 20 },
      ],
      peak: [
        { libraryId: 'felt-sense', duration: 12 },
        { libraryId: 'shaking-the-tree', duration: 15 },
        { libraryId: 'lets-dance', duration: 20 },
        { libraryId: 'self-compassion', duration: 11 },
      ],
      integration: [
        { libraryId: 'values-compass', duration: 25 },
        { libraryId: 'open-awareness', duration: 15 },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // Minimal — lightweight structure, no pre-session activities
  // ════════════════════════════════════════════════════════════
  minimal: {
    comeUp: [
      { libraryId: 'simple-grounding', duration: 5 },
    ],
    peak: [
      { libraryId: 'music-listening', duration: 20 },
      { libraryId: 'felt-sense', duration: 12 },
      { libraryId: 'lets-dance', duration: 20 },
    ],
    integration: [
      { libraryId: 'open-awareness', duration: 15 },
    ],
  },
};
