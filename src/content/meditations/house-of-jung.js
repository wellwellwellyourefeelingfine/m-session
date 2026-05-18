/**
 * The House of Jung Meditation
 *
 * A guided imagery / archetypal descent meditation (Jungian active imagination
 * + Leuner's Guided Affective Imagery). 17 phases: arrival at a house at dusk,
 * descent into its depths through a hidden door, encounter with a shadowy
 * figure, offering and transformation, golden key, ascent through a greenhouse
 * to dawn over the ocean.
 *
 * Audio-synced TTS with 123 pre-recorded prompts and authored silence
 * intervals. Fixed duration (~28-30 minutes, silence-tuned).
 *
 * The original transcript had 63 prompts. Any prompt longer than 4 sentences
 * was split into shorter sub-prompts joined by 1 second of silence, to keep
 * ElevenLabs from accelerating delivery on long-form input. The last sub-part
 * of each split inherits the transcript's original silence value; all earlier
 * sub-parts get baseSilenceAfter: 1. IDs are renumbered sequentially within
 * each phase.
 *
 * Voice: Theo Silk (UmQN7jS1Ee8B1czsUtQh) via eleven_multilingual_v2
 *   stability: 0.60, similarity_boost: 0.60, style: 0.0
 *   use_speaker_boost: true, speed: 0.83
 *
 * Phase breakdown (post-split counts):
 *   1.  Arrival                (arrival-01..08)        — 8
 *   2.  Approach               (approach-01..06)       — 6
 *   3.  Entry & Kitchen        (kitchen-01..09)        — 9
 *   4.  Hallway                (hallway-01..06)        — 6
 *   5.  Childhood Room         (childhood-01..09)      — 9
 *   6.  Hidden Door            (hidden-door-01..07)    — 7
 *   7.  Passageway             (passageway-01..05)     — 5
 *   8.  Spiral Staircase       (staircase-01..08)      — 8
 *   9.  Spring                 (spring-01..06)         — 6
 *   10. Bridge & Double Doors  (bridge-01..09)         — 9
 *   11. Encounter              (encounter-01..13)      — 13
 *   12. Recognition            (recognition-01..06)    — 6
 *   13. Offering               (offering-01..07)       — 7
 *   14. Transformation         (transformation-01..04) — 4
 *   15. Key & Ascent           (ascent-01..09)         — 9
 *   16. Greenhouse             (greenhouse-01..05)     — 5
 *   17. Dawn                   (dawn-01..12)           — 12
 */

export const houseOfJungMeditation = {
  id: 'house-of-jung',
  title: 'The House of Jung',
  subtitle: 'Archetypal Imagery Journey',
  description: 'A guided imagery journey through a house on the coast. Based in Jungian archetypal semiotics and Leuner Guided Affective Imagery (GAI), in which the mind fills in narrative details that allows for deeper processing and connection between conscious and unconscious.',

  audio: {
    basePath: '/audio/meditations/house-of-jung/',
    format: 'mp3',
    defaultVoice: 'theo',
    voices: [
      { id: 'theo',   label: 'Thoughtful Theo', subfolder: '' },
      { id: 'rachel', label: 'Relaxing Rachel', subfolder: 'relaxing-rachel/' },
    ],
  },

  // Fixed duration — silence-tuned to ~28-30 min.
  // Placeholder; refresh from manifest after audio gen.
  isFixedDuration: true,
  fixedDuration: 1740,

  prompts: [
    // ============================================
    // PHASE 1: ARRIVAL (arrival-01..08)
    // Original transcript prompts P1-P4
    // ============================================

    // P1 (7 sentences) → split 3+4
    {
      id: 'arrival-01',
      text: "Settle into a comfortable position, either sitting upright, reclined, or lying down. If it's available, wearing an eye mask may allow you to remain immersed in the narrative imagery.",
      baseSilenceAfter: 1,
    },
    {
      id: 'arrival-02',
      text: "Let your eyes close. Let your body settle. Feel the weight of yourself exactly where you are... the surface beneath you, the temperature of the air on your skin, the rhythm of your own breathing. Let all of that be here.",
      baseSilenceAfter: 8,
    },

    // P2 (7 sentences) → split 3+2+2 (the original 4-sentence part B was further split since its long last sentence triggered ElevenLabs speed-up)
    {
      id: 'arrival-03',
      text: "Now let an image begin to form. You are walking. Your feet move over soft, uneven ground... sand and dry grass shifting beneath each step.",
      baseSilenceAfter: 1,
    },
    {
      id: 'arrival-04',
      text: "Dunes rise gently around you, their shapes smooth and wind-carved. The air carries salt and warmth.",
      baseSilenceAfter: 1,
    },
    {
      id: 'arrival-05',
      text: "Your steps lead you along a path that threads these high dunes of cresting sand. Patches of tall grass hum in the wind, a vibrating aura that pushes out into the open sky, expanding the bounds of your awareness.",
      baseSilenceAfter: 6,
    },

    // P3 (4 sentences) → keep
    {
      id: 'arrival-06',
      text: "You crest a final dune, and the landscape opens. Wide coastline stretches before you. A golden sun hangs low in the sky, its light scattering across crests of ocean surf. A bronze glow holds it all in the last hours of day.",
      baseSilenceAfter: 8,
    },

    // P4 (6 sentences) → split 3+3
    {
      id: 'arrival-07',
      text: "And there, set back from the shore, is a house. It sits in the landscape as though it has always been there. Something about it stops you.",
      baseSilenceAfter: 1,
    },
    {
      id: 'arrival-08',
      text: "Not because it is strange, but because it feels like you recognize it... You hold this house in your gaze for a long time. It's so familiar, like a memory that's been waiting for you.",
      baseSilenceAfter: 10,
    },

    // ============================================
    // PHASE 2: APPROACH (approach-01..06)
    // Original transcript prompts P5-P7
    // ============================================

    // P5 (6 sentences) → split 3+3
    {
      id: 'approach-01',
      text: "You begin to walk toward the house. Golden light falls across the front of the house, warming its surfaces. You notice its roof, its windows, the front door.",
      baseSilenceAfter: 1,
    },
    {
      id: 'approach-02',
      text: "To one side, you notice an old greenhouse, its glass panes clouded and dark, its frame leaning slightly with age. Whatever once grew inside has gone untended for a long time. The house remains strong, waiting for your attention.",
      baseSilenceAfter: 6,
    },

    // P6 (8 sentences) → split 4+4
    {
      id: 'approach-03',
      text: "As you draw closer, notice what you see. What does this house look like? What is it made of? Is it large or small, old or new?",
      baseSilenceAfter: 1,
    },
    {
      id: 'approach-04',
      text: "Let it appear as it wants to appear. This is your house, has always been yours. Let the house gently materialize in your mind's eye. Effortlessly constructed...",
      baseSilenceAfter: 12,
    },

    // P7 (8 sentences) → split 4+4
    {
      id: 'approach-05',
      text: "You reach the front door. Notice its shape. Its texture. There is no lock.",
      baseSilenceAfter: 1,
    },
    {
      id: 'approach-06',
      text: "The door is ready to open. You place your hand on it and feel its weight, its temperature. Take a breath here, just a moment to collect yourself before you cross this threshold. How does it feel?",
      baseSilenceAfter: 10,
    },

    // ============================================
    // PHASE 3: ENTRY & KITCHEN (kitchen-01..09)
    // Original transcript prompts P8-P12 (kitchen-03 further split for ElevenLabs pacing)
    // ============================================

    // P8 (5 sentences) → split 3+2
    {
      id: 'kitchen-01',
      text: "You open the door and step inside. The air changes. It is warmer here, and still.",
      baseSilenceAfter: 1,
    },
    {
      id: 'kitchen-02',
      text: "The sounds of the ocean and the wind fall away, replaced by a deep, held quiet. The kind of quiet that feels like it has been kept for you.",
      baseSilenceAfter: 8,
    },

    // P9 (4 sentences) → split 2+2 (further split for ElevenLabs pacing)
    {
      id: 'kitchen-03',
      text: "You find yourself in a kitchen. The last light of the day pours through the windows in long golden beams, catching everything it touches.",
      baseSilenceAfter: 1,
    },
    {
      id: 'kitchen-04',
      text: "Dust motes drift slowly through the light. The warmth of the sun has been held in this room all day, and it radiates gently from every surface.",
      baseSilenceAfter: 6,
    },

    // P10 (5 sentences) → split 3+2
    {
      id: 'kitchen-05',
      text: "On the table, a cup of tea is waiting. It is still warm. Steam rises from it in a thin, curling thread.",
      baseSilenceAfter: 1,
    },
    {
      id: 'kitchen-06',
      text: "Sit down. Wrap your hands around the cup and feel its warmth move into your palms, your fingers, your wrists.",
      baseSilenceAfter: 10,
    },

    // P11 (4 sentences) → keep
    {
      id: 'kitchen-07',
      text: "Let yourself be here for a moment. Feel what it is to arrive somewhere calm, a place of safety and refuge. Sit for a moment in the warmth of this day. Just receive this, feeling the warmth radiate through your body as you sip the cup of tea.",
      baseSilenceAfter: 10,
    },

    // P12 (7 sentences) → split 4+3
    {
      id: 'kitchen-08',
      text: "Notice your body now. Notice what has softened since you sat down. Notice where you feel the warmth. Let yourself belong to this room for as long as you need to.",
      baseSilenceAfter: 1,
    },
    {
      id: 'kitchen-09',
      text: "The light continues to shift across the walls, slow and golden, as the sun moves closer to the horizon. The gentle rhythm of the ocean waves pulses through the warm walls of the kitchen, against the clear windowpanes. In, and out.",
      baseSilenceAfter: 10,
    },

    // ============================================
    // PHASE 4: HALLWAY (hallway-01..06)
    // Original transcript prompts P13-P15
    // ============================================

    // P13 (6 sentences) → split 3+3
    {
      id: 'hallway-01',
      text: "When you are ready, you stand. You leave the cup on the table. There is a hallway ahead of you, extending deeper into the house.",
      baseSilenceAfter: 1,
    },
    {
      id: 'hallway-02',
      text: "The light here is softer. Amber. The golden beams from the kitchen do not quite reach this far.",
      baseSilenceAfter: 6,
    },

    // P14 (5 sentences) → split 3+2
    {
      id: 'hallway-03',
      text: "You begin to walk. The hallway is longer than you expected. As you move through it, you notice things on the walls... shapes, textures, objects you cannot quite make out in this light.",
      baseSilenceAfter: 1,
    },
    {
      id: 'hallway-04',
      text: "You do not stop to examine them. Something ahead is drawing you forward.",
      baseSilenceAfter: 6,
    },

    // P15 (7 sentences) → split 3+4
    {
      id: 'hallway-05',
      text: "The air changes again. There is something familiar in it now. A scent, maybe.",
      baseSilenceAfter: 1,
    },
    {
      id: 'hallway-06',
      text: "A quality of light. A feeling that you have been here before, that your body remembers even if your mind does not. Let that feeling come. Do not try to name it.",
      baseSilenceAfter: 10,
    },

    // ============================================
    // PHASE 5: CHILDHOOD ROOM (childhood-01..09)
    // Original transcript prompts P16-P20
    // ============================================

    // P16 (7 sentences) → split 4+3
    {
      id: 'childhood-01',
      text: "At the end of the hallway, a door stands open. You step through it. And the room you enter stops you completely. Because you know this room.",
      baseSilenceAfter: 1,
    },
    {
      id: 'childhood-02',
      text: "It belongs to a younger version of you. The bed, the walls, the objects on the shelves or the desk or the floor... this room is exactly as it once was. Every detail preserved.",
      baseSilenceAfter: 10,
    },

    // P17 (8 sentences) → split 4+4
    {
      id: 'childhood-03',
      text: "Let the room come into focus. What do you see? What is on the walls? What is on the bed?",
      baseSilenceAfter: 1,
    },
    {
      id: 'childhood-04',
      text: "What is the light like? Let the details arrive on their own. Your memory knows this place better than your thinking mind does. Trust what appears.",
      baseSilenceAfter: 15,
    },

    // P18 (4 sentences) → keep
    {
      id: 'childhood-05',
      text: "Walk to the bed. Sit down on it. Feel the surface beneath you, the height of it, the way it holds your weight. You are here now, in a room that once held everything you were.",
      baseSilenceAfter: 8,
    },

    // P19 (7 sentences) → split 4+3
    {
      id: 'childhood-06',
      text: "Notice how old you feel in this room. Not how old you are... how old you feel. What age rises in your body when you sit here? Let that younger self be present.",
      baseSilenceAfter: 1,
    },
    {
      id: 'childhood-07',
      text: "You do not need to do anything with what comes. Just notice. Just be with.",
      baseSilenceAfter: 20,
    },

    // P20 (7 sentences) → split 4+3
    {
      id: 'childhood-08',
      text: "Something may have happened in this room, or in the life that surrounded it, that still lives inside you. Something unfinished, unspoken, or unfelt. You do not need to search for it. If it is here, it will make itself known.",
      baseSilenceAfter: 1,
    },
    {
      id: 'childhood-09',
      text: "And if it does, let it. You are safe. You are the one who came back.",
      baseSilenceAfter: 20,
    },

    // ============================================
    // PHASE 6: HIDDEN DOOR (hidden-door-01..07)
    // Original transcript prompts P21-P24
    // ============================================

    // P21 (7 sentences) → split 4+3
    {
      id: 'hidden-door-01',
      text: "As you sit, your eyes are drawn to one of the walls. And you notice something that should not be there. A door. It is arched at the top, set deep into the wall, with an iron ring for a handle.",
      baseSilenceAfter: 1,
    },
    {
      id: 'hidden-door-02',
      text: "You have never seen this door before. It was never part of this room. And yet here it is, as though it has always been waiting behind the wallpaper, behind the paint, behind the years.",
      baseSilenceAfter: 10,
    },

    // P22 (8 sentences) → split 4+4
    {
      id: 'hidden-door-03',
      text: "You stand. You walk toward it. You reach for the iron ring and feel the cold metal against your palm. You pull.",
      baseSilenceAfter: 1,
    },
    {
      id: 'hidden-door-04',
      text: "The door is heavy. It resists at first, then yields, swinging open slowly. Behind it, a passageway extends into darkness. Cool air moves past your face, carrying a scent of stone and earth and something older than memory.",
      baseSilenceAfter: 8,
    },

    // P23 (6 sentences) → split 3+3
    {
      id: 'hidden-door-05',
      text: "This is a choice. You can feel the pull of what lies beyond this door. Something down there has been waiting for you.",
      baseSilenceAfter: 1,
    },
    {
      id: 'hidden-door-06',
      text: "Something that has been waiting a long time. And you are ready for it. You would not be here if you were not ready.",
      baseSilenceAfter: 10,
    },

    // P24 (1 sentence) → keep
    {
      id: 'hidden-door-07',
      text: "You step through, and the darkness gathers around you like a held breath.",
      baseSilenceAfter: 6,
    },

    // ============================================
    // PHASE 7: PASSAGEWAY (passageway-01..05)
    // Original transcript prompts P25-P27
    // ============================================

    // P25 (3 sentences) → keep
    {
      id: 'passageway-01',
      text: "The door closes behind you as you move forward with assured steps, curious and open to what you will discover. The passageway stretches ahead, carved from stone. Along its walls, torches glow in iron brackets, their flames steady and orange.",
      baseSilenceAfter: 8,
    },

    // P26 (5 sentences) → split 3+2
    {
      id: 'passageway-02',
      text: "You walk. The passage curves gently as it descends. The air grows cooler against your skin.",
      baseSilenceAfter: 1,
    },
    {
      id: 'passageway-03',
      text: "The sounds of the house above... the quiet settling, the distant ocean... fade and then disappear entirely. There is only the passage, the torchlight, and your own footsteps.",
      baseSilenceAfter: 10,
    },

    // P27 (7 sentences) → split 4+3
    {
      id: 'passageway-04',
      text: "Notice your body as you walk. Notice your heartbeat. Notice your breathing. Notice whatever you feel in your chest, your belly, your throat.",
      baseSilenceAfter: 1,
    },
    {
      id: 'passageway-05',
      text: "You are moving into a deeper realm now. The part that exists below the rooms you usually live in. Let your body and mind be open to what arises here.",
      baseSilenceAfter: 15,
    },

    // ============================================
    // PHASE 8: SPIRAL STAIRCASE (staircase-01..08)
    // Original transcript prompts P28-P31
    // ============================================

    // P28 (6 sentences) → split 3+3
    {
      id: 'staircase-01',
      text: "The passageway opens into a vast space. Before you stands a spiral staircase, built from the same stone as the passageway. It is enormous in scale, curving downward in wide, gradual arcs.",
      baseSilenceAfter: 1,
    },
    {
      id: 'staircase-02',
      text: "You step to the edge and look down through the open center. It descends beyond what you can make out. Dots of torchlight waver far below, like stars reflected in a deep well.",
      baseSilenceAfter: 8,
    },

    // P29 (7 sentences) → split 4+3
    {
      id: 'staircase-03',
      text: "You begin to descend. Each step is solid beneath your feet. The air continues to cool. Your hand trails along the curved stone wall as you go, feeling its roughness, its age.",
      baseSilenceAfter: 1,
    },
    {
      id: 'staircase-04',
      text: "Down and around. Down and around. Let the rhythm of the descent carry you deeper into yourself with each revolution.",
      baseSilenceAfter: 10,
    },

    // P30 (6 sentences) → split 3+3
    {
      id: 'staircase-05',
      text: "As you descend, the world above becomes very far away. The kitchen, the golden light, the dunes, the ocean... they are still there, but they belong to the surface now. You are going somewhere that exists beneath all of that.",
      baseSilenceAfter: 1,
    },
    {
      id: 'staircase-06',
      text: "Beneath the daily. Beneath the known. Let yourself go there.",
      baseSilenceAfter: 12,
    },

    // P31 (6 sentences) → split 3+3
    {
      id: 'staircase-07',
      text: "Down and around. Down and around. Your breathing is steady.",
      baseSilenceAfter: 1,
    },
    {
      id: 'staircase-08',
      text: "Your body knows this descent even if your mind does not. There is no hurry. Each step takes you exactly where you are meant to go.",
      baseSilenceAfter: 15,
    },

    // ============================================
    // PHASE 9: SPRING (spring-01..06)
    // Original transcript prompts P32-P34
    // ============================================

    // P32 (6 sentences) → split 3+3
    {
      id: 'spring-01',
      text: "You reach the last step of the staircase and your feet meet level ground. The air is still here. And in the stillness at the bottom of everything, you hear water.",
      baseSilenceAfter: 1,
    },
    {
      id: 'spring-02',
      text: "Not pipes or plumbing... something older. A spring, rising from a fissure in the stone floor, water bubbling up from depths you cannot fathom. It has been flowing here since long before anything you have ever known.",
      baseSilenceAfter: 8,
    },

    // P33 (8 sentences) → split 4+4
    {
      id: 'spring-03',
      text: "Soft green moss and small ferns grow around the edges of the spring, nourished by the spring. You gaze into its bubbling surface, moving closer. You cup your hands and let the water fill them. It is cool and clean.",
      baseSilenceAfter: 1,
    },
    {
      id: 'spring-04',
      text: "Drink from it if you want to. Let it ground you. Let it remind your body what it is to be nourished from the pure waters of deep life. From the source.",
      baseSilenceAfter: 15,
    },

    // P34 (5 sentences) → split 3+2
    {
      id: 'spring-05',
      text: "The water flows from the spring into a narrow channel cut into the stone floor. You follow its path with assured steps. The channel runs across the corridor and empties into a wide subterranean lake.",
      baseSilenceAfter: 1,
    },
    {
      id: 'spring-06',
      text: "The waters here are quiet and still, reflecting the huge cavernous ceiling like a mirror. A long stone bridge cuts across its surface.",
      baseSilenceAfter: 10,
    },

    // ============================================
    // PHASE 10: BRIDGE & DOUBLE DOORS (bridge-01..09)
    // Original transcript prompts P35-P38 (bridge-02 further split for ElevenLabs pacing)
    // ============================================

    // P35 (6 sentences) → split 3+1+2 (the long-doors sentence isolated for ElevenLabs pacing)
    {
      id: 'bridge-01',
      text: "The stone bridge arcs over the lake, narrow but solid, its surface worn smooth by time. The water below is motionless and black, reflecting the torchlight in long, wavering lines. You step onto the bridge.",
      baseSilenceAfter: 1,
    },
    {
      id: 'bridge-02',
      text: "Each footstep sounds against the stone and returns to you from across the water.",
      baseSilenceAfter: 1,
    },
    {
      id: 'bridge-03',
      text: "On the far side, a landing rises from the rock, and set into the wall beyond it are two enormous doors, old and heavy, made of dark wood, bound with iron. Two torches burn on either side.",
      baseSilenceAfter: 10,
    },

    // P36 (6 sentences) → split 3+3
    {
      id: 'bridge-04',
      text: "You cross the bridge. You can feel something on the other side of those doors. A presence.",
      baseSilenceAfter: 1,
    },
    {
      id: 'bridge-05',
      text: "Not threatening, but unmistakable. Something is in there. Something that has been waiting.",
      baseSilenceAfter: 8,
    },

    // P37 (6 sentences) → split 3+3
    {
      id: 'bridge-06',
      text: "Stand here for a moment and feel where you are. Deep beneath the surface of your life, deep beneath the house, deep beneath the room that held your childhood. You have come a long way down.",
      baseSilenceAfter: 1,
    },
    {
      id: 'bridge-07',
      text: "And you are still here. You are still whole. Whatever is ahead, you are ready to meet it.",
      baseSilenceAfter: 12,
    },

    // P38 (6 sentences) → split 3+3
    {
      id: 'bridge-08',
      text: "You walk to the doors. You place both hands flat against the wood. Feel its grain, its temperature.",
      baseSilenceAfter: 1,
    },
    {
      id: 'bridge-09',
      text: "Feel the weight of it and the weight of this moment. Then push. The doors swing inward, slowly, and the room beyond opens before you.",
      baseSilenceAfter: 8,
    },

    // ============================================
    // PHASE 11: ENCOUNTER (encounter-01..13)
    // Original transcript prompts P39-P44 (encounter-09 further split for ElevenLabs pacing)
    // ============================================

    // P39 (4 sentences) → keep
    {
      id: 'encounter-01',
      text: "The room is large. The ceiling is high and lost in shadow. Torchlight flickers along the walls, casting shapes that shift and breathe. And there, in the center of the room, stands a figure.",
      baseSilenceAfter: 6,
    },

    // P40 (6 sentences) → split 3+3
    {
      id: 'encounter-02',
      text: "You cannot see the face clearly. The light does not quite reach it, or the features seem to shift each time you try to focus. But something about this figure is familiar.",
      baseSilenceAfter: 1,
    },
    {
      id: 'encounter-03',
      text: "The way it stands. The way it holds itself. Something in the shape of it that you have always known but never looked at directly.",
      baseSilenceAfter: 10,
    },

    // P41 (8 sentences) → split 4+4
    {
      id: 'encounter-04',
      text: "Stop here. Before you move any closer, drop your attention into your body. What do you feel? Where do you feel it?",
      baseSilenceAfter: 1,
    },
    {
      id: 'encounter-05',
      text: "Your chest, your throat, your stomach, your hands? Whatever is happening in your body right now is not random. It is your response to what is in this room. Let it be fully here.",
      baseSilenceAfter: 20,
    },

    // P42 (7 sentences) → split 4+3
    {
      id: 'encounter-06',
      text: "Now take a step closer. And another. With each step, the figure becomes a little clearer. Not all at once, but gradually, the way something comes into focus when you stop trying to see it and simply let yourself look.",
      baseSilenceAfter: 1,
    },
    {
      id: 'encounter-07',
      text: "Who is this? What are you beginning to recognize? Let the knowing come from the depths of your being.",
      baseSilenceAfter: 25,
    },

    // P43 (8 sentences) → split 4+2+2 (encounter-09 further split for ElevenLabs pacing)
    {
      id: 'encounter-08',
      text: "You are close now. Close enough to see. Whatever face or form has appeared before you... let it be here. Do not turn away from it.",
      baseSilenceAfter: 1,
    },
    {
      id: 'encounter-09',
      text: "This is what lives at the bottom of the staircase, beneath the childhood room, beneath the house, beneath your daily life. It has been here all along.",
      baseSilenceAfter: 1,
    },
    {
      id: 'encounter-10',
      text: "And it has been waiting for exactly this... for you to come down and meet it with a steady gaze. With clear eyes.",
      baseSilenceAfter: 20,
    },

    // P44 (11 sentences) → split 3+4+4
    {
      id: 'encounter-11',
      text: "Notice what you feel toward this figure. Not what you think you should feel. What you actually feel.",
      baseSilenceAfter: 1,
    },
    {
      id: 'encounter-12',
      text: "Is there fear? Grief? Tenderness? Anger?",
      baseSilenceAfter: 1,
    },
    {
      id: 'encounter-13',
      text: "Recognition? Let whatever is true be true. There is no correct response. There is only what is real.",
      baseSilenceAfter: 25,
    },

    // ============================================
    // PHASE 12: RECOGNITION (recognition-01..06)
    // Original transcript prompts P45-P47
    // ============================================

    // P45 (7 sentences) → split 4+3
    {
      id: 'recognition-01',
      text: "Stay with this figure. Stay with what you feel. You do not need to fix anything, heal anything, or understand anything right now. The most powerful thing you can do in this moment is simply remain.",
      baseSilenceAfter: 1,
    },
    {
      id: 'recognition-02',
      text: "To not leave. To not look away. To be the one who finally stayed.",
      baseSilenceAfter: 30,
    },

    // P46 (6 sentences) → split 3+3
    {
      id: 'recognition-03',
      text: "If this figure could speak... if it could say the one thing it has most needed to say... what would that be? You do not need to hear words. You might feel it in your body instead.",
      baseSilenceAfter: 1,
    },
    {
      id: 'recognition-04',
      text: "A pressure releasing. A truth landing. Let it communicate in whatever way it knows how.",
      baseSilenceAfter: 30,
    },

    // P47 (5 sentences) → split 3+2
    {
      id: 'recognition-05',
      text: "And if you could say something back... if you could offer this figure the one thing it has most needed to hear... what would that be? You can speak it silently. You can feel it as a warmth moving from your chest toward them.",
      baseSilenceAfter: 1,
    },
    {
      id: 'recognition-06',
      text: "Or you can speak it out loud. However it wants to come, let it come.",
      baseSilenceAfter: 30,
    },

    // ============================================
    // PHASE 13: OFFERING (offering-01..07)
    // Original transcript prompts P48-P50
    // ============================================

    // P48 (9 sentences) → split 3+3+3
    {
      id: 'offering-01',
      text: "Now look down at your hands. There is something there. You did not put it there.",
      baseSilenceAfter: 1,
    },
    {
      id: 'offering-02',
      text: "It has appeared on its own... a light, a warmth, a glow resting in your open palms. It is not blinding. It is soft and steady, the way the last sunlight was in the kitchen.",
      baseSilenceAfter: 1,
    },
    {
      id: 'offering-03',
      text: "It is yours. It has always been yours. It is the part of you that can hold anything without breaking.",
      baseSilenceAfter: 15,
    },

    // P49 (7 sentences) → split 4+3
    {
      id: 'offering-04',
      text: "You can offer this to the figure. Not to fix them. Not to make them go away. But the way you would offer warmth to someone who has been cold for a very long time.",
      baseSilenceAfter: 1,
    },
    {
      id: 'offering-05',
      text: "Step forward. Extend your hands. Let what is in your palms move toward what is in the room.",
      baseSilenceAfter: 15,
    },

    // P50 (8 sentences) → split 4+4
    {
      id: 'offering-06',
      text: "Watch what happens. When the light meets the figure, something changes. Maybe the shadows soften. Maybe the figure changes shape, or becomes smaller, or becomes clearer.",
      baseSilenceAfter: 1,
    },
    {
      id: 'offering-07',
      text: "Maybe the room itself shifts. Do not try to control what happens next. Just watch. Just stay.",
      baseSilenceAfter: 30,
    },

    // ============================================
    // PHASE 14: TRANSFORMATION (transformation-01..04)
    // Original transcript prompts P51-P52
    // ============================================

    // P51 (7 sentences) → split 4+3
    {
      id: 'transformation-01',
      text: "Something is releasing now. You can feel it in the room and you can feel it in your body. A weight that was held is being set down. A door that was closed is opening.",
      baseSilenceAfter: 1,
    },
    {
      id: 'transformation-02',
      text: "Light is entering this space from somewhere... from above, from within the walls, from the figure itself, from you. Let it come. Let the room fill with it.",
      baseSilenceAfter: 20,
    },

    // P52 (6 sentences) → split 3+3
    {
      id: 'transformation-03',
      text: "This moment does not need to be understood. It needs to be felt. Let your body absorb whatever is happening here.",
      baseSilenceAfter: 1,
    },
    {
      id: 'transformation-04',
      text: "Let it register in your cells, in your breathing, in the way your chest rises and falls. Something has changed. Something that was locked has unlocked.",
      baseSilenceAfter: 25,
    },

    // ============================================
    // PHASE 15: KEY & ASCENT (ascent-01..09)
    // Original transcript prompts P53-P55
    // ============================================

    // P53 (5 sentences) → split 3+2
    {
      id: 'ascent-01',
      text: "Take one last look at the room. At the figure, or whatever remains. At what has changed.",
      baseSilenceAfter: 1,
    },
    {
      id: 'ascent-02',
      text: "And silently, in whatever way feels right to you, acknowledge it with gratitude. A simple nod, as if to say, I see you now, with clear eyes.",
      baseSilenceAfter: 20,
    },

    // P54 (13 sentences) → split 3+3+4+3
    {
      id: 'ascent-03',
      text: "Your gaze drops to the ground. Near your feet, something catches the light. A golden key, resting on the stone as though it has always been there.",
      baseSilenceAfter: 1,
    },
    {
      id: 'ascent-04',
      text: "You pick it up. It is warm. It fits your hand perfectly.",
      baseSilenceAfter: 1,
    },
    {
      id: 'ascent-05',
      text: "And now you see what you had not seen before... a door on the far wall. Simple. Unadorned. A keyhole at its center.",
      baseSilenceAfter: 1,
    },
    {
      id: 'ascent-06',
      text: "You cross the room and slide the key into the lock. It turns without resistance. The door opens.",
      baseSilenceAfter: 8,
    },

    // P55 (12 sentences) → split 4+4+4
    {
      id: 'ascent-07',
      text: "Behind it, a staircase rises in a straight line. At the top, a square of light. You climb toward it. The steps are easy under your feet.",
      baseSilenceAfter: 1,
    },
    {
      id: 'ascent-08',
      text: "The air warms as you rise. You are not escaping what you found down there. You are carrying it upward. The light grows.",
      baseSilenceAfter: 1,
    },
    {
      id: 'ascent-09',
      text: "You reach the top. A glass door, framed in pale wood. Green beyond it. You push through.",
      baseSilenceAfter: 8,
    },

    // ============================================
    // PHASE 16: GREENHOUSE (greenhouse-01..05)
    // Original transcript prompts P56-P57 (greenhouse-01 and greenhouse-03 further split for ElevenLabs pacing)
    // ============================================

    // P56 (7 sentences) → split 2+2+3 (greenhouse-01 further split for ElevenLabs pacing)
    {
      id: 'greenhouse-01',
      text: "You enter the greenhouse, now transformed and teeming with life. The glass is clear, a soft light filling the vibrant space.",
      baseSilenceAfter: 1,
    },
    {
      id: 'greenhouse-02',
      text: "Everywhere, the hum of life: plants climbing the walls, spilling from stone beds, leaves unfurling toward the glass. They're alive with a vital energy, singing at a frequency you feel through your entire body.",
      baseSilenceAfter: 1,
    },
    {
      id: 'greenhouse-03',
      text: "You walk among them, breathe in the output of their fresh oxygen. They are vigorous, rooted, reaching. The greenhouse has been renewed.",
      baseSilenceAfter: 15,
    },

    // P57 (4 sentences) → split 2+2 (further split for ElevenLabs pacing)
    {
      id: 'greenhouse-04',
      text: "Through the glass panes, you see the sky, soft pink and glowing with the fading remnants of stars. You realize it's almost dawn, that the entire night has passed as you journeyed beneath the house.",
      baseSilenceAfter: 1,
    },
    {
      id: 'greenhouse-05',
      text: "The horizon over the ocean glows with the first band of warm light. You've made it all the way through.",
      baseSilenceAfter: 12,
    },

    // ============================================
    // PHASE 17: DAWN (dawn-01..12)
    // Original transcript prompts P58-P63
    // ============================================

    // P58 (5 sentences) → split 3+2
    {
      id: 'dawn-01',
      text: "You push open the greenhouse door and step outside. The morning air fills your lungs, fresh and cool, carrying the ocean and the promise of a new day. Take a deep full breath here.",
      baseSilenceAfter: 1,
    },
    {
      id: 'dawn-02',
      text: "In... and out. Feel the body open as the air of a new day fills your lungs.",
      baseSilenceAfter: 10,
    },

    // P59 (5 sentences) → split 3+2
    {
      id: 'dawn-03',
      text: "Look up. The last remnants of stars are still visible overhead, fading as the sky brightens. The moon hangs at one end of the sky's long blue arc, pale now, giving way.",
      baseSilenceAfter: 1,
    },
    {
      id: 'dawn-04',
      text: "And at the other end, rising over the ocean's steady surface, the sun. It lifts itself from the horizon slowly, throwing a path of gold across the waves that reaches all the way to where you stand.",
      baseSilenceAfter: 15,
    },

    // P60 (7 sentences) → split 4+3
    {
      id: 'dawn-05',
      text: "Stand here. Feel the sun on your face. Feel the ground solid beneath your feet. The house is behind you, with all of its rooms, the depths you discovered beneath it.",
      baseSilenceAfter: 1,
    },
    {
      id: 'dawn-06',
      text: "All of it is part of you. All of it has always been part of you. You simply went in and met it with clear eyes.",
      baseSilenceAfter: 20,
    },

    // P61 (3 sentences) → keep
    {
      id: 'dawn-07',
      text: "Let yourself be here for as long as you need to. There is no hurry. The day is just beginning.",
      baseSilenceAfter: 20,
    },

    // P62 (9 sentences) → split 3+3+3
    {
      id: 'dawn-08',
      text: "When you are ready, gently let the image soften. Let the coastline, the house and its greenhouse, the rising sun, let it all begin to dissolve, slowly, the way a dream releases you in the moments before waking. Feel your own body again.",
      baseSilenceAfter: 1,
    },
    {
      id: 'dawn-09',
      text: "The surface beneath you. The weight of your arms. The air in the room where you actually are.",
      baseSilenceAfter: 1,
    },
    {
      id: 'dawn-10',
      text: "You are here. You are back. And the new dawn is inside you now.",
      baseSilenceAfter: 15,
    },

    // P63 (7 sentences) → split 4+3
    {
      id: 'dawn-11',
      text: "Take a full breath. Feel it fill your chest and your belly. And let it go. You do not need to hold anything.",
      baseSilenceAfter: 1,
    },
    {
      id: 'dawn-12',
      text: "It is already yours. Rest here. The meditation is complete.",
      baseSilenceAfter: 10,
    },
  ],
};
