/**
 * SingleSelect Component
 * Radio-style single selection question
 */

import { useAppStore } from '../../../stores/useAppStore';
import { useToolsStore } from '../../../stores/useToolsStore';
import { ArrowUpRightIcon } from '../../shared/Icons';

export default function SingleSelect({ question, value, onChange }) {
  const handleToolLink = (action) => {
    if (action.section) {
      useToolsStore.getState().setPendingSection(action.section);
    }
    if (action.tool) {
      const { openTools, toggleTool } = useToolsStore.getState();
      if (!openTools.includes(action.tool)) {
        toggleTool(action.tool);
      }
    }
    if (action.tab) {
      useAppStore.getState().setCurrentTab(action.tab);
    }
  };

  return (
    <div className="space-y-3">
      <p
        className="text-lg"
        style={{
          fontFamily: "'DM Serif Text', serif",
          textTransform: 'none',
          color: 'var(--text-primary)',
        }}
      >
        {question.label}
      </p>
      {question.contentBlocks && question.contentBlocks.map((block, i) => {
        // Resolve content-block text color. `grey` is the lightest tertiary
        // gray; `grey-dark` is a darker secondary gray used on the safety
        // self-screening pages (medications / heart / psychiatric) where
        // the trailing caveat needs to be more readable while still
        // visually de-emphasized relative to the primary copy.
        const textColor =
          block.color === 'grey-dark'
            ? 'var(--text-secondary)'
            : block.color === 'grey'
              ? 'var(--text-tertiary)'
              : 'var(--text-primary)';

        if (block.type === 'spacer') {
          // Invisible spacer — preserves vertical rhythm without the
          // decorative circle. Same 6px height as the original circle-spacer.
          return <div key={i} aria-hidden="true" style={{ height: '6px' }} />;
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="text-left space-y-1 pl-4" style={{ color: textColor }}>
              {block.items.map((item) => (
                <li key={item} className="list-disc">{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'accent-link') {
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleToolLink(block.action)}
              className="inline-flex items-center gap-1 uppercase tracking-wider text-xs"
              style={{ color: 'var(--accent)' }}
            >
              <span>{block.text}</span>
              <ArrowUpRightIcon size={12} />
            </button>
          );
        }
        return <p key={i} style={{ color: textColor }}>{block.text}</p>;
      })}
      {!question.contentBlocks && question.description && (
        <p style={{ color: 'var(--text-tertiary)' }}>{question.description}</p>
      )}
      {!question.contentBlocks && question.descriptionSecondary && (
        <p style={{ color: 'var(--text-tertiary)' }}>{question.descriptionSecondary}</p>
      )}
      {!question.contentBlocks && question.contentList && (
        <ul className="text-left space-y-1 pl-4" style={{ color: 'var(--text-primary)' }}>
          {question.contentList.map((item) => (
            <li key={item} className="list-disc">{item}</li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className="w-full text-left px-4 py-3 border transition-colors duration-300"
              style={{
                borderColor: isSelected ? 'var(--text-secondary)' : 'var(--border)',
                backgroundColor: isSelected ? 'var(--text-secondary)' : 'transparent',
                color: isSelected ? 'var(--bg-primary)' : 'var(--text-primary)',
              }}
            >
              <span className="uppercase tracking-wider">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
