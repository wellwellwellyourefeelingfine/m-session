/**
 * Section Renderer Dispatcher
 *
 * Maps section type strings to their renderer components.
 */

export { default as ScreensSection } from './ScreensSection';
export { default as MeditationSection } from './MeditationSection';
export { default as TimerSection } from './TimerSection';
export { default as GenerateSection } from './GenerateSection';

import ScreensSection from './ScreensSection';
import MeditationSection from './MeditationSection';
import TimerSection from './TimerSection';
import GenerateSection from './GenerateSection';

export const SECTION_RENDERERS = {
  screens: ScreensSection,
  meditation: MeditationSection,
  timer: TimerSection,
  generate: GenerateSection,
};

export function getSectionRenderer(type) {
  return SECTION_RENDERERS[type] || null;
}
