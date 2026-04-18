/**
 * Transition Audio — Closing Reflection
 *
 * Voice-guided closing (~2 min) delivered over the Moonrise animation
 * at the midpoint of the Closing Ritual.
 *
 * Tone: settled, gentle, honoring the work done. Lets the user exhale.
 */

export const transitionClosing = {
  id: 'transition-closing',
  title: 'Closing Reflection',
  description: 'A brief guided closing as the session comes to a close.',

  audio: {
    basePath: '/audio/meditations/transition-closing/',
    format: 'mp3',
  },

  speakingRate: 95,

  prompts: [
    { id: 'open', text: "Let's take a moment before we close.", baseSilenceAfter: 3 },
    { id: 'breath', text: 'Close your eyes. Take a breath.', baseSilenceAfter: 5 },
    { id: 'honor', text: 'You moved through something real today. Whatever it was, whether it was quiet or intense, whether it gave you answers or more questions, it was yours. And it was enough.', baseSilenceAfter: 5 },
    { id: 'release', text: "You don't need to hold it all. You don't need to understand it all right now. Some of what happened today will surface in the coming days, in quiet moments, in conversations, in dreams. Let it come when it comes.", baseSilenceAfter: 5 },
    { id: 'notice', text: 'For now, just notice how you feel. Notice your body. Notice your breath.', baseSilenceAfter: 5 },
    { id: 'return', text: "When you're ready, open your eyes.", baseSilenceAfter: 3 },
  ],
};
