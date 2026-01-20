/**
 * AIAssistantTab Component
 * Header tab trigger for the AI Assistant modal
 */

export default function AIAssistantTab({ isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity"
      aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      aria-expanded={isOpen}
    >
      <span>My AI</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        aria-hidden="true"
      >
        <path d="M4 2.5L8 6L4 9.5" />
      </svg>
    </button>
  );
}
