/**
 * renderContentLines
 *
 * Shared text renderer for education/informational screens.
 * Handles markup conventions used throughout the app:
 *   §        → vertical spacer
 *   {term}   → accent-colored text (looked up in accentTerms map)
 *   {#N} txt → numbered item with accent-colored number
 *
 * @param {string[]} lines - Array of text lines to render
 * @param {object} [accentTerms] - Map of placeholder keys to display text
 * @returns {JSX.Element}
 */
export default function renderContentLines(lines, accentTerms = {}) {
  if (!lines || lines.length === 0) return null;

  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        // § → spacer
        if (line === '§') {
          return <div key={i} className="h-3" />;
        }

        // {#N} text → numbered item with accent number
        const numMatch = line.match(/^\{#(\d+)\}\s*(.*)/);
        if (numMatch) {
          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              <span className="text-[var(--accent)] font-medium">{numMatch[1]}</span>
              {' — '}{numMatch[2]}
            </p>
          );
        }

        // {term} → accent-colored replacement
        const hasAccent = /\{[^#][^}]*\}/.test(line);
        if (hasAccent && Object.keys(accentTerms).length > 0) {
          const parts = [];
          let remaining = line;
          let partIndex = 0;

          while (remaining.length > 0) {
            const match = remaining.match(/\{([^}]+)\}/);
            if (!match) {
              parts.push(<span key={partIndex++}>{remaining}</span>);
              break;
            }

            const before = remaining.slice(0, match.index);
            if (before) {
              parts.push(<span key={partIndex++}>{before}</span>);
            }

            const termKey = match[1];
            const termDisplay = accentTerms[termKey] || termKey;
            parts.push(
              <span key={partIndex++} className="text-[var(--accent)]">
                {termDisplay}
              </span>
            );

            remaining = remaining.slice(match.index + match[0].length);
          }

          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {parts}
            </p>
          );
        }

        // Default: standard paragraph
        return (
          <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}
