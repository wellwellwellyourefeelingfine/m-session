/**
 * ToolPanel Component
 * Individual expandable panel for each tool
 * Manages its own animation state
 */

import { useState, useEffect } from 'react';
import { useToolsStore } from '../../stores/useToolsStore';

export default function ToolPanel({ toolId, ToolComponent }) {
  const isOpen = useToolsStore((state) => state.openTools.includes(toolId));
  const closeTool = useToolsStore((state) => state.closeTool);
  const canCloseTool = useToolsStore((state) => state.canCloseTool);

  const [isClosing, setIsClosing] = useState(false);
  const [renderedTool, setRenderedTool] = useState(isOpen ? toolId : null);

  // Handle tool opening/closing animations
  useEffect(() => {
    if (isOpen) {
      // Opening: update rendered tool immediately
      setRenderedTool(toolId);
      setIsClosing(false);
    } else if (renderedTool) {
      // Closing: start closing animation, delay content removal
      setIsClosing(true);
      const timer = setTimeout(() => {
        setRenderedTool(null);
        setIsClosing(false);
      }, 950); // 300ms fade + 450ms delay + 500ms slide = 1250ms, but content can be removed at 950ms
      return () => clearTimeout(timer);
    }
  }, [isOpen, toolId, renderedTool]);

  const handleClose = () => {
    if (canCloseTool(toolId)) {
      closeTool(toolId);
    }
  };

  return (
    <div
      className={`grid bg-app-white dark:bg-app-black ${renderedTool ? 'border-b border-app-black dark:border-app-white' : ''}`}
      style={{
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transition: isOpen
          ? 'grid-template-rows 500ms ease-in-out'
          : 'grid-template-rows 500ms ease-in-out 450ms'
      }}
    >
      <div className="overflow-hidden">
        {renderedTool && (
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={!canCloseTool(toolId)}
              className={`
                absolute top-2 right-3 text-lg leading-none
                transition-opacity duration-300
                ${isClosing ? 'opacity-0' : 'opacity-100 delay-200'}
                ${canCloseTool(toolId)
                  ? 'text-app-black dark:text-app-white hover:opacity-70 cursor-pointer'
                  : 'text-app-gray-400 dark:text-app-gray-600 cursor-not-allowed'
                }
              `}
              aria-label="Close tool"
            >
              ×
            </button>

            {/* Tool Content */}
            <div
              className="min-h-[80px] transition-opacity duration-300 ease-in-out"
              style={{
                opacity: isClosing ? 0 : (isOpen ? 1 : 0),
                transition: isClosing ? 'opacity 300ms ease-in-out' : 'opacity 300ms ease-in-out 200ms'
              }}
            >
              {ToolComponent && <ToolComponent />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
