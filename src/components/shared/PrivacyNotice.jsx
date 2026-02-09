/**
 * Privacy Notice (Desktop)
 * Shows on non-mobile devices to inform users that
 * no cookies, trackers, or analytics are used.
 * All data stays on-device via localStorage.
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';

const BANNER_ID = 'privacy-notice';

function isMobile() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Android|iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function PrivacyNotice() {
  const dismissed = useAppStore((state) => state.dismissedBanners[BANNER_ID]);
  const dismissBanner = useAppStore((state) => state.dismissBanner);
  const [show, setShow] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    // Only show on desktop (mobile users get the iOS/Android install prompts instead)
    if (!dismissed && !isMobile()) {
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
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${
        hiding ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0 animate-slideUp'
      }`}
    >
      <div className="max-w-md mx-auto bg-[var(--color-bg)] border border-[var(--color-border)] p-5 shadow-lg rounded-lg">
        <h3 className="text-[var(--color-text-primary)] text-xs uppercase tracking-wider font-medium mb-3">
          Your Privacy
        </h3>
        <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed mb-4">
          This app doesn&apos;t use any cookies, trackers, or analytics.
          All of your data is stored locally on your device &mdash; nothing
          is ever sent to any servers.
        </p>
        <button
          onClick={handleDismiss}
          className="w-full py-2.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          Okay, sounds good
        </button>
      </div>
    </div>
  );
}
