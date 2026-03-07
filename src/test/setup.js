import '@testing-library/jest-dom'

// Mock window.matchMedia for jsdom (used by useInstallPrompt and theme detection)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Ensure localStorage is available for Zustand persist middleware
const store = {}
const localStorageMock = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = String(value) },
  removeItem: (key) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  get length() { return Object.keys(store).length },
  key: (i) => Object.keys(store)[i] ?? null,
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
