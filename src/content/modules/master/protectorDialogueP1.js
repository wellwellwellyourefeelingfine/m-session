/**
 * SEE FIRST: ../../../components/active/modules/MasterModule/MasterModuleStyleSheet.md
 *   This file is the canonical reference module — every master-module
 *   convention is exemplified somewhere in here. The style sheet's
 *   §3 ("Reference Module") indexes specific patterns to specific line
 *   ranges in this file. If you're authoring or migrating a module and
 *   want to see the conventions in practice, read the style sheet first,
 *   then come back here.
 *
 * Dialogue with a Protector — Part 1: "Meeting a Protector"
 *
 * MasterModule content config replacing ProtectorDialoguePart1Module.jsx.
 * Lives at peak phase. Walks the user through three intro screens →
 * guided meditation → naming → feel-toward check (with unblending detour
 * for negative feel-toward responses) → body location → message → closing.
 *
 * Writes durable identity data to sessionProfile.protector via the
 * ProtectorFieldBlock so Part 2 (and any future module) can reference
 * the named protector.
 */

import {
  PROTECTOR_EXAMPLES,
  PROTECTOR_EXAMPLES_FOOTNOTE,
  FEEL_TOWARD_OPTIONS,
  FEEL_TOWARD_UNBLENDING_LINES,
} from './protectorDialogueShared';

// Header block reused across the three intro screens so they share a
// stable title + animation (no header re-fade between screens).
const INTRO_HEADER = {
  type: 'header',
  title: 'Meeting a Protector',
  animation: 'ascii-moon',
};

// Closing section header — diamond animation marks the moment of completion.
const CLOSING_HEADER = {
  type: 'header',
  title: 'Closing Notes',
  animation: 'ascii-diamond',
};

// Shared header for the post-meditation section. The naming screen and the
// feel-toward screen both render under this header — same JS reference on
// both screens so ScreensSection's same-title/same-animation comparison
// keeps the title and ascii-moon anchored (no re-fade) across the
// transition. See MasterModule.jsx top docstring, conventions §4–§5.
const NAMING_SECTION_HEADER = {
  type: 'header',
  title: 'What Surfaced',
  animation: 'ascii-moon',
};

// Shared header for the unblending detour — same idiom as
// NAMING_SECTION_HEADER above so both unblending screens render under one
// stable title/animation.
const UNBLENDING_HEADER = {
  type: 'header',
  title: 'Finding Space',
  animation: 'ascii-moon',
};

// Choice options for the feel-toward step. Positive options (no `route`)
// fall through sequentially; negative options route into the unblending
// detour with a bookmark, returning to the next main section after.
const FEEL_TOWARD_CHOICES = FEEL_TOWARD_OPTIONS.map((opt) => ({
  id: opt.id,
  label: opt.label,
  description: opt.description,
  ...(opt.positive ? {} : { route: { to: 'unblending', bookmark: true } }),
}));

// Per-option recheck responses for the unblending detour. Each option in
// FEEL_TOWARD_OPTIONS gets a tailored note rather than a single boilerplate
// for negatives. Positive options affirm the shift; negative options
// validate the holdback while giving permission to continue. Rendered as
// six conditional text blocks below the recheck choice — only the matching
// one renders (see evaluateCondition + the choice's `key`).
const FEEL_TOWARD_RECHECK_NOTES = {
  curious: 'Curiosity is the doorway. {protectorName} can feel the difference between being observed and being met. Hold that quality as you continue.',
  warm: "That warmth is the shift. {protectorName} has been working alone for a long time — even a flicker of compassion changes what's possible between you.",
  open: "Openness is enough. You don't need to feel any particular way — only willing to be with it. That's the ground for everything that follows.",
  frustrated: "Still here. That's information too. Notice the frustration without becoming it — it's another part with its own reasoning. You can keep going while it sits beside you.",
  afraid: '{protectorName} may be guarding something tender, or another part is wary of getting close. Honor the fear — it has something to say. Move at whatever pace feels safe.',
  numb: "Numbness is its own protector — it shows up when something needs distance. You don't have to push through it. Acknowledge it's here, and let it come along.",
};

export const protectorDialogueP1Content = {
  idleAnimation: 'ascii-moon',
  idle: {
    // Unified parent title — both linked parts use this so the activity
    // reads as one continuous practice across the timeline.
    title: 'Dialogue with a Protector',
    // Per-part subtitle in small grey mono caps below the animation.
    subtitle: 'Part 1: Meeting a Protector',
    // Whole-activity time estimate shown on this module's idle pill. The
    // audio meditation itself is ~20 min (declared as fixedDuration on the
    // meditation, shown on the meditation section's own idle). The +15 min
    // here accounts for the educational intro screens and the naming /
    // body-location / message reflection steps that bracket it.
    durationMinutes: 35,
    // Description sits between subtitle and pills. Combines the IFS framing
    // (parts as protective patterns) with the personifying-as-distance idea
    // and the practical "what you'll do in this part" arc — so the user
    // gets the conceptual hook and the activity goal in one read.
    description:
      'Based on Internal Family Systems (IFS), which uses the idea of parts and protective patterns of the mind. Personifying a pattern might help create enough distance to observe it with curiosity instead of being caught inside it. In this first part, you\'ll slow down and meet one of your protectors. Through a guided meditation and reflection, you\'ll begin to notice it, name it, and start a relationship with it. Not to fix anything. Just to say hello.',
  },

  journal: {
    saveOnComplete: true,
    titlePrefix: 'PROTECTOR DIALOGUE — PART 1',
  },

  sections: [
    // ── A. Intro: 3 progressively-revealed text screens ────────────────────
    {
      id: 'intro',
      type: 'screens',
      persistBlocks: true,
      ritualFade: true,
      screens: [
        {
          blocks: [
            INTRO_HEADER,
            { type: 'text', lines: [
              'This activity is about getting to know a part of yourself that works hard to protect you.',
              '§',
              'Not to fix it. Not to get rid of it. Just to understand it a little better.',
            ] },
          ],
        },
        {
          blocks: [
            INTRO_HEADER,
            { type: 'text', lines: [
              'This activity is about getting to know a part of yourself that works hard to protect you.',
              '§',
              'Not to fix it. Not to get rid of it. Just to understand it a little better.',
            ] },
            { type: 'text', lines: [
              'You carry patterns that formed for good reasons. Ways of coping, defending, managing the world.',
              '§',
              'An inner critic that pushes you to be better. A part that avoids conflict at all costs. A part that stays busy so you never have to sit still. A part that reaches for distraction the moment things get uncomfortable.',
              '§',
              "These aren't flaws. They're protectors. They took on their roles when you needed them.",
            ] },
          ],
        },
        {
          blocks: [
            INTRO_HEADER,
            { type: 'text', lines: [
              'This activity is about getting to know a part of yourself that works hard to protect you.',
              '§',
              'Not to fix it. Not to get rid of it. Just to understand it a little better.',
            ] },
            { type: 'text', lines: [
              'You carry patterns that formed for good reasons. Ways of coping, defending, managing the world.',
              '§',
              'An inner critic that pushes you to be better. A part that avoids conflict at all costs. A part that stays busy so you never have to sit still. A part that reaches for distraction the moment things get uncomfortable.',
              '§',
              "These aren't flaws. They're protectors. They took on their roles when you needed them.",
            ] },
            { type: 'text', lines: [
              'Right now, in this state, something interesting happens.',
              '§',
              'The walls these protectors usually maintain tend to soften on their own. You may already be sensing parts of yourself more clearly than usual.',
              '§',
              "We're going to work with that. Not by forcing anything open, just by paying attention to what's already here.",
            ] },
          ],
        },
      ],
    },

    // ── B. Meditation: "Meeting a Protector" guided audio ──────────────────
    {
      id: 'meditation',
      type: 'meditation',
      meditationId: 'protector-dialogue',
      animation: 'morphing-shapes',
      showTranscript: true,
    },

    // ── C. Naming + feel-toward (one section, two screens) ────────────────
    // Both screens share NAMING_SECTION_HEADER so the title and ascii-moon
    // animation stay anchored (no re-fade) when advancing from naming to
    // feel-toward. The negative-feel-toward route to 'unblending' still
    // bookmarks back to the section after this one (= 'unblending', whose
    // own advance-after-completion lands on body-location).
    {
      id: 'naming',
      type: 'screens',
      screens: [
        // Screen 1 — name + describe the protector
        {
          blocks: [
            NAMING_SECTION_HEADER,
            { type: 'text', lines: [
              "Now we'll put words to what just came up. Nothing precise — just whatever feels true.",
            ] },
            {
              type: 'protector-field',
              field: 'name',
              prompt: 'In a word or short phrase, what would you call it?',
              placeholder: 'e.g., The Critic, The Wall, The Fixer...',
              maxLength: 80,
              centerInput: true,
              journalLabel: 'Protector',
            },
            {
              type: 'protector-field',
              field: 'description',
              prompt: 'Briefly describe what it does or how it shows up.',
              placeholder: 'e.g., It pushes me to be perfect so no one can criticize me first...',
              multiline: true,
              rows: 3,
              journalLabel: 'Description',
            },
            {
              type: 'expandable',
              showLabel: 'Examples of common protectors',
              icon: 'circle-plus',
              alignment: 'left',
              items: PROTECTOR_EXAMPLES,
              footnote: PROTECTOR_EXAMPLES_FOOTNOTE,
            },
          ],
        },
        // Screen 2 — feel-toward check (header + animation persist from screen 1)
        {
          blocks: [
            NAMING_SECTION_HEADER,
            { type: 'text', lines: [
              "Take a moment to check. The relationship you build with this protector depends on where you're coming from.",
            ] },
            {
              type: 'choice',
              prompt: 'How do you feel toward {protectorName}?',
              key: 'feelTowardInitial',
              columns: 2,
              options: FEEL_TOWARD_CHOICES,
            },
          ],
        },
      ],
    },

    // ── E. Unblending detour: 2-screen progressive reveal w/ recheck ───────
    // Reachable only via the bookmark route from D. After the recheck choice,
    // sequential advance pops the bookmark and lands on `body-location`.
    {
      id: 'unblending',
      type: 'screens',
      persistBlocks: true,
      screens: [
        {
          blocks: [
            UNBLENDING_HEADER,
            { type: 'text', lines: FEEL_TOWARD_UNBLENDING_LINES },
          ],
        },
        {
          blocks: [
            UNBLENDING_HEADER,
            { type: 'text', lines: FEEL_TOWARD_UNBLENDING_LINES },
            {
              type: 'choice',
              prompt: 'How do you feel toward {protectorName} now?',
              key: 'feelTowardRecheck',
              columns: 2,
              // No routes — both positive and negative selections fall through
              // sequentially, which pops the bookmark back to body-location.
              options: FEEL_TOWARD_OPTIONS.map((opt) => ({
                id: opt.id,
                label: opt.label,
                description: opt.description,
              })),
            },
            // One conditional text block per recheck option — only the
            // matching note renders. Spread keeps the blocks at stable
            // positions in the screen array (in the iteration order of
            // FEEL_TOWARD_OPTIONS) so persistBlocks reconciliation behaves.
            ...FEEL_TOWARD_OPTIONS.map((opt) => ({
              type: 'text',
              condition: { key: 'feelTowardRecheck', equals: opt.id },
              lines: [FEEL_TOWARD_RECHECK_NOTES[opt.id]],
            })),
          ],
        },
      ],
    },

    // ── F. Body location: where the protector lives in the body ────────────
    {
      id: 'body-location',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Bodily Feeling', animation: 'ascii-moon' },
            { type: 'text', lines: [
              'If you noticed a tightness, warmth, heaviness, pressure, or hollowness — anywhere you felt {protectorName} — take a moment to note it.',
            ] },
            {
              type: 'protector-field',
              field: 'bodyLocation',
              prompt: 'Where in your body did you feel {protectorName}?',
              placeholder: 'e.g., tightness in my chest, knot in my stomach, pressure behind my eyes',
              journalLabel: 'Body location',
            },
          ],
        },
      ],
    },

    // ── G. Message: a short message-to-protector ───────────────────────────
    {
      id: 'message',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Say Something To It', animation: 'ascii-moon' },
            { type: 'text', lines: [
              'Before we close this part, take a moment to write a short message to {protectorName}. One message. Whatever comes.',
              '§',
              'You might thank it. You might tell it you see how hard it has been working. You might say something you have never said before.',
              '§',
              "There's no right answer. Just write whatever feels true.",
            ] },
            {
              type: 'protector-field',
              field: 'message',
              prompt: 'What would you say to {protectorName}?',
              placeholder: 'Write whatever feels true...',
              multiline: true,
              rows: 4,
              journalLabel: 'Message to protector',
            },
          ],
        },
      ],
    },

    // ── H. Closing: 2 progressively-revealed screens with diamond ──────────
    {
      id: 'closing',
      type: 'screens',
      persistBlocks: true,
      ritualFade: true,
      screens: [
        {
          blocks: [
            CLOSING_HEADER,
            { type: 'text', lines: [
              "Don't try to analyze it yet. What surfaced is more honest before you shape it into a story about yourself.",
            ] },
          ],
        },
        {
          blocks: [
            CLOSING_HEADER,
            { type: 'text', lines: [
              "Don't try to analyze it yet. What surfaced is more honest before you shape it into a story about yourself.",
            ] },
            { type: 'text', lines: [
              "Part 2 picks up from here — the origins of {protectorName}, the fear underneath, and what it might be asking for. You'll write to it directly and listen for what comes back.",
              '§',
              "Patterns like this stay hidden by running quietly in the background. Naming one and turning toward it changes the relationship on its own. Nothing else is required of you right now.",
            ] },
          ],
        },
      ],
    },
  ],
};
