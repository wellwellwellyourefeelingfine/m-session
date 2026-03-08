import React from 'react';

const TimelineItem = ({ item, index, isSelected, onSelect, onDelete, onKeyDown }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Timeline item ${index + 1}: ${item.title}`}
      aria-selected={isSelected}
      className={`timeline-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(index)}
      onKeyDown={(e) => onKeyDown(e, index)}
    >
      <span>{item.title}</span>
      <button onClick={(e) => { e.stopPropagation(); onDelete(index); }}>Delete</button>
    </div>
  );
};

export default TimelineItem;