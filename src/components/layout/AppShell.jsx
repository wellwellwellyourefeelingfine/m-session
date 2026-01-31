/**
 * AppShell Component
 * Main layout wrapper with header, content area, and tab bar
 */

import { useAppStore } from '../../stores/useAppStore';
import { useEffect, useRef } from 'react';
import Header from './Header';
import TabBar from './TabBar';

export default function AppShell({ children }) {
  const darkMode = useAppStore((state) => state.darkMode);
  const currentTab = useAppStore((state) => state.currentTab);
  const mainRef = useRef(null);

  // Apply dark mode class to document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Reset scroll position when switching tabs or on initial mount
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentTab]);

  // Disable browser scroll restoration (prevents auto-scroll on page load)
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-app-white dark:bg-app-black">
      <Header />

      {/* Main content area - scrollable container with fixed header/footer compensation */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overscroll-none" style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top))', paddingBottom: 'calc(3rem + env(safe-area-inset-bottom))' }}>
        {children}
      </main>

      <TabBar />
    </div>
  );
}
