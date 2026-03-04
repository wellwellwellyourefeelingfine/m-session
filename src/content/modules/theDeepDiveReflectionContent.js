/**
 * The Deep Dive — Post-Meditation Reflection Content
 * All screen text for the 10-screen reflection flow after the meditation.
 *
 * Screens 1-6 are shared (with minor couple additions on 1-2).
 * Screens 7-9 diverge: solo = journal prompts, couple = discussion prompts.
 * Screen 10 has 4 variants (mode x hasPart2).
 */

// ============================================
// QUICK CAPTURE (Screen 1)
// ============================================

export const QUICK_CAPTURE_SCREEN = {
  solo: {
    header: 'While it\u2019s fresh',
    body: 'Take a moment before anything else. Whatever just happened during the meditation, get it down in a few words before it fades.',
    hint: 'No need for complete sentences. This is just for you.',
    journal: {
      key: 'quickCapture',
      placeholder: 'Whatever is most alive right now...',
      rows: 5,
    },
  },
  couple: {
    header: 'While it\u2019s fresh',
    instruction: 'Take a quiet moment before you talk. If either of you wants to write something down from the meditation, do that now. This one is individual.',
    journal: {
      key: 'quickCapture',
      placeholder: 'Whatever is most alive right now...',
      rows: 4,
    },
  },
};

// ============================================
// CHECK-IN (Screen 2)
// ============================================

export const CHECKIN_HEADER = 'What happened when you went underneath?';
export const CHECKIN_SUBTEXT = 'There is no wrong answer. Just pick whichever feels closest.';

export const CHECKIN_OPTIONS = [
  { id: 'softened', label: 'Something softened or opened up' },
  { id: 'hurt', label: 'I found something painful underneath' },
  { id: 'clarity', label: 'I saw something I hadn\u2019t seen before' },
  { id: 'stuck', label: 'I couldn\u2019t get past my usual reactions' },
  { id: 'unsure', label: 'I\u2019m not sure what happened' },
];

export const CHECKIN_COUPLE_NOTE = 'Pick whichever feels closest for the person holding the device. You will have a chance to discuss where you each landed.';

// ============================================
// TAILORED RESPONSES (Screen 3)
// ============================================

export const TAILORED_RESPONSES = {
  softened: {
    header: 'That softening is real',
    paragraphs: [
      'When the defenses come down, even briefly, what shows up underneath is not always pain. Sometimes it is tenderness. A recognition of how much this person actually matters to you. A longing for closeness that your usual reactions have been covering.',
      'That feeling is what was there before the walls went up. It is the original signal, the one your nervous system learned to muffle because it felt too vulnerable to leave exposed.',
    ],
  },
  hurt: {
    header: 'You made contact with something real',
    paragraphs: [
      'The pain you found is probably what has been driving your reactions all along. Most people spend years building walls around exactly this feeling. Fear of being left. Grief about a disconnection you cannot fix. The raw question of whether you are enough.',
      'The fact that you could feel it, even for a moment, without being destroyed by it, is significant. Your nervous system just learned that this feeling can be survivable.',
    ],
  },
  clarity: {
    header: 'A shift in perspective',
    paragraphs: [
      'Seeing something clearly that you could not see before is one of the most powerful things that can happen in this kind of practice. It usually means you stepped outside your usual position in the relationship long enough to see the whole picture.',
      'Maybe you saw a pattern you have been running on autopilot. Maybe you recognized what you actually need, underneath what you usually ask for. Hold onto that. Clarity like this tends to stay.',
    ],
  },
  stuck: {
    header: 'The wall is not a failure',
    paragraphs: [
      'If you could not get past your surface reactions, that is not a sign that something went wrong. The defenses you are encountering are there for a reason. They have been protecting you, probably for a long time, and they do not step aside on command.',
      'Sometimes the most honest thing that happens in a practice like this is discovering how strong the wall is. That is real information. It tells you something about what this relationship activates in you, and how much your system is working to keep you safe from it.',
    ],
  },
  unsure: {
    header: 'That\u2019s a real answer',
    paragraphs: [
      'Not knowing what happened is not the same as nothing happening. This kind of experience does not always organize itself into a clear narrative in the moment. Something may have shifted at a level below what your thinking mind can easily track.',
      'As you go through the next few screens, see if anything clicks. Sometimes the understanding arrives on a delay. Your body processed something. Give it time to translate.',
    ],
  },
};

// ============================================
// PSYCHOEDUCATION (Screens 4-6)
// ============================================

export const PSYCHOED_SCREENS = [
  // Screen 4: Two layers
  {
    header: 'Two layers',
    lines: [
      'In every close relationship, there are two layers of emotion happening at once.',
      '\u00A7',
      'On the surface: the reactions you can see. Frustration. Criticism. Withdrawal. Shutting down. These are the ones both people tend to fight about.',
      '\u00A7',
      'Underneath: something more vulnerable. Fear of being left. Sadness about a disconnection you cannot name. A question about whether you are enough for this person.',
      '\u00A7',
      'The surface reactions are not the problem. They are a {response} to the problem. They are what happens when the deeper feeling has nowhere to go.',
    ],
  },
  // Screen 5: Why we hide
  {
    header: 'Why we hide',
    lines: [
      'You learned early on which feelings were safe to show and which ones were not.',
      '\u00A7',
      'Most people learn that raw vulnerability, the open need for connection, the fear of rejection, is dangerous. So your nervous system built an automatic defense. The criticism, the withdrawal, the shut-down, the people-pleasing. These are not character flaws. They are protection strategies your mind created when you were too young to have a choice.',
      '\u00A7',
      'The meditation you just did was designed to get underneath that layer. Not to remove the protection. Just to see what it has been guarding.',
    ],
  },
  // Screen 6: What just happened
  {
    header: 'What you just experienced',
    lines: [
      'The deeper feeling you touched, or tried to touch, is what therapists call a {primary_emotion}. It is the feeling that was there first, before your defenses learned to cover it.',
      '\u00A7',
      'Primary emotions are difficult to access in everyday life. The defense system works fast. By the time you open your mouth in an argument, the raw feeling has already been converted into something safer: blame, withdrawal, numbness.',
      '\u00A7',
      'This matters because {primary_emotions} are the only ones that actually change things in a relationship. When two people can finally say the real thing, the one underneath the defense, something shifts that years of arguing about the surface cannot touch.',
    ],
  },
];

export const ACCENT_TERMS = {
  response: 'response',
  primary_emotion: 'primary emotion',
  primary_emotions: 'primary emotions',
};

// ============================================
// REFLECT SCREENS (Screens 7-9)
// ============================================

export const REFLECT_SURFACE_SCREEN = {
  solo: {
    header: 'The surface',
    preamble: {
      default: 'Now that you have a frame for what just happened, start with the surface. When things get difficult between you and this person, what is the reaction you usually show?',
      stuck: 'You noticed that the surface reactions held strong during the meditation. That is useful information. When things get difficult with this person, what is the reaction that dominates?',
    },
    journal: {
      key: 'surfaceReaction',
      prompt: 'What do I usually show on the surface when things get hard between us?',
      placeholder: 'The reaction, the pattern, what I do or say...',
      rows: 4,
    },
  },
  couple: {
    header: 'The surface',
    instruction: 'You just read about two layers: the surface reaction and the feeling underneath. Before going deeper, name the surface layer to each other.',
    steps: [
      'Each of you: tell your partner what YOUR surface pattern looks like. What do you do when the tension starts? Do you push? Go quiet? Criticize? Shut down? Be honest. You are not confessing. You are describing a pattern you both already recognize.',
      'After you have each named yours, see if you can describe it without blame. Not \u201CI shut down because you push me.\u201D Just \u201CI shut down.\u201D',
    ],
    timeSuggestion: 'Take a few minutes with this.',
    placeholder: 'What we each named as our surface patterns...',
    rows: 3,
  },
};

export const REFLECT_UNDERNEATH_SCREEN = {
  solo: {
    header: 'Underneath',
    preamble: {
      softened: 'During the meditation, something softened. A tenderness or a closeness came through. Stay with that for a moment. What was the feeling that showed up when the walls came down?',
      hurt: 'You made contact with something raw during the meditation. A pain that your usual reactions have been trying to protect you from. Can you put words to it? Even rough ones.',
      clarity: 'You saw something clearly that you had not been able to see before. Now see if you can go one layer deeper. Underneath the insight, is there a feeling? A fear, a sadness, a need that the clarity is pointing toward?',
      stuck: 'Even when the defenses hold, there are usually glimpses. A flash of something before the wall went back up. If you sensed anything at all underneath the surface reaction, try to describe it here. And if you did not, write about what the wall itself felt like.',
      unsure: 'Something happened during the meditation, even if you cannot quite name it. Try to describe the texture of it. Not what you think it means. Just what it felt like. A heaviness, a pulling, a blankness, a flicker of something.',
    },
    journal: {
      key: 'primaryEmotion',
      prompt: {
        default: 'What did I find underneath my usual reactions?',
        stuck: 'What did I notice, even briefly, underneath the surface?',
        unsure: 'What was the quality of what I experienced?',
      },
      placeholder: {
        default: 'The feeling that was there before the defense...',
        stuck: 'Any flicker, any glimpse, or what the wall itself felt like...',
        unsure: 'The texture, the sensation, whatever words come...',
      },
      rows: 5,
    },
  },
  couple: {
    header: 'What you heard',
    instruction: 'At the end of the meditation, you each shared one sentence about what you found underneath. Now take turns reflecting that back.',
    steps: [
      'Tell your partner: this is what I heard you say. Not your interpretation. Not your response. Just what you heard.',
      'Then your partner tells you if you got it right. If you missed something, they can say what it actually was.',
      'Switch. The other person reflects back what they heard. Same process.',
    ],
    timeSuggestion: 'This is not a debate. It is an exercise in hearing each other.',
    placeholder: 'What we each heard and what was clarified...',
    rows: 4,
  },
};

export const REFLECT_UNSAID_SCREEN = {
  solo: {
    header: 'The unsaid',
    preamble: 'From this place, knowing what you now know about what is really happening underneath, is there something you want to say to this person? Not the complaint. Not the defense. The thing you have never been able to say because it was too close to the bone.',
    journal: {
      key: 'unsaidMessage',
      prompt: 'What do I need this person to know that I have not been able to say?',
      placeholder: 'The truest thing...',
      rows: 5,
    },
  },
  couple: {
    header: 'Saying it',
    instruction: 'During the meditation, you each said one sentence. Now, with new language for what is happening underneath your patterns, the door is open a little wider.',
    steps: [
      'Take turns. Say anything else you want your partner to know from this place. Not the familiar complaints. Not a response to what they said. The thing underneath that you have had trouble putting into words.',
      'The listener\u2019s only job is to receive it. No fixing. No defending. No reassuring. Just hearing.',
    ],
    note: 'This can be one sentence or many. It can also be silence. If there is nothing else to say right now, that is enough. What you shared during the meditation already counted.',
    timeSuggestion: 'Take as much time as you need.',
    placeholder: 'What was said, what it felt like...',
    rows: 4,
  },
};

// ============================================
// CLOSING (Screen 10)
// ============================================

export const CLOSING_CONTENT = {
  header: 'What comes next',
  solo: {
    withPart2: [
      'The feeling you found underneath does not just sit there quietly. It shapes how you react, what you say, what you avoid. Over time, it creates a pattern between you and this person that can repeat for years.',
      '\u00A7',
      'In Part 2, you will map that pattern. You will see the whole cycle from above. And that changes everything.',
      '\u00A7',
      'For now, just let what you found settle. It will keep working on its own.',
    ],
    withoutPart2: [
      'What you found here does not need to be resolved today. Just knowing it is there, knowing what the surface reactions are actually protecting, changes how the pattern operates. Even without doing anything else.',
    ],
  },
  couple: {
    withPart2: [
      'What you just did is hard. Finding the feeling underneath your defenses, saying it out loud, and hearing your partner do the same. Most couples never get here.',
      '\u00A7',
      'In Part 2, you will map the pattern these feelings create between you. You will see the whole cycle from above. And you will do that together too.',
      '\u00A7',
      'For now, let what you found settle. You do not need to solve anything tonight.',
    ],
    withoutPart2: [
      'What you just did is hard. Finding the feeling underneath your defenses, saying it out loud, and hearing your partner do the same. Most couples never get here.',
      '\u00A7',
      'You do not need to resolve anything tonight. Just knowing what is underneath, and knowing that your partner knows it too, changes how the pattern operates. Even without doing anything else.',
    ],
  },
};
