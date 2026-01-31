/**
 * Main App Component
 * Handles tab routing and renders appropriate view
 *
 * Views are lazy-loaded on first visit and then kept mounted (via CSS)
 * to preserve state when switching tabs. This is important for modules
 * like BreathMeditation that need to maintain their state across tab switches.
 */

import { useEffect, useState, lazy, Suspense } from 'react';
import { useAppStore } from './stores/useAppStore';
import { useAIStore } from './stores/useAIStore';
import AppShell from './components/layout/AppShell';
import HomeView from './components/home/HomeView';

// Lazy-load non-Home views — only downloaded when their tab is first opened
const ActiveView = lazy(() => import('./components/active/ActiveView'));
const JournalView = lazy(() => import('./components/journal/JournalView'));
const ToolsView = lazy(() => import('./components/tools/ToolsView'));

function App() {
  const currentTab = useAppStore((state) => state.currentTab);

  // Track which tabs have been visited so we keep them mounted after first load
  const [mountedTabs, setMountedTabs] = useState({ home: true });

  useEffect(() => {
    if (!mountedTabs[currentTab]) {
      setMountedTabs((prev) => ({ ...prev, [currentTab]: true }));
    }
  }, [currentTab]);

  // AI key expiration check
  const checkKeyExpiration = useAIStore((state) => state.checkKeyExpiration);
  const clearApiKey = useAIStore((state) => state.clearApiKey);

  useEffect(() => {
    // Check on mount
    if (checkKeyExpiration()) {
      clearApiKey();
    }

    // Check periodically (every minute)
    const interval = setInterval(() => {
      if (checkKeyExpiration()) {
        clearApiKey();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [checkKeyExpiration, clearApiKey]);

  return (
    <AppShell>
      {/* Home is always mounted (critical path) */}
      <div className={currentTab === 'home' ? '' : 'hidden'}>
        <HomeView />
      </div>

      {/* Other views: lazy-loaded on first visit, then kept mounted */}
      <Suspense fallback={null}>
        {mountedTabs.active && (
          <div className={currentTab === 'active' ? '' : 'hidden'}>
            <ActiveView />
          </div>
        )}
        {mountedTabs.journal && (
          <div className={currentTab === 'journal' ? '' : 'hidden'}>
            <JournalView />
          </div>
        )}
        {mountedTabs.tools && (
          <div className={currentTab === 'tools' ? '' : 'hidden'}>
            <ToolsView />
          </div>
        )}
      </Suspense>
    </AppShell>
  );
}

export default App;
