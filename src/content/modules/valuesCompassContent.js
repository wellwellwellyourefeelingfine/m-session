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
      'This exercise is designed to give you clarity on the forces that drive your behavior.',
      '§',
      { title: '1:', body: 'We\u2019ll explain the ACT Matrix.' },
      { title: '2:', body: 'We\u2019ll guide you through developing your own personalized matrix.' },
      { title: '3:', body: 'We\u2019ll end with some journaling to help draw out insights and integrate them into your life.' },
      '§',
      'By mapping your inner world against your outer actions, you stop reacting to discomfort and start building a life of intention.',
    ],
  },
  {
    header: 'The Four Areas',
    spaced: true,
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
    spaced: true,
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

// ─── Observer Self interstitial ──────────────────────────────────────────────

export const OBSERVER_SELF_CONTENT = {
  lines: [
    'Everything in your matrix. What matters, what gets in the way, what you do on both sides.',
    '\u00a7',
    'There\u2019s a you at the center of it.',
    '\u00a7',
    'The one who chose what matters. The one who feels what gets in the way. The one who gets to decide what comes next.',
  ],
};

// ─── Journaling screens ─────────────────────────────────────────────────────

export const JOURNALING_SCREENS = [
  {
    id: 'first-impression',
    title: 'What did you notice when you saw the full picture?',
    prompt: 'A connection, a gap, a pattern, something surprising. Whatever came up first.',
    placeholder: 'What stood out to you...',
    visual: 'compass',
  },
  {
    id: 'stuck-loop',
    title: 'The Loop on the Left',
    prompt: 'Inner stuff shows up \u2014 fear, doubt, old stories. You do something to get away from it. It helps for a while. Then the inner stuff comes back.\n\nThis is a loop. Everybody has them. It only becomes a problem when you can\u2019t step out of it.\n\nLook at the left side of your matrix. Do you recognize this pattern? Is it working?',
    placeholder: 'What you notice about the loop...',
    visual: 'stuck-loop',
  },
  {
    id: 'vital-loop',
    title: 'The Loop on the Right',
    prompt: 'This side works differently. When you act from what matters, it feeds the connection back. The things you care about become clearer. The moves become easier to see.\n\nThis loop doesn\u2019t need the inner stuff to go away first. It runs alongside it.',
    placeholder: 'What this brings up for you...',
    visual: 'vital-loop',
  },
  {
    id: 'tension',
    title: 'The Away Moves Have a Cost',
    prompt: 'Time and energy spent on the left side is time and energy not spent on the right. Not because you\u2019re failing \u2014 because that\u2019s how the system works.\n\nWhen you look at your matrix, which side has been getting more of your life lately?',
    placeholder: 'What you see when you look at both sides...',
    visual: 'tension',
  },
  {
    id: 'toward-move',
    title: 'One Toward Move',
    prompt: 'Look at the top-right of your matrix \u2014 the toward moves.\n\nPick the one that feels most alive right now. The one your body responds to.\n\nWhat would it look like to actually do this in the next week? Be specific. Not the grand version \u2014 the real one.',
    placeholder: 'One toward move, made real...',
    visual: 'toward-focus',
  },
  {
    id: 'compassion',
    title: 'The Left Side Isn\u2019t a Failure',
    prompt: 'Everything on the left side of your matrix \u2014 the fear, the avoidance, the loops \u2014 those are things you learned to do to protect yourself.\n\nThey made sense at some point. Some of them still do.\n\nIs there anything you want to say to yourself about those patterns?',
    placeholder: 'What you want to say to yourself...',
    visual: 'compassion-focus',
  },
  {
    id: 'wholeness',
    title: 'This Is Your Whole Picture',
    prompt: 'Both sides. The toward and the away. The things that matter and the things that make it hard. The loops and the moves.\n\nNone of it needs to be fixed right now. You mapped it. You see it clearly. That\u2019s not a small thing.',
    placeholder: 'Anything you want to hold onto from what you\u2019ve seen...',
    visual: 'wholeness',
  },
  {
    id: 'message-from-here',
    title: 'Write Something to Yourself From This Place',
    prompt: 'Right now, you\u2019re seeing yourself clearly. That doesn\u2019t always happen.\n\nWhatever you want to remember, about who you are, what matters, what you\u2019re ready to do, or what you need to hear again on a harder day, write it here.',
    placeholder: 'A message from you, to you...',
    visual: 'compass',
  },
];

// ─── Closing ────────────────────────────────────────────────────────────────

export const CLOSING_CONTENT = {
  lines: [
    'Your matrix is saved in your journal.',
    '§',
    'Values aren\u2019t something you find once and keep forever. They\u2019re a direction you face, sometimes clearly, sometimes in the dark.',
    '§',
    'The toward moves are always available to you.',
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
