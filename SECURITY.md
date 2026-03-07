# Security Policy

## Privacy Architecture

M-SESSION is designed with a privacy-first architecture. **No user data ever leaves the device.**

- All session data is stored in the browser's **localStorage** and **IndexedDB**
- There are **no accounts**, no cloud sync, no analytics, and no tracking
- The app runs entirely client-side as a Progressive Web App
- Session data can be exported as local text files at the user's discretion
- AI assistant API keys (if used) are encrypted with session-based encryption and auto-expire

## What Data Is Stored

| Data | Storage | Scope |
|------|---------|-------|
| Session state (responses, timeline, captures) | localStorage | Per-browser |
| Journal entries (text) | localStorage | Per-browser |
| Journal images | IndexedDB | Per-browser |
| AI assistant conversations | localStorage | Per-browser |
| App preferences (dark mode, tab state) | localStorage | Per-browser |
| Archived sessions | localStorage | Per-browser |

All data can be cleared by the user at any time through browser settings or the app's reset functionality.

## Reporting Security Issues

If you discover a security vulnerability in M-SESSION, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Instead, email the maintainers or use [GitHub's private vulnerability reporting](https://github.com/wellwellwellyourefeelingfine/m-session/security/advisories/new)
3. Include a description of the vulnerability, steps to reproduce, and potential impact

We will acknowledge receipt within 48 hours and work to address the issue promptly.

## Scope

Security concerns relevant to this project include:

- Cross-site scripting (XSS) in user-generated content (journal entries, text inputs)
- Insecure handling of AI API keys
- Data leakage through service workers or caching
- Vulnerabilities in dependencies

Issues outside our scope:
- Browser-level vulnerabilities
- Device-level security (screen lock, physical access)
- Third-party AI provider security (Anthropic, OpenAI, OpenRouter APIs)
