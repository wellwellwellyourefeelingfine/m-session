/**
 * ActiveView Component
 * Active session display - currently running module
 */

import { useState, useEffect } from 'react';

export default function ActiveView() {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger fade-in when component mounts
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`session-container transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex-1 flex items-center justify-center w-full">
        <p className="session-prompt">
          Start a session from the Home tab to begin.
        </p>
      </div>
    </div>
  );
}
