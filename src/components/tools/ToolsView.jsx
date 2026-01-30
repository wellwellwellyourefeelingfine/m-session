/**
 * ToolsView Component
 * Clean tool menu with expandable panels
 * Now supports multiple tools open simultaneously
 */

import { useState, useEffect } from 'react';
import { useToolsStore } from '../../stores/useToolsStore';
import ToolPanel from './ToolPanel';
import DosageTool from './DosageTool';
import TestingTool from './TestingTool';
import ResourcesTool from './ResourcesTool';
import FAQTool from './FAQTool';
import SettingsTool from './SettingsTool';
import HelpTool from './HelpTool';
import AISettingsTool from './AISettingsTool';
import PhilosophyTool from './PhilosophyTool';
import AboutTool from './AboutTool';

const tools = [
  { id: 'help', label: 'I NEED HELP', component: HelpTool },
  { id: 'about', label: 'ABOUT', component: AboutTool },
  { id: 'philosophy', label: 'OUR PHILOSOPHY', component: PhilosophyTool },
  { id: 'dosage', label: 'DOSAGE ASSISTANT', component: DosageTool },
  { id: 'testing', label: 'SUBSTANCE TESTING', component: TestingTool },
  { id: 'resources', label: 'RESOURCES', component: ResourcesTool },
  { id: 'faq', label: 'FAQ', component: FAQTool },
  { id: 'ai', label: 'AI ASSISTANT', component: AISettingsTool },
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
      {/* Tool Menu Box */}
      <div className="bg-app-black dark:bg-app-white border border-app-black dark:border-app-white">
        {tools.map((tool, index) => {
          const isOpen = openTools.includes(tool.id);
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`
                w-full text-left pl-3 pr-6 py-4
                text-app-white dark:text-app-black
                hover:opacity-70 transition-opacity
                ${index < tools.length - 1 ? 'border-b border-app-white dark:border-app-black' : ''}
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
          );
        })}
      </div>

      {/* Individual Tool Panels - Each tool gets its own expandable panel */}
      {tools.map((tool) => (
        <ToolPanel
          key={tool.id}
          toolId={tool.id}
          ToolComponent={tool.component}
        />
      ))}
    </div>
  );
}
