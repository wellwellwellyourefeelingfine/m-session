/**
 * TabBar Component
 * Bottom navigation with 4 tabs
 * Minimal, text-based (no icons initially)
 */

import { useAppStore } from '../../stores/useAppStore';

const tabs = [
  { id: 'home', label: 'HOME' },
  { id: 'active', label: 'ACTIVE' },
  { id: 'journal', label: 'JOURNAL' },
  { id: 'tools', label: 'TOOLS' },
];

export default function TabBar() {
  const currentTab = useAppStore((state) => state.currentTab);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-app-gray-200 dark:border-app-gray-800" style={{ backgroundColor: 'var(--bg-primary)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'var(--tabbar-height)' }}>
      <div className="flex h-12">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex-1 flex items-center justify-center text-[12px] uppercase tracking-wider transition-opacity duration-300 touch-target
              ${
                currentTab === tab.id
                  ? 'text-app-black dark:text-app-white'
                  : 'text-app-gray-500 dark:text-app-gray-500 hover:opacity-70'
              }`}
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
