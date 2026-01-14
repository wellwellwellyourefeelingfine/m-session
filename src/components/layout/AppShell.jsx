/**
 * AppShell Component
 * Main layout wrapper with header, content area, and tab bar
 */

import { useAppStore } from '../../stores/useAppStore';
import { useEffect } from 'react';
import Header from './Header';
import TabBar from './TabBar';

export default function AppShell({ children }) {
  const darkMode = useAppStore((state) => state.darkMode);

  // Apply dark mode class to document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-app-white dark:bg-app-black">
      <Header />

      {/* Main content area with padding for fixed header/footer */}
      <main className="pt-16 pb-20 min-h-screen">
        {children}
      </main>

      <TabBar />
    </div>
  );
}
