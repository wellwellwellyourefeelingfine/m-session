/**
 * Relationships Reflection Content
 * Follow-up module: explore how your session shifted the way you see people in your life.
 */

export const relationshipsReflectionContent = {
  screens: [
    {
      type: 'text',
      header: 'Relationships Reflection',
      lines: [
        'Sessions frequently bring clarity to relationships. People often report seeing others with more compassion, understanding relational patterns more clearly, and feeling motivated to repair or deepen connections.',
        '\u00a7',
        'This reflection will help you capture those insights while they are still close.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'Who has been on your mind since your session?',
      context: 'During and after a session, certain people tend to surface. It might be someone you are close to, someone you have lost, or someone you have unfinished business with.',
      placeholder: 'The person or people I keep thinking about...',
    },
    {
      type: 'selector',
      prompt: 'How has your perspective on this relationship changed?',
      key: 'relationshipShift',
      columns: 2,
      multiSelect: false,
      options: [
        { id: 'compassion', label: 'More compassion toward them' },
        { id: 'understanding', label: 'Better understanding of their perspective' },
        { id: 'clarity', label: 'Clearer about what I need' },
        { id: 'forgiveness', label: 'Ready to forgive something' },
        { id: 'closeness', label: 'Wanting to be closer' },
        { id: 'pattern', label: 'Recognizing a pattern' },
        { id: 'distance', label: 'Needing more distance' },
        { id: 'unsure', label: 'Not sure yet' },
      ],
      journal: {
        prompt: 'Want to say more about what shifted?',
        placeholder: 'What changed in how I see this...',
        rows: 3,
      },
    },
    {
      type: 'prompt',
      prompt: 'Is there a pattern in how you relate to someone that you can see more clearly now?',
      context: 'Sessions can reveal patterns in how we relate to others. Ways we protect ourselves, ways we withdraw, things we tolerate that we should not, or things we withhold that we should share.',
      placeholder: 'A pattern I notice is...',
    },
    {
      type: 'prompt',
      prompt: 'Is there something you want to communicate to someone based on what came up?',
      context: 'You do not have to act on this right away. Writing it down is enough for now. If you choose to have this conversation, give yourself a few days first.',
      placeholder: 'What I want to say is...',
    },
    {
      type: 'text',
      header: 'A Note on Timing',
      lines: [
        'The urge to reach out to someone immediately after a session can be strong. The empathy and openness you feel are real, but they are also amplified.',
        '\u00a7',
        'Give yourself at least a few days before initiating difficult conversations or making major relationship decisions. What remains true after the afterglow settles is what matters most.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'What kind of relationships do you want to build or strengthen going forward?',
      placeholder: 'The connections I want to invest in...',
    },
    {
      type: 'text',
      header: 'Relationships Reflection',
      lines: [
        'Relationships are one of the areas where session insights tend to have the most lasting impact, but only if you act on them.',
        '\u00a7',
        'Your reflections are saved in your journal. Consider revisiting them before any important conversations.',
        '\u00a7',
        'If relationship issues came up that feel beyond what you can work through alone, a therapist or counselor can help you navigate them.',
      ],
    },
  ],
};
