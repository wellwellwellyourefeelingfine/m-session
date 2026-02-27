/**
 * Life Graph Activity Content
 * Step definitions for the pre-session life graph exercise.
 *
 * 7 user-facing pages:
 * 0: Welcome / Framing
 * 1: Guided Milestone — Childhood
 * 2: Guided Milestone — Young Adult Years
 * 3: Open Entry Mode
 * 4: Review & Generate
 * 5: Reflection
 * 6: Closing
 */

// User-facing step count — for progress bar
export const PROGRESS_STEPS = 7;

// Rating scale anchors
export const RATING_ANCHORS = {
  low: 'Struggling',
  high: 'Thriving',
};

// Soft maximum for open-entry milestones (14 total including guided)
export const OPEN_ENTRY_SOFT_MAX = 12;

// Step definitions
export const LIFE_GRAPH_STEPS = [
  // Step 0 — Welcome / Framing
  {
    id: 'welcome',
    type: 'welcome',
    content: {
      title: 'Life Graph',
      body: "Before your session, it can help to step back and look at your life from a distance — not to analyze anything, just to see the shape of it.",
      bodySecondary: "In this activity, you'll mark a few moments from your life and rate how you were doing at the time. At the end, you'll see it all as a single picture.",
    },
  },

  // Step 1 — Guided Milestone: Childhood
  {
    id: 'guided-childhood',
    type: 'guidedMilestone',
    content: {
      title: 'Childhood',
      defaultLabel: 'Childhood',
      body: 'Think back to your childhood, roughly ages 5 to 12. How would you rate your overall well-being during that time?',
      notePrompt: 'A few words about this time (optional)',
    },
  },

  // Step 2 — Guided Milestone: Young Adult Years
  {
    id: 'guided-young-adult',
    type: 'guidedMilestone',
    content: {
      title: 'Young Adult Years',
      defaultLabel: 'Young Adult Years',
      body: 'Now think about your late teens and early twenties. How were you doing?',
      notePrompt: 'A few words about this time (optional)',
    },
  },

  // Step 3 — Open Entry Mode
  {
    id: 'open-entry',
    type: 'openEntry',
    content: {
      title: 'Add Your Own',
      body: "Add as many or as few moments as you'd like. These can be life chapters, specific events, or anything that stands out.",
      placeholder: 'e.g., College years, First real job, Year everything changed...',
      notePrompt: 'A few words (optional)',
      addButton: 'Add Another',
      doneButton: "I'm Done",
      softMaxMessage: "That's a good amount. You can always revisit this later.",
    },
  },

  // Step 4 — Review & Generate
  {
    id: 'review',
    type: 'review',
    content: {
      title: "Let's See What You've Drawn",
      body: "Here's what you've mapped so far. Tap any entry to adjust it, or go ahead and create your graph.",
      buttonLabel: 'Create My Life Graph',
    },
  },

  // Step 5 — Reflection
  {
    id: 'reflection',
    type: 'reflection',
    content: {
      title: 'The Shape of a Life',
      body: 'Take a moment to look at the whole picture.',
      bodySecondary: "What you've drawn is a sketch, not a diagnosis. Every life has valleys. Every life has peaks. Sometimes the most meaningful growth happens in the low stretches, even if it didn't feel that way at the time.",
      bodyTertiary: 'If something on this graph catches your attention, or surprises you, hold onto that. It might be worth sitting with during your session.',
    },
  },

  // Step 6 — Closing
  {
    id: 'closing',
    type: 'closing',
    content: {
      title: "That's Enough",
      body: "Your life is more than any line can hold. But sometimes seeing the shape of it, even roughly, can show you something you didn't notice from inside it.",
      bodySecondary: 'Your life graph has been saved to your journal. You can pull it up anytime using the graph button in the bottom bar.',
    },
  },
];
