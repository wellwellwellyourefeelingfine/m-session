/**
 * Body & Somatic Awareness Content
 * Follow-up module: notice what your body is holding, releasing, and asking for.
 */

export const bodySomaticContent = {
  instructions: 'A guided journaling exercise to notice what your body is holding, releasing, and asking for after your session. Includes prompts about physical sensations, tension, comfort, and what your body is communicating.',
  screens: [
    {
      type: 'text',
      header: 'Body & Somatic Awareness',
      lines: [
        'During a session, the body often communicates more clearly than the mind. Tension releases, emotions surface as physical sensations, and areas of chronic holding can temporarily soften.',
        '\u00a7',
        'In the days after a session, the body continues to process. Paying attention to what it is telling you is one of the most effective forms of integration.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'What do you notice in your body right now?',
      context: 'Take a moment to scan your body from head to feet. Notice any areas of tension, warmth, heaviness, lightness, or numbness. You do not need to interpret what you find. Just notice.',
      placeholder: 'Where I feel tension, ease, or sensation...',
    },
    {
      type: 'selector',
      prompt: 'What physical changes have you noticed since your session?',
      key: 'physicalChanges',
      columns: 2,
      multiSelect: true,
      options: [
        { id: 'relaxed', label: 'More relaxed than usual' },
        { id: 'tension', label: 'Tension in a new place' },
        { id: 'pain-softened', label: 'Old pain has softened' },
        { id: 'awareness', label: 'More aware of my body' },
        { id: 'sleep', label: 'Sleep has changed' },
        { id: 'appetite', label: 'Appetite has shifted' },
        { id: 'emotional', label: 'More emotional than usual' },
        { id: 'drained', label: 'Feeling physically drained' },
        { id: 'energy', label: 'Increased energy' },
        { id: 'none', label: 'No noticeable changes' },
      ],
      journal: {
        prompt: 'Want to describe what you are feeling physically?',
        placeholder: 'What I am noticing in my body...',
        rows: 3,
      },
    },
    {
      type: 'prompt',
      prompt: 'Did your body show you anything during the session that you want to remember?',
      context: 'Sessions can reveal how the body stores experiences. A tightness in the chest that corresponds to grief. Tension in the jaw from years of holding back words. Heaviness in the stomach connected to anxiety. Sometimes the body releases these during a session. Sometimes it shows them to you so you can begin to work with them.',
      placeholder: 'What my body revealed...',
    },
    {
      type: 'text',
      header: 'The Body Keeps Processing',
      lines: [
        'After a session, the body often continues what it started. You might notice unexpected waves of emotion, changes in how you sleep, shifts in appetite, or a desire to move differently.',
        '\u00a7',
        'These are not side effects. They are part of the integration process. The body processes at its own pace, and it does not always follow the timeline the mind expects.',
        '\u00a7',
        'Be patient with physical changes. They are usually temporary and meaningful.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'What kind of physical activity or rest does your body seem to want right now?',
      context: 'Some people feel called to move more after a session. Others need stillness. Both are valid responses to what the body is working through.',
      placeholder: 'What my body is asking for...',
    },
    {
      type: 'prompt',
      prompt: 'Is there tension or pain in your body that you now recognize as connected to something specific?',
      context: 'Somatic therapists often observe that people carry tension, pain, or holding patterns that originated in someone else\'s experience or in situations that ended long ago. Sessions can make this visible.',
      placeholder: 'What I am carrying and where it came from...',
    },
    {
      type: 'text',
      header: 'Working with the Body',
      lines: [
        'The body responds to attention. Simple practices can help continue what the session started.',
        '\u00a7',
        'Placing a hand on a tense area and breathing into it. Gentle stretching without forcing anything. Walking slowly and noticing how your feet meet the ground. Warm baths or showers with deliberate attention to sensation.',
        '\u00a7',
        'These are not exercises. They are ways of maintaining the conversation your body started during the session.',
      ],
    },
    {
      type: 'selector',
      prompt: 'Which of these body-based practices feel right for you right now?',
      key: 'somaticPractices',
      columns: 2,
      multiSelect: true,
      options: [
        { id: 'stretching', label: 'Gentle stretching or yoga' },
        { id: 'walking', label: 'Walking in nature' },
        { id: 'breathwork', label: 'Breathwork' },
        { id: 'bath', label: 'Warm bath or shower' },
        { id: 'dance', label: 'Dance or free movement' },
        { id: 'massage', label: 'Massage or bodywork' },
        { id: 'rest', label: 'Rest and sleep' },
        { id: 'other', label: 'Something else' },
      ],
      journal: {
        prompt: 'Is there a specific practice you want to commit to?',
        placeholder: 'What I will try...',
        rows: 3,
      },
    },
    {
      type: 'prompt',
      prompt: 'If your body could speak directly to you right now, what would it say?',
      context: 'This is not a metaphor. The body has its own intelligence. It registers and responds to experience faster than conscious thought. Letting it speak, even through writing, can surface things the mind has not yet processed.',
      placeholder: 'What my body would tell me...',
    },
    {
      type: 'text',
      header: 'Body & Somatic Awareness',
      lines: [
        'The body does not forget what happened during a session, even when the mind moves on. The physical changes you noticed may continue to unfold over days or weeks.',
        '\u00a7',
        'Your reflections are saved in your journal. Consider revisiting them alongside any body-based practice you chose.',
        '\u00a7',
        'If you are experiencing persistent physical discomfort, unusual pain, or physical symptoms that concern you, consult a healthcare provider. Somatic processing is real, but so are medical conditions that deserve attention.',
      ],
    },
  ],
};
