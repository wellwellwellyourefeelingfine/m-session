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
  const triggerLogoAnimation = useAppStore((state) => state.triggerLogoAnimation);
  const glassEffect = useAppStore((state) => state.preferences?.glassEffect ?? true);
  return (
    <nav className="fixed bottom-0 left-0 right-0" style={{ borderTop: '1px solid var(--color-border)', background: glassEffect ? 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' : 'var(--bg-primary)', backdropFilter: glassEffect ? 'blur(24px)' : 'none', WebkitBackdropFilter: glassEffect ? 'blur(24px)' : 'none', paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'var(--tabbar-height)' }}>
      <div className="flex h-12 max-w-[1000px] mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setCurrentTab(tab.id); triggerLogoAnimation(); }}
            className={`flex-1 flex items-center justify-center text-[12px] uppercase tracking-wider transition-opacity duration-300 touch-target
              ${
                currentTab === tab.id
                  ? 'text-app-black dark:text-app-white'
                  : 'text-app-gray-500 dark:text-app-gray-500 hover:opacity-70'
              }`}
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            <span className="flex flex-col items-center gap-0.5">
              <span>{tab.label}</span>
              <span
                className={`w-2 h-2 rounded-full bg-[var(--accent)] transition-opacity duration-500 flex-shrink-0 ${
                  currentTab === tab.id ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
