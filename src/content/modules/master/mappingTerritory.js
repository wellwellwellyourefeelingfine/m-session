/**
 * Mapping the Territory
 *
 * MasterModule content config replacing MappingTerritoryActivity.jsx.
 * Pre-session educational orientation based on Bill Richards' Sacred
 * Knowledge. Preserves the historical mappingTerritory export captures via
 * small custom bridge blocks.
 */

const COPING_PATTERN_OPTIONS = [
  { id: 'push-away', label: 'I push it away and stay busy' },
  { id: 'think-through', label: 'I try to think my way through it' },
  { id: 'freeze', label: 'I freeze up or go numb' },
  { id: 'overwhelm', label: 'I let myself feel it but it overwhelms me' },
  { id: 'depends', label: 'It depends on the situation' },
];

const APPROACH_STYLE_OPTIONS = [
  { id: 'specific', label: 'I have something specific I want to work through' },
  { id: 'general-open', label: 'I have a general sense of what needs attention but want to stay open' },
  { id: 'experience-led', label: 'I want to let the experience lead entirely' },
  { id: 'not-sure', label: 'I’m honestly not sure yet' },
];

const header = (title, animation = 'compass') => ({ type: 'header', title, animation });

const BEFORE_YOU_GO_IN = header('Before You Go In', null);
const NO_TWO_SESSIONS = header('No Two Sessions Are Alike');
const PERSONAL_MATERIAL = header('Personal Material');
const THE_BODY = header('The Body');
const DIFFICULT_PASSAGES = header('Difficult Passages', null);
const TOWARD_NOT_AWAY = header('Toward, Not Away');
const YOUR_PATTERNS = header('Your Patterns', null);
const EXPANDED_STATES = header('Expanded States');
const SPACE_BETWEEN = header('The Space Between');
const ASKING_ATTENTION = header('What’s Been Asking For Attention', null);
const PSYCHE_INTELLIGENT = header('Your Psyche Is Intelligent');
const DONT_FORCE = header('You Don’t Need To Make Anything Happen');
const APPROACH_STYLE = header('Approach Style', null);
const MUSIC = header('Music Will Do A Lot Of The Work', null);
const WORDS_LATER = header('Words Come Later');
const WORD_TO_SELF = header('A Word To Yourself', null);
const CLOSING = header('That’s The Map', 'compass');

const ASKING_FOR_ATTENTION_PROMPT = {
  type: 'prompt',
  promptKey: 'asking-for-attention',
  mappingTerritoryField: 'askingForAttention',
  prompt: 'Is there anything in your life right now that’s been quietly asking for your attention? A feeling, a relationship, an unresolved question?',
  placeholder: 'Whatever comes to mind...',
  rows: 5,
  journalLabel: 'What’s been asking for attention',
};

const WORD_TO_SELF_PROMPT = {
  type: 'prompt',
  promptKey: 'word-to-self',
  mappingTerritoryField: 'wordToSelf',
  prompt: 'Write one sentence to yourself that you want to carry into the session. A reminder, a permission, a small act of courage.',
  placeholder: 'What I want to remember...',
  rows: 5,
  journalLabel: 'A word to myself',
};

export const mappingTerritoryContent = {
  idleAnimation: 'compass',
  idle: {
    title: 'Mapping the Territory',
    durationMinutes: 10,
    description:
      'A brief pre-session orientation to the kinds of experience that can arise. Based on the work of psychedelic researcher Bill Richards, this map is not here to control the session — only to help you recognize the terrain when it appears.',
  },

  journal: {
    saveOnComplete: true,
    titlePrefix: 'MAPPING THE TERRITORY',
  },

  sections: [
    {
      id: 'orientation',
      type: 'screens',
      screens: [
        {
          blocks: [
            BEFORE_YOU_GO_IN,
            { type: 'text', lines: [
              'This module is about orienting yourself before a session. Not rules. Not warnings. Just a map.',
              '§',
              'Psychedelic researcher Bill Richards spent decades guiding people through altered states. His book Sacred Knowledge is one of the most important works on the therapeutic use of psychedelics, drawing on over fifty years of clinical research. Much of what follows is informed by his insights.',
              '§',
              'One of his core principles: preparation isn’t about controlling what happens. It’s about being less surprised by it.',
            ] },
            {
              type: 'external-link',
              label: 'Sacred Knowledge: Psychedelics and Religious Experiences — Columbia University Press',
              href: 'https://cup.columbia.edu/book/sacred-knowledge/9780231174077',
            },
          ],
        },
        {
          blocks: [
            NO_TWO_SESSIONS,
            { type: 'text', lines: [
              'There’s no such thing as “the MDMA experience.” There are many different kinds of experience that can happen within a single session.',
              '§',
              'Some are emotional. Some are physical. Some are quietly profound. Some are difficult. Most sessions contain several of these.',
              '§',
              'Knowing the territory ahead of time won’t change what happens. But it can change how you respond to it.',
            ] },
          ],
        },
        {
          blocks: [
            PERSONAL_MATERIAL,
            { type: 'text', lines: [
              'The most common territory with MDMA is personal and relational. Memories, relationships, unfinished emotional business.',
              '§',
              'Things you haven’t let yourself feel. Conversations you never had. Moments from childhood you haven’t thought about in years. Grief you set aside because life kept moving.',
              '§',
              'MDMA tends to invite this material forward rather than force it. Early researchers described it as making inner exploration feel approachable rather than overwhelming.',
            ] },
          ],
        },
        {
          blocks: [
            THE_BODY,
            { type: 'text', lines: [
              'Your body will be an active participant.',
              '§',
              'Warmth, tingling, jaw tension, waves of physical release. But also subtler things: the way your chest opens when something emotional lands, the way tension shows up in your shoulders or stomach before your mind has caught up.',
              '§',
              'A lot of important information during a session comes through the body first, not through thoughts.',
            ] },
          ],
        },
        {
          blocks: [
            DIFFICULT_PASSAGES,
            { type: 'text', lines: [
              'Not everything that arises will feel good.',
              '§',
              'Sadness, fear, shame, anger, physical discomfort, even moments of emptiness or confusion. These are not signs that something has gone wrong. They’re some of the most therapeutically valuable parts of a session.',
              '§',
              'One thing that makes MDMA unique: it tends to create a kind of distance between you and your difficult emotions. You can see them clearly without being swallowed by them. Grief can be present without being annihilating. Fear can surface without triggering panic. This window of clarity is one of the most therapeutically powerful aspects of the substance.',
              '§',
              'Richards called difficult experiences “uninvited guests.” His advice was simple: greet them. With MDMA, you’re better equipped to do that than you might expect.',
            ] },
          ],
        },
        {
          blocks: [
            TOWARD_NOT_AWAY,
            { type: 'text', lines: [
              'The single most important thing to understand about working with difficult material:',
              '§',
              'Move toward it, not away from it.',
              '§',
              'When fear arises, the instinct is to distract, resist, or analyze. But the things that frighten us during a session tend to lose their power when we face them directly. Richards compared them to kids in Halloween masks. The game is up once you step closer.',
            ] },
          ],
        },
        {
          blocks: [
            YOUR_PATTERNS,
            {
              type: 'selector',
              key: 'copingPattern',
              mappingTerritoryField: 'copingPattern',
              columns: 1,
              prompt: 'When something emotionally difficult comes up in everyday life, what’s your usual response?',
              options: COPING_PATTERN_OPTIONS,
            },
            {
              type: 'mapping-territory-capture',
              source: 'selector',
              field: 'copingPattern',
              selectorKey: 'copingPattern',
            },
            { type: 'text', tightAbove: true, lines: [
              'There’s no wrong answer. This is just about noticing your default. During the session, you’ll have a chance to try something different.',
            ] },
          ],
        },
        {
          blocks: [
            EXPANDED_STATES,
            { type: 'text', lines: [
              'MDMA can also open into experiences of deep connection, love, or clarity that feel larger than your ordinary sense of self.',
              '§',
              'Profound compassion. A sense that everything is fundamentally okay. Feeling connected to people, to life itself, in a way that’s hard to put into words.',
              '§',
              'These aren’t hallucinations or delusions. Researchers have found that experiences like these are among the most meaningful events people report across their entire lives.',
            ] },
          ],
        },
        {
          blocks: [
            SPACE_BETWEEN,
            { type: 'text', lines: [
              'A lot of a session isn’t dramatic at all.',
              '§',
              'Quiet stretches. Listening to music and not thinking much. Feeling peaceful. Noticing small things with unusual clarity. Drifting.',
              '§',
              'These periods aren’t wasted time. They’re often when the deepest integration is happening beneath the surface. You don’t need to be “working on something” every minute.',
            ] },
          ],
        },
        {
          blocks: [
            ASKING_ATTENTION,
            { type: 'text', lines: [
              'Before a session, it can help to gently notice what’s already alive in you. Not to set an agenda, but to acknowledge what’s present.',
            ] },
            ASKING_FOR_ATTENTION_PROMPT,
            {
              type: 'mapping-territory-capture',
              source: 'prompt',
              field: 'askingForAttention',
              promptKey: 'asking-for-attention',
            },
            { type: 'text', tightAbove: true, lines: [
              'You don’t need to come in with a plan. Sometimes the most important material isn’t what you expected.',
            ] },
          ],
        },
        {
          blocks: [
            PSYCHE_INTELLIGENT,
            { type: 'text', lines: [
              'One of Richards’ deepest convictions, after guiding hundreds of sessions: if something comes into consciousness during a session, it means you’re ready to deal with it.',
              '§',
              'Your mind won’t surface anything you’re not capable of meeting. If it comes to you, that’s the invitation.',
              '§',
              'This doesn’t mean it will be easy. It means you can trust the process.',
            ] },
          ],
        },
        {
          blocks: [
            DONT_FORCE,
            { type: 'text', lines: [
              'There’s a common anxiety before sessions: “What if nothing happens?” or “What if I do it wrong?”',
              '§',
              'You can’t do it wrong. Your only job is to stay open and be willing to be with whatever shows up. You don’t need to chase insights, manufacture emotions, or perform your own healing.',
              '§',
              'The medicine does its part. You do yours by paying attention.',
            ] },
          ],
        },
        {
          blocks: [
            APPROACH_STYLE,
            {
              type: 'selector',
              key: 'approachStyle',
              mappingTerritoryField: 'approachStyle',
              columns: 1,
              prompt: 'People enter sessions with different orientations. Which feels closest to yours right now?',
              options: APPROACH_STYLE_OPTIONS,
            },
            {
              type: 'mapping-territory-capture',
              source: 'selector',
              field: 'approachStyle',
              selectorKey: 'approachStyle',
            },
            { type: 'text', tightAbove: true, lines: [
              'All of these are valid. Even if you have a specific intention, be willing to let the session take you somewhere unexpected.',
            ] },
          ],
        },
        {
          blocks: [
            MUSIC,
            { type: 'text', lines: [
              'The Hopkins psilocybin studies treat music as a co-therapist, not background noise. The same principle applies here.',
              '§',
              'Have your music ready before you begin. Choose something without lyrics for the peak hours. Let it be emotionally spacious. Classical, ambient, or instrumental works well.',
              '§',
              'When you notice yourself resisting a piece of music, try staying with it. The resistance itself is sometimes where the work is.',
            ] },
            { type: 'music-recommendations' },
            { type: 'text', tightAbove: true, lines: [
              'This app includes several music-focused activities with curated recommendations. You can browse the full list anytime using the list button above.',
            ] },
          ],
        },
        {
          blocks: [
            WORDS_LATER,
            { type: 'text', lines: [
              'Some of what you experience won’t make sense in the moment. Some of it won’t translate into language at all.',
              '§',
              'That’s normal. Richards spent his career wrestling with the limits of language in describing these states. The understanding often arrives days or weeks later, not during the session.',
              '§',
              'Don’t pressure yourself to narrate or interpret your experience in real time. Just be in it.',
            ] },
          ],
        },
        {
          blocks: [
            WORD_TO_SELF,
            { type: 'text', lines: [
              'Last thing before we close this out.',
            ] },
            WORD_TO_SELF_PROMPT,
            {
              type: 'mapping-territory-capture',
              source: 'prompt',
              field: 'wordToSelf',
              promptKey: 'word-to-self',
            },
          ],
        },
        {
          blocks: [
            CLOSING,
            { type: 'text', lines: [
              'The territory will be your own. No map can fully prepare you for what’s yours to discover.',
              '§',
              'But now you have a rough orientation: personal material may surface, your body will be part of the conversation, difficult passages are valuable rather than dangerous, and you can trust what arises.',
              '§',
              'The rest is between you and the experience.',
            ] },
            { type: 'mapping-territory-completion' },
          ],
        },
      ],
    },
  ],
};
