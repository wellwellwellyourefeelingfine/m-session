/**
 * AppShell Component
 * Main layout wrapper with header, content area, and tab bar
 */

import { useAppStore } from '../../stores/useAppStore';
import { useHelperStore } from '../../stores/useHelperStore';
import { lazy, Suspense, useEffect, useRef } from 'react';
import Header from './Header';
import TabBar from './TabBar';
const HelperModal = lazy(() => import('../helper/HelperModal'));
import { AppUpdaterProvider } from '../shared/AppUpdaterContext';

export default function AppShell({ children }) {
  const darkMode = useAppStore((state) => state.darkMode);
  const readableFont = useAppStore((state) => state.preferences?.readableFont);
  const fontSizeAdjustment = useAppStore((state) => state.preferences?.fontSizeAdjustment ?? 0);
  const currentTab = useAppStore((state) => state.currentTab);
  const isHelperOpen = useHelperStore((state) => state.isOpen);
  const mainRef = useRef(null);

  // Apply dark mode class to document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Apply readable-font class to document element
  useEffect(() => {
    if (readableFont) {
      document.documentElement.classList.add('font-readable');
    } else {
      document.documentElement.classList.remove('font-readable');
    }
  }, [readableFont]);

  // Apply font-size adjustment to document element
  useEffect(() => {
    if (fontSizeAdjustment === 0) {
      document.documentElement.removeAttribute('data-font-size');
    } else {
      document.documentElement.setAttribute('data-font-size', String(fontSizeAdjustment));
    }
  }, [fontSizeAdjustment]);

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
    <AppUpdaterProvider>
      <div className="h-full flex flex-col bg-app-white dark:bg-app-black">
        <Header />
        {isHelperOpen && (
          <Suspense fallback={null}>
            <HelperModal />
          </Suspense>
        )}

        {/* Main content area - scrollable container with fixed header/footer compensation */}
        <main ref={mainRef} className="flex-1 overflow-y-auto overscroll-none" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--tabbar-height)' }}>
          {children}
        </main>

        <TabBar />
      </div>
    </AppUpdaterProvider>
  );
}
