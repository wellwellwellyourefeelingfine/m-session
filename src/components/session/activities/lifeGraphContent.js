/**
 * Life Graph Activity Content
 * Step definitions for the pre-session life graph exercise.
 *
 * Base flow (6 pages):
 * 0: Welcome / Framing
 * 1: Guided Entry — early life
 * 2: Guided Entry — later life
 * 3: Open Entry + Generate
 * 4: Reflection
 * 5: Check-in (branch point)
 * 6: Closing
 *
 * Optional "go deeper" branch (inserted between check-in and closing):
 * 5a: Noticing Patterns (journal)
 * 5b: What Wants Attention (journal)
 * 5c: Memory Lens (journal — cool-down)
 */

// Base step count (without journal branch) — for progress bar
export const BASE_STEP_COUNT = 7;

// Rating scale anchors
export const RATING_ANCHORS = {
  low: 'Struggling',
  high: 'Thriving',
};

// Total milestone soft maximum
export const MILESTONE_SOFT_MAX = 14;

// ─── Core steps (always shown) ──────────────────────────────────────────────

export const LIFE_GRAPH_STEPS = [
  // Step 0 — Welcome / Framing
  {
    id: 'welcome',
    type: 'welcome',
    content: {
      title: 'Life Graph',
      body: "Before your session, it can help to step back and look at your life from a distance. The goal is not to analyze deeply, just to see the shape of it.",
      bodySecondary: "You'll mark a few moments from your life and rate how you were doing at the time. From these moments, a simple trendline will give you a bird's eye view. And if you feel up to it, you'll then have the opportunity to think more on these moments and the general trend.",
    },
  },

  // Step 1 — First Guided Entry (early life)
  {
    id: 'guided-entry-1',
    type: 'guidedEntry',
    content: {
      title: 'Your First Moment',
      body: "Start with something from earlier in your life. A chapter, an event, a stretch of time. It can be as specific or as vague as you want. Give it a name and rate how you were doing.",
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
      body: "Now pick something further along, after your first entry. We're building forward in time so the graph tells a story.",
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
      title: 'Your Life Graph',
      body: 'Take a moment to look at the whole picture.',
      bodySecondary: "What you've drawn is a sketch, not a diagnosis. Every life has peaks and valleys. Sometimes the most meaningful growth happens in the low stretches, even if it didn't feel that way at the time.",
      bodyTertiary: 'If something catches your attention or surprises you, hold onto that. It might be worth exploring during your session.',
    },
  },

  // Step 5 — Check-in (branch point)
  {
    id: 'check-in',
    type: 'checkIn',
    content: {
      title: 'How Are You Sitting With This?',
      body: "You've looked at the shape of your life from a distance. Notice how that feels. You might feel curious, neutral, stirred up, or something you can't quite name.",
      bodySecondary: "If something on your graph caught your attention and you'd like to spend a few more minutes with it, you can.",
      bodyTertiary: "If you'd rather save that for your session, that works too. The point of this was to lay out the map so it's easier to find your way when the time comes.",
      deepenButton: "I'd like to reflect a bit more",
      closeButton: "That's enough for now",
    },
  },

  // Step 6 — Closing
  {
    id: 'closing',
    type: 'closing',
    content: {
      title: 'A Good Place to Pause',
      body: "Sometimes seeing the shape of your life, even roughly, shows you something you didn't notice from inside it.",
      bodySecondary: "You don't have to do anything with this right now. When your session begins, you may find that what came up here returns on its own.",
      bodyTertiary: 'Your life graph has been saved to your journal. You can review it there anytime.',
      bodyDeepened: "The patterns you noticed, the lenses, the things that pulled at you. You don't have to do anything with that right now. It's primed. When your session begins, this material may surface on its own, and with it a clearer sense of what wants your attention.",
      bodyDeepenedSecondary: 'Your life graph and reflections have been saved to your journal.',
    },
  },
];

// ─── Journal branch steps (inserted when user chooses "go deeper") ──────────

export const JOURNAL_BRANCH_STEPS = [
  // Journal 1 — Noticing Patterns
  {
    id: 'journal-patterns',
    type: 'journal',
    content: {
      title: 'What Do You Notice?',
      body: 'Look at the shape of your graph. Not the individual points, but the arc of it. The rises, the dips, the plateaus.',
      bodySecondary: "Patterns sometimes only become visible when you see everything at once. Certain stretches might cluster together. A transition might surprise you. The overall direction might not be what you expected.",
      bodyTertiary: "You don't need to explain any of it. Just notice.",
      prompt: 'What patterns or themes stand out to you?',
      placeholder: 'Any trends, surprises, or things that catch your eye...',
    },
  },

  // Journal 2 — What Wants Attention
  {
    id: 'journal-attention',
    type: 'journal',
    content: {
      title: "What's Pulling at You?",
      body: "When we map our lives, certain moments pull at us more than others. Not always the highest or lowest points. Sometimes it's a quiet stretch, a transition, or something you thought you were done thinking about.",
      bodySecondary: "You don't have to resolve anything here. Naming it is enough. Think of it as placing a bookmark that your session can return to if and when you're ready.",
      prompt: 'Is there a moment or period on your graph that feels like it wants more of your attention?',
      placeholder: 'Something that pulls at you, even gently...',
    },
  },

  // Journal 3 — Memory Lens (educational cool-down)
  {
    id: 'journal-lens',
    type: 'journal',
    content: {
      title: 'The Lens You\'re Looking Through',
      body: "When we look back on our lives, we never see them exactly as they were. Memory is constructive. It's shaped by how we feel now, what we've been told, and what we've had time to make sense of.",
      bodySecondary: "We smooth over some periods and sharpen others. A difficult year might look worse in hindsight than it felt at the time. A good one might glow brighter than it actually was. Both things can be true at once.",
      bodyTertiary: "During your session, you may find that MDMA lets you revisit some of these memories with less of a filter. Not to correct the record, but to see what else might be there.",
      prompt: 'Is there a period on your graph you might be remembering through a particular lens, rosier or darker than it actually was?',
      placeholder: 'A time that might look different from the inside...',
    },
  },
];
