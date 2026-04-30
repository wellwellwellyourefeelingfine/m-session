/**
 * IntentionExampleBlock — Static expectation/intention pair display.
 *
 * Renders two labeled paragraphs side-by-side conceptually:
 *   - EXPECTATION: a strikethrough quoted line at 60% opacity
 *   - INTENTION:   a quoted line with a left accent border
 *
 * Used on the intention-vs-expectation page to make the difference between
 * the two postures concrete with one example pair. Static content — props
 * carry the two strings; the block has no state and never writes.
 *
 * Config:
 *   { type: 'intention-example',
 *     expectation: "I will finally understand why I'm anxious and fix it.",
 *     intention: "I want to be open to learning what's beneath my anxiety." }
 */

export default function IntentionExampleBlock({ block }) {
  const { expectation, intention } = block;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-1">
          Expectation
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed line-through opacity-60">
          &ldquo;{expectation}&rdquo;
        </p>
      </div>
      <div>
        <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-1">
          Intention
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed border-l-2 border-[var(--accent)] pl-3">
          &ldquo;{intention}&rdquo;
        </p>
      </div>
    </div>
  );
}
