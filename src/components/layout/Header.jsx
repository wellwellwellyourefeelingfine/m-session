/**
 * Header Component
 * Top bar with app title and AI Assistant tab
 */

import { useState, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useAIStore } from '../../stores/useAIStore';
import AIAssistantTab from '../ai/AIAssistantTab';
import AIAssistantModal from '../ai/AIAssistantModal';
import SessionMenu from './SessionMenu';
import AnimatedTextLogo from './AnimatedTextLogo';

export default function Header() {
  const darkMode = useAppStore((state) => state.darkMode);
  const glassEffect = useAppStore((state) => state.preferences?.glassEffect ?? true);
  const alternateAppLogo = useAppStore((state) => state.preferences?.alternateAppLogo);
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
      <header className="fixed top-0 left-0 right-0 z-40" style={{ borderBottom: '1px solid var(--color-border)', background: glassEffect ? 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' : 'var(--bg-primary)', backdropFilter: glassEffect ? 'blur(24px)' : 'none', WebkitBackdropFilter: glassEffect ? 'blur(24px)' : 'none', paddingTop: 'env(safe-area-inset-top, 0px)', height: 'var(--header-height)' }}>
        <div className="h-full flex items-end pl-0 pr-0">
          {/* App Logo + "SESSION" text */}
          <div className="h-full flex items-end" style={{ padding: '0' }}>
            {alternateAppLogo ? (
              <div style={{ paddingBottom: '8px', paddingLeft: '12px' }}>
                <AnimatedTextLogo />
              </div>
            ) : (
              <img
                src={`${import.meta.env.BASE_URL}${darkMode ? 'm-session-logo-black-128.png' : 'm-session-logo-light-128.png'}`}
                alt="m-session"
                className="h-full w-auto"
                style={darkMode ? { filter: 'brightness(1.3)' } : undefined}
              />
            )}
          </div>

          {/* AI Assistant Tab (centered in remaining space, only visible when API key is configured) */}
          {isKeyValid ? (
            <div className="flex-1 flex justify-center">
              <AIAssistantTab isOpen={isModalOpen} onClick={handleToggle} />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Session Menu (hamburger) */}
          <SessionMenu />
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
