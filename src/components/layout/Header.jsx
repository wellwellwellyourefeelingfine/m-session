/**
 * Header Component
 * Top bar with app title and AI Assistant tab
 */

import { useAIStore } from '../../stores/useAIStore';
import AIAssistantTab from '../ai/AIAssistantTab';
import AIAssistantModal from '../ai/AIAssistantModal';

export default function Header() {
  const isKeyValid = useAIStore((state) => state.isKeyValid);
  const isModalOpen = useAIStore((state) => state.isModalOpen);
  const toggleModal = useAIStore((state) => state.toggleModal);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-app-gray-200 dark:border-app-gray-800 z-40" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="h-full flex items-center px-4">
          {/* App Title - DM Serif Text (left-aligned) */}
          <h1
            className="font-serif text-3xl leading-none mt-3 -ml-2"
            style={{
              fontFamily: 'DM Serif Text, serif',
              textTransform: 'none'
            }}
          >
            Session
          </h1>

          {/* AI Assistant Tab (centered in remaining space, only visible when API key is configured) */}
          {isKeyValid && (
            <div className="flex-1 flex justify-center">
              <AIAssistantTab isOpen={isModalOpen} onClick={toggleModal} />
            </div>
          )}

          {/* Spacer to balance the layout when AI tab is visible */}
          {isKeyValid && <div className="w-16" />}
        </div>
      </header>

      {/* AI Assistant Modal (slides down from header) */}
      {isKeyValid && isModalOpen && (
        <AIAssistantModal onClose={toggleModal} />
      )}
    </>
  );
}
