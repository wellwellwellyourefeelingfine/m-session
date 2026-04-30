/**
 * Pendulation Module — All Screen Content
 *
 * Pre-education intro screens, sensation vocabulary, checkpoint options,
 * adaptive post-meditation debrief (psychoeducation + journaling + choice),
 * and closing screen content.
 *
 * Framework: Somatic Experiencing (Peter Levine)
 */

// ─── Accent Terms ───────────────────────────────────────────────────────────

export const ACCENT_TERMS = {
  island_of_safety: 'island of safety',
  pendulation: 'pendulation',
  completion_signals: 'completion signals',
  thwarted_response: 'thwarted response',
  trauma_vortex: 'trauma vortex',
  healing_vortex: 'healing vortex',
  slow_completion: 'Slow completion',
};

// ─── Pre-Education Screens ───────────────────────────────────────────────────

export const INTRO_SCREENS = [
  {
    id: 'what-is-this',
    type: 'text',
    label: 'Preparation',
    title: 'Somatic Experiencing',
    showAnimation: true,
    body: [
      'This practice is based on the work of Peter Levine, who spent over forty years studying how the body processes stress and trauma.',
      'His core observation: when we go through overwhelming experiences, our bodies begin a survival response, a push, a brace, an urge to run, and something interrupts it before it can complete. That unfinished response stays stored in the nervous system. Sometimes for years.',
      'This practice helps your body finish what it started.',
    ],
  },
  {
    id: 'how-it-works',
    type: 'text',
    label: 'Preparation',
    title: 'How It Works',
    showAnimation: true,
    body: [
      'You will be guided to find a place in your body that feels calm or neutral. Levine calls this an \u201c{island_of_safety}.\u201d This becomes your home base for the practice.',
      'Then you will bring to mind something mildly activating and notice where it shows up physically. Not the story. The sensation.',
    ],
  },
  {
    id: 'how-it-works-2',
    type: 'text',
    label: 'Preparation',
    title: 'How It Works',
    showAnimation: true,
    body: [
      'The core of the practice is moving your attention slowly back and forth between these two places. Calm, and activation. Safety, and charge. This oscillation is called {pendulation}. It is the mechanism through which the nervous system releases stored energy.',
    ],
  },
  {
    id: 'space-setup',
    type: 'text',
    label: 'Preparation',
    title: 'Your Space',
    showAnimation: true,
    body: [
      'This practice may involve slow, gentle physical movement. Your body might want to push, reach, curl up, stretch out, or press your feet against something solid.',
      'If possible, give yourself room to move freely. A yoga mat or blanket on the floor works well. A pillow or cushion nearby can be helpful.',
      'Nothing strenuous will happen. But having space to follow your body\u2019s impulses, if they come, makes a real difference.',
    ],
  },
  {
    id: 'what-to-expect',
    type: 'text',
    label: 'Preparation',
    title: 'What to Expect',
    showAnimation: true,
    body: [
      'The meditation will guide you through the core pendulation practice, then pause and ask how you are feeling. Your answer shapes what comes next.',
      'If your body is showing you movements it wants to complete, the meditation will continue with guidance for following those impulses. If you feel settled, it will move to closing.',
      'Some sessions will be quiet. The pendulation itself is the practice, and that is always enough. Other sessions may go deeper. Both are valuable. There is no target to reach.',
    ],
  },
];

// ─── Checkpoint Options ──────────────────────────────────────────────────────

export const CHECKPOINT_1_OPTIONS = [
  { id: 'settled',   label: 'Settled. Something shifted or softened.',           route: 'd' },
  { id: 'move',      label: 'My body wants to move or do something.',            route: 'b' },
  { id: 'activated', label: 'Still activated. Energy that hasn\u2019t resolved.', route: 'b' },
  { id: 'frozen',    label: 'Heavy, still, or frozen. Hard to move.',            route: 'c' },
  { id: 'unsure',    label: 'Not sure. I need some time.',                       route: 'd' },
];

export const CHECKPOINT_2_OPTIONS = [
  { id: 'released',   label: 'Something completed. I feel a release or settling.', route: 'd' },
  { id: 'processing', label: 'Still processing, but I feel okay.',                 route: 'd' },
  { id: 'frozen',     label: 'I feel stuck, heavy, or unable to move.',            route: 'c' },
  { id: 'shaky',      label: 'I feel shaky or stirred up.',                        route: 'bGround' },
];

// ─── Debrief: Core (always shown, 5 screens) ────────────────────────────────

export const DEBRIEF_CORE = [
  {
    id: 'what-you-practiced',
    type: 'text',
    label: 'Reflection',
    title: 'What You Just Practiced',
    showAnimation: true,
    body: [
      'By moving your attention back and forth between activation and safety, you gave your nervous system room to process stored energy at its own pace.',
      'Each cycle of pendulation teaches your body something fundamental: that it can approach the difficult thing and come back. That it does not have to stay locked in one place.',
    ],
  },
  {
    id: 'journal-island',
    type: 'journal',
    label: 'Reflection',
    title: 'Your Island of Safety',
    showAnimation: true,
    body: [
      'The resource you found in your body is not just a meditation technique. It is a real place in your nervous system that you can return to anytime.',
    ],
    prompt: 'Where was it? What did it feel like? If you gave it a word, write it down.',
    placeholder: 'The location, the word, the quality of it...',
    captureField: 'islandOfSafety',
    footer: 'Remembering this place in detail strengthens your access to it.',
  },
  {
    id: 'completion-signals',
    type: 'text',
    label: 'Reflection',
    title: 'Completion Signals',
    showAnimation: true,
    body: [
      'During or after the practice, you may have noticed spontaneous shifts in your body. A deep breath. Trembling or shaking. Warmth spreading. Tears. A sigh. A wave of tiredness.',
      'In somatic experiencing, these are called {completion_signals}. They mean that stored survival energy is discharging. They are healthy.',
      'If nothing dramatic happened, that is equally valid. Some processing happens quietly, beneath conscious awareness. You may notice shifts in the hours or days ahead.',
    ],
  },
  {
    id: 'completion-signals-checkin',
    type: 'multiSelect',
    label: 'Check In',
    title: 'What Did You Notice?',
    showAnimation: false,
    body: [
      'Did any of these show up during or after the practice? Tap any that apply.',
    ],
    options: [
      { id: 'deep-breath',     label: 'A deep, spontaneous breath' },
      { id: 'trembling',       label: 'Trembling or shaking' },
      { id: 'warmth',          label: 'Warmth spreading' },
      { id: 'tears',           label: 'Tears' },
      { id: 'tiredness',       label: 'A wave of tiredness' },
      { id: 'tingling',        label: 'Tingling or buzzing' },
      { id: 'lightness',       label: 'A sense of lightness' },
      { id: 'emotional-wave',  label: 'A wave of emotion' },
      { id: 'nothing-obvious', label: 'Nothing obvious' },
    ],
    captureField: 'completionSignals',
    footer: 'All of these are normal. So is noticing nothing at all.',
  },
  {
    id: 'journal-pendulation',
    type: 'journal',
    label: 'Reflection',
    title: 'The Pendulation',
    showAnimation: true,
    body: [
      'Take a moment to describe what happened as you moved between the two places in your body.',
    ],
    prompt: 'What did you notice as you moved back and forth?',
    placeholder: 'Did the activation soften, move, stay the same? What was it like to come back to your resource?',
    captureField: 'pendulationExperience',
  },
];

// ─── Debrief: Fight/Flight (conditional, 4 screens) ─────────────────────────

export const DEBRIEF_FIGHT_FLIGHT = [
  {
    id: 'thwarted-response',
    type: 'text',
    label: 'Going Deeper',
    title: 'What Your Body Was Finishing',
    showAnimation: false,
    body: [
      'When you followed that impulse to move, you were allowing your nervous system to complete a survival response that was interrupted at some point in the past.',
      'The push, the pull, the brace, the turn: that movement was not random. In somatic experiencing, this is called a {thwarted_response}. A motor plan that your body initiated but had to suppress, with the energy behind it remaining stored, waiting for a chance to complete.',
      'By following it slowly, you allowed your nervous system to register that the response actually happened this time.',
    ],
  },
  {
    id: 'journal-movement',
    type: 'journal',
    label: 'Going Deeper',
    title: 'The Movement',
    showAnimation: true,
    body: [
      'Your body showed you something it wanted to do.',
    ],
    prompt: 'What did your body want to do?',
    placeholder: 'The direction, the impulse, what it felt like to follow it...',
    captureField: 'survivalMovement',
  },
  {
    id: 'why-slow',
    type: 'text',
    label: 'Going Deeper',
    title: 'Why Slow Matters',
    showAnimation: true,
    body: [
      'When a survival response completes at full speed, the nervous system may not register that it actually happened. The body needs enough time to feel each part of the movement, to sense the strength in the push, the power in the legs, the act of turning away.',
      '{slow_completion} tells the nervous system: this response is real. It happened. You are no longer stuck.',
    ],
  },
  {
    id: 'discharge-checkin',
    type: 'choice',
    label: 'Going Deeper',
    title: 'Discharge',
    showAnimation: false,
    body: [
      'If you experienced trembling, shaking, heat, or involuntary movement, that was your nervous system discharging stored energy.',
      'Animals in the wild do exactly this after escaping a threat. They shake, and then they return to normal. Humans have the same mechanism. We just tend to suppress it. MDMA reduces that suppression, which is why this kind of release can happen more naturally here.',
    ],
    question: 'Did anything feel like it completed or resolved?',
    options: [
      { id: 'yes-clear',    label: 'Yes, something clearly finished' },
      { id: 'yes-subtle',   label: 'Maybe. Something shifted but I\u2019m not sure' },
      { id: 'still-moving', label: 'It still feels like it\u2019s in process' },
      { id: 'not-sure',     label: 'I\u2019m not sure' },
    ],
    captureField: 'dischargeCompletion',
    footer: 'All of these are fine. Completion doesn\u2019t always announce itself in the moment.',
  },
];

// ─── Debrief: Freeze (conditional, 5 screens) ───────────────────────────────

export const DEBRIEF_FREEZE = [
  {
    id: 'about-freeze',
    type: 'text',
    label: 'The Freeze',
    title: 'What You Experienced',
    showAnimation: true,
    animationType: 'diamond',
    body: [
      'That heaviness, that stillness, that difficulty moving, is one of the most ancient and powerful survival responses in the animal kingdom.',
      'When the nervous system determines that fighting and running are both impossible, it shuts down. It goes still. It numbs. This response reduces pain, conserves energy, and in nature, can cause a predator to lose interest.',
      'The freeze response is not weakness. It is not giving up. It is an intelligent, automatic strategy that your body deployed because it was the best option available at the time.',
    ],
  },
  {
    id: 'freeze-not-chosen',
    type: 'text',
    label: 'The Freeze',
    title: 'This Is Not Something You Chose',
    showAnimation: true,
    animationType: 'diamond',
    body: [
      'Many people carry shame about freeze responses. There is a common belief that the right thing to do in a threatening situation is to fight or run, and that freezing means you failed.',
      'That belief is wrong. The freeze response is activated automatically by the oldest part of your nervous system, below the level of conscious decision-making. You did not choose to freeze, and you could not have chosen differently.',
    ],
  },
  {
    id: 'journal-freeze',
    type: 'journal',
    label: 'The Freeze',
    title: 'The Stillness',
    showAnimation: true,
    body: [
      'Take a moment with what you experienced.',
    ],
    prompt: 'What was the heaviness or stillness like? Where did you feel it? What was it like to be inside it?',
    placeholder: 'The quality of it, where it lived, what it felt like...',
    captureField: 'freezeExperience',
    footer: 'Writing about freeze can help it settle. But if you\u2019d rather not, skip this.',
  },
  {
    id: 'the-thaw',
    type: 'text',
    label: 'The Freeze',
    title: 'The Thaw',
    showAnimation: true,
    animationType: 'diamond',
    body: [
      'When you began moving your fingers and toes, when you found the edges of the stillness and let movement slowly return, your nervous system was coming back online gradually. In somatic experiencing, this is called a titrated thaw: the freeze dissolving at a pace your body can handle, rather than all at once.',
      'If you felt a rush of emotion, sudden energy, or shaking as the freeze lifted, that was the activation underneath the stillness finally being allowed to move. It can feel intense. It means something real shifted.',
      'One of the most important things this practice can do is help you experience that your body has options. That movement is available to you now. That the freeze was then, and this is now.',
    ],
  },
  {
    id: 'thaw-checkin',
    type: 'choice',
    label: 'The Freeze',
    title: 'Coming Back',
    showAnimation: true,
    body: [
      'As movement returned, what was most present?',
    ],
    options: [
      { id: 'relief',       label: 'Relief' },
      { id: 'emotion',      label: 'A rush of emotion' },
      { id: 'energy',       label: 'Sudden energy or restlessness' },
      { id: 'warmth',       label: 'Warmth returning to my body' },
      { id: 'grief',        label: 'Sadness or grief' },
      { id: 'quiet-shift',  label: 'A quiet, subtle shift' },
      { id: 'not-sure',     label: 'Hard to put into words' },
    ],
    captureField: 'thawExperience',
    hasJournal: true,
    journalPrompt: 'If you want to say more, or if there\u2019s something you want to say to yourself about what happened:',
    journalPlaceholder: 'Optional...',
    journalCaptureField: 'freezeReflection',
  },
];

// ─── Debrief: Closing (always shown, 3 screens) ─────────────────────────────

export const DEBRIEF_CLOSING = [
  {
    id: 'two-vortices',
    type: 'text',
    label: 'Understanding',
    title: 'Two Vortices',
    showAnimation: true,
    body: [
      'Whenever you approach a traumatic experience, two things are always present simultaneously: the pull toward overwhelm, and something life-affirming nearby.',
      'In somatic experiencing, these are described as two vortices. A {trauma_vortex}, which pulls toward fear and helplessness. And a {healing_vortex}, which pulls toward safety and aliveness. They always form together.',
      'Your island of safety is the healing vortex. Pendulation uses its pull to prevent you from being swallowed by the trauma vortex, drawing off the stored energy a little at a time.',
    ],
  },
  {
    id: 'between-sessions',
    type: 'text',
    label: 'Integration',
    title: 'Between Sessions',
    showAnimation: true,
    body: [
      'Pendulation does not require MDMA. It works anytime you notice activation in your body. Find your resource. Find the activation. Move between them. That\u2019s the whole practice.',
      'The days and weeks after a session are often when the most integration happens. Pay attention to moments when your body feels different, when old reactions lose some of their charge. Those are signs the processing is continuing on its own.',
    ],
  },
  {
    id: 'journal-before-after',
    type: 'journal',
    label: 'Integration',
    title: 'Before and After',
    showAnimation: true,
    body: [
      'One last thing. Noticing the difference between where you started and where you are now helps the nervous system consolidate what it learned.',
    ],
    prompt: 'What feels different now? What stayed the same? Anything you want to remember or return to?',
    placeholder: 'What shifted, what stayed, what surprised you...',
    captureField: 'beforeAfter',
    footer: 'You can return to this module anytime. Each session may find a different layer.',
  },
];

// ─── Closing Screen ──────────────────────────────────────────────────────────

export const CLOSING_CONTENT = {
  title: 'Pendulation',
  body: 'Your body knows how to heal. You just gave it room.',
  footer: {
    default: 'This practice builds over time. Each session strengthens your nervous system\u2019s capacity to self-regulate.',
    deep: 'You went deep today. Be gentle with yourself in the hours ahead.',
  },
  attribution: 'This module is based on Somatic Experiencing, developed by Peter A. Levine, PhD.',
  resources: [
    {
      text: 'Healing Trauma: A Pioneering Program for Restoring the Wisdom of Your Body',
      url: 'https://www.amazon.com/Healing-Trauma-Pioneering-Program-Restoring/dp/159179658X',
      note: 'Levine\u2019s self-guided workbook with 12 audio exercises. The most accessible entry point for continuing this work on your own.',
    },
    {
      text: 'Waking the Tiger: Healing Trauma',
      url: 'https://www.amazon.com/Waking-Tiger-Healing-Peter-Levine/dp/155643233X',
      note: 'The foundational text on how the body processes and releases trauma.',
    },
  ],
};
