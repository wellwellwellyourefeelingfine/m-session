/**
 * ErrorBoundary
 * Catches render errors in child components and shows a recovery UI.
 * Must be a class component — React's error boundary API requires it.
 */

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="text-center space-y-4 max-w-sm">
            <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
              Something unexpected happened.
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Your session data is safe — it's stored locally on your device.
            </p>
            <button
              onClick={this.handleReset}
              className="mt-4 px-6 py-2 text-[11px] uppercase tracking-wider text-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
