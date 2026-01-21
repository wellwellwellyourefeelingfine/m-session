/**
 * Open Awareness Meditation
 *
 * A Vipassana-inspired guided meditation featuring:
 * - Sam Harris "Daily Meditation" style pointing instructions
 * - Variable duration (10-30 minutes) via expandable silence intervals
 * - Conditional prompts for longer sessions (20+ min)
 * - Pre-recorded TTS audio support
 *
 * Purpose: Rest in awareness itself; notice whatever arises without grasping;
 * recognize the nature of mind.
 *
 * Posture: Lying down on back or seated on cushion, eyes closed
 */

export const openAwarenessMeditation = {
  id: 'open-awareness',
  title: 'Open Awareness',
  subtitle: 'Vipassana-inspired',
  description: 'Rest in awareness itself. No technique, no effort — just noticing.',
  baseDuration: 600,   // 10 minutes in seconds
  minDuration: 600,    // 10 min
  maxDuration: 1800,   // 30 min
  durationSteps: [10, 15, 20, 25, 30],

  // Audio configuration
  audio: {
    basePath: '/audio/meditations/open-awareness/',
    format: 'mp3',
  },

  prompts: [
    // === OPENING (Fixed Duration) ===
    {
      id: 'opening-01',
      text: 'Find a comfortable position. You can lie down on your back, or sit on a cushion. Let your eyes close.',
      baseSilenceAfter: 8,
      silenceExpandable: false,
    },
    {
      id: 'opening-02',
      text: "Take a moment to settle. There's nothing you need to do right now. Nowhere to go. Nothing to figure out. Just rest here.",
      baseSilenceAfter: 10,
      silenceExpandable: false,
    },
    {
      id: 'opening-03',
      text: "Notice that you're already aware. Before you do anything, awareness is here. Sounds are appearing. Sensations are appearing. Thoughts may be appearing. And all of it is known.",
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 30,
    },

    // === ESTABLISHING PRESENCE (Moderate Expansion) ===
    {
      id: 'presence-01',
      text: 'Without trying to change anything, simply notice what\'s present in this moment.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'presence-02',
      text: "There may be sounds around you. Let them come and go. You don't need to push them away or hold onto them. They appear, and they pass.",
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 40,
    },
    {
      id: 'presence-03',
      text: 'There may be sensations in the body. Pressure. Temperature. Tingling. Stillness. Whatever is here — let it be here. Just notice.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 40,
    },
    {
      id: 'presence-04',
      text: "And there may be thoughts. Images, words, memories, plans. These too simply appear. You don't have to follow them anywhere. Just let them pass like clouds.",
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 45,
    },

    // === VISUAL FIELD & INNER SPACE ===
    {
      id: 'visual-field-01',
      text: 'Now bring your attention to the darkness behind your closed eyes. Just this. The simple fact of seeing — even with nothing to see.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 40,
    },
    {
      id: 'visual-field-02',
      text: "Notice that this darkness isn't quite empty. There may be subtle colors. Shapes. Textures. Faint patterns that arise and dissolve. The mind generating something out of nothing.",
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 35,
    },
    {
      id: 'visual-field-03',
      text: "You don't need to hold onto any of it. Let these visual impressions come and go. Like watching static on a screen that no one is controlling.",
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 45,
    },
    {
      id: 'visual-field-04',
      text: 'Notice the spaciousness here. Behind your eyelids, there\'s no boundary. No wall. No edge. Just openness.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 60,
    },
    {
      id: 'visual-field-05',
      text: 'Rest in this space. Not looking for anything. Not trying to see anything in particular. Just being.',
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 75,
    },
    {
      id: 'body-space-01',
      text: 'Now, while staying aware of this open visual field, also notice the space in your belly. The area around your diaphragm. Without changing your breath, just feel what\'s there.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 45,
    },
    {
      id: 'body-space-02',
      text: "There's a kind of inner volume here. A felt sense of space inside the body. Let your attention include both — the darkness behind the eyes, and this openness in the belly.",
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 60,
    },
    {
      id: 'body-space-03',
      text: "These aren't two separate things. It's all one field of experience. Seeing and feeling. Inside and outside. Just presence, knowing itself.",
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 90,
    },
    {
      id: 'body-space-04',
      text: 'Continue resting here. Nothing to do. Nowhere to go. Just this.',
      baseSilenceAfter: 30,
      silenceExpandable: true,
      silenceMax: 120,
    },

    // === THE CORE PRACTICE (High Expansion) ===
    {
      id: 'core-01',
      text: 'Now, rather than focusing on any particular object — the breath, a sound, a sensation — simply rest as the awareness in which all of this appears.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 60,
    },
    {
      id: 'core-02',
      text: "Notice: there's no effort required to be aware. Awareness is already the case. It's not something you do. It's what you are.",
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 60,
    },
    {
      id: 'core-03',
      text: "Thoughts will come. The moment you notice you've been thinking — that's awareness. That noticing is the practice. You're not trying to stop thoughts. You're simply recognizing what's already aware of them.",
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 75,
    },

    // === INQUIRY / POINTING INSTRUCTIONS (High Expansion) ===
    {
      id: 'inquiry-01',
      text: 'See if you can notice where attention seems to be located. Is there a sense of being somewhere? A feeling of being behind the eyes, or in the head?',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 45,
    },
    {
      id: 'inquiry-02',
      text: "Now look for the one who is looking. What is aware right now? Don't think about the answer — look directly.",
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 75,
    },
    {
      id: 'inquiry-03',
      text: "You may find that you can't locate a self as an object. There's experience — sensations, sounds, thoughts — but the one who experiences is strangely absent when you look for it. Just notice this.",
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 90,
    },
    {
      id: 'inquiry-04',
      text: 'Let everything be as it is. No meditator. No meditation. Just this open space of knowing.',
      baseSilenceAfter: 30,
      silenceExpandable: true,
      silenceMax: 120,
    },

    // === EXTENDED SILENCE PERIOD (Maximum Expansion) ===
    {
      id: 'silence-main',
      text: "I'll be quiet for a while now. Continue resting in awareness. Whatever appears — sensations, thoughts, feelings — just let it come and go on its own.",
      baseSilenceAfter: 60,
      silenceExpandable: true,
      silenceMax: 300, // Up to 5 minutes
    },

    // === MIDPOINT CHECK-IN (Only for 20+ minute sessions) ===
    {
      id: 'midpoint-01',
      text: "If you find you've been lost in thought for some time, that's fine. Just notice that you're back. This — right here — is the practice. Not maintaining some special state. Simply noticing what's present, again and again.",
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 60,
      conditional: { minDuration: 20 },
    },
    {
      id: 'midpoint-02',
      text: 'Continue as you were. Resting. Noticing. Nothing to achieve.',
      baseSilenceAfter: 90,
      silenceExpandable: true,
      silenceMax: 240, // Up to 4 minutes
      conditional: { minDuration: 20 },
    },

    // === CLOSING (Mostly Fixed) ===
    {
      id: 'closing-01',
      text: 'In the next minute or so, we\'ll bring this meditation to a close.',
      baseSilenceAfter: 8,
      silenceExpandable: false,
    },
    {
      id: 'closing-02',
      text: 'Take a moment to notice how you feel. Not judging it, just noticing.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'closing-03',
      text: "Whatever insights or feelings arose — or didn't arise — the practice was simply to be present. And you were.",
      baseSilenceAfter: 8,
      silenceExpandable: false,
    },
    {
      id: 'closing-04',
      text: "When you're ready, you can begin to move gently. Fingers. Toes. If you're lying down, perhaps roll to one side first. Take your time.",
      baseSilenceAfter: 10,
      silenceExpandable: false,
    },
    {
      id: 'closing-05',
      text: 'And whenever you\'re ready, let your eyes open. Welcome back.',
      baseSilenceAfter: 0,
      silenceExpandable: false,
    },
  ],
};
