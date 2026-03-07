# Contributing to M-SESSION

Thank you for your interest in contributing to M-SESSION. This project exists to provide a free, privacy-first companion for people who choose to have intentional MDMA experiences, and contributions that improve safety, usability, and accessibility are always welcome.

## Getting Started

### Prerequisites

- **Node.js 22 LTS** (pinned in `.nvmrc`). Node 25+ introduces breaking changes.
- A modern browser for testing (Chrome, Safari, Firefox)

### Setup

```bash
git clone https://github.com/wellwellwellyourefeelingfine/m-session.git
cd m-session
nvm use
npm install
npm run dev       # Dev server at localhost:5173
```

### Build and Verify

```bash
npm run build     # Production build
npm run preview   # Preview production build locally
```

## How to Contribute

### Reporting Bugs

Use the [bug report template](https://github.com/wellwellwellyourefeelingfine/m-session/issues/new?template=bug_report.yml). Include your device/browser, steps to reproduce, and expected vs. actual behavior.

### Suggesting Features

Use the [feature request template](https://github.com/wellwellwellyourefeelingfine/m-session/issues/new?template=feature_request.yml). Describe the problem you're solving and your proposed approach.

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b my-feature`)
3. Make your changes
4. Test on both light and dark modes
5. Verify tab switching doesn't break timer state
6. Run `npm run build` to ensure clean build
7. Submit a pull request with a clear description of your changes

## Architecture

For detailed documentation on the codebase — directory structure, module system, audio pipeline, state management, and design system — see [ARCHITECTURE.md](ARCHITECTURE.md).

## Guidelines

### Code Style

- **Components**: `*View.jsx` for views, `*Module.jsx` for modules
- **Hooks**: `use*.js`
- **State**: Always use Zustand actions, never mutate directly
- **Styling**: Prefer Tailwind utilities; use CSS variables for colors (enables dark mode)
- **Error handling**: Use optional chaining (`?.`) and provide fallbacks

### Adding New Modules

For new activity modules, prefer the capability-based approach first (no custom code needed). See the [Adding a New Module](ARCHITECTURE.md#adding-a-new-module) section in ARCHITECTURE.md.

### Audio Modules

For meditation modules with TTS audio, ensure graceful fallback to text-only display. See the [Adding a Meditation Module](ARCHITECTURE.md#adding-a-meditation-module-with-audio) section for the full 7-step process.

### Version Numbers

On significant releases, update both:
- `version` in `package.json`
- The display label in `src/components/layout/SessionMenu.jsx` (the `m-session vX.X` text in the hamburger menu)

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating. This project involves a sensitive topic and we ask that all contributors approach discussions about substance use with respect and without judgment.
