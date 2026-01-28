/**
 * Tailored Integration Activities
 * Content definitions for the 6 focus-based activities in the integration transition
 */

export const TAILORED_ACTIVITIES = {
  relationship: {
    id: 'letter',
    title: "A Letter You Don't Have to Send",
    instructions: "Write to them as if they could truly hear you.",
    instructionsSecondary: "You don't have to send this. You don't have to show anyone. This is just for you—a way to understand what you really want to say.",
    salutationPlaceholder: "Dear...",
    mainPlaceholder: "What I want you to know...",
    prompts: [
      "What I've never told you...",
      "What I wish you understood...",
      "What I see now that I couldn't see before...",
      "What I need from you...",
      "What I want to give you...",
    ],
    journalTag: 'integration-letter',
  },

  'self-understanding': {
    id: 'dialogue',
    title: 'A Conversation With Yourself',
    instructions: "Sometimes clarity comes from letting different parts of yourself speak.",
    instructionsSecondary: "This is a conversation between two perspectives within you—the part that questions and the part that knows. Let them talk to each other.",
    voice1Label: "The part that asks",
    voice1Placeholder: "What I want to understand...",
    voice2Label: "The part that knows",
    voice2Placeholder: "What I sense is true...",
    closingPrompt: "Read what you wrote. What do you notice?",
    closingPlaceholder: "What I notice...",
    journalTag: 'integration-dialogue',
  },

  processing: {
    id: 'release-keep',
    title: 'What Stays, What Goes',
    instructions: "Processing isn't about fixing everything. It's about sorting—recognizing what you're ready to let go of, and what you're choosing to carry forward.",
    instructionsSecondary: "Take your time with this.",
    releaseTitle: "What I'm Ready to Release",
    releaseDescription: "Old stories, beliefs that no longer serve, weight you've been carrying that isn't yours.",
    releasePlaceholder: "I'm ready to let go of...",
    keepTitle: "What I'm Keeping",
    keepDescription: "Lessons learned, strength earned, truths that are yours.",
    keepPlaceholder: "I'm choosing to hold onto...",
    closingPrompt: "Look at what you wrote. How does it feel to name these things?",
    closingPlaceholder: "It feels...",
    journalTag: 'integration-release-keep',
  },

  healing: {
    // Uses same activity as processing
    id: 'release-keep',
    title: 'What Stays, What Goes',
    instructions: "Processing isn't about fixing everything. It's about sorting—recognizing what you're ready to let go of, and what you're choosing to carry forward.",
    instructionsSecondary: "Take your time with this.",
    releaseTitle: "What I'm Ready to Release",
    releaseDescription: "Old stories, beliefs that no longer serve, weight you've been carrying that isn't yours.",
    releasePlaceholder: "I'm ready to let go of...",
    keepTitle: "What I'm Keeping",
    keepDescription: "Lessons learned, strength earned, truths that are yours.",
    keepPlaceholder: "I'm choosing to hold onto...",
    closingPrompt: "Look at what you wrote. How does it feel to name these things?",
    closingPlaceholder: "It feels...",
    journalTag: 'integration-release-keep',
  },

  reconnecting: {
    id: 'reclaiming',
    title: "What You're Reclaiming",
    instructions: "Disconnection happens slowly—pieces of ourselves get lost, set aside, forgotten. Reconnection is about calling those pieces home.",
    instructionsSecondary: "What have you found again today?",
    prompts: [
      {
        question: "What part of yourself are you reclaiming?",
        placeholder: "I'm reclaiming...",
      },
      {
        question: "What feels like the essence of being you—the core that can't be lost, only forgotten?",
        placeholder: "The essence of me is...",
      },
      {
        question: "What do you want to prioritize in your life going forward?",
        placeholder: "What matters most now is...",
      },
    ],
    journalTag: 'integration-reclaiming',
  },

  creativity: {
    id: 'vision-meaning',
    title: 'What You Saw, What It Means',
    instructions: "Existential exploration often produces images, impressions, patterns—things that don't always translate directly into language.",
    instructionsSecondary: "Try to capture what came through, even if it feels incomplete or strange.",
    sections: [
      {
        title: 'The Vision',
        question: "What did you see, sense, or encounter? Describe it as you would a dream—images, symbols, feelings, fragments.",
        placeholder: "What I encountered...",
        large: true,
      },
      {
        title: 'The Meaning',
        question: "What might it mean? Don't try to be certain—just let your intuition speak.",
        placeholder: "What I sense this means...",
      },
      {
        title: 'The Question',
        question: "What question does this leave you with?",
        placeholder: "The question I'm left with...",
        small: true,
      },
    ],
    journalTag: 'integration-vision-meaning',
  },

  open: {
    id: 'open-reflection',
    title: 'What Came Through',
    instructions: "You stayed open, without a fixed agenda. That takes trust.",
    instructionsSecondary: "Even without a specific focus, something usually emerges. Let's capture what's here.",
    prompts: [
      {
        question: "What stands out from this experience? What moments, realizations, or feelings do you want to remember?",
        placeholder: "What stands out...",
      },
      {
        question: "Was there anything surprising—something you didn't expect to encounter?",
        placeholder: "What surprised me...",
      },
      {
        question: "If this experience was trying to show you something, what might it be?",
        placeholder: "What I was shown...",
      },
    ],
    journalTag: 'integration-open-reflection',
  },
};

// Helper to get activity by focus
export function getActivityForFocus(focus) {
  return TAILORED_ACTIVITIES[focus] || TAILORED_ACTIVITIES.open;
}
