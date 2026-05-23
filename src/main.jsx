import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/shared/ErrorBoundary'
import { track } from './services/analyticsService'

// Fire pwa-installed once per device, the first time the app is opened in
// standalone display mode (i.e. from the home-screen icon). This is the only
// signal available on iOS — Safari never dispatches the `appinstalled` event.
try {
  const isStandalone =
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  if (isStandalone && !localStorage.getItem('m-session-install-tracked')) {
    localStorage.setItem('m-session-install-tracked', '1');
    track('pwa-installed');
  }
} catch {
  // localStorage or matchMedia may be unavailable in some contexts
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
