/**
 * HelpButton Component
 * Always-visible help button during active sessions
 * Provides quick access to support resources
 */

import { useState } from 'react';

export default function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help button - fixed position */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 px-4 py-2 border border-[var(--color-bg)]/30
                   text-[var(--color-bg)]/70 uppercase tracking-wider
                   hover:border-[var(--color-bg)] hover:text-[var(--color-bg)]
                   transition-colors duration-150"
      >
        I Need Help
      </button>

      {/* Help modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-[var(--color-text-primary)]/95 z-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-8">
            <h2 className="font-serif text-lg text-[var(--color-bg)] text-center">
              You Are Safe
            </h2>

            <div className="space-y-4 text-[var(--color-bg)]/80">
              <p>Take a deep breath. This experience is temporary.</p>
              <p>You are in control. You can:</p>
              <ul className="space-y-2 pl-4">
                <li>- Change your environment</li>
                <li>- Put on calming music</li>
                <li>- Move to a different position</li>
                <li>- Call someone you trust</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[var(--color-bg)]/20">
              <p className="text-[var(--color-bg)]/60 mb-4">
                If you need immediate support:
              </p>
              <p className="text-[var(--color-bg)]">
                Fireside Project: 62-FIRESIDE (623-473-7433)
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-4 bg-[var(--color-bg)] text-[var(--color-text-primary)]
                         uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
            >
              I'm Okay
            </button>
          </div>
        </div>
      )}
    </>
  );
}
