/**
 * ExternalLinkBlock — compact outbound source link for MasterModule screens.
 */

export default function ExternalLinkBlock({ block }) {
  if (!block?.href || !block?.label) return null;

  return (
    <a
      href={block.href}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-sm text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-4 hover:opacity-80 transition-opacity"
      style={{ textTransform: 'none' }}
    >
      {block.label}
    </a>
  );
}
