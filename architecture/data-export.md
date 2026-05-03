# Data Export

Session data can be downloaded in three places:
1. **Closing Ritual** (Step 6: "Before You Go") — via `DataDownloadModal`
2. **Settings tool** (Tools tab) — via download buttons with confirmation
3. **Hamburger menu** → "Export Session" — via `DataDownloadModal`

### Formats

- **Text (.txt)**: Human-readable session record with divider-separated sections
- **Images (.png)**: Session-created images (e.g. Values Compass) downloaded as separate PNG files

### Data Included

| Section | Source |
|---------|--------|
| Session metadata | Timestamps, duration, dosage, booster status |
| Intention & touchstone | Intake + pre-session intro |
| Peak transition captures | One-word, body sensations |
| Integration transition captures | Edited intention, focus changes, tailored activity |
| Closing reflections | Self-gratitude, future message, commitment |
| Come-up check-in responses | Timestamped feeling responses |
| Booster check-in responses | Experience quality, physical state, trajectory |
| Module completion history | All completed/skipped activities with timestamps |
| Follow-up reflections | Check-in, revisit, integration (if completed) |
| All journal entries | Both session-created and personal/manual entries |

Follow-up data is included only if those modules have been completed. Downloads during the closing ritual will gracefully omit follow-up sections since they unlock 24-48 hours later.

### Implementation

`src/utils/downloadSessionData.js` reads directly from Zustand stores via `getState()` (no React hooks needed) and generates the export at download time.
