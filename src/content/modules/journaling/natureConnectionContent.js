/**
 * Nature & Connection Content
 * Follow-up module: explore how your relationship to the natural world has shifted.
 */

export const natureConnectionContent = {
  screens: [
    {
      type: 'text',
      header: 'Nature & Connection',
      lines: [
        'Many people report that after a session, the natural world feels different. Colors are more vivid, the sound of wind or water carries more weight, and the boundary between self and environment feels thinner.',
        '\u00a7',
        'This is not imagination. Sessions can recalibrate how the nervous system processes sensory information, making the natural world register more deeply.',
        '\u00a7',
        'This reflection will help you explore that connection and consider how to sustain it.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'Has the natural world felt different to you since your session?',
      context: 'Think about the last time you were outside since your session. It could be a walk, standing in a doorway, or looking out a window.',
      placeholder: 'What I have been noticing...',
    },
    {
      type: 'selector',
      prompt: 'What element of the natural world feels most alive to you right now?',
      key: 'natureElement',
      columns: 2,
      multiSelect: true,
      options: [
        { id: 'trees', label: 'Trees and forests' },
        { id: 'water', label: 'Water and oceans' },
        { id: 'sky', label: 'Sky and weather' },
        { id: 'animals', label: 'Animals and wildlife' },
        { id: 'earth', label: 'Soil and earth' },
        { id: 'plants', label: 'Plants and flowers' },
        { id: 'mountains', label: 'Mountains or open land' },
        { id: 'stars', label: 'Night sky and stars' },
      ],
      journal: {
        prompt: 'What is it about this that draws you?',
        placeholder: 'What draws me to this...',
        rows: 3,
      },
    },
    {
      type: 'prompt',
      prompt: 'Was there a moment of connection with nature during or after your session that stayed with you?',
      context: 'Sessions can make a single encounter with nature feel significant. A bird outside the window at the right moment. The texture of bark under your hand. Rain on your face.',
      placeholder: 'A moment I remember...',
    },
    {
      type: 'text',
      header: 'The Oldest Medicine',
      lines: [
        'Long before psychedelics were synthesized in laboratories, plant medicines were used within natural settings by cultures around the world. The relationship between psychedelic experience and the natural world is not incidental.',
        '\u00a7',
        'Research on forest bathing, nature exposure, and outdoor therapy consistently shows that time in nature reduces cortisol, lowers inflammation, and improves mood.',
        '\u00a7',
        'After a session, when the nervous system is still recalibrating, nature provides a regulating environment that supports the integration process without requiring effort.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'Has your relationship to the environment or the planet shifted since your session?',
      context: 'Some people find that sessions shift their awareness of environmental issues, consumption habits, or their sense of responsibility toward the natural world.',
      placeholder: 'How I think about the environment now...',
    },
    {
      type: 'prompt',
      prompt: 'When you spend time in nature, what happens in your body and mind?',
      context: 'Pay attention to the physical response. Does your breathing change? Does your chest open? Does your jaw relax? The body often knows before the mind does why nature matters.',
      placeholder: 'What nature does for me physically...',
    },
    {
      type: 'text',
      header: 'Bringing Nature into Integration',
      lines: [
        'You do not need to live in the wilderness to integrate through nature. A daily walk with deliberate attention to what you see, hear, and feel is enough.',
        '\u00a7',
        'Sit with a tree for ten minutes without your phone. Watch weather change. Put your hands in soil. Eat a meal outside.',
        '\u00a7',
        'The practice is not about doing something special. It is about removing the barriers between you and what is already there.',
      ],
    },
    {
      type: 'selector',
      prompt: 'Which of these feel possible for you in the coming week?',
      key: 'naturePractice',
      columns: 2,
      multiSelect: true,
      options: [
        { id: 'walk', label: 'Daily walk outside' },
        { id: 'park', label: 'Sitting in a park or garden' },
        { id: 'sunrise', label: 'Watching sunrise or sunset' },
        { id: 'garden', label: 'Gardening or touching soil' },
        { id: 'water', label: 'Swimming or being near water' },
        { id: 'meal', label: 'Eating a meal outdoors' },
        { id: 'window', label: 'Sleeping with a window open' },
        { id: 'phone', label: 'Leaving my phone inside' },
      ],
      journal: {
        prompt: 'What will you try first?',
        placeholder: 'I will start with...',
        rows: 3,
      },
    },
    {
      type: 'prompt',
      prompt: 'After your session, do you feel more connected to something beyond yourself?',
      context: 'This could be ecological, spiritual, communal, or something you cannot name. The feeling of being part of a larger system is one of the most consistently reported outcomes of psychedelic experience.',
      placeholder: 'What I feel connected to...',
    },
    {
      type: 'text',
      header: 'Nature & Connection',
      lines: [
        'The connection you feel to the natural world right now is available to you at any time. It does not require a session to access. It requires attention.',
        '\u00a7',
        'Your reflections are saved in your journal. Consider revisiting them the next time you are outdoors. Notice whether the connection you described is still there. It usually is.',
      ],
    },
  ],
};
