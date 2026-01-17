/**
 * DurationPicker Component
 * iOS-style vertical scroll wheel for selecting meditation duration
 * Snaps to predefined duration steps (e.g., 10, 15, 20, 25, 30 minutes)
 */

import { useState, useEffect, useRef } from 'react';

export default function DurationPicker({
  isOpen,
  onClose,
  onSelect,
  currentDuration,
  durationSteps = [10, 15, 20, 25, 30],
  minDuration = 10,
  maxDuration = 30,
}) {
  const [selectedDuration, setSelectedDuration] = useState(currentDuration);
  const wheelRef = useRef(null);
  const itemHeight = 48; // Height of each item in pixels

  // Filter steps to only include valid ones
  const validSteps = durationSteps.filter(
    (step) => step >= minDuration && step <= maxDuration
  );

  // Find the index of the current/selected duration
  const selectedIndex = validSteps.indexOf(selectedDuration);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Scroll to selected item on mount
  useEffect(() => {
    if (isOpen && wheelRef.current && selectedIndex >= 0) {
      const scrollTop = selectedIndex * itemHeight;
      wheelRef.current.scrollTop = scrollTop;
    }
  }, [isOpen, selectedIndex]);

  // Handle scroll with snap behavior
  const handleScroll = () => {
    if (!wheelRef.current) return;

    const scrollTop = wheelRef.current.scrollTop;
    const nearestIndex = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(nearestIndex, validSteps.length - 1));

    if (validSteps[clampedIndex] !== selectedDuration) {
      setSelectedDuration(validSteps[clampedIndex]);
    }
  };

  // Snap to nearest on scroll end
  const handleScrollEnd = () => {
    if (!wheelRef.current) return;

    const scrollTop = wheelRef.current.scrollTop;
    const nearestIndex = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(nearestIndex, validSteps.length - 1));

    wheelRef.current.scrollTo({
      top: clampedIndex * itemHeight,
      behavior: 'smooth',
    });
  };

  // Handle item click
  const handleItemClick = (duration, index) => {
    setSelectedDuration(duration);
    if (wheelRef.current) {
      wheelRef.current.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth',
      });
    }
  };

  // Handle confirm
  const handleConfirm = () => {
    onSelect(selectedDuration);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-xs shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-center">Duration</h3>
        </div>

        {/* Wheel container */}
        <div className="relative h-48 overflow-hidden">
          {/* Selection highlight bar */}
          <div
            className="absolute left-0 right-0 border-y border-[var(--color-text-primary)] pointer-events-none z-10"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              height: `${itemHeight}px`,
            }}
          />

          {/* Gradient overlays for fade effect */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[var(--color-bg)] to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--color-bg)] to-transparent pointer-events-none z-10" />

          {/* Scrollable wheel */}
          <div
            ref={wheelRef}
            className="h-full overflow-y-auto scrollbar-hide"
            onScroll={handleScroll}
            onTouchEnd={handleScrollEnd}
            onMouseUp={handleScrollEnd}
            style={{
              scrollSnapType: 'y mandatory',
              paddingTop: `${itemHeight * 2}px`,
              paddingBottom: `${itemHeight * 2}px`,
            }}
          >
            {validSteps.map((duration, index) => {
              const isSelected = duration === selectedDuration;
              return (
                <div
                  key={duration}
                  className={`flex items-center justify-center cursor-pointer transition-all duration-150
                    ${isSelected
                      ? 'text-[var(--color-text-primary)] font-medium'
                      : 'text-[var(--color-text-tertiary)]'
                    }`}
                  style={{
                    height: `${itemHeight}px`,
                    scrollSnapAlign: 'center',
                  }}
                  onClick={() => handleItemClick(duration, index)}
                >
                  <span className={`text-2xl tracking-wide ${isSelected ? 'scale-110' : 'scale-100'} transition-transform`}>
                    {duration}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-[var(--color-text-tertiary)] text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
