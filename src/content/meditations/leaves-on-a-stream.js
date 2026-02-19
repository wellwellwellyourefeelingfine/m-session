/**
 * Leaves on a Stream Meditation
 *
 * An ACT (Acceptance and Commitment Therapy) cognitive defusion exercise.
 * The user visualises thoughts as leaves floating on a stream, practising
 * observation without engagement.
 *
 * 21 prompts (18 base + 3 conditional) written at ~90 WPM for peak state.
 * Audio files are TTS-generated and placed in /audio/meditations/leaves-on-a-stream/
 *
 * Variable duration: 10, 15, or 20 minutes via expandable silence intervals
 * and conditional prompts for longer sessions.
 */

export const leavesOnAStreamMeditation = {
  id: 'leaves-on-a-stream',
  title: 'Leaves on a Stream',
  subtitle: 'ACT Cognitive Defusion',
  description: 'A guided audio meditation for observing your thoughts with curiosity rather than getting caught in them. Have your headphones or speakers ready.',
  baseDuration: 600,   // ~10 minutes base
  minDuration: 600,    // 10 min
  maxDuration: 1200,   // 20 min
  durationSteps: [10, 15, 20],
  defaultDuration: 10,

  // Audio configuration
  audio: {
    basePath: '/audio/meditations/leaves-on-a-stream/',
    format: 'mp3',
  },

  // Speaking rate — slower for peak state (90 WPM vs typical 150)
  speakingRate: 90,

  prompts: [
    // === MOVEMENT 1: SETTLING ===
    {
      id: 'settling-01',
      text: 'Let yourself settle into a comfortable position. You can close your eyes, or soften your gaze downward. Whatever feels right.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'settling-02',
      text: 'Take a few slow breaths. Not trying to breathe in any particular way. Just noticing the breath as it comes and goes on its own.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'settling-03',
      text: 'Feel the weight of your body wherever you\'re resting. The places where you make contact with the surface beneath you. Let gravity do the work.',
      baseSilenceAfter: 6,
      silenceExpandable: true,
      silenceMax: 12,
    },
    {
      id: 'settling-04',
      text: 'For the next few minutes, you\'re going to practice something simple. Not thinking harder. Not stopping your thoughts. Just changing where you stand in relation to them.',
      baseSilenceAfter: 6,
      silenceExpandable: false,
    },

    // === MOVEMENT 2: ESTABLISHING THE STREAM ===
    {
      id: 'stream-01',
      text: 'In your mind\'s eye, imagine you\'re sitting beside a gentle stream. It doesn\'t have to be a specific place. Just a quiet stream. Water moving slowly past you. You\'re sitting on the bank, watching.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'stream-02',
      text: 'Notice what the water looks like. The way it moves. There may be sounds. A soft current, leaves rustling nearby. Let the scene fill in however it wants to. There\'s no right way to see it.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'stream-03',
      text: 'Now notice that there are leaves on the surface of the water. Drifting slowly past. Each one arrives, floats by, and moves on downstream. One after another. Some fast, some slow.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'stream-04',
      text: 'Here is the practice. Whenever you notice a thought, gently place it on one of those leaves. Any thought at all. And watch it float away.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'stream-05',
      text: 'The thought might be a word, an image, a memory, a judgment, a plan. It doesn\'t matter what kind it is. Just place it on a leaf and let the stream carry it.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },

    // === MOVEMENT 3: THE PRACTICE ===
    {
      id: 'practice-01',
      text: 'Begin now. Just sit by the stream and wait for thoughts to come. When one appears, place it on a leaf. Watch the leaf drift out of sight. Then wait for the next one.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 50,
    },
    {
      id: 'practice-02',
      text: 'If you find yourself getting pulled into a thought, that\'s okay. Following it downstream, thinking it through, arguing with it. That\'s what minds do. The moment you notice it happened, you\'re already back. Just place that thought on the next leaf.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 50,
    },
    {
      id: 'practice-03',
      text: 'You don\'t need to change any thought. You don\'t need to believe it or disbelieve it. Just notice it\'s there and set it down on the water.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 45,
    },
    {
      id: 'practice-04',
      text: 'If your mind goes quiet, or you think you\'re not having any thoughts, notice that. That\'s a thought too. Place it on a leaf.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 40,
    },
    {
      id: 'practice-05',
      text: 'Some thoughts may feel heavy. Important. Urgent. You might feel a pull to hold onto them, to keep them from floating past. See if you can notice that pull, and still set the thought gently on the water. It\'s not going anywhere you can\'t follow later. Right now, you\'re just watching.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 55,
    },
    {
      id: 'practice-06',
      text: 'Keep going. Each thought gets its own leaf. Pleasant thoughts, difficult thoughts, mundane thoughts. They all get the same treatment. On a leaf. Into the stream.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 60,
    },
    // Conditional: only included for 15+ minute sessions
    {
      id: 'practice-07',
      text: 'If you notice you\'ve been judging how well you\'re doing this, that\'s just another thought. Trying to do it right, wondering if it\'s working. It all gets a leaf.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 55,
      conditional: { minDuration: 15 },
    },
    {
      id: 'practice-08',
      text: 'See if you can let the stream keep moving at its own pace. You don\'t need to speed it up or slow it down. Just sit here and watch. Thought by thought, leaf by leaf.',
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 60,
      conditional: { minDuration: 15 },
    },
    // Conditional: only included for 20 minute sessions
    {
      id: 'practice-09',
      text: 'You might notice a feeling beneath the thoughts. Something in your body. You can place that on a leaf too. The sensation, the mood, the texture of whatever is here right now. It all goes on the water.',
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 60,
      conditional: { minDuration: 20 },
    },

    // === MOVEMENT 4: CLOSING ===
    {
      id: 'closing-01',
      text: 'Gently now, let the stream begin to fade. You don\'t need to hold the image anymore. Let it dissolve on its own.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'closing-02',
      text: 'Before you come back, notice something. Thoughts came and went the entire time. But you were here the whole time. Watching. The thoughts changed. The one watching didn\'t.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 18,
    },
    {
      id: 'closing-03',
      text: 'You don\'t need to figure out what that means right now. Just notice that it\'s true.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 12,
    },
    {
      id: 'closing-04',
      text: 'When you\'re ready, let your awareness come back to the room. The weight of your body. The feeling of your breath. Take your time.',
      baseSilenceAfter: 8,
      silenceExpandable: false,
    },
  ],
};
