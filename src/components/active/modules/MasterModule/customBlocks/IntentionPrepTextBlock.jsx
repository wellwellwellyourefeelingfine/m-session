/**
 * IntentionPrepTextBlock — Gray, centered, two-line prep beat shown
 * immediately before the intention textarea on the write-intention section.
 *
 * Visually quieter than a standard TextBlock — it's a ceremonial bridge,
 * not a content paragraph. Two sentences split with a paragraph break.
 *
 * Config:
 *   { type: 'intention-prep-text',
 *     lines: ["First sentence.", "Second sentence."] }
 */

export default function IntentionPrepTextBlock({ block }) {
  const lines = block.lines || [];
  return (
    <div className="text-center space-y-3">
      {lines.map((line, i) => (
        <p
          key={i}
          className="text-[var(--color-text-tertiary)] text-sm leading-relaxed"
        >
          {line}
        </p>
      ))}
    </div>
  );
}
