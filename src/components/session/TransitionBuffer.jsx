/**
 * TransitionBuffer Component
 * A reusable transition screen between flow sections.
 *
 * Sequence:
 * 1. Blank screen
 * 2. AsciiDiamond + random quote fade in (800ms)
 * 3. Hold for 2 seconds
 * 4. Fade out (800ms)
 * 5. Blank screen briefly, then calls onComplete
 *
 * @param {function} onComplete - Called when the transition finishes
 */

import { useState, useEffect, useRef } from 'react';
import AsciiDiamond from '../active/capabilities/animations/AsciiDiamond';

const QUOTES = [
  {
    text: 'The curious paradox is that when I accept myself just as I am, then I can change.',
    author: 'Carl Rogers',
  },
  {
    text: 'The only journey is the one within.',
    author: 'Rilke',
  },
  {
    text: 'The ability to observe without evaluating is the highest form of intelligence.',
    author: 'Krishnamurti',
  },
  {
    text: 'Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'It is only with the heart that one can see rightly; what is essential is invisible to the eye.',
    author: 'Antoine de Saint-Exupéry',
  },
  {
    text: "All of humanity's problems stem from man's inability to sit quietly in a room alone.",
    author: 'Blaise Pascal',
  },
  {
    text: 'Be patient toward all that is unsolved in your heart and try to love the questions themselves.',
    author: 'Rilke',
  },
];

export default function TransitionBuffer({ onComplete }) {
  const [phase, setPhase] = useState('blank'); // 'blank' | 'fading-in' | 'visible' | 'fading-out' | 'done'
  const quoteRef = useRef(null);

  // Pick a random quote on mount
  if (!quoteRef.current) {
    quoteRef.current = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  const quote = quoteRef.current;

  useEffect(() => {
    // Initial blank pause
    const t1 = setTimeout(() => setPhase('fading-in'), 300);

    // Fully visible after fade-in
    const t2 = setTimeout(() => setPhase('visible'), 1100); // 300 + 800ms fade

    // Start fading out after hold
    const t3 = setTimeout(() => setPhase('fading-out'), 3100); // 1100 + 2000ms hold

    // Done after fade-out
    const t4 = setTimeout(() => {
      setPhase('done');
    }, 3900); // 3100 + 800ms fade

    // Call onComplete after brief blank
    const t5 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4200); // 3900 + 300ms blank

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  const getOpacity = () => {
    switch (phase) {
      case 'blank':
      case 'done':
        return 0;
      case 'fading-in':
        return 1; // CSS transition handles the animation
      case 'visible':
        return 1;
      case 'fading-out':
        return 0; // CSS transition handles the animation
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div
        className="flex flex-col items-center text-center space-y-8 transition-opacity duration-800"
        style={{ opacity: getOpacity() }}
      >
        <AsciiDiamond />

        <div className="max-w-xs space-y-3">
          <p className="text-[var(--color-text-primary)] leading-relaxed italic text-sm">
            "{quote.text}"
          </p>
          <p className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}
