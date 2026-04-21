/**
 * Shared constants for the four transition configs.
 */

// Focus options for the synthesis transition's focus-edit step.
// Ids match intake (sectionB.js) so an updated focus can coexist with the
// original `sessionProfile.primaryFocus` using the same vocabulary. Labels
// are longer/more reflective than intake's terse labels — the transition
// moment warrants a softer phrasing.
export const FOCUS_OPTIONS = [
  { id: 'self-understanding', label: 'Understanding myself more deeply' },
  { id: 'healing',            label: "Processing something I've been carrying" },
  { id: 'relationship',       label: 'A relationship in my life' },
  { id: 'creativity',         label: 'Something creative or existential' },
  { id: 'open',               label: 'Staying open to what comes' },
];

// Relationship sub-type options — used both directly as FOCUS_SUBTYPES.relationship
// and by the standalone `relationship-type` detour on the keep-relationship path.
export const RELATIONSHIP_TYPES = [
  { id: 'romantic-current', label: 'Romantic partner (current)' },
  { id: 'romantic-past',    label: 'Romantic partner (past)' },
  { id: 'parent',           label: 'Parent' },
  { id: 'child',            label: 'Child' },
  { id: 'sibling',          label: 'Sibling' },
  { id: 'friend',           label: 'Friend' },
  { id: 'myself',           label: 'Myself' },
  { id: 'deceased',         label: 'Someone who has passed' },
  { id: 'other',            label: 'Other' },
];

// Per-focus sub-type selectors, revealed progressively in focus-edit after
// the user picks a main focus. Reflective — the value captured here is
// primarily for the user's own export/journal artifact, not gating downstream
// content.
export const FOCUS_SUBTYPES = {
  'self-understanding': [
    { id: 'a-pattern',   label: 'A pattern I keep seeing in myself' },
    { id: 'my-purpose',  label: 'My direction or purpose' },
    { id: 'my-history',  label: 'Something from my past' },
    { id: 'my-identity', label: 'Who I am at my core' },
    { id: 'open',        label: 'Something else' },
  ],
  'healing': [
    { id: 'grief',        label: 'Grief or loss' },
    { id: 'trauma',       label: 'An old wound' },
    { id: 'shame',        label: 'Self-criticism or shame' },
    { id: 'relationship', label: 'A relationship wound' },
    { id: 'open',         label: 'Something else' },
  ],
  'relationship': RELATIONSHIP_TYPES,
  'creativity': [
    { id: 'a-project', label: 'A specific project' },
    { id: 'a-block',   label: 'Something blocking me' },
    { id: 'a-vision',  label: 'A vision or image' },
    { id: 'meaning',   label: 'Meaning or existential questions' },
    { id: 'open',      label: 'Something else' },
  ],
  'open': [
    { id: 'curious',     label: 'Curious, listening for what arrives' },
    { id: 'surrendered', label: 'Trusting whatever comes' },
    { id: 'open',        label: 'Something else' },
  ],
};

// Maps primaryFocus IDs → user-facing labels (display-only). Kept in sync
// with intake's 5 ids. Legacy ids (processing/reconnecting) are intentionally
// absent — any archived session with those values will display the raw id.
export const FOCUS_LABELS = {
  'self-understanding': 'Self-understanding',
  'healing':            'Emotional healing',
  'relationship':       'Relationship exploration',
  'creativity':         'Creativity & insight',
  'open':               'Open exploration',
};
