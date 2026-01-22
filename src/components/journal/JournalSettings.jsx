/**
 * JournalSettings Component
 * Modal for adjusting journal display settings
 * Font size, font family, line height
 */

import { useState } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';

const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const FONT_FAMILY_OPTIONS = [
  { value: 'sans', label: 'Sans-serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Monospace' },
];

const LINE_HEIGHT_OPTIONS = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Relaxed' },
];

export default function JournalSettings({ onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  const settings = useJournalStore((state) => state.settings);
  const setFontSize = useJournalStore((state) => state.setFontSize);
  const setFontFamily = useJournalStore((state) => state.setFontFamily);
  const setLineHeight = useJournalStore((state) => state.setLineHeight);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-end justify-center z-50 ${
        isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      onClick={handleBackdropClick}
    >
      <div className={`bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-5 pb-20 ${
        isClosing ? 'animate-slideDownOut' : 'animate-slideUp'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <h3>
            Journal Settings
          </h3>
          <button
            onClick={handleClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1 -mt-1 -mr-1"
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>

        {/* Settings sections */}
        <div className="space-y-4">
          {/* Font Size */}
          <SettingSection title="Text Size">
            <div className="flex gap-2">
              {FONT_SIZE_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  selected={settings.fontSize === option.value}
                  onClick={() => setFontSize(option.value)}
                >
                  {option.label}
                </OptionButton>
              ))}
            </div>
          </SettingSection>

          {/* Font Family */}
          <SettingSection title="Font">
            <div className="flex gap-2">
              {FONT_FAMILY_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  selected={settings.fontFamily === option.value}
                  onClick={() => setFontFamily(option.value)}
                >
                  {option.label}
                </OptionButton>
              ))}
            </div>
          </SettingSection>

          {/* Line Height */}
          <SettingSection title="Line Spacing">
            <div className="flex gap-2">
              {LINE_HEIGHT_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  selected={settings.lineHeight === option.value}
                  onClick={() => setLineHeight(option.value)}
                >
                  {option.label}
                </OptionButton>
              ))}
            </div>
          </SettingSection>

          {/* Preview - fixed height container to prevent modal size changes */}
          <SettingSection title="Preview">
            <div
              className="border border-[var(--color-border)] rounded overflow-hidden"
              style={{ height: '88px' }}
            >
              <div
                className={`p-4 h-full flex items-center ${getFontSizeClass(settings.fontSize)} ${getFontFamilyClass(settings.fontFamily)} ${getLineHeightClass(settings.lineHeight)}`}
                style={{ textTransform: 'none' }}
              >
                <p className="text-[var(--color-text-primary)]">
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </div>
          </SettingSection>
        </div>

        {/* Done button */}
        <button
          onClick={handleClose}
          className="w-full mt-4 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider hover:opacity-80 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// Helper component for setting sections
function SettingSection({ title, children }) {
  return (
    <div>
      <h4 className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-widest mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

// Helper component for option buttons
function OptionButton({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-3 border text-sm transition-colors ${
        selected
          ? 'border-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]'
          : 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'
      }`}
    >
      {children}
    </button>
  );
}

// Helper functions for preview classes
function getFontSizeClass(size) {
  switch (size) {
    case 'small':
      return 'text-sm';
    case 'large':
      return 'text-lg';
    default:
      return 'text-base';
  }
}

function getFontFamilyClass(family) {
  switch (family) {
    case 'serif':
      return 'font-serif';
    case 'mono':
      return 'font-mono';
    default:
      return 'font-sans';
  }
}

function getLineHeightClass(height) {
  switch (height) {
    case 'compact':
      return 'leading-snug';
    case 'relaxed':
      return 'leading-loose';
    default:
      return 'leading-normal';
  }
}
