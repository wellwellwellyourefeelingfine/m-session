/**
 * Lifestyle Reflection Content
 * Follow-up module: identify what to keep, what to change, and where to start.
 */

export const lifestyleReflectionContent = {
  instructions: 'A guided journaling exercise to identify what to keep, what to change, and where to start. Includes prompts about daily habits, routines, and the practical changes your session brought into focus.',
  screens: [
    {
      type: 'text',
      header: 'Lifestyle Reflection',
      lines: [
        'Sessions can make you want to change everything at once. The clarity about what is and is not working in your daily life can feel urgent.',
        '\u00a7',
        'But lasting change happens through small, deliberate adjustments, not dramatic overhauls. This reflection will help you identify what to focus on first.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'What in your daily life is already serving you well?',
      context: 'Before thinking about what to change, take a moment to notice what is already working. Routines, habits, or practices that support you, even if they are simple.',
      placeholder: 'What is working for me right now...',
    },
    {
      type: 'selector',
      prompt: 'What area of your life feels most ready for a change?',
      key: 'lifestyleArea',
      columns: 2,
      multiSelect: false,
      options: [
        { id: 'sleep', label: 'Sleep and rest' },
        { id: 'movement', label: 'Physical movement' },
        { id: 'diet', label: 'Diet and nutrition' },
        { id: 'work', label: 'Work and productivity' },
        { id: 'screens', label: 'Screen time and media' },
        { id: 'social', label: 'Social life' },
        { id: 'creative', label: 'Creative expression' },
        { id: 'other', label: 'Something else' },
      ],
      journal: {
        prompt: 'What specifically do you want to change in this area?',
        placeholder: 'What I want to change...',
        rows: 3,
      },
    },
    {
      type: 'prompt',
      prompt: 'Is there a boundary you need to set, adjust, or let go of?',
      context: 'Sessions often make it clearer where your boundaries are too rigid or too loose. Places where you give too much, tolerate too much, or hold too tightly to control.',
      placeholder: 'A boundary I need to change...',
    },
    {
      type: 'prompt',
      prompt: 'What is one specific habit you want to start, stop, or change?',
      context: 'Research on habit change suggests that starting with one small, specific change is more effective than attempting several at once. The neuroplasticity window after a session makes this an especially good time to begin.',
      placeholder: 'One thing I will do differently...',
    },
    {
      type: 'text',
      header: 'Small Changes, Real Impact',
      lines: [
        'The most effective lifestyle changes after a session are ones you can sustain without willpower. Instead of relying on motivation, attach the new behavior to something you already do.',
        '\u00a7',
        'If you want to meditate, do it right after brushing your teeth. If you want to move more, start with five minutes, not an hour.',
        '\u00a7',
        'The window after a session is a time when new patterns can form more easily. Use it for one thing, not everything.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'What routines, environments, or people help you stay on track when you are trying to make a change?',
      placeholder: 'What supports me...',
    },
    {
      type: 'text',
      header: 'Lifestyle Reflection',
      lines: [
        'The changes that stick after a session are usually the ones that feel obvious rather than ambitious.',
        '\u00a7',
        'Your reflections are saved in your journal. Come back to them in a week and see which changes you actually made. That will tell you more about what matters than anything you wrote today.',
      ],
    },
  ],
};
