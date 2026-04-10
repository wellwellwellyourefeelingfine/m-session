/**
 * ToolsView Component
 * Accordion-style tool menu — each panel opens directly below its button,
 * pushing the remaining buttons down.
 * Supports multiple tools open simultaneously.
 */

import { useState, useEffect, Fragment } from 'react';
import { useToolsStore } from '../../stores/useToolsStore';
import ToolPanel from './ToolPanel';
import DosageTool from './DosageTool';
import ResourcesTool from './ResourcesTool';
import FAQTool from './FAQTool';
import SettingsTool from './SettingsTool';
import AboutTool from './AboutTool';
import HowToUseTool from './HowToUseTool';
import SourcesTool from './SourcesTool';
const tools = [
  { id: 'about', label: 'ABOUT', component: AboutTool },
  { id: 'how-to-use', label: 'HOW TO USE THIS APP', component: HowToUseTool },
  { id: 'faq', label: 'FAQ', component: FAQTool },
  { id: 'resources', label: 'RESOURCES', component: ResourcesTool },
  { id: 'dosage', label: 'DOSAGE ASSISTANT', component: DosageTool },
  { id: 'sources', label: 'SOURCES & ACKNOWLEDGEMENTS', component: SourcesTool },
  { id: 'settings', label: 'SETTINGS', component: SettingsTool },
];

export default function ToolsView() {
  const openTools = useToolsStore((state) => state.openTools);
  const toggleTool = useToolsStore((state) => state.toggleTool);

  const [isVisible, setIsVisible] = useState(false);

  // Trigger fade-in when component mounts
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleToolClick = (toolId) => {
    toggleTool(toolId);
  };

  return (
    <div className={`max-w-2xl mx-auto px-6 py-8 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Accordion — each button is followed by its expandable panel */}
      <div className="border border-app-black dark:border-app-white overflow-hidden">
        {tools.map((tool, index) => {
          const isOpen = openTools.includes(tool.id);
          const isLast = index === tools.length - 1;
          return (
            <Fragment key={tool.id}>
              <button
                onClick={() => handleToolClick(tool.id)}
                className={`
                  w-full text-left pl-3 pr-6 py-4
                  bg-app-black dark:bg-app-white
                  text-app-white dark:text-app-black
                  hover:opacity-70 transition-opacity
                  ${isLast ? '' : 'border-b border-app-white/20 dark:border-app-black/20'}
                  ${isOpen ? 'font-medium' : ''}
                `}
              >
                <span className="flex items-center gap-2">
                  {/* Accent dot indicator - fades in/out based on open state */}
                  <span
                    className={`w-2 h-2 rounded-full bg-[var(--accent)] transition-opacity duration-300 flex-shrink-0 ${
                      isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <span className="text-sm tracking-wider">{tool.label}</span>
                </span>
              </button>
              <ToolPanel toolId={tool.id} ToolComponent={tool.component} isLast={isLast} />
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
