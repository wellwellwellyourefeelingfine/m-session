/**
 * MeditationTimePillBlock — Display-only DurationPill that reads the
 * estimated minutes for a meditation embedded later in the same module.
 *
 * Used on the headphones/prep screen that sits just before a meditation
 * section so the user sees the time commitment one more time before
 * pressing Begin. Mirrors the visual language used on the module's idle
 * screen (same accent-bordered pill, same "time:" prefix).
 *
 * The block looks up the meditation's duration in the following order:
 *   - block.minutes              — explicit override
 *   - block.meditationId         — read from that meditation's content
 *   - first 'meditation' section's meditationId in the active module
 *
 * If no meditation duration can be resolved the block renders nothing
 * (rather than a misleading empty pill).
 *
 * Config:
 *   { type: 'meditation-time-pill' }
 *   { type: 'meditation-time-pill', minutes: 14 }
 *   { type: 'meditation-time-pill', meditationId: 'open-awareness' }
 */

import { DurationPill } from '../../../capabilities/ModuleLayout';
import { getMeditationById } from '../../../../../content/meditations';
import { getModuleById } from '../../../../../content/modules';
import { useSessionStore } from '../../../../../stores/useSessionStore';

function durationMinutesForMeditation(meditation) {
  if (!meditation) return null;
  const seconds = meditation.fixedDuration
    ?? meditation.baseDuration
    ?? meditation.maxDuration
    ?? meditation.minDuration
    ?? null;
  return typeof seconds === 'number' ? Math.round(seconds / 60) : null;
}

export default function MeditationTimePillBlock({ block }) {
  // Active module → its content's first meditation section, when block
  // doesn't pin a specific meditationId. Read from the live store rather
  // than threading through context — keeps the block self-contained.
  const activeModuleInstanceId = useSessionStore(
    (s) => s.modules.currentModuleInstanceId
  );
  const activeModule = useSessionStore((s) => (
    s.modules.items.find((m) => m.instanceId === activeModuleInstanceId)
  ));

  let resolvedMinutes = typeof block.minutes === 'number' ? block.minutes : null;

  if (resolvedMinutes == null) {
    let meditationId = block.meditationId;
    if (!meditationId && activeModule) {
      const lib = getModuleById(activeModule.libraryId);
      const sections = lib?.content?.masterModuleContent?.sections || [];
      const medSection = sections.find((s) => s.type === 'meditation');
      meditationId = medSection?.meditationId;
    }
    if (meditationId) {
      resolvedMinutes = durationMinutesForMeditation(getMeditationById(meditationId));
    }
  }

  if (resolvedMinutes == null) return null;

  return (
    <div className="flex justify-center">
      <DurationPill minutes={resolvedMinutes} />
    </div>
  );
}
