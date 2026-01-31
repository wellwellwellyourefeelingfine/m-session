/**
 * iOS Install Prompt
 * Detects iOS Safari (not already in standalone PWA mode)
 * and prompts the user to add the app to their home screen.
 *
 * iOS doesn't support programmatic install — we guide the user
 * through the native Share > Add to Home Screen flow.
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';

const BANNER_ID = 'ios-install-prompt';

function isIOSSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

export default function IOSInstallPrompt() {
  const dismissed = useAppStore((state) => state.dismissedBanners[BANNER_ID]);
  const dismissBanner = useAppStore((state) => state.dismissBanner);
  const [show, setShow] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari when not already installed as PWA
    if (!dismissed && isIOSSafari() && !isStandalone()) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [dismissed]);

  if (!show || dismissed) return null;

  const handleDismiss = () => {
    setHiding(true);
    setTimeout(() => dismissBanner(BANNER_ID), 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 transition-opacity duration-300 ${
        hiding ? 'opacity-0' : 'opacity-100 animate-fadeIn'
      }`}
      onClick={handleDismiss}
    >
      <div
        className={`w-full max-w-md bg-[var(--color-bg)] border-t border-[var(--color-border)] p-6 pb-8 rounded-t-2xl shadow-xl transition-transform duration-300 ${
          hiding ? 'translate-y-full' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[var(--color-text-primary)] text-xs uppercase tracking-wider font-medium">
            Install m-session
          </h3>
          <button
            onClick={handleDismiss}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors text-lg leading-none -mt-1"
          >
            &times;
          </button>
        </div>

        <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed mb-5">
          For the best experience — offline access, full screen,
          and no browser distractions — add this app to your home screen.
        </p>

        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3">
            <span className="text-[var(--accent)] text-sm mt-0.5 shrink-0">1.</span>
            <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed">
              Tap the{' '}
              <span className="inline-block align-middle mx-0.5">
                <ShareIcon />
              </span>{' '}
              share button in your browser toolbar
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[var(--accent)] text-sm mt-0.5 shrink-0">2.</span>
            <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed">
              Scroll down and tap <strong className="text-[var(--color-text-primary)]">Add to Home Screen</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[var(--accent)] text-sm mt-0.5 shrink-0">3.</span>
            <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed">
              Tap <strong className="text-[var(--color-text-primary)]">Add</strong> to confirm
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-3 border border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

/** Minimal iOS share icon (box with arrow) */
function ShareIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--accent)]"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
