/**
 * JournalView Component
 * View and write journal entries
 */

import { useState, useEffect } from 'react';

export default function JournalView() {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger fade-in when component mounts
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`max-w-2xl mx-auto px-6 py-8 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <h2 className="text-2xl mb-8">Journal</h2>
      <p className="text-app-gray-600 dark:text-app-gray-400 mb-8">
        Your journal entries will appear here. Write freely during or after your session.
      </p>
    </div>
  );
}
