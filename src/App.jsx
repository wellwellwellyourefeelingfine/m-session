/**
 * Main App Component
 * Handles tab routing and renders appropriate view
 *
 * Views are kept mounted but hidden (via CSS) to preserve state
 * when switching tabs. This is important for modules like BreathMeditation
 * that need to maintain their state (timer, progress) across tab switches.
 */

import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { useAIStore } from './stores/useAIStore';
import AppShell from './components/layout/AppShell';
import HomeView from './components/home/HomeView';
import ActiveView from './components/active/ActiveView';
import JournalView from './components/journal/JournalView';
import ToolsView from './components/tools/ToolsView';

function App() {
  const currentTab = useAppStore((state) => state.currentTab);

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
      {/* Keep all views mounted but hide inactive ones to preserve state */}
      <div className={currentTab === 'home' ? '' : 'hidden'}>
        <HomeView />
      </div>
      <div className={currentTab === 'active' ? '' : 'hidden'}>
        <ActiveView />
      </div>
      <div className={currentTab === 'journal' ? '' : 'hidden'}>
        <JournalView />
      </div>
      <div className={currentTab === 'tools' ? '' : 'hidden'}>
        <ToolsView />
      </div>
    </AppShell>
  );
}

export default App;
