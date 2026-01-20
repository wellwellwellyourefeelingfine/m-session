/**
 * ChatSidebar Component
 * Conversation list with create/delete functionality
 * Collapses to hamburger menu on mobile
 */

import { useState, useEffect } from 'react';
import { useAIStore } from '../../stores/useAIStore';

/**
 * Format date for display
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

/**
 * Individual conversation item
 */
function ConversationItem({ conversation, isActive, onClick, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={`
        w-full text-left px-3 py-2 mb-1 cursor-pointer
        text-[10px] uppercase tracking-wider
        transition-colors
        ${isActive
          ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
        }
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate flex-1">{conversation.title}</span>
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
            aria-label="Delete conversation"
          >
            ×
          </button>
        )}
      </div>
      <div className="text-[9px] text-[var(--text-tertiary)] mt-0.5">
        {formatDate(conversation.updatedAt)}
      </div>
    </div>
  );
}

/**
 * Desktop sidebar (visible on md+ screens)
 * Supports collapsed state with smooth animation
 */
export function DesktopSidebar({ collapsed = false, onToggleCollapse, onOpenSettings }) {
  const conversations = useAIStore((state) => state.conversations);
  const activeConversationId = useAIStore((state) => state.activeConversationId);
  const setActiveConversation = useAIStore((state) => state.setActiveConversation);
  const createConversation = useAIStore((state) => state.createConversation);
  const deleteConversation = useAIStore((state) => state.deleteConversation);

  return (
    <div
      className={`
        hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--bg-primary)]
        transition-all duration-200 ease-out overflow-hidden
        ${collapsed ? 'w-10' : 'w-48'}
      `}
    >
      {collapsed ? (
        // Collapsed state - just show icons
        <>
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <div className="flex-1" />
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 hover:bg-[var(--bg-secondary)] transition-colors"
              aria-label="AI Settings"
              title="AI Settings"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="10" cy="10" r="3" />
                <path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.5 3.5l2 2M14.5 14.5l2 2M3.5 16.5l2-2M14.5 5.5l2-2" />
              </svg>
            </button>
          )}
          <button
            onClick={createConversation}
            className="p-2 hover:bg-[var(--bg-secondary)] transition-colors mb-2"
            aria-label="New chat"
            title="New chat"
          >
            <span className="text-lg">+</span>
          </button>
        </>
      ) : (
        // Expanded state
        <>
          {/* Header with collapse toggle */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 border-b border-[var(--border)]">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] whitespace-nowrap">
              Conversations
            </span>
            <button
              onClick={onToggleCollapse}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M9 3L5 7L9 11" />
              </svg>
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto py-2">
            {conversations.length === 0 ? (
              <div className="px-3 py-4 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider text-center">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  onClick={() => setActiveConversation(conv.id)}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))
            )}
          </div>

          {/* Bottom buttons */}
          <div className="flex-shrink-0 p-3 border-t border-[var(--border)] space-y-2">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="
                  w-full py-2 px-3 flex items-center justify-center gap-2
                  border border-[var(--border)]
                  text-[10px] uppercase tracking-wider
                  hover:bg-[var(--bg-secondary)] transition-colors
                "
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="10" cy="10" r="3" />
                  <path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.5 3.5l2 2M14.5 14.5l2 2M3.5 16.5l2-2M14.5 5.5l2-2" />
                </svg>
                Settings
              </button>
            )}
            <button
              onClick={createConversation}
              className="
                w-full py-2 px-3
                border border-[var(--border)]
                text-[10px] uppercase tracking-wider
                hover:bg-[var(--bg-secondary)] transition-colors
              "
            >
              + New Chat
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Mobile sidebar (hamburger menu)
 */
export function MobileSidebar({ isOpen, onClose, onOpenSettings }) {
  const [isClosing, setIsClosing] = useState(false);
  const conversations = useAIStore((state) => state.conversations);
  const activeConversationId = useAIStore((state) => state.activeConversationId);
  const setActiveConversation = useAIStore((state) => state.setActiveConversation);
  const createConversation = useAIStore((state) => state.createConversation);
  const deleteConversation = useAIStore((state) => state.deleteConversation);

  // Reset closing state when opening - when isOpen becomes true, ensure clean state
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false); // Reset closing state before calling onClose
      onClose();
    }, 200); // Match animation duration
  };

  const handleSelectConversation = (id) => {
    setActiveConversation(id);
    handleClose();
  };

  const handleCreateConversation = () => {
    createConversation();
    handleClose();
  };

  const handleOpenSettings = () => {
    handleClose();
    if (onOpenSettings) {
      setTimeout(() => onOpenSettings(), 200);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 top-16 bg-black/50 z-[76] md:hidden ${isClosing ? 'animate-fadeOut pointer-events-none' : 'animate-fadeIn'}`}
        onClick={handleClose}
      />

      {/* Sidebar panel - aligned with header bottom (top-16 = 64px = header height) */}
      <div
        className={`
          fixed top-16 left-0 bottom-0 w-64
          bg-[var(--bg-primary)] z-[77] md:hidden
          border-r border-[var(--border)]
          ${isClosing ? 'animate-slideOutToLeft pointer-events-none' : 'animate-slideInFromLeft'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            Conversations
          </span>
          <button
            onClick={handleClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2" style={{ maxHeight: 'calc(100vh - 64px - 140px)' }}>
          {conversations.length === 0 ? (
            <div className="px-4 py-4 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider text-center">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => handleSelectConversation(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))
          )}
        </div>

        {/* Bottom buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border)] bg-[var(--bg-primary)] space-y-2">
          {onOpenSettings && (
            <button
              onClick={handleOpenSettings}
              className="
                w-full py-2 px-4 flex items-center justify-center gap-2
                border border-[var(--border)]
                text-[10px] uppercase tracking-wider
                hover:bg-[var(--bg-secondary)] transition-colors
              "
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="10" cy="10" r="3" />
                <path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.5 3.5l2 2M14.5 14.5l2 2M3.5 16.5l2-2M14.5 5.5l2-2" />
              </svg>
              AI Settings
            </button>
          )}
          <button
            onClick={handleCreateConversation}
            className="
              w-full py-2 px-4
              border border-[var(--border)]
              text-[10px] uppercase tracking-wider
              hover:bg-[var(--bg-secondary)] transition-colors
            "
          >
            + New Chat
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Mobile hamburger button
 */
export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 -ml-2 hover:opacity-70 transition-opacity"
      aria-label="Open conversation menu"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 5h14M3 10h14M3 15h14" />
      </svg>
    </button>
  );
}
