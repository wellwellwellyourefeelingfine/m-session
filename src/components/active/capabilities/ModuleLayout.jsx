/**
 * ModuleLayout Component
 *
 * Provides consistent layout structure for all modules.
 * Works with ModuleStatusBar (fixed at top) and ModuleControlBar (fixed at bottom).
 *
 * Layout structure:
 * ┌─────────────────────────────────────┐
 * │ [Header - h-16]                    │
 * ├─────────────────────────────────────┤
 * │ [ModuleStatusBar - h-9]            │
 * ├─────────────────────────────────────┤
 * │                                     │
 * │         [Main Content Area]         │
 * │    Scrollable, centered content     │
 * │                                     │
 * │                                     │
 * ├─────────────────────────────────────┤
 * │ [Control Bar - h-14]               │
 * ├─────────────────────────────────────┤
 * │ [Tab Bar - h-16]                   │
 * └─────────────────────────────────────┘
 *
 * Content area accounts for:
 * - Control bar (h-14 = 56px)
 * - Tab bar (h-16 = 64px)
 * - Safe area padding
 */

/**
 * @param {object} props
 * @param {object} props.layout - Layout configuration
 * @param {boolean} props.layout.centered - Center content vertically
 * @param {string} props.layout.maxWidth - 'sm' | 'md' | 'lg' | 'full'
 * @param {string} props.layout.padding - 'normal' | 'compact' | 'none'
 * @param {React.ReactNode} props.children - Main content
 */
export default function ModuleLayout({
  layout = {},
  children,
}) {
  const {
    centered = true,
    maxWidth = 'md',
    padding = 'normal',
  } = layout;

  const getPaddingClass = () => {
    switch (padding) {
      case 'compact': return 'px-4';
      case 'none': return '';
      default: return 'px-6';
    }
  };

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'lg': return 'max-w-lg';
      case 'full': return 'w-full';
      default: return 'max-w-md';
    }
  };

  return (
    <div
      className={`flex flex-col ${getPaddingClass()} pt-4 pb-8`}
      style={{
        minHeight: centered ? 'calc(100vh - var(--header-height) - var(--bottom-chrome))' : undefined,
        paddingBottom: '2rem',
      }}
    >
      {/* Main content area */}
      <div
        className={`flex-1 ${centered ? 'flex items-center justify-center' : ''} w-full`}
      >
        <div className={`${getMaxWidthClass()} mx-auto w-full`}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Module Header Component
 * Standardized header with title and optional subtitle/instructions
 */
export function ModuleHeader({
  title,
  subtitle,
  instructions,
  centered = true,
  className = '',
}) {
  return (
    <div className={`${centered ? 'text-center' : ''} space-y-3 ${className}`}>
      {title && (
        <h2 className="text-[var(--color-text-primary)]">
          {title}
        </h2>
      )}

      {subtitle && (
        <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
          {subtitle}
        </p>
      )}

      {instructions && (
        <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs">
          {instructions}
        </p>
      )}
    </div>
  );
}

/**
 * Module Content Container
 * Wrapper for main module content with consistent spacing
 */
export function ModuleContent({
  children,
  centered = true,
  className = '',
}) {
  return (
    <div className={`${centered ? 'text-center' : ''} space-y-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Completion Screen Component
 * Shown when a module finishes successfully
 */
export function CompletionScreen({
  title = 'Well done.',
  message = 'Take a moment before moving on.',
}) {
  return (
    <div className="text-center space-y-4 animate-fadeIn">
      <h2 className="text-[var(--color-text-primary)]">
        {title}
      </h2>
      <p className="uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)]">
        {message}
      </p>
    </div>
  );
}

/**
 * Idle Screen Component
 * Shown before a module starts (with title, description)
 */
export function IdleScreen({
  title,
  description,
  duration,
}) {
  return (
    <div className="text-center space-y-6 animate-fadeIn">
      {title && (
        <h2 className="text-[var(--color-text-primary)]">
          {title}
        </h2>
      )}

      {description && (
        <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {description}
        </p>
      )}

      {duration && (
        <p className="uppercase tracking-wider text-[10px] text-[var(--color-text-tertiary)]">
          {duration} minutes
        </p>
      )}
    </div>
  );
}

/**
 * Phase Indicator
 * Shows current phase text (for breathing, meditation, etc.)
 */
export function PhaseIndicator({ phase, className = '' }) {
  return (
    <p className={`text-[var(--color-text-primary)] text-sm uppercase tracking-wider ${className}`}>
      {phase}
    </p>
  );
}
