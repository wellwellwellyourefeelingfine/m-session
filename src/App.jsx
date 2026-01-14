/**
 * Main App Component
 * Handles tab routing and renders appropriate view
 */

import { useAppStore } from './stores/useAppStore';
import AppShell from './components/layout/AppShell';
import HomeView from './components/home/HomeView';
import ActiveView from './components/active/ActiveView';
import JournalView from './components/journal/JournalView';
import ToolsView from './components/tools/ToolsView';

function App() {
  const currentTab = useAppStore((state) => state.currentTab);

  const renderView = () => {
    switch (currentTab) {
      case 'home':
        return <HomeView />;
      case 'active':
        return <ActiveView />;
      case 'journal':
        return <JournalView />;
      case 'tools':
        return <ToolsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <AppShell>
      {renderView()}
    </AppShell>
  );
}

export default App;
