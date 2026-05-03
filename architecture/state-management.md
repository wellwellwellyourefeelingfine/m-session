# State Management

All stores use Zustand with `persist` middleware for localStorage backup.

## useSessionStore (Core)

```javascript
{
  sessionPhase: 'not-started' | 'intake' | 'pre-session' |
                'substance-checklist' | 'active' | 'paused' | 'completed',

  intake: {
    currentSection, currentQuestionIndex, isComplete,
    showSafetyWarnings, showMedicationWarning,
    // Navigation + completion flags only. User answers live in sessionProfile.
  },
  sessionProfile: {
    // Universal per-session user-data slice. Every value the user enters —
    // intake answers, substance plan, intention artifacts, emergency contact.
    // Written via `updateSessionProfile(field, value)`.
    // Includes: experienceLevel, sessionMode, primaryFocus, holdingQuestion,
    // emotionalState, guidanceLevel, sessionDuration, considerBooster,
    // safeSpace, heartConditions, psychiatricHistory, medications,
    // emergencyContactDetails: { name, phone, notes },
    // hasSubstance, hasTestedSubstance, hasPreparedDosage,
    // plannedDosageMg, dosageFeedback, touchstone,
    // intentionJournalEntryId, focusJournalEntryId,
    // ... (35 fields total)
  },
  substanceChecklist: {
    hasTakenSubstance, ingestionTime, ingestionTimeConfirmed,
    // Ingestion-event runtime state only. Substance fields in sessionProfile.
  },
  preSubstanceActivity: {
    substanceChecklistSubPhase, completedActivities,
    // Navigation + completion tracking only.
  },

  timeline: {
    currentPhase: 'come-up' | 'peak' | 'integration',
    targetDuration, phases: { comeUp, peak, integration }
  },

  modules: {
    items: [/* module instances */],
    currentModuleInstanceId: string | null,
    history: [/* completed/skipped modules */]
  },

  comeUpCheckIn: { responses, currentResponse, hasIndicatedFullyArrived, nextPromptAt, ... },

  booster: {
    considerBooster, status: 'pending' | 'prompted' | 'taken' | 'skipped' | 'snoozed' | 'expired',
    checkInResponses: { experienceQuality, physicalState, trajectory }
  },

  phaseTransitions: {
    activeTransition: 'come-up-to-peak' | 'peak-to-integration' | 'session-closing' | null
  },

  transitionCaptures: {
    peak: { bodySensations, oneWord },
    integration: { editedIntention, newFocus, tailoredActivityResponse },
    closing: { selfGratitude, futureMessage, commitment }
  },

  session: { closedAt, finalDurationSeconds },

  followUp: {
    phaseUnlockTime: null,       // ms timestamp when follow-up modules unlock (8h post-session)
  }
}
```

**Key Actions:**
- `startSession()`, `completeModule()`, `skipModule()`, `abandonModule()`
- `addModule(libraryId, phase, position)` — pre-session timeline editing (handles linked parents)
- `insertAtActive(libraryId)` — runtime module injection (used by Helper Modal)
- `abandonModule(instanceId)` — resets module to `upcoming`, clears meditation playback
- `updateSessionProfile(field, value)` — universal user-data writer (auto-derives `dosageFeedback`)
- `beginPeakTransition()`, `transitionToPeak()`, `transitionToIntegration()`
- `recordCheckInResponse()`, `recordIngestionTime()`, `confirmIngestionTime()`
- `setSubstanceChecklistSubPhase()`, `completePreSubstanceActivity()`
- `updateTransitionCapture()`, `updateClosingCapture()`, `completeSession()`

## `sessionProfile` — Design Rationale

The `sessionProfile` slice is the **single source of truth for every value the user enters during a session**. Before v24, this data was scattered across `intake.responses`, `substanceChecklist`, and `preSubstanceActivity`.

**Lifecycle.** Born when a session starts, preserved across archive/restore, only destroyed via `deleteSession()`. `resetSession()` only runs after the prior session is safely snapshotted.

**Per-session, not global.** Two sessions never share data. Starting a new session never pre-fills from a prior session.

**What did NOT move into `sessionProfile`.** The semantic line is *answers vs. event state*: `ingestionTime`/`hasTakenSubstance`/`ingestionTimeConfirmed` stay in `substanceChecklist` (event timestamps, not user answers). `intake.{currentSection, currentQuestionIndex, isComplete}` stay in `intake` (navigation flags). `preSubstanceActivity.{substanceChecklistSubPhase, completedActivities}` stay (screen completion, not answers).

**Adding a new field.** (1) Add default to `sessionProfile` initial state, (2) add to `resetSession()` payload, (3) add migration case if default isn't `null`, (4) read/write via `updateSessionProfile('fieldName', value)`. Auto-archived, auto-migrated, auto-exported.

## useHelperStore

Minimal unpersisted store (`{ isOpen, openHelper, closeHelper }`) bridging the trigger button in `Header.jsx` and the modal mount in `AppShell.jsx`.

## localStorage Keys

| Key | Store |
|-----|-------|
| `mdma-guide-session-state` | useSessionStore |
| `mdma-guide-app-state` | useAppStore |
| `mdma-guide-journal-state` | useJournalStore |
| `mdma-guide-ai-state` | useAIStore |
| `mdma-guide-session-history` | useSessionHistoryStore |

`useHelperStore` and `useToolsStore` are intentionally **not** persisted — transient UI state only.
