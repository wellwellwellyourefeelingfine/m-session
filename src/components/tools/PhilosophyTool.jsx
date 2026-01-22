/**
 * PhilosophyTool Component
 * Our Philosophy - core philosophy behind this guide
 */

import PhilosophyContent from '../shared/PhilosophyContent';

export default function PhilosophyTool() {
  return (
    <div className="py-12 px-6 max-w-xl mx-auto">
      <h3 className="text-lg mb-8 tracking-wider text-xs text-[var(--color-text-tertiary)]">
        Core Philosophy
      </h3>
      <PhilosophyContent />
    </div>
  );
}
