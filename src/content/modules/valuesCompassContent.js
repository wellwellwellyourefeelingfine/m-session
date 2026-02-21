/**
 * Values Compass Module Content
 *
 * Static text, quadrant configurations, example chips, journaling prompts,
 * and closing content for the ACT Matrix exercise.
 */

// ─── Intro screens ──────────────────────────────────────────────────────────

export const INTRO_SCREENS = [
  {
    lines: [
      'This exercise helps you map the relationship between what you care about, what gets in the way, and how you actually move through your life.',
      '§',
      'It\u2019s based on the ACT Matrix, a tool for seeing your patterns clearly, without judgment.',
    ],
  },
  {
    header: 'The Four Areas',
    topLines: [
      'The ACT Matrix has four areas:',
      { title: 'Toward Moves', body: '(Top Right): The actions you take to move toward what is important.' },
      { title: 'Away Moves', body: '(Top Left): The things you do to move away from, or \u201Cfix,\u201D difficult feelings.' },
    ],
    schematic: 'quadrants-only',
    bottomLines: [
      { title: 'What Matters', body: '(Bottom Right): The people and values that are important to you deep down.' },
      { title: 'Inner Obstacles', body: '(Bottom Left): The difficult thoughts, feelings, and \u201Chooks\u201D that show up inside you.' },
    ],
  },
  {
    header: 'The Axes',
    topLines: [
      'We use two axes to map these areas:',
      { title: 'The Horizontal Axis', body: '(Away vs. Toward): This tracks the direction of your life. Are you moving away from discomfort, or toward what you care about?' },
    ],
    schematic: 'axes-only',
    bottomLines: [
      { title: 'The Vertical Axis', body: '(External vs. Inner): This separates your External Actions (what you do in the physical world) from your Inner Experience (what is happening inside your mind and heart).' },
    ],
  },
  {
    header: 'What Placement Means',
    lines: [
      'The closer an item is to the outer corners, the more \u201Cpull\u201D it has on your life.',
      '§',
      { title: 'What Matters:', body: 'Items in the far bottom-right are your deepest internal values and the most powerful \u201CNorth Stars\u201D for moving you toward the life you want.' },
      '§',
      { title: 'Inner Obstacles:', body: 'Items in the far bottom-left are your core hooks\u2014the oldest, deepest internal stories that most strongly push you toward defensive reactions.' },
      '§',
      { title: 'Away Moves:', body: 'Items in the far top-left are your strongest avoidance habits, representing significant energy spent trying to escape discomfort.' },
      '§',
      { title: 'Toward Moves:', body: 'Items in the far top-right are your boldest actions, representing moments where you are most actively living out your values.' },
    ],
    showKeyTip: true,
  },
  {
    header: 'The Big Picture',
    topLines: [
      'We\u2019ll start in the bottom right corner (What Matters) and work our way clockwise.',
    ],
    schematic: 'full',
    bottomLines: [
      'By the end of this exercise, you\u2019ll have built a personalized ACT Matrix that you can fine tune before it is saved to your journal.',
    ],
  },
];

// ─── Quadrant configurations ────────────────────────────────────────────────

export const QUADRANT_ORDER = ['q1', 'q2', 'q3', 'q4'];

export const QUADRANT_CONFIG = {
  q1: {
    id: 'q1',
    title: 'What matters to you?',
    subtitle: 'What Matters',
    prompt: 'Not what should matter. Not what looks good. What actually pulls at you when you\u2019re honest with yourself.',
    position: 'bottom-right',
    gradientOrigin: '0% 0%',
    borderEdges: ['left', 'top'],
    minItems: 2,
    examples: [
      'Connection',
      'Honesty',
      'Family',
      'Freedom',
      'Creativity',
      'Growth',
      'Courage',
      'Health',
      'Adventure',
      'Contribution',
      'Intimacy',
      'Independence',
      'Curiosity',
      'Kindness',
      'Meaning',
      'Playfulness',
      'Presence',
      'Loyalty',
      'Justice',
      'Beauty',
      'Truth',
      'Authenticity',
      'Love',
    ],
    transition: 'Look at what you chose. Sit with it for a moment.',
  },
  q2: {
    id: 'q2',
    title: 'When you think about living by what matters to you, what shows up inside that pulls you away?',
    subtitle: 'What Gets in the Way',
    prompt: 'Feelings, thoughts, fears, old stories. The stuff that makes it hard.',
    position: 'bottom-left',
    gradientOrigin: '100% 0%',
    borderEdges: ['right', 'top'],
    minItems: 1,
    examples: [
      'Fear of being judged',
      'Not being enough',
      'Shame',
      'Overwhelm',
      'Anger',
      'Loneliness',
      'Fear of failure',
      'Guilt',
      'Exhaustion',
      'Fear of rejection',
      'Grief',
      'Self-doubt',
      'Feeling like a fraud',
      'Fear of being seen',
      'Emptiness',
      'Anxiety about the future',
      'Old hurt',
      'Distrust',
      'Perfectionism',
      'Fear of losing control',
    ],
    transition: 'That\u2019s the inner landscape. Now let\u2019s look at what happens next: what you actually do when this stuff shows up.',
  },
  q3: {
    id: 'q3',
    title: 'When those feelings and thoughts take over, what do you actually do?',
    subtitle: 'What You Do When Hooked',
    prompt: 'No judgment here. Just honest recognition. These are the moves you make when you\u2019re trying to get away from what hurts.',
    position: 'top-left',
    gradientOrigin: '100% 100%',
    borderEdges: ['right', 'bottom'],
    minItems: 1,
    examples: [
      'Withdraw from people',
      'Scroll / numb out',
      'Overwork',
      'People-please',
      'Procrastinate',
      'Shut down emotionally',
      'Lash out',
      'Avoid difficult conversations',
      'Stay busy',
      'Overthink / ruminate',
      'Drink or use substances',
      'Say yes when I mean no',
      'Isolate',
      'Seek reassurance',
      'Control everything',
      'Go quiet',
      'Criticize myself',
      'Criticize others',
      'Abandon what I started',
      'Pretend everything\u2019s fine',
    ],
    transition: 'That takes honesty. Now, the other direction.',
  },
  q4: {
    id: 'q4',
    title: 'If you could act from what matters, instead of from what scares you, what would that look like?',
    subtitle: 'What You\u2019d Do Instead',
    prompt: 'Specific is good. Not grand resolutions. Real moves you could actually make.',
    position: 'top-right',
    gradientOrigin: '0% 100%',
    borderEdges: ['left', 'bottom'],
    minItems: 1,
    emphasizeAdd: true,
    examples: [
      'Have the hard conversation',
      'Set a boundary',
      'Ask for help',
      'Show up even when scared',
      'Make time for what I love',
      'Be honest about how I feel',
      'Reach out to someone I miss',
      'Say no without apologizing',
      'Start the thing I\u2019ve been avoiding',
      'Take care of my body',
      'Let someone see the real me',
      'Leave what isn\u2019t working',
      'Spend less time performing',
      'Rest without guilt',
      'Create something',
      'Listen more',
      'Forgive myself',
      'Forgive someone else',
      'Trust the process',
      'Take one small step',
    ],
    transition: 'You\u2019ve mapped four parts of your inner life. Let\u2019s put them together.',
  },
};

// ─── Matrix reveal ──────────────────────────────────────────────────────────

export const REVEAL_CONTENT = {
  title: 'Your matrix is ready.',
  lines: [
    'Everything you named, arranged together for the first time.',
  ],
  buttonLabel: 'Reveal My Matrix',
};

// ─── Journaling screens ─────────────────────────────────────────────────────

export const JOURNALING_SCREENS = [
  {
    id: 'noticing',
    title: 'What did you notice when you saw the full picture?',
    prompt: 'A connection, a gap, a pattern, something surprising. Whatever stood out first.',
    placeholder: 'What stood out to you...',
    required: false,
  },
  {
    id: 'toward-move',
    title: 'Look at your toward moves, the top-right of your matrix.',
    prompt: 'Pick the one that feels most alive right now. The one your body responds to.\n\nWhat would it look like to actually do this in the next week?',
    placeholder: 'One toward move, made real...',
    required: false,
  },
  {
    id: 'compassion',
    title: 'The left side of your matrix isn\u2019t a failure. It\u2019s what you\u2019ve been doing to survive.',
    prompt: 'Is there anything you want to say to yourself about those patterns?',
    placeholder: 'What you want to say to yourself...',
    required: false,
    skippable: true,
  },
];

// ─── Closing ────────────────────────────────────────────────────────────────

export const CLOSING_CONTENT = {
  lines: [
    'Your matrix is saved in your journal.',
    '§',
    'Values aren\u2019t something you find once and keep forever. They\u2019re a direction you face, sometimes clearly, sometimes in the dark.',
    '§',
    'The toward-moves are always available to you.',
  ],
};

// ─── Matrix axis labels ─────────────────────────────────────────────────────

export const AXIS_LABELS = {
  left: 'away',
  right: 'toward',
  top: 'external actions',
  bottom: 'inner experience',
};

// ─── Quadrant labels for the full matrix ────────────────────────────────────

export const QUADRANT_LABELS = {
  q1: 'What Matters',
  q2: 'Inner Obstacles',
  q3: 'Away Moves',
  q4: 'Toward Moves',
};
