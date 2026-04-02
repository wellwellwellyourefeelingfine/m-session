/**
 * Spirit & Meaning Content
 * Follow-up module: explore existential, spiritual, or meaning-making experiences.
 */

export const spiritMeaningContent = {
  instructions: 'A guided journaling exercise to explore the existential, spiritual, or meaning-making dimensions of your session. Includes prompts about what felt larger than yourself, shifts in perspective, and what meaning is emerging.',
  screens: [
    {
      type: 'text',
      header: 'Spirit & Meaning',
      lines: [
        'Sessions sometimes open a door to experiences that are difficult to categorize. A sense of connection to something larger. A shift in how death, time, or purpose feels. A dissolving of boundaries that normally feel solid.',
        '\u00a7',
        'These experiences are among the most commonly reported and least discussed outcomes of psychedelic work.',
        '\u00a7',
        'This reflection is a space to sit with whatever came through, whether it was spiritual in a traditional sense, existential, or something you do not have a word for yet.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'Was there a moment during your session that felt larger than you?',
      context: 'Many people report that the most meaningful parts of their experience are also the hardest to put into words. Researchers call this ineffability. Try anyway. Even partial descriptions can help you hold onto what happened.',
      placeholder: 'What I experienced was...',
    },
    {
      type: 'selector',
      prompt: 'Which of these comes closest to what you experienced?',
      key: 'spiritualExperience',
      columns: 2,
      multiSelect: true,
      options: [
        { id: 'connection', label: 'Connection to something larger' },
        { id: 'unity', label: 'A sense of unity or oneness' },
        { id: 'clarity', label: 'Clarity about what matters' },
        { id: 'mortality', label: 'Confrontation with mortality' },
        { id: 'held', label: 'Feeling of being held or loved' },
        { id: 'dissolving', label: 'Dissolving of boundaries' },
        { id: 'sacred', label: 'Encounter with something sacred' },
        { id: 'peace', label: 'A deep sense of peace' },
        { id: 'grief', label: 'Grief or loss' },
        { id: 'none', label: 'None of these' },
      ],
      journal: {
        prompt: 'Want to describe it in your own words?',
        placeholder: 'In my own words, it was...',
        rows: 4,
      },
    },
    {
      type: 'text',
      header: 'Holding What Cannot Be Named',
      lines: [
        'One of the difficulties of spiritual or mystical experience is that it can feel absolutely real and certain in the moment but become hard to access or trust afterward.',
        '\u00a7',
        'This is normal. The experience does not become less real because it fades from immediate awareness.',
        '\u00a7',
        'Integration is the process of finding ways to stay connected to what you saw, even when ordinary life makes it harder to feel.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'Has your sense of what life is about changed since your session?',
      context: 'Sessions can change how you think about purpose, meaning, death, connection, or what matters most. These shifts can be subtle or seismic.',
      placeholder: 'What I see differently now...',
    },
    {
      type: 'prompt',
      prompt: 'Is there something you believe or feel to be true now that you did not before your session?',
      context: 'This does not have to be religious or even spiritual. It could be about yourself, about other people, about how things work, or about what matters.',
      placeholder: 'What I now hold to be true...',
    },
    {
      type: 'text',
      header: 'Practices for Staying Connected',
      lines: [
        'People who have had meaningful spiritual or existential experiences during sessions report several practices that help them maintain connection to what they found: spending time in nature, meditation or contemplation, creative expression, returning to music from the session, and conversations with others who understand.',
        '\u00a7',
        'You do not need to adopt a belief system or a practice. But finding even one way to regularly touch what you experienced can keep it alive as a source of meaning rather than a fading memory.',
      ],
    },
    {
      type: 'prompt',
      prompt: 'Is there a practice, ritual, or habit that might help you stay connected to what you experienced?',
      context: 'It could be as simple as a daily walk, a few minutes of silence, or revisiting a piece of music. The most effective practices are the ones you will actually do.',
      placeholder: 'Something I could do regularly...',
    },
    {
      type: 'prompt',
      prompt: 'What question are you sitting with right now that you do not have an answer to?',
      context: 'Some of the most important outcomes of a session are not answers but better questions. Questions that reframe how you think about your life, your relationships, or your place in things.',
      placeholder: 'The question I am sitting with...',
    },
    {
      type: 'text',
      header: 'Spirit & Meaning',
      lines: [
        'What you explored here may be the most personal and least shareable part of your experience. That is fine. Not everything needs to be communicated to be real.',
        '\u00a7',
        'Your reflections are saved in your journal. You may find that they become more meaningful over time, not less.',
        '\u00a7',
        'If what came up during your session has raised questions that feel too large to sit with alone, consider seeking out a therapist, spiritual director, or integration circle. These experiences deserve careful attention.',
      ],
    },
  ],
};
