/**
 * Mapping the Territory Content
 * Pre-session educational module — 17 screens
 * Based on Bill Richards, Sacred Knowledge (Columbia University Press, 2015)
 *
 * Screen types: text, journal, choice
 * 17 user-facing screens for progress bar calculation.
 */

// User-facing step count — for progress bar
export const PROGRESS_STEPS = 17;

export const SCREEN_TYPES = {
  TEXT: 'text',
  JOURNAL: 'journal',
  CHOICE: 'choice',
};

// Screen 7 — coping pattern options
export const COPING_PATTERN_OPTIONS = [
  { id: 'push-away', label: 'I push it away and stay busy' },
  { id: 'think-through', label: 'I try to think my way through it' },
  { id: 'freeze', label: 'I freeze up or go numb' },
  { id: 'overwhelm', label: 'I let myself feel it but it overwhelms me' },
  { id: 'depends', label: 'It depends on the situation' },
];

// Screen 13 — approach style options
export const APPROACH_STYLE_OPTIONS = [
  { id: 'specific', label: 'I have something specific I want to work through' },
  { id: 'general-open', label: 'I have a general sense of what needs attention but want to stay open' },
  { id: 'experience-led', label: 'I want to let the experience lead entirely' },
  { id: 'not-sure', label: 'I\u2019m honestly not sure yet' },
];

/**
 * Screen definitions — 17 content screens
 * Each screen has: id, type, label, title, showAnimation, body[], and type-specific fields
 */
export const MAPPING_SCREENS = [
  // ─── Screen 1: Opening ─────────────────────────────────────────
  {
    id: 'opening',
    type: SCREEN_TYPES.TEXT,
    label: 'Preparation',
    title: 'Before You Go In',
    showAnimation: false,
    showMusic: false,
    body: [
      'This module is about orienting yourself before a session. Not rules. Not warnings. Just a map.',
      'Psychedelic researcher Bill Richards spent decades guiding people through altered states. His book Sacred Knowledge is one of the most important works on the therapeutic use of psychedelics, drawing on over fifty years of clinical research. Much of what follows is informed by his insights.',
      'One of his core principles: preparation isn\u2019t about controlling what happens. It\u2019s about being less surprised by it.',
    ],
    link: {
      text: 'Sacred Knowledge: Psychedelics and Religious Experiences \u2014 Columbia University Press',
      url: 'https://cup.columbia.edu/book/sacred-knowledge/9780231174077',
    },
  },

  // ─── Screen 2 ──────────────────────────────────────────────────
  {
    id: 'no-two-sessions',
    type: SCREEN_TYPES.TEXT,
    label: 'Preparation',
    title: 'No Two Sessions Are Alike',
    showAnimation: true,
    showMusic: false,
    body: [
      'There\u2019s no such thing as \u201Cthe MDMA experience.\u201D There are many different kinds of experience that can happen within a single session.',
      'Some are emotional. Some are physical. Some are quietly profound. Some are difficult. Most sessions contain several of these.',
      'Knowing the territory ahead of time won\u2019t change what happens. But it can change how you respond to it.',
    ],
  },

  // ─── Screen 3: Domain 1 — Personal Material ───────────────────
  {
    id: 'personal-material',
    type: SCREEN_TYPES.TEXT,
    label: 'The Territory',
    title: 'Personal Material',
    showAnimation: true,
    showMusic: false,
    body: [
      'The most common territory with MDMA is personal and relational. Memories, relationships, unfinished emotional business.',
      'Things you haven\u2019t let yourself feel. Conversations you never had. Moments from childhood you haven\u2019t thought about in years. Grief you set aside because life kept moving.',
      'MDMA tends to invite this material forward rather than force it. Early researchers described it as making inner exploration feel approachable rather than overwhelming.',
    ],
  },

  // ─── Screen 4: Domain 2 — The Body ────────────────────────────
  {
    id: 'the-body',
    type: SCREEN_TYPES.TEXT,
    label: 'The Territory',
    title: 'The Body',
    showAnimation: true,
    showMusic: false,
    body: [
      'Your body will be an active participant.',
      'Warmth, tingling, jaw tension, waves of physical release. But also subtler things: the way your chest opens when something emotional lands, the way tension shows up in your shoulders or stomach before your mind has caught up.',
      'A lot of important information during a session comes through the body first, not through thoughts.',
    ],
  },

  // ─── Screen 5: Domain 3 — Difficult Passages ─────────────────
  {
    id: 'difficult-passages',
    type: SCREEN_TYPES.TEXT,
    label: 'The Territory',
    title: 'Difficult Passages',
    showAnimation: false,
    showMusic: false,
    body: [
      'Not everything that arises will feel good.',
      'Sadness, fear, shame, anger, physical discomfort, even moments of emptiness or confusion. These are not signs that something has gone wrong. They\u2019re some of the most therapeutically valuable parts of a session.',
      'One thing that makes MDMA unique: it tends to create a kind of distance between you and your difficult emotions. You can see them clearly without being swallowed by them. Grief can be present without being annihilating. Fear can surface without triggering panic. This window of clarity is one of the most therapeutically powerful aspects of the substance.',
      'Richards called difficult experiences \u201Cuninvited guests.\u201D His advice was simple: greet them. With MDMA, you\u2019re better equipped to do that than you might expect.',
    ],
  },

  // ─── Screen 6: Key Principle — Toward, Not Away ───────────────
  {
    id: 'toward-not-away',
    type: SCREEN_TYPES.TEXT,
    label: 'The Territory',
    title: 'Toward, Not Away',
    showAnimation: true,
    showMusic: false,
    body: [
      'The single most important thing to understand about working with difficult material:',
      'Move toward it, not away from it.',
      'When fear arises, the instinct is to distract, resist, or analyze. But the things that frighten us during a session tend to lose their power when we face them directly. Richards compared them to kids in Halloween masks. The game is up once you step closer.',
    ],
  },

  // ─── Screen 7: [Choice] Your Patterns ─────────────────────────
  {
    id: 'your-patterns',
    type: SCREEN_TYPES.CHOICE,
    label: 'Check In',
    title: 'Your Patterns',
    showAnimation: false,
    showMusic: false,
    body: [
      'When something emotionally difficult comes up in everyday life, what\u2019s your usual response?',
    ],
    captureField: 'copingPattern',
    footer: 'There\u2019s no wrong answer. This is just about noticing your default. During the session, you\u2019ll have a chance to try something different.',
  },

  // ─── Screen 8: Domain 4 — Expanded States ─────────────────────
  {
    id: 'expanded-states',
    type: SCREEN_TYPES.TEXT,
    label: 'The Territory',
    title: 'Expanded States',
    showAnimation: true,
    showMusic: false,
    body: [
      'MDMA can also open into experiences of deep connection, love, or clarity that feel larger than your ordinary sense of self.',
      'Profound compassion. A sense that everything is fundamentally okay. Feeling connected to people, to life itself, in a way that\u2019s hard to put into words.',
      'These aren\u2019t hallucinations or delusions. Researchers have found that experiences like these are among the most meaningful events people report across their entire lives.',
    ],
  },

  // ─── Screen 9: Domain 5 — The Space Between ───────────────────
  {
    id: 'space-between',
    type: SCREEN_TYPES.TEXT,
    label: 'The Territory',
    title: 'The Space Between',
    showAnimation: true,
    showMusic: false,
    body: [
      'A lot of a session isn\u2019t dramatic at all.',
      'Quiet stretches. Listening to music and not thinking much. Feeling peaceful. Noticing small things with unusual clarity. Drifting.',
      'These periods aren\u2019t wasted time. They\u2019re often when the deepest integration is happening beneath the surface. You don\u2019t need to be \u201Cworking on something\u201D every minute.',
    ],
  },

  // ─── Screen 10: [Journal] What's Been Asking for Attention ────
  {
    id: 'asking-for-attention',
    type: SCREEN_TYPES.JOURNAL,
    label: 'Reflection',
    title: 'What\u2019s Been Asking for Attention',
    showAnimation: false,
    showMusic: false,
    body: [
      'Before a session, it can help to gently notice what\u2019s already alive in you. Not to set an agenda, but to acknowledge what\u2019s present.',
    ],
    prompt: 'Is there anything in your life right now that\u2019s been quietly asking for your attention? A feeling, a relationship, an unresolved question?',
    placeholder: 'Whatever comes to mind...',
    captureField: 'askingForAttention',
    footer: 'You don\u2019t need to come in with a plan. Sometimes the most important material isn\u2019t what you expected.',
  },

  // ─── Screen 11: Trust — Your Psyche Is Intelligent ────────────
  {
    id: 'psyche-intelligent',
    type: SCREEN_TYPES.TEXT,
    label: 'Trust',
    title: 'Your Psyche Is Intelligent',
    showAnimation: true,
    showMusic: false,
    body: [
      'One of Richards\u2019 deepest convictions, after guiding hundreds of sessions: if something comes into consciousness during a session, it means you\u2019re ready to deal with it.',
      'Your mind won\u2019t surface anything you\u2019re not capable of meeting. If it comes to you, that\u2019s the invitation.',
      'This doesn\u2019t mean it will be easy. It means you can trust the process.',
    ],
  },

  // ─── Screen 12: Trust — You Don't Need to Make Anything Happen
  {
    id: 'dont-force',
    type: SCREEN_TYPES.TEXT,
    label: 'Trust',
    title: 'You Don\u2019t Need to Make Anything Happen',
    showAnimation: true,
    showMusic: false,
    body: [
      'There\u2019s a common anxiety before sessions: \u201CWhat if nothing happens?\u201D or \u201CWhat if I do it wrong?\u201D',
      'You can\u2019t do it wrong. Your only job is to stay open and be willing to be with whatever shows up. You don\u2019t need to chase insights, manufacture emotions, or perform your own healing.',
      'The medicine does its part. You do yours by paying attention.',
    ],
  },

  // ─── Screen 13: [Choice] How Do You Want to Approach This ─────
  {
    id: 'approach-style',
    type: SCREEN_TYPES.CHOICE,
    label: 'Check In',
    title: 'How Do You Want to Approach This?',
    showAnimation: false,
    showMusic: false,
    body: [
      'People enter sessions with different orientations. Which feels closest to yours right now?',
    ],
    captureField: 'approachStyle',
    footer: 'All of these are valid. Even if you have a specific intention, be willing to let the session take you somewhere unexpected.',
  },

  // ─── Screen 14: Practical — Music ─────────────────────────────
  {
    id: 'music',
    type: SCREEN_TYPES.TEXT,
    label: 'Practical',
    title: 'Music Will Do a Lot of the Work',
    showAnimation: false,
    showMusic: true,
    body: [
      'The Hopkins psilocybin studies treat music as a co-therapist, not background noise. The same principle applies here.',
      'Have your music ready before you begin. Choose something without lyrics for the peak hours. Let it be emotionally spacious. Classical, ambient, or instrumental works well.',
      'When you notice yourself resisting a piece of music, try staying with it. The resistance itself is sometimes where the work is.',
    ],
    hasMusicRecommendations: true,
    musicFooter: 'This app includes several music-focused activities with curated recommendations. You can browse the full list anytime using the music button in the control panel.',
  },

  // ─── Screen 15: Trust — Words Come Later ──────────────────────
  {
    id: 'words-come-later',
    type: SCREEN_TYPES.TEXT,
    label: 'Trust',
    title: 'Words Come Later',
    showAnimation: true,
    showMusic: true,
    body: [
      'Some of what you experience won\u2019t make sense in the moment. Some of it won\u2019t translate into language at all.',
      'That\u2019s normal. Richards spent his career wrestling with the limits of language in describing these states. The understanding often arrives days or weeks later, not during the session.',
      'Don\u2019t pressure yourself to narrate or interpret your experience in real time. Just be in it.',
    ],
  },

  // ─── Screen 16: [Journal] A Word to Yourself ──────────────────
  {
    id: 'word-to-self',
    type: SCREEN_TYPES.JOURNAL,
    label: 'Reflection',
    title: 'A Word to Yourself',
    showAnimation: false,
    showMusic: true,
    body: [
      'Last thing before we close this out.',
    ],
    prompt: 'Write one sentence to yourself that you want to carry into the session. A reminder, a permission, a small act of courage.',
    placeholder: 'What I want to remember...',
    captureField: 'wordToSelf',
  },

  // ─── Screen 17: Closing ───────────────────────────────────────
  {
    id: 'closing',
    type: SCREEN_TYPES.TEXT,
    label: 'Complete',
    title: 'That\u2019s the Map',
    showAnimation: true,
    showMusic: true,
    isClosing: true,
    body: [
      'The territory will be your own. No map can fully prepare you for what\u2019s yours to discover.',
      'But now you have a rough orientation: personal material may surface, your body will be part of the conversation, difficult passages are valuable rather than dangerous, and you can trust what arises.',
      'The rest is between you and the experience.',
    ],
  },
];
