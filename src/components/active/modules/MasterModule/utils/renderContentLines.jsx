/**
 * renderContentLines
 *
 * Shared text renderer for education/informational screens.
 * Handles markup conventions used throughout the app:
 *   §              → vertical spacer
 *   {term}         → accent-colored text (looked up in accentTerms map)
 *   {icon:NAME}    → inline icon (looked up in INLINE_ICONS map below)
 *   {#N} txt       → numbered item with accent-colored number
 *
 * @param {string[]} lines - Array of text lines to render
 * @param {object} [accentTerms] - Map of placeholder keys to display text
 * @returns {JSX.Element}
 */

import { HeartIcon } from '../../../../shared/Icons';

// Inline icons available via {icon:NAME} markup in text lines.
// Sized to sit naturally inline at the surrounding text size.
const INLINE_ICONS = {
  heart: HeartIcon,
};

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

        // {term} → accent-colored replacement; {icon:NAME} → inline icon
        const hasMarkup = /\{[^#][^}]*\}/.test(line);
        if (hasMarkup) {
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

            if (termKey.startsWith('icon:')) {
              const iconName = termKey.slice(5);
              const IconComp = INLINE_ICONS[iconName];
              if (IconComp) {
                parts.push(
                  <IconComp
                    key={partIndex++}
                    size={16}
                    strokeWidth={3}
                    className="inline-block align-text-bottom mx-0.5 text-[var(--accent)]"
                  />
                );
              } else {
                // Unknown icon — fall back to the literal markup for visibility
                parts.push(<span key={partIndex++}>{`{${termKey}}`}</span>);
              }
            } else {
              const termDisplay = accentTerms[termKey] || termKey;
              parts.push(
                <span key={partIndex++} className="text-[var(--accent)]">
                  {termDisplay}
                </span>
              );
            }

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
