/**
 * Android Install Prompt
 * Detects Android browsers (not already in standalone PWA mode)
 * and prompts the user to install the app to their home screen.
 * Also includes privacy notice (no cookies, local storage only).
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';

const BANNER_ID = 'android-install-prompt';

function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

export default function AndroidInstallPrompt() {
  const dismissed = useAppStore((state) => state.dismissedBanners[BANNER_ID]);
  const dismissBanner = useAppStore((state) => state.dismissBanner);
  const [show, setShow] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    // Only show on Android when not already installed as PWA
    if (!dismissed && isAndroid() && !isStandalone()) {
      const timer = setTimeout(() => setShow(true), 10000);
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

        <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed mb-4">
          This app doesn&apos;t use any cookies, trackers, or analytics.
          All of your data is stored locally on your device &mdash; nothing
          is ever sent to any servers.
        </p>

        <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed mb-5">
          For the best experience &mdash; offline access, full screen,
          and no browser distractions &mdash; install this app to your home screen:
        </p>

        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3">
            <span className="text-[var(--accent)] text-sm mt-0.5 shrink-0">1.</span>
            <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed">
              Tap the{' '}
              <span className="inline-block align-middle mx-0.5">
                <MenuIcon />
              </span>{' '}
              menu in your browser toolbar
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[var(--accent)] text-sm mt-0.5 shrink-0">2.</span>
            <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed">
              Tap <strong className="text-[var(--color-text-primary)]">Install app</strong> or{' '}
              <strong className="text-[var(--color-text-primary)]">Add to Home Screen</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[var(--accent)] text-sm mt-0.5 shrink-0">3.</span>
            <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed">
              Tap <strong className="text-[var(--color-text-primary)]">Install</strong> to confirm
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-3 border border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          Okay, sounds good
        </button>
      </div>
    </div>
  );
}

/** Three-dot vertical menu icon (Android Chrome) */
function MenuIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-[var(--accent)]"
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
