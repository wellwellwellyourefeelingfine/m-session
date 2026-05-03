# Session History

Sessions can be archived and restored via the hamburger menu in the header.

### How It Works
- **Archive**: "New Session" saves the current session state + journal entries to `useSessionHistoryStore`, then resets both stores
- **Restore**: "Past Sessions" opens an accordion panel where users can browse archived sessions and load them back (current session is auto-archived first)
- **Storage**: All archived sessions are stored in localStorage under `mdma-guide-session-history`

### Hamburger Menu (`SessionMenu`)

Entry point for session lifecycle actions: dark/light toggle, New Session (archive current → reset), Past Sessions (accordion UI for browsing/loading archives), Export Session (opens `DataDownloadModal`).

### Known Limitation
Journal images stored in IndexedDB are not included in archives. Users should download images before archiving a session.
