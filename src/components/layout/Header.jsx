/**
 * Header Component
 * Top bar with app title and AI Assistant tab
 */

import { useState, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAIStore } from '../../stores/useAIStore';
import AIAssistantTab from '../ai/AIAssistantTab';
import AIAssistantModal from '../ai/AIAssistantModal';

export default function Header() {
  const darkMode = useAppStore((state) => state.darkMode);
  const isKeyValid = useAIStore((state) => state.isKeyValid);
  const isModalOpen = useAIStore((state) => state.isModalOpen);
  const openModal = useAIStore((state) => state.openModal);
  const closeModal = useAIStore((state) => state.closeModal);

  // Track closing state to keep modal mounted during exit animation
  const [isClosing, setIsClosing] = useState(false);

  const handleToggle = useCallback(() => {
    if (isModalOpen && !isClosing) {
      // Start close animation
      setIsClosing(true);
    } else if (!isModalOpen) {
      openModal();
    }
  }, [isModalOpen, isClosing, openModal]);

  const handleCloseComplete = useCallback(() => {
    setIsClosing(false);
    closeModal();
  }, [closeModal]);

  // Keep modal mounted during close animation
  const showModal = isModalOpen || isClosing;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 border-b border-app-gray-200 dark:border-app-gray-800 z-40" style={{ backgroundColor: 'var(--bg-primary)', paddingTop: 'env(safe-area-inset-top, 0px)', height: 'var(--header-height)' }}>
        <div className="h-full flex items-end pl-0 pr-4">
          {/* App Logo + "SESSION" text */}
          <div className="h-full flex items-end gap-1" style={{ padding: '0' }}>
            <img
              src={darkMode ? '/m-session-logo-black-128.png' : '/m-session-logo-light-128.png'}
              alt="m-session"
              className="h-full w-auto"
            />
            <span
              className="uppercase tracking-wider leading-none"
              style={{ fontFamily: 'Azeret Mono, monospace', fontSize: '10px', color: 'var(--accent)', marginBottom: '11px', marginLeft: '-7px' }}
            >
              session
            </span>
          </div>

          {/* AI Assistant Tab (centered in remaining space, only visible when API key is configured) */}
          {isKeyValid && (
            <div className="flex-1 flex justify-center">
              <AIAssistantTab isOpen={isModalOpen} onClick={handleToggle} />
            </div>
          )}

          {/* Spacer to balance the layout when AI tab is visible */}
          {isKeyValid && <div className="w-16" />}
        </div>
      </header>

      {/* AI Assistant Modal (slides in from right) */}
      {isKeyValid && showModal && (
        <AIAssistantModal
          onClose={handleCloseComplete}
          isClosing={isClosing}
        />
      )}
    </>
  );
}
