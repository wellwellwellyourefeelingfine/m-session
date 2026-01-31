/**
 * Cookie Banner
 * A lighthearted EU cookie notice — we don't use cookies,
 * so this just lets the user feel good about clicking "accept."
 */

import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';

const BANNER_ID = 'cookie-notice';

export default function CookieBanner() {
  const dismissed = useAppStore((state) => state.dismissedBanners[BANNER_ID]);
  const dismissBanner = useAppStore((state) => state.dismissBanner);
  const [hiding, setHiding] = useState(false);

  if (dismissed) return null;

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
      <div className="max-w-md mx-auto bg-[var(--color-bg)] border border-[var(--color-border)] p-4 shadow-lg">
        <p className="text-[var(--color-text-secondary)] text-[10px] leading-relaxed mb-3">
          This app doesn&apos;t use cookies, trackers, or analytics.
          Your data stays on your device. But here&apos;s a button
          anyway, because you deserve to click something.
        </p>
        <button
          onClick={handleDismiss}
          className="w-full py-2.5 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-[10px] hover:opacity-90 transition-opacity"
        >
          I feel good about this
        </button>
      </div>
    </div>
  );
}
