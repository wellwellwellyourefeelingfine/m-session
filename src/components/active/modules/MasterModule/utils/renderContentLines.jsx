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
 * Runtime tokens (e.g. {protectorName}, {bodyLocation}) live in the same
 * accentTerms map — MasterModule merges store-derived values in before
 * passing the map down. Tokens with no value resolve to the literal key,
 * unless the caller pre-fills a fallback string.
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

/**
 * renderLineWithMarkup
 *
 * Render a single string with the same {term} / {icon:NAME} markup support
 * as renderContentLines, but return just the inline React fragment (no
 * surrounding <p>). Used by HeaderBlock to substitute runtime tokens like
 * {protectorName} into screen titles with accent coloring.
 *
 * Does NOT support § (line spacers) or {#N} numbered items — those are
 * line-level concerns handled by renderContentLines.
 *
 * @param {string} line
 * @param {object} [accentTerms]
 * @returns {React.ReactNode}
 */
export function renderLineWithMarkup(line, accentTerms = {}) {
  if (!line) return null;

  const hasMarkup = /\{[^#][^}]*\}/.test(line);
  if (!hasMarkup) return line;

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

  return <>{parts}</>;
}

/**
 * substituteTokensPlain
 *
 * Plain-text token substitution (no JSX, no accent spans). Useful where the
 * caller just needs the substituted string — for example the
 * sameTitle-comparison check in ScreensSection that drives header continuity.
 *
 * @param {string} text
 * @param {object} [accentTerms]
 * @returns {string}
 */
export function substituteTokensPlain(text, accentTerms = {}) {
  if (!text) return text;
  return text.replace(/\{([^#}][^}]*)\}/g, (full, key) => {
    if (key.startsWith('icon:')) return full; // leave inline icons alone
    return accentTerms[key] || full;
  });
}

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
          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {renderLineWithMarkup(line, accentTerms)}
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
