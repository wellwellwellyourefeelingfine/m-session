import React, { useState } from 'react';
import TimelineItem from './TimelineItem';

const TimelineEditor = ({ items, setItems }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = (e, index) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        setSelectedIndex(index);
        break;
      case 'Delete':
      case 'Backspace':
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        setSelectedIndex(Math.max(0, index - 1));
        break;
      default:
        break;
    }
  };

  return (
    <div className="timeline-editor" role="listbox">
      {items.map((item, index) => (
        <TimelineItem
          key={index}
          item={item}
          index={index}
          isSelected={index === selectedIndex}
          onSelect={setSelectedIndex}
          onDelete={(idx) => setItems(items.filter((_, i) => i !== idx))}
          onKeyDown={handleKeyDown}
        />
      ))}
    </div>
  );
};

export default TimelineEditor;