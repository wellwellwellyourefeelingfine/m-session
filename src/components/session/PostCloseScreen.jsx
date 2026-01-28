/**
 * PostCloseScreen Component
 * Black screen animation that plays after the closing ritual completes
 *
 * Animation Sequence:
 * 1. 0-800ms: Black screen, AsciiMoon fades in (opacity 0→1)
 * 2. 500-1300ms: "Take care of yourself." text fades in
 * 3. 1300-3000ms: Hold both at full opacity
 * 4. 3000-4000ms: Both fade out (opacity 1→0)
 * 5. After 4000ms: Navigate to Home tab
 *
 * No skip allowed - animation plays fully to create contemplative closing moment
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import { POST_CLOSE_CONTENT } from './transitions/content/closingRitualContent';

// Timing constants (in milliseconds)
const TIMING = {
  moonFadeStart: 0,
  moonFadeDuration: 800,
  textFadeStart: 500,
  textFadeDuration: 800,
  holdEnd: 3000,
  fadeOutDuration: 1000,
  navigateAt: 4000,
};

export default function PostCloseScreen() {
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);

  // Animation phases: 'initial' | 'moon-fading' | 'text-fading' | 'holding' | 'fading-out' | 'complete'
  const [phase, setPhase] = useState('initial');

  useEffect(() => {
    // Start moon fade-in immediately
    const moonTimer = setTimeout(() => {
      setPhase('moon-fading');
    }, TIMING.moonFadeStart);

    // Start text fade-in after 500ms
    const textTimer = setTimeout(() => {
      setPhase('text-fading');
    }, TIMING.textFadeStart);

    // Both fully visible, hold phase
    const holdTimer = setTimeout(() => {
      setPhase('holding');
    }, TIMING.textFadeStart + TIMING.textFadeDuration);

    // Start fade-out
    const fadeOutTimer = setTimeout(() => {
      setPhase('fading-out');
    }, TIMING.holdEnd);

    // Navigate to home
    const navigateTimer = setTimeout(() => {
      setPhase('complete');
      setCurrentTab('home');
    }, TIMING.navigateAt);

    return () => {
      clearTimeout(moonTimer);
      clearTimeout(textTimer);
      clearTimeout(holdTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(navigateTimer);
    };
  }, [setCurrentTab]);

  // Calculate opacity based on phase
  const getMoonOpacity = () => {
    switch (phase) {
      case 'initial':
        return 0;
      case 'moon-fading':
      case 'text-fading':
      case 'holding':
        return 1;
      case 'fading-out':
      case 'complete':
        return 0;
      default:
        return 0;
    }
  };

  const getTextOpacity = () => {
    switch (phase) {
      case 'initial':
      case 'moon-fading':
        return 0;
      case 'text-fading':
      case 'holding':
        return 1;
      case 'fading-out':
      case 'complete':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
      {/* Moon - positioned upper-center */}
      <div
        className="transition-opacity mb-12"
        style={{
          opacity: getMoonOpacity(),
          transitionDuration: phase === 'fading-out' ? `${TIMING.fadeOutDuration}ms` : `${TIMING.moonFadeDuration}ms`,
        }}
      >
        <AsciiMoon />
      </div>

      {/* Text - positioned below moon */}
      <div
        className="transition-opacity text-center"
        style={{
          opacity: getTextOpacity(),
          transitionDuration: phase === 'fading-out' ? `${TIMING.fadeOutDuration}ms` : `${TIMING.textFadeDuration}ms`,
        }}
      >
        <p className="text-white text-lg font-serif">
          {POST_CLOSE_CONTENT.text}
        </p>
      </div>
    </div>
  );
}
