/**
 * TextBlock — Education/informational screen
 *
 * Renders a header (serif) + body lines with markup support.
 * Content is read-only — no user input captured.
 */

import renderContentLines from '../utils/renderContentLines';

export default function TextBlock({ screen, accentTerms }) {
  return (
    <div>
      {screen.header && (
        <p
          className="text-base mb-3 text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          {screen.header}
        </p>
      )}
      {renderContentLines(screen.lines, accentTerms)}
    </div>
  );
}
