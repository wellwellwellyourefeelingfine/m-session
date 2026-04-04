/**
 * Block Renderer Registry
 *
 * Maps block type strings to their renderer components.
 * Each renderer is a pure presentational component that renders
 * one visual block within a screen's vertical stack.
 */

export { default as HeaderBlock } from './HeaderBlock';
export { default as TextBlock } from './TextBlock';
export { default as PromptBlock } from './PromptBlock';
export { default as SelectorBlock } from './SelectorBlock';
export { default as ChoiceBlock } from './ChoiceBlock';
export { default as AnimationBlock } from './AnimationBlock';
export { default as AlarmBlock } from './AlarmBlock';
export { default as ReviewBlock } from './ReviewBlock';
export { default as MeditationAudioBlock } from './MeditationAudioBlock';
