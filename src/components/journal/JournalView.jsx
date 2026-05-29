/**
 * JournalView Component
 * Main container for journal functionality
 * Manages navigation between editor and list views with smooth transitions
 * Default view is editor (new entry) - like iOS Notes
 */

import { useState, useCallback } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import JournalEditor from './JournalEditor';
import JournalList from './JournalList';
import JournalSettings from './JournalSettings';

// Navigation states
const VIEW_EDITOR = 'editor';
const VIEW_LIST = 'list';

export default function JournalView() {
  // Get persisted navigation state from store
  const navigation = useJournalStore((state) => state.navigation);
  const setNavigation = useJournalStore((state) => state.setNavigation);

  // Use store state for view and entry
  const currentView = navigation.currentView;
  const activeEntryId = navigation.activeEntryId;

  // Animation state (local only - doesn't need persistence)
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState(null); // 'toList' | 'toEditor'
  // Settings modal
  const [showSettings, setShowSettings] = useState(false);

  // Navigate to list view (back button in editor)
  const navigateToList = useCallback(() => {
    setIsAnimating(true);
    setAnimationDirection('toList');
    setTimeout(() => {
      setNavigation(VIEW_LIST, null);
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 300);
  }, [setNavigation]);

  // Navigate to editor view (from list or new entry button)
  const navigateToEditor = useCallback((entryId = null) => {
    setIsAnimating(true);
    setAnimationDirection('toEditor');
    setTimeout(() => {
      setNavigation(VIEW_EDITOR, entryId);
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 300);
  }, [setNavigation]);

  // Create new entry
  const handleNewEntry = useCallback(() => {
    // If already in editor with unsaved new entry, just clear
    if (currentView === VIEW_EDITOR && !activeEntryId) {
      return; // Already on new entry
    }
    navigateToEditor(null);
  }, [currentView, activeEntryId, navigateToEditor]);

  // Get animation classes
  const getEditorAnimationClass = () => {
    if (!isAnimating) return '';
    if (animationDirection === 'toList') return 'animate-slideOutToRight';
    if (animationDirection === 'toEditor') return 'animate-slideInFromRight';
    return '';
  };

  const getListAnimationClass = () => {
    if (!isAnimating) return '';
    if (animationDirection === 'toList') return 'animate-slideInFromLeft';
    if (animationDirection === 'toEditor') return 'animate-slideOutToLeft';
    return '';
  };

  return (
    <div className="fixed left-0 right-0 overflow-hidden" style={{ top: 'var(--header-height)', bottom: 'var(--tabbar-height)' }}>
      {/* Editor View */}
      {(currentView === VIEW_EDITOR || isAnimating) && (
        <div
          className={`absolute inset-0 bg-[var(--color-bg)] ${getEditorAnimationClass()}`}
          style={{ zIndex: currentView === VIEW_EDITOR ? 10 : 5 }}
        >
          <JournalEditor
            key={activeEntryId || 'new'}
            entryId={activeEntryId}
            onBack={navigateToList}
            isVisible={currentView === VIEW_EDITOR && !isAnimating}
          />
        </div>
      )}

      {/* List View */}
      {(currentView === VIEW_LIST || isAnimating) && (
        <div
          className={`absolute inset-0 bg-[var(--color-bg)] ${getListAnimationClass()}`}
          style={{ zIndex: currentView === VIEW_LIST ? 10 : 5 }}
        >
          <JournalList
            onSelectEntry={navigateToEditor}
            onNewEntry={handleNewEntry}
            onSettings={() => setShowSettings(true)}
            isSettingsOpen={showSettings}
          />
        </div>
      )}

      {/* New Entry Button - only show on list view */}
      {currentView === VIEW_LIST && !isAnimating && (
        <button
          onClick={handleNewEntry}
          className="fixed right-4 w-12 h-12 rounded-full bg-[var(--color-text-primary)] text-[var(--color-bg)] flex items-center justify-center shadow-lg z-20 hover:opacity-80 transition-opacity"
          style={{ bottom: 'calc(var(--tabbar-height) + 1.25rem)' }}
          aria-label="New entry"
        >
          <span className="text-2xl font-light">+</span>
        </button>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <JournalSettings onClose={() => setShowSettings(false)} />
      )}

    </div>
  );
}
