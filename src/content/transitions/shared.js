/**
 * Shared constants for the four transition configs.
 */

// Focus options for the synthesis transition's focus-edit step
export const FOCUS_OPTIONS = [
  { id: 'self-understanding', label: 'Understanding myself more deeply' },
  { id: 'relationship', label: 'A relationship in my life' },
  { id: 'processing', label: "Processing something I've been carrying" },
  { id: 'reconnecting', label: 'Reconnecting with a part of myself' },
  { id: 'creativity', label: 'Something creative or existential' },
  { id: 'open', label: 'I want to stay open' },
];

// Relationship sub-type options
export const RELATIONSHIP_TYPES = [
  { id: 'romantic-current', label: 'Romantic partner (current)' },
  { id: 'romantic-past', label: 'Romantic partner (past)' },
  { id: 'parent', label: 'Parent' },
  { id: 'child', label: 'Child' },
  { id: 'sibling', label: 'Sibling' },
  { id: 'friend', label: 'Friend' },
  { id: 'myself', label: 'Myself' },
  { id: 'deceased', label: 'Someone who has passed' },
  { id: 'other', label: 'Other' },
];

// Maps primaryFocus IDs → user-facing labels (display-only)
export const FOCUS_LABELS = {
  'self-understanding': 'Self-understanding',
  'relationship': 'Relationship exploration',
  'healing': 'Emotional healing',
  'processing': 'Processing',
  'reconnecting': 'Reconnecting',
  'creativity': 'Creativity & insight',
  'open': 'Open exploration',
};
