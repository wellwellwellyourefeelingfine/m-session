/**
 * Integration Reflection Content
 * Follow-up module: guided reflection on what stayed with you from your session.
 */

export const integrationReflectionContent = {
  screens: [
    {
      type: 'text',
      header: 'Integration Reflection',
      lines: [
        'The first day or two after a session is a window. Research suggests that neuroplasticity is elevated during this period, which means the brain is more receptive to forming new connections and consolidating new patterns.',
        '\u00a7',
        'Writing things down during this window helps anchor what came up. Insights that feel vivid now can fade quickly without something to hold them in place.',
        '\u00a7',
        'This reflection will walk you through what stayed with you, what shifted, and what you want to carry forward.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'What from your session is still with you right now?',
      context: 'It could be an image, a feeling, a thought, or something you cannot quite name.',
      placeholder: 'What is still present...',
    },
    {
      type: 'selector',
      prompt: 'How have you been feeling since your session?',
      key: 'emotionalState',
      columns: 2,
      multiSelect: false,
      options: [
        { id: 'settled', label: 'Settled and clear' },
        { id: 'processing', label: 'Still processing' },
        { id: 'lighter', label: 'Lighter than before' },
        { id: 'heavy', label: 'Heavy or weighed down' },
        { id: 'tender', label: 'Tender but okay' },
        { id: 'energized', label: 'Energized' },
        { id: 'numb', label: 'Numb or flat' },
        { id: 'mixed', label: 'Mixed or uncertain' },
      ],
      journal: {
        prompt: 'Want to say more about that?',
        placeholder: 'Any details about how you have been feeling...',
        rows: 3,
      },
    },
    {
      type: 'prompt',
      prompt: 'Has anything about the way you see yourself, another person, or a situation changed since your session?',
      context: 'Pay attention to small changes. A thought that used to trigger anxiety but now just feels neutral. A person you think about differently. A situation that seemed impossible but now seems manageable. Shifts after a session are often quiet.',
      placeholder: 'What has shifted...',
    },
    {
      type: 'prompt',
      prompt: 'Is there anything from your session that feels unfinished or unresolved?',
      context: 'Not everything that comes up during a session gets completed during the session. Naming what is still open can help you stay with it rather than push it away.',
      placeholder: 'What feels unfinished...',
    },
    {
      type: 'text',
      header: 'The Integration Window',
      lines: [
        'The period after a session is sometimes called the integration window. The heightened neuroplasticity that follows a psychedelic experience can last days to weeks, and during this time the brain is unusually receptive to change.',
        '\u00a7',
        'This is why writing, reflecting, and making small intentional changes during this period can have an outsized effect. You are not just remembering what happened. You are actively shaping how it becomes part of you.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'What from your session do you want to remember and bring into your daily life?',
      placeholder: 'What I want to carry forward...',
    },
    {
      type: 'prompt',
      prompt: 'Is there anyone you want to talk to about what came up? Is there any kind of support that would help you right now?',
      context: 'Integration does not have to be solitary. Some things are better processed with a therapist, a trusted friend, or a community that understands.',
      placeholder: 'The support I need...',
    },
    {
      type: 'text',
      header: 'Integration Reflection',
      lines: [
        'Integration is not a single event. It is an ongoing process that can continue for weeks, months, or longer. What you wrote today is a snapshot of where you are right now, and it will be useful to revisit.',
        '\u00a7',
        'You may notice new connections, emotions, or realizations in the days ahead that were not obvious during this reflection. Your journal is always available if you want to come back and add to what you started.',
        '\u00a7',
        'If anything difficult came up during your session or during this reflection, consider reaching out to a therapist, integration professional, or trusted friend. You do not have to process everything alone.',
      ],
    },
  ],
};
