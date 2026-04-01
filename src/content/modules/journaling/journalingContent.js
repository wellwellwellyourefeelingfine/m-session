/**
 * Journaling Module Content
 * Content for light journaling, deep journaling, gratitude reflection, and time capsule modules.
 */

export const lightJournalingContent = {
  instructions: 'Write freely about whatever is present for you. Don\'t worry about grammar or making sense. Just let the words flow.',
  introScreens: [
    {
      header: 'Light Journaling',
      lines: [
        'Writing during a session can help you hold onto what you are experiencing before it slips away. You do not need to write well or write a lot. Even a few words can anchor something important.',
        '§',
        'There are no rules here. Write whatever comes. If nothing comes, sit with the question and see what surfaces.',
      ],
    },
  ],
  prompts: [
    'What am I noticing right now?',
    'What wants to be expressed?',
    'What feels true in this moment?',
  ],
  closingScreens: [
    {
      header: 'Light Journaling',
      lines: [
        'Whatever you wrote is enough. You can always come back to your journal and add more later.',
        '§',
        'Sometimes the most useful entries are the ones that feel incomplete. They mark a moment in time, and that is their value.',
      ],
    },
  ],
};

export const deepJournalingContent = {
  instructions: 'Take your time with these prompts. Write whatever comes, even if it surprises you. This is for you alone.',
  introScreens: [
    {
      header: 'Deep Journaling',
      lines: [
        'This is a space for the things that are harder to look at. The questions ahead are designed to go beneath the surface, and the state you are in right now can make that easier than it usually is.',
        '§',
        'Write honestly. No one will read this unless you choose to share it. If a question brings up something uncomfortable, that is often a sign you are close to something that matters.',
      ],
    },
  ],
  prompts: [
    'What have I been avoiding looking at?',
    'What truth am I ready to acknowledge?',
    'What would my life look like if I fully accepted myself?',
    'What am I ready to release?',
  ],
  closingScreens: [
    {
      header: 'Deep Journaling',
      lines: [
        'You just spent time with questions that most people avoid. That takes a kind of courage that is easy to underestimate.',
        '§',
        'What you wrote may continue to unfold over the coming days. You may notice new thoughts, feelings, or connections that were not obvious during the writing itself. Your journal is always here if you want to return and add to what you started.',
      ],
    },
  ],
};

export const gratitudeReflectionContent = {
  instructions: 'Reflect on what you\'re grateful for. People, experiences, qualities in yourself, simple pleasures. Let yourself really feel it.',
  introScreens: [
    {
      header: 'Gratitude Reflection',
      lines: [
        'Gratitude can feel like a cliche until you actually slow down and let it land. During a session, the usual filters that keep you from feeling things fully are lowered, and appreciation can become surprisingly vivid.',
        '§',
        'The prompts ahead will ask you to think about different parts of your life. Take your time with each one. The goal is not to list things but to let yourself feel the weight of what you have.',
      ],
    },
  ],
  prompts: [
    'What am I grateful for right now?',
    'Who has helped me become who I am?',
    'What simple pleasure am I thankful for?',
  ],
  closingScreens: [
    {
      header: 'Gratitude Reflection',
      lines: [
        'Research on gratitude practices consistently shows that they improve wellbeing, but only when they move beyond the surface. What you just did was closer to the real thing.',
        '§',
        'You may find that the people or things you wrote about stay with you over the next few days. Consider telling one of them what they mean to you, if the opportunity arises.',
      ],
    },
  ],
};

export const timeCapsuleContent = {
  introScreens: [
    {
      header: 'Time Capsule',
      lines: [
        'Right now, you may be seeing things with a clarity that is hard to access in everyday life. Patterns that usually stay hidden are visible. Things that matter feel unmistakably clear.',
        '§',
        'This is a chance to capture that clarity before it fades. You are going to write a message to your future self \u2014 the version of you who will be back in ordinary life, navigating the same patterns, the same relationships, the same choices.',
        '§',
        'What does that person need to hear from the version of you who is here right now?',
      ],
    },
  ],
  prompts: [
    'It is one year from now. What do you want to tell the person sitting here today?',
    'What do you see clearly right now that you are afraid you might forget?',
    'What is one thing you want to promise yourself?',
  ],
  closingScreens: [
    {
      header: 'Time Capsule',
      lines: [
        'What you just wrote is a message from a version of yourself that had access to something important. In the days and weeks ahead, the intensity of this clarity may soften, but the truth underneath it does not go away.',
        '§',
        'Your message is saved in your journal. Come back to it when you need a reminder of what you saw today.',
        '§',
        'Some people find it useful to set a calendar reminder for a month, three months, or a year from now to re-read what they wrote. It can be surprising how much still resonates.',
      ],
    },
  ],
};
