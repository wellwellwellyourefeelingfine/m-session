/**
 * SingleSelect Component
 * Radio-style single selection question
 */

import { useAppStore } from '../../../stores/useAppStore';
import { useToolsStore } from '../../../stores/useToolsStore';

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
      <p style={{ color: 'var(--text-primary)' }}>{question.label}</p>
      {question.contentBlocks && question.contentBlocks.map((block, i) => {
        if (block.type === 'spacer') {
          return <div key={i} className="flex justify-center"><div className="circle-spacer" /></div>;
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="text-left space-y-1 pl-4" style={{ color: block.color === 'grey' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
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
              className="uppercase tracking-wider text-xs underline"
              style={{ color: 'var(--accent)' }}
            >
              {block.text}
            </button>
          );
        }
        return <p key={i} style={{ color: block.color === 'grey' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{block.text}</p>;
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
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="w-full text-left px-4 py-3 border transition-colors duration-75"
            style={{
              borderColor: value === option.value ? 'var(--text-primary)' : 'var(--border)',
              backgroundColor: value === option.value ? 'var(--text-primary)' : 'transparent',
              color: value === option.value ? 'var(--bg-primary)' : 'var(--text-primary)',
            }}
          >
            <span className="uppercase tracking-wider">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
