/**
 * Test Module Content — Comprehensive MasterModule Test
 *
 * Exercises every capability of the MasterModule system:
 *
 * BLOCK TYPES:      header, text, prompt, selector, choice, animation, alarm, review
 * SECTION TYPES:    screens, meditation, timer, generate
 * FEATURES:         shorthand screens, explicit blocks, mixed-content screens,
 *                   conditional blocks, conditional screens, choice routing (cross-section),
 *                   choice without routing (inline conditions), section visit tracking,
 *                   meditation with gong config, review screen, PNG generation,
 *                   right-slot image viewer, accent terms, numbered items
 *
 * FLOW:
 *   1. Intro — shorthand screens (text, prompt, selector single, selector multi)
 *   2. Mixed blocks — header+text+selector+prompt on one page, no-header, custom animation
 *   3. Meditation — short-grounding with transcript + seek
 *   4. Post-meditation check-in — choice routing to different sections
 *   5. Tailored response — routed section (settled or activated)
 *   6. Conditional inline content — choice without routing + conditional blocks + conditional screen
 *   7. Multi-prompt screen — two prompts on one screen for counter testing
 *   8. Review — editable review of first two prompts
 *   9. Generate — PNG generation with RevealOverlay
 *  10. Timer — music timer with recommendations + alarm
 *  11. Closing — right-slot viewer + visited-section conditions + final prompt + animation
 */

export const testModuleContent = {
  accentTerms: {
    master_module: 'MasterModule',
    screen_types: 'screen types',
    blocks: 'blocks',
    conditional: 'conditional rendering',
  },

  idle: {
    animation: 'ascii-moon',
  },

  completion: {
    title: 'Test complete',
    message: 'All capabilities exercised successfully.',
  },

  journal: {
    saveOnComplete: true,
    titlePrefix: 'MASTER MODULE TEST',
  },

  sections: [
    // ═══════════════════════════════════════════════════════════════════════════
    // 1. SHORTHAND SCREENS — all basic block types via shorthand expansion
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'intro',
      type: 'screens',
      screens: [
        // Text with all markup types (§ spacer, {accent}, {#N} numbered)
        {
          type: 'text',
          header: 'Welcome to the Test',
          lines: [
            'This module tests every {master_module} capability.',
            '§',
            'You will move through {screen_types}, {blocks}, and {conditional}.',
            '§',
            '{#1} Shorthand screens and explicit blocks',
            '{#2} Mixed-content screens with multiple block types',
            '{#3} Meditation with transcript and seek controls',
            '{#4} Choice routing between sections',
            '{#5} Conditional inline content based on choices',
            '{#6} Review screens and PNG generation',
            '{#7} Timer with music recommendations',
          ],
        },

        // Prompt with context
        {
          type: 'prompt',
          prompt: 'What brings you here today?',
          context: 'Take a moment to notice what is present.',
          placeholder: 'Write whatever comes to mind...',
        },

        // Selector — single select, 2 columns, with journal follow-up
        {
          type: 'selector',
          prompt: 'How are you feeling right now?',
          context: 'Choose the one that fits best.',
          key: 'currentFeeling',
          columns: 2,
          multiSelect: false,
          options: [
            { id: 'calm', label: 'Calm' },
            { id: 'curious', label: 'Curious' },
            { id: 'energized', label: 'Energized' },
            { id: 'uncertain', label: 'Uncertain' },
          ],
          journal: {
            prompt: 'Want to say more about that?',
            placeholder: 'Any details...',
            rows: 3,
          },
        },

        // Selector — multi select, 3 columns, no journal
        {
          type: 'selector',
          prompt: 'Which of these resonate?',
          key: 'resonating',
          columns: 3,
          multiSelect: true,
          options: [
            { id: 'openness', label: 'Openness' },
            { id: 'connection', label: 'Connection' },
            { id: 'clarity', label: 'Clarity' },
            { id: 'release', label: 'Release' },
            { id: 'grounding', label: 'Grounding' },
            { id: 'wonder', label: 'Wonder' },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. EXPLICIT BLOCKS — mixed content on single screens
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'mixed-blocks',
      type: 'screens',
      screens: [
        // Mixed: header + text + selector + prompt on ONE screen
        {
          blocks: [
            { type: 'header', title: 'Mixed Blocks', animation: 'leaf' },
            { type: 'text', lines: ['This screen combines text, a selector, and a prompt — all on one page.'] },
            { type: 'selector', prompt: 'Quick pick', key: 'quickPick', columns: 3,
              options: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }, { id: 'c', label: 'Gamma' }] },
            { type: 'prompt', prompt: 'And a thought?', placeholder: 'Anything...' },
          ],
        },

        // No header — clean minimal screen
        {
          blocks: [
            { type: 'text', lines: [
              'This screen has no header block — just text.',
              '§',
              'Useful for immersive or minimal screens where you want the content to speak for itself.',
            ] },
          ],
        },

        // Custom animation in header
        {
          blocks: [
            { type: 'header', title: 'Custom Animation', animation: 'compass' },
            { type: 'text', lines: ['This screen uses the compass animation instead of AsciiMoon.'] },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. MEDITATION SECTION — audio playback with transcript + seek
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'meditation',
      type: 'meditation',
      meditationId: 'short-grounding',
      animation: 'morphing-shapes',
      showTranscript: true,
      showSeekControls: true,
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. CHOICE ROUTING �� cross-section routing based on selection
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'post-meditation-checkin',
      type: 'screens',
      hideTimer: true,
      screens: [
        {
          type: 'choice',
          prompt: 'How did that land?',
          key: 'postMeditationCheckin',
          options: [
            { id: 'settled', label: 'Settled and grounded', route: 'settled-response' },
            { id: 'activated', label: 'Still activated', route: 'activated-response' },
          ],
        },
      ],
    },

    // Route target A
    {
      id: 'settled-response',
      type: 'screens',
      screens: [
        {
          type: 'text',
          header: 'Grounded',
          lines: [
            'Good. That settling feeling is your nervous system finding its rhythm.',
            '§',
            'Carry that with you into the next part.',
          ],
        },
      ],
    },

    // Route target B
    {
      id: 'activated-response',
      type: 'screens',
      screens: [
        {
          type: 'text',
          header: 'Still Moving',
          lines: [
            'That is perfectly fine. Activation is not something to fix.',
            '§',
            'Let it be there as you continue.',
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. CONDITIONAL CONTENT — choice without routing + conditional blocks/screens
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'conditional-test',
      type: 'screens',
      screens: [
        // Choice with NO route — saves value for conditional rendering
        {
          type: 'choice',
          prompt: 'Pick a path to test conditional content',
          key: 'pathChoice',
          options: [
            { id: 'alpha', label: 'Path Alpha' },
            { id: 'beta', label: 'Path Beta' },
          ],
        },

        // Conditional blocks on one screen — only matching blocks render
        {
          blocks: [
            { type: 'header', title: 'Your Path' },
            { type: 'text', condition: { key: 'pathChoice', equals: 'alpha' },
              lines: ['You chose Alpha. This text only appears for Alpha.'] },
            { type: 'text', condition: { key: 'pathChoice', equals: 'beta' },
              lines: ['You chose Beta. This text only appears for Beta.'] },
            { type: 'text', lines: ['This text always appears regardless of choice.'] },
            { type: 'prompt', condition: { key: 'pathChoice', equals: 'alpha' },
              prompt: 'Alpha-only prompt — what does Alpha mean to you?', placeholder: 'Only Alpha sees this...' },
            { type: 'prompt', condition: { key: 'pathChoice', equals: 'beta' },
              prompt: 'Beta-only prompt — what does Beta mean to you?', placeholder: 'Only Beta sees this...' },
          ],
        },

        // Conditional entire screen — only shows for Alpha
        {
          condition: { key: 'pathChoice', equals: 'alpha' },
          type: 'text',
          header: 'Alpha Exclusive',
          lines: ['This entire screen is only visible if you chose Alpha.', '§', 'Beta users skip it entirely.'],
        },

        // Condition using 'in' — shows for either choice
        {
          blocks: [
            { type: 'header', title: 'Both Paths' },
            { type: 'text', condition: { key: 'pathChoice', in: ['alpha', 'beta'] },
              lines: ['This block uses the "in" condition — it appears for both Alpha and Beta.'] },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. MULTI-PROMPT SCREEN — tests prompt counter across blocks
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'multi-prompt',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Two Prompts, One Screen' },
            { type: 'text', lines: ['This screen has two prompt blocks. The counter should show the correct position for each.'] },
            { type: 'prompt', prompt: 'First prompt on this screen', placeholder: 'Prompt A...' },
            { type: 'prompt', prompt: 'Second prompt on this screen', placeholder: 'Prompt B...' },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. REVIEW SCREEN �� assembles earlier prompt responses for editing
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'review',
      type: 'screens',
      screens: [
        {
          type: 'review',
          header: 'Review Your Responses',
          context: 'Here is what you wrote earlier. You can edit before continuing.',
          assembleFrom: [0, 1, 2, 3, 4, 5],
          editable: true,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. GENERATE SECTION — PNG generation with RevealOverlay
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'generate-test',
      type: 'generate',
      generatorId: 'test-solid-color',
      buttonLabel: 'Generate Test Image',
      previewLines: [
        'This will generate a simple test image to validate the generate flow.',
        '§',
        'The RevealOverlay will play, then the image viewer will appear.',
      ],
      saveToJournal: false,
      imageName: 'test-image',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. TIMER SECTION — countdown with music recommendations
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'music-break',
      type: 'timer',
      animation: 'morphing-shapes',
      showAlarm: true,
      recommendations: 'music',
      allowAddTime: true,
      idleDescription: 'Set a duration, choose an album or pick from our recommendations, and let the music move through you.',
      activeDescription: 'Relax, listen, and let the music move through you.',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 10. CLOSING — right-slot viewer, visited-section conditions, final screens
    // ═══════════════════════════════════════════════════════════════════════════
    {
      id: 'closing',
      type: 'screens',
      rightSlotViewer: 'test-solid-color',
      screens: [
        // Section-visit conditions — shows different text based on which route was taken
        {
          blocks: [
            { type: 'header', title: 'Your Journey' },
            { type: 'text', condition: { visited: 'settled-response' },
              lines: ['You took the settled path after meditation.'] },
            { type: 'text', condition: { visited: 'activated-response' },
              lines: ['You took the activated path after meditation.'] },
            { type: 'text', condition: { visited: 'meditation' },
              lines: ['You completed the meditation section.'] },
            { type: 'text', condition: { visited: 'music-break' },
              lines: ['You completed the music timer section.'] },
            { type: 'text', lines: [
              '§',
              'The right-slot button (image icon) should be visible in the control bar — tap it to re-view the generated test image.',
            ] },
          ],
        },

        // Final prompt
        {
          type: 'prompt',
          prompt: 'What stayed with you from all of that?',
          placeholder: 'A final thought...',
        },

        // Animation screen (self-contained, no header prepended)
        {
          type: 'animation',
          animation: 'ascii-diamond',
          header: 'Well done',
          lines: [
            'You have tested every {master_module} capability.',
            '§',
            'Shorthand screens, explicit {blocks}, {conditional}, choice routing,',
            'meditation, timer, PNG generation, and section visit tracking.',
          ],
        },

        // Alarm screen
        {
          type: 'alarm',
          activityName: 'the test module',
        },
      ],
    },
  ],
};
