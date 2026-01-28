/**
 * Peak Transition Content
 * Step definitions and body sensation options for the come-up → peak transition
 */

export const BODY_SENSATIONS = [
  { id: 'warmth', label: 'Warmth' },
  { id: 'tingling', label: 'Tingling' },
  { id: 'openness', label: 'Openness' },
  { id: 'lightness', label: 'Lightness' },
  { id: 'energy', label: 'Energy' },
  { id: 'softness', label: 'Softness' },
  { id: 'heaviness', label: 'Heaviness' },
  { id: 'stillness', label: 'Stillness' },
  { id: 'expansion', label: 'Expansion' },
];

export const UNNAMED_SENSATION = {
  id: 'unnamed',
  label: "Something I can't name",
};

export const PEAK_TRANSITION_STEPS = [
  {
    id: 'arrived',
    content: {
      label: 'Transition',
      title: "You've Arrived",
      body: "As you enter this new state, know that you don't need to figure anything out right now.",
      bodySecondary: "Let the experience unfold.",
      bodyTertiary: "Be open to what arises.",
      bodyQuaternary: "Curious about thoughts and feelings.",
      useGrayForExtras: true,
    },
  },
  {
    id: 'one-word',
    content: {
      label: 'Capture',
      title: 'One Word',
      body: "If you could name what you're feeling right now in a single word, what would it be?",
      footer: "This is just for you. You can look back on it later.",
      isOneWord: true,
    },
  },
  {
    id: 'body-sensation',
    content: {
      label: 'Check In',
      title: "What's Present in Your Body?",
      body: "Notice what sensations are here right now. You don't need to change anything—just notice.",
      instruction: "Tap any that resonate.",
      isBodySensation: true,
    },
  },
  {
    id: 'reassurance',
    content: {
      label: 'Reassurance',
      title: 'Tune In',
      body: "The intensity of this moment can be surprising.",
      bodySecondary:
        "Some people feel a rush of energy or emotion. Others feel a quiet shift. Some feel uncertain.",
      bodyTertiary: "All of this is normal. You don't need to manage it or make it different.",
      bodyQuaternary:
        "You're safe, and if it feels like a lot, know that it will soon settle into something workable.",
    },
  },
  {
    id: 'unfold',
    content: {
      label: 'Guidance',
      title: 'Let It Unfold',
      body: "Your body might want to move—to stretch, shake, curl up, or dance. Or it might want complete stillness.",
      bodySecondary: "Follow what feels right.",
    },
  },
  {
    id: 'ready',
    content: {
      label: 'Ready',
      title: 'Begin Next Phase',
      body: "Take a few sips of water if you haven't already.",
      bodySecondary: "When you're ready, we'll move into the next phase of your session.",
      isReady: true,
    },
  },
];

// Post-transition now uses TransitionBuffer component (diamond + quote)
// These constants are no longer used but kept for reference
export const POST_TRANSITION_TEXT = "Trust what arises.";
export const POST_TRANSITION_DURATION = 3500; // 3.5 seconds
