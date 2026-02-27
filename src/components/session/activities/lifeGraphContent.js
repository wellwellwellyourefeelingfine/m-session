/**
 * Life Graph Activity Content
 * Step definitions for the pre-session life graph exercise.
 *
 * 6 user-facing pages:
 * 0: Welcome / Framing
 * 1: Guided Entry — early life
 * 2: Guided Entry — later life
 * 3: Open Entry + Generate
 * 4: Reflection
 * 5: Closing
 */

// User-facing step count — for progress bar
export const PROGRESS_STEPS = 6;

// Rating scale anchors
export const RATING_ANCHORS = {
  low: 'Struggling',
  high: 'Thriving',
};

// Total milestone soft maximum
export const MILESTONE_SOFT_MAX = 14;

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

  // Step 1 — First Guided Entry (early life)
  {
    id: 'guided-entry-1',
    type: 'guidedEntry',
    content: {
      title: 'Your First Moment',
      body: "Start with something from earlier in your life — a chapter, event, or time that stands out. It can be as specific or as vague as you'd like. Give it a name and rate how you were doing.",
      notePrompt: 'A few words (optional)',
      examples: ['Childhood', 'Early school years', 'Growing up', 'Family life', 'Teenage years', 'First memories'],
    },
  },

  // Step 2 — Second Guided Entry (later life)
  {
    id: 'guided-entry-2',
    type: 'guidedEntry',
    content: {
      title: 'Your Next Moment',
      body: "Now think of a time further along — something that came after your first entry. We're building forward in time, so your graph will tell a story.",
      notePrompt: 'A few words (optional)',
      examples: ['College years', 'First real job', 'A turning point', 'Moving away', 'Recent years', 'Last year'],
    },
  },

  // Step 3 — Open Entry + Generate
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
      generateButton: 'Create My Life Graph',
      softMaxMessage: "That's a good amount. You can always revisit this later.",
    },
  },

  // Step 4 — Reflection
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

  // Step 5 — Closing
  {
    id: 'closing',
    type: 'closing',
    content: {
      title: "That's Enough",
      body: "Your life is more than any line can hold. But sometimes seeing the shape of it, even roughly, can show you something you didn't notice from inside it.",
      bodySecondary: 'Your life graph has been saved to your journal. You can review it there anytime.',
    },
  },
];
