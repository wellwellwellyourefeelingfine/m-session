/**
 * useInstallPrompt Hook
 * Captures the beforeinstallprompt event for native PWA install on Android/Chrome,
 * and provides platform detection helpers for conditional install UI.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

function isIOSSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

export function useInstallPrompt() {
  const deferredPrompt = useRef(null);
  const [canPromptNatively, setCanPromptNatively] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanPromptNatively(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setCanPromptNatively(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptNativeInstall = useCallback(async () => {
    if (!deferredPrompt.current) return null;
    deferredPrompt.current.prompt();
    const result = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setCanPromptNatively(false);
    return result;
  }, []);

  return {
    canPromptNatively,
    promptNativeInstall,
    isIOS: isIOSSafari(),
    isAndroid: isAndroid(),
    isStandalone: isStandalone(),
  };
}
