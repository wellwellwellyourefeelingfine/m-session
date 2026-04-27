/**
 * Pendulation Meditation
 *
 * A Somatic Experiencing (Peter Levine) guided meditation with branching paths.
 * The module has multiple audio sections separated by interactive checkpoint
 * screens that determine which section plays next.
 *
 * Sections:
 *   A: Core SE pendulation practice (~21 min)
 *   B: Survival response completion — fight/flight (~9 min)
 *   B-Ground: Brief grounding after B if user feels shaky (~2.5 min)
 *   C: Freeze/collapse support (~6 min)
 *   D: Closing — return to resource and orientation (~4 min)
 *
 * Valid flows:
 *   A → D (core only, ~25 min)
 *   A → B → D (fight/flight, ~34 min)
 *   A → C → D (freeze, ~31 min)
 *   A → B → C → D (full, ~40 min)
 *   A → B → B-ground → D (fight/flight + grounding, ~37 min)
 *
 * ~123 audio clips (split from 64 original prompts for ElevenLabs TTS quality).
 * Long prompts are split into shorter sub-chunks (≤3 sentences) at sentence
 * boundaries to prevent the TTS model from speeding up on longer text.
 * Sub-chunks play with baseSilenceAfter: 1 (1-second gap to prevent awkward
 * run-together); the original silence value is preserved on the final sub-chunk only.
 *
 * Audio files placed in /audio/meditations/pendulation/
 */

export const pendulationMeditation = {
  id: 'pendulation',
  title: 'Pendulation',
  subtitle: 'Somatic experiencing practice',
  description: 'A body-based practice for working with activation in the nervous system. You\u2019ll find a calm place in your body, approach something mildly activating, and move your attention slowly between them. Based on the somatic experiencing work of Peter Levine.',

  audio: {
    basePath: '/audio/meditations/pendulation/',
    format: 'mp3',
  },

  isFixedDuration: true,

  sections: {
    // ─── SECTION A: Core SE Pendulation Practice (~21 min) ────────────────────
    a: {
      id: 'section-a',
      label: 'Core Practice',
      prompts: [
        // Part 1: Settling In (~2 min)
        {
          id: 'a-settle-01a',
          text: 'Find a comfortable position. You can sit or lie down, whatever feels right. If you\u2019re on the floor, let your body spread out.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-settle-01b',
          text: 'Let your eyes close, or soften your gaze downward. There\u2019s no rush here. Take a moment to arrive.',
          baseSilenceAfter: 8,
          silenceExpandable: false,
        },
        {
          id: 'a-settle-02a',
          text: 'Notice the surface beneath you. The places where your body is being held. Your back against the chair, or the floor, or the bed.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-settle-02b',
          text: 'The weight of your legs. Your feet, if they\u2019re touching the ground. Let yourself be supported. You don\u2019t need to hold yourself up right now.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },
        {
          id: 'a-settle-03a',
          text: 'You don\u2019t need to relax. You don\u2019t need to feel any particular way.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-settle-03b',
          text: 'Just notice what\u2019s already here. Whatever is happening in your body right now... that\u2019s the starting place.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },

        // Part 2: Islands of Safety / Resourcing (~4:30)
        {
          id: 'a-resource-01a',
          text: 'Now, slowly, begin to scan through your body. You\u2019re looking for a place that feels okay. It doesn\u2019t need to feel good. Just... okay. Neutral.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-resource-01b',
          text: 'Maybe a little calm, or a little warm, or just quiet. It might be the palms of your hands. The soles of your feet. A spot in your chest, or your belly. Your forehead. Anywhere at all.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-resource-02a',
          text: 'If you\u2019ve found a spot, stay with it for a moment. Let your attention rest there, gently. In somatic experiencing, this is called an island of safety.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-resource-02b',
          text: 'A place in your body where things are not activated, not disturbed. Just at rest. This place is going to be your home base for the rest of this practice. Somewhere you can always return to.',
          baseSilenceAfter: 12,
          silenceExpandable: false,
        },
        {
          id: 'a-resource-03a',
          text: 'Get to know this area. Notice what it actually feels like. Is it warm, or cool? Heavy, or light? Still, or does it have some quality of movement?',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-resource-03b',
          text: 'Is there a texture to it... dense, soft, open, smooth? Take your time. There\u2019s no wrong answer. You\u2019re just getting familiar with how safety feels in your body.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-resource-04a',
          text: 'If a word comes to mind that captures what this place feels like, hold onto it. Calm. Warm. Still. Solid. Open. Soft. Whatever fits.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-resource-04b',
          text: 'This word is your anchor. You\u2019ll use it later to find your way back here.',
          baseSilenceAfter: 12,
          silenceExpandable: false,
        },
        {
          id: 'a-resource-05a',
          text: 'Spend a few more moments here. Let this feeling strengthen, just by paying attention to it. You\u2019re not creating it. It was already here.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-resource-05b',
          text: 'You\u2019re just letting your nervous system know... this place exists. It\u2019s available. It\u2019s yours.',
          baseSilenceAfter: 20,
          silenceExpandable: false,
        },

        // Part 3: Felt Sense — Tracking Sensations (~4:30)
        {
          id: 'a-track-01a',
          text: 'Now, gently, let your attention begin to wander through the rest of your body. Not searching for anything in particular. Just noticing.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-track-01b',
          text: 'What sensations are present right now? Anywhere in your body. Anything at all.',
          baseSilenceAfter: 12,
          silenceExpandable: false,
        },
        {
          id: 'a-track-02a',
          text: 'You might notice tension. Tightness. Warmth or coolness. Tingling. Heaviness. Pressure. Hollowness. A buzzing, or a deep stillness.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-track-02b',
          text: 'These are all just sensations. They\u2019re information. Your body is always communicating. Right now, you\u2019re learning to listen.',
          baseSilenceAfter: 12,
          silenceExpandable: false,
        },
        {
          id: 'a-track-03a',
          text: 'If you find an area that has some charge to it... some intensity, some aliveness, whether pleasant or unpleasant... let your attention settle there gently.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-track-03b',
          text: 'Not gripping it. Not analyzing it. Just being with it, the way you might sit beside a stream and watch the water.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-track-04a',
          text: 'Notice the qualities of what you\u2019re feeling. Is it sharp, or dull? Tight, or open? Moving, or still? Does it have a shape, or a size? A temperature? A color?',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-track-04b',
          text: 'Does it stay the same, or is it shifting, even slightly? The more specific you can be with yourself, the better. Your body responds to being noticed with this kind of care.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-track-05a',
          text: 'There\u2019s no need to figure out what it means. You don\u2019t need to connect it to a story, or a memory, or an emotion.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-track-05b',
          text: 'Right now you\u2019re just tracking sensation. Following what\u2019s there. Letting it be exactly what it is, without needing it to change.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },

        // Part 4: Approaching Activation (~3:30)
        {
          id: 'a-activate-01a',
          text: 'Now I\u2019m going to ask you to gently bring to mind something that carries some weight for you. Not the hardest thing in your life. Something moderate.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-activate-01b',
          text: 'Something that feels a little unresolved, or uncomfortable, or tender. If you were to rate it on a scale of zero to ten, aim for something around a three or a four. Enough to feel. Not enough to overwhelm.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },
        {
          id: 'a-activate-02a',
          text: 'You don\u2019t need to replay a whole story. Just let the feeling of it arrive. A relationship. A situation. A memory. Something unfinished.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-activate-02b',
          text: 'Let it come to the surface just enough that you can feel it register somewhere in your body.',
          baseSilenceAfter: 12,
          silenceExpandable: false,
        },
        {
          id: 'a-activate-03a',
          text: 'And now notice what happens physically. Where does this land in your body? What changes?',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-activate-03b',
          text: 'Does something tighten? Does your breathing shift? Is there heat, or cold, or pressure? Is there a pulling, or a bracing, or a clenching somewhere?',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-activate-04a',
          text: 'Stay with the physical sensation. Not the story. Not the thoughts about it. Just the sensation itself. Where it lives. What it feels like.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-activate-04b',
          text: 'Give it a word if you can. Tight. Heavy. Hot. Sharp. Churning. Hollow. Knotted. Whatever fits.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-activate-05a',
          text: 'You might notice that the sensation wants to grow, or move, or that your attention wants to pull away from it. Both of those are fine.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-activate-05b',
          text: 'If it becomes too much at any point, you can always return to your island of safety. That place is still there. It hasn\u2019t gone anywhere. You can go back to it any time.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },

        // Part 5: Pendulation (~7 min)
        {
          id: 'a-pend-01a',
          text: 'Now you have two places in your body. One that feels resourced... calm, at ease. And one that is activated... holding something, carrying some charge.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-01b',
          text: 'You\u2019re going to move your attention slowly between them. Back and forth. This is called pendulation, and it\u2019s the core of this practice.',
          baseSilenceAfter: 8,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-02a',
          text: 'Start with the activation. Feel it. Notice its qualities. Let it be there. You don\u2019t need to change it or fix it. Just acknowledge it.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-02b',
          text: 'You can say to it, quietly, inside yourself... you are welcome here. You are welcome here.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-03a',
          text: 'Now, slowly, shift your attention to your island of safety. The place that feels calm, or neutral. Let yourself arrive there. Feel the difference.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-03b',
          text: 'Let your system settle into it for a moment. Notice what happens in your body as you make this shift. Even small changes count.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-04a',
          text: 'Spend some time here. Let the resource strengthen. Feel the qualities of it again.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-04b',
          text: 'The warmth, the calm, the openness... whatever it is for you. Let your nervous system take it in.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-05a',
          text: 'When you\u2019re ready, slowly move your attention back toward the activation. You might notice it has changed.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-05b',
          text: 'It might feel a little different now... smaller, or shifted, or the same. Just notice. Stay with it, gently.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-06a',
          text: 'And now shift back, to your resource. Back and forth. Like a pendulum. Activation... and resource. Charge... and calm.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-06b',
          text: 'Each time you make this shift, you\u2019re teaching your nervous system something important: that it can touch the difficult thing and come back to safety. That it doesn\u2019t have to stay stuck in one place.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-07a',
          text: 'Continue this on your own now. Move at your own pace between these two places. There\u2019s no right speed.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-07b',
          text: 'Some people move slowly, some more quickly. Follow what feels natural. Notice what happens each time you shift.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-07c',
          text: 'Pay attention to any spontaneous changes... a deeper breath, a loosening, warmth spreading, a small tremor or movement. These are all signs that your body is processing something. Let them happen without interference.',
          baseSilenceAfter: 60,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-08a',
          text: 'As you continue, you may notice the distance between these two places starting to shrink. The activation may soften. The resource may expand.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-08b',
          text: 'Or you may feel a wave of something moving through... a release of breath, a wave of warmth, a feeling of settling. Whatever happens, let it. Whatever doesn\u2019t happen is fine too.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-08c',
          text: 'There is no target to reach. The practice is the pendulation itself. The movement between.',
          baseSilenceAfter: 45,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-09a',
          text: 'Take a few more moments with this. If you\u2019ve found a rhythm, stay with it. If the activation has mostly dissolved, you can rest in your resource.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-09b',
          text: 'If it\u2019s still there, that\u2019s okay. You can come back to this practice again. Each time you do it, the pendulation goes a little deeper.',
          baseSilenceAfter: 30,
          silenceExpandable: false,
        },

        // Part 6: Settling with the Voo Sound (~2 min)
        {
          id: 'a-voo-01',
          text: 'Now, let the pendulation come to a natural end. Let your attention settle wherever it wants to settle. Take a breath.',
          baseSilenceAfter: 8,
          silenceExpandable: false,
        },
        {
          id: 'a-voo-02a',
          text: 'There\u2019s one more thing you can do to help your body settle. On your next exhale, if you\u2019d like to, try making a low, steady sound... "vooooo." Let it come from deep in your belly.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-voo-02b',
          text: 'Not forced, not loud. Just a low hum that you can feel vibrating in your chest and your gut. This vibration helps the part of your nervous system that brings you back to rest.',
          baseSilenceAfter: 5,
          silenceExpandable: false,
        },
        {
          id: 'a-voo-03a',
          text: 'Take a full breath in... and on the exhale... vooooo. Let the sound last as long as the breath does.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-voo-03b',
          text: 'And when it\u2019s done, just sit with whatever you feel. Notice what shifts.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-voo-04a',
          text: 'You can do that once more, if it felt good. A full breath in... and a slow, low "vooooo" on the exhale.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'a-voo-04b',
          text: 'And then rest. Let your breathing return to normal. Let your body settle.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'a-voo-05',
          text: 'Notice how your body feels now, compared to when you started. You don\u2019t need to name it or evaluate it. Just notice.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },
        {
          id: 'a-pend-close',
          text: 'When you\u2019re ready, take a look at your screen. There\u2019s a short question about how you\u2019re feeling, and your answer will shape what comes next. Take your time. There\u2019s no rush.',
          baseSilenceAfter: 5,
          silenceExpandable: false,
        },
      ],
    },

    // ─── SECTION B: Survival Response Completion — Fight/Flight (~9 min) ──────
    b: {
      id: 'section-b',
      label: 'Survival Response',
      prompts: [
        {
          id: 'b-intro-01a',
          text: 'Your body is telling you there\u2019s something still moving. Some energy that hasn\u2019t finished. This is completely normal.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-intro-01b',
          text: 'When we go through overwhelming experiences, our bodies often begin a response... a push, a pull, a brace, a turn away... and something interrupts it before it can complete.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-intro-01c',
          text: 'That unfinished movement stays in the body, sometimes for years. Right now, your system is showing you what it started and never got to finish.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },
        {
          id: 'b-intro-02a',
          text: 'Let\u2019s give it room. Start by noticing where the energy is right now. Where in your body do you feel it most?',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-intro-02b',
          text: 'Arms, legs, chest, shoulders, jaw, hands, stomach? Just locate it. Let your attention go there.',
          baseSilenceAfter: 12,
          silenceExpandable: false,
        },
        {
          id: 'b-impulse-01a',
          text: 'Now notice if there\u2019s a direction to it. Is there something your body wants to do?',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-impulse-01b',
          text: 'You might feel an urge to push something away. To pull back. To reach forward. To turn away. To brace or tighten. To kick, or stand, or curl up, or take up more space.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-impulse-01c',
          text: 'It might be subtle... just the faintest flicker of an impulse. Or it might feel very clear and strong.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'b-impulse-02a',
          text: 'There\u2019s no wrong answer, and there\u2019s no pressure to find something. But if you do notice an impulse... an urge toward movement, a direction your body wants to go... I want you to follow it.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-impulse-02b',
          text: 'Very slowly. At maybe a quarter of its natural speed. Slow enough that you can feel every part of the movement as it happens.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },
        {
          id: 'b-follow-01a',
          text: 'If your hands want to push, let them push. Slowly. Against an imaginary surface, or against your own palms pressed together, or against the bed, or against the floor.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-follow-01b',
          text: 'Feel the strength in your arms as you push. Feel the intention behind the movement. This push belongs to you. It\u2019s something your body wanted to do once and couldn\u2019t.',
          baseSilenceAfter: 20,
          silenceExpandable: false,
        },
        {
          id: 'b-follow-02a',
          text: 'If your legs want to move... to run, to press, to kick, to stand... let them. Slowly. You can press your feet firmly into the floor or into a wall.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-follow-02b',
          text: 'Feel the power in your legs. Feel what it\u2019s like to have this movement finally available to you. Follow wherever the impulse leads.',
          baseSilenceAfter: 20,
          silenceExpandable: false,
        },
        {
          id: 'b-follow-03a',
          text: 'If you feel your body wanting to turn away, or pull back, or make itself smaller, follow that too. Slowly. Let your body take the shape it\u2019s reaching for.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-follow-03b',
          text: 'And if you feel the opposite... an urge to expand, to stretch out, to take up space... follow that. Whatever direction your body is moving in, that direction is right.',
          baseSilenceAfter: 20,
          silenceExpandable: false,
        },
        {
          id: 'b-follow-04a',
          text: 'Keep going at your own pace. Let the movement be slow enough that you can feel every part of it. This isn\u2019t about force or intensity. It\u2019s about completion.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-follow-04b',
          text: 'Your nervous system is finishing something it started a long time ago. The slowness is what lets it register that the response actually happened this time.',
          baseSilenceAfter: 30,
          silenceExpandable: false,
        },
        {
          id: 'b-discharge-01a',
          text: 'As you follow this movement, pay attention to what happens next. You might notice a spontaneous deep breath. A trembling or shaking in your arms, or your legs, or through your whole body.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-discharge-01b',
          text: 'Warmth spreading through your chest or belly. Tears. A sigh. A sudden wave of tiredness, or relief. These are all completion signals.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-discharge-01c',
          text: 'They mean your body is releasing energy that has been stored for a long time. Let them happen. Don\u2019t hold them back, and don\u2019t try to make them bigger than they are. Just let your body do what it needs to do.',
          baseSilenceAfter: 30,
          silenceExpandable: false,
        },
        {
          id: 'b-discharge-02a',
          text: 'If trembling or shaking comes, stay with it. It might feel unfamiliar, but it is not dangerous. This is what animals do after escaping a threat.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-discharge-02b',
          text: 'They shake, and then they return to normal. Your body knows how to do this too. Trust it.',
          baseSilenceAfter: 20,
          silenceExpandable: false,
        },
        {
          id: 'b-return-01a',
          text: 'When you feel the movement starting to wind down, or when you sense that something has completed, let yourself come to rest.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-return-01b',
          text: 'Return to your island of safety. That place in your body that feels calm or neutral. Let yourself land there gently.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'b-return-02a',
          text: 'Spend a few moments here. Let your system settle. You have just allowed your body to complete something that may have been unfinished for a very long time.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-return-02b',
          text: 'There\u2019s nothing more you need to do with it right now. Just be here, and let it integrate.',
          baseSilenceAfter: 20,
          silenceExpandable: false,
        },
        {
          id: 'b-close',
          text: 'When you\u2019re ready, take a look at your screen. There\u2019s one more question about how you\u2019re feeling.',
          baseSilenceAfter: 5,
          silenceExpandable: false,
        },
      ],
    },

    // ─── SECTION B-GROUND: Brief Grounding (~2.5 min) ────────────────────────
    bGround: {
      id: 'section-b-ground',
      label: 'Grounding',
      prompts: [
        {
          id: 'b-ground-01a',
          text: 'That shakiness is your nervous system discharging energy. It\u2019s a healthy sign, even though it might not feel comfortable right now. Let\u2019s help it settle.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-ground-01b',
          text: 'Feel the surface beneath you. Feel where your body is being supported. Press your feet gently into the floor, or into the bed. Feel the solidity of what\u2019s holding you.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },
        {
          id: 'b-ground-02a',
          text: 'Take a slow breath in. And on the exhale, make that low sound again... "vooooo." From deep in your belly.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-ground-02b',
          text: 'Let the vibration settle through your chest and your gut. Take another breath, and another "vooooo." One more if you\u2019d like. And then let your breathing return to normal.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'b-ground-03a',
          text: 'Now slowly open your eyes, if they were closed. Look around the room. Let your eyes move at their own pace.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-ground-03b',
          text: 'Notice something nearby... its color, its shape, its texture. Then find another object. And another. You\u2019re orienting yourself to the present moment. You\u2019re here, in this room, right now, and you\u2019re safe.',
          baseSilenceAfter: 12,
          silenceExpandable: false,
        },
        {
          id: 'b-ground-04a',
          text: 'Take one more breath. Notice how the shakiness has changed. It may still be there, but it should be settling.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'b-ground-04b',
          text: 'Your body knows how to come back to rest. Give it a few more moments.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },
      ],
    },

    // ─── SECTION C: Freeze/Collapse Support (~6 min) ──────────────────────────
    c: {
      id: 'section-c',
      label: 'Freeze Support',
      prompts: [
        {
          id: 'c-intro-01a',
          text: 'If your body feels heavy, or still, or hard to move... like something has shut down or gone quiet inside you... that\u2019s okay.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'c-intro-01b',
          text: 'What you\u2019re experiencing is one of your body\u2019s oldest and most powerful forms of protection. When the nervous system decides that fighting or running isn\u2019t possible, it does this instead. It slows everything down. It goes still.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'c-intro-01c',
          text: 'This response kept you safe once. It is not something wrong with you. It is something that worked.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },
        {
          id: 'c-intro-02a',
          text: 'You don\u2019t need to force yourself out of it. We\u2019re not going to fight the stillness.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'c-intro-02b',
          text: 'Instead, we\u2019re going to find its edges. The places where movement is still possible, even in the smallest way.',
          baseSilenceAfter: 8,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-01a',
          text: 'Start with your fingers. Can you feel them? Can you move them, even slightly? A tiny wiggle. A gentle curl.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-01b',
          text: 'Just the smallest movement you can make. If even that feels like too much right now, just bring your attention to the tips of your fingers.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-01c',
          text: 'Notice whatever is there... any warmth, or tingling, or pressure, or coolness. That awareness itself is a form of movement.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-02a',
          text: 'Now your toes. Can you feel them? Can you flex them, gently? Just a small movement. A press into the floor, or into the blanket.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-02b',
          text: 'Notice what happens in your body as you do this. Even the smallest movement is a signal to your nervous system that you are not frozen. That movement is available to you.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-03a',
          text: 'Let the movement grow, only if it wants to. If your hands want to open and close, let them. If your feet want to press or flex, let them.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-03b',
          text: 'Your head might want to turn, slowly, side to side. Your shoulders might want to roll, or lift, or drop. Follow whatever impulse comes. Don\u2019t force anything. Let your body set the pace entirely.',
          baseSilenceAfter: 20,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-04a',
          text: 'If you feel warmth starting to return to your limbs, or tingling, or a wave of feeling coming back into parts that were numb... that\u2019s the freeze beginning to thaw.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-04b',
          text: 'This can sometimes bring a rush of emotion. A sudden urge to move. Tears. Shaking. All of that is the energy underneath the stillness finally being allowed to move. It is welcome. Let it come.',
          baseSilenceAfter: 20,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-05a',
          text: 'Keep going at your own pace. From the periphery inward. Fingers, toes, hands, feet, arms, legs.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'c-micro-05b',
          text: 'Let movement return in its own time. There\u2019s no timeline for this. Your body will come back to full aliveness when it\u2019s ready, and not before.',
          baseSilenceAfter: 25,
          silenceExpandable: false,
        },
        {
          id: 'c-settle-01a',
          text: 'When you feel some aliveness returning... when the heaviness has lifted even a little... let yourself rest there. Notice the difference between where you were and where you are now.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'c-settle-01b',
          text: 'You didn\u2019t force anything. Your body found its own way back to movement. That capacity was always there, underneath the stillness. It was never lost.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'c-close',
          text: 'When you\u2019re ready, take a look at your screen.',
          baseSilenceAfter: 5,
          silenceExpandable: false,
        },
      ],
    },

    // ─── SECTION D: Closing — Return to Resource and Orientation (~4 min) ─────
    d: {
      id: 'section-d',
      label: 'Closing',
      prompts: [
        {
          id: 'd-return-01a',
          text: 'Let\u2019s bring this to a close. Come back, one more time, to your island of safety. That place in your body that felt calm or neutral at the beginning of this practice.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'd-return-01b',
          text: 'It might feel different now. It might feel larger, or warmer, or more settled than before. Just notice how it is now, without trying to change it.',
          baseSilenceAfter: 15,
          silenceExpandable: false,
        },
        {
          id: 'd-return-02a',
          text: 'Let your whole body settle around this feeling. There\u2019s nothing more to do. Nothing to analyze or figure out.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'd-return-02b',
          text: 'Whatever happened during this practice, your body knows what to do with it. Your nervous system will continue to process and integrate in the hours and days ahead. You have done your part by showing up and paying attention.',
          baseSilenceAfter: 12,
          silenceExpandable: false,
        },
        {
          id: 'd-orient-01a',
          text: 'When you\u2019re ready, slowly open your eyes. Don\u2019t rush this. Let the light come in gradually.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'd-orient-01b',
          text: 'And then, gently, look around the room. Let your eyes move wherever they want to go. Notice what\u2019s around you. Colors. Shapes. Textures. Objects.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'd-orient-01c',
          text: 'Let your gaze land on something that\u2019s pleasant to look at, or just interesting. Stay with it for a moment. Really see it.',
          baseSilenceAfter: 12,
          silenceExpandable: false,
        },
        {
          id: 'd-orient-02a',
          text: 'Notice the temperature of the air on your skin. Notice any sounds around you, near or far. Let the room come back in, fully.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'd-orient-02b',
          text: 'You\u2019re here. You\u2019re present. You\u2019re in your body, in this room, in this moment.',
          baseSilenceAfter: 10,
          silenceExpandable: false,
        },
        {
          id: 'd-close-01a',
          text: 'Take one more full breath. Let it go completely. You can move your body now however it wants to move. Stretch, shift, roll your shoulders, settle in.',
          baseSilenceAfter: 1,
          silenceExpandable: false,
        },
        {
          id: 'd-close-01b',
          text: 'This practice is complete. Whatever you experienced here, let yourself carry it lightly. It will continue working on its own.',
          baseSilenceAfter: 5,
          silenceExpandable: false,
        },
      ],
    },
  },
};
