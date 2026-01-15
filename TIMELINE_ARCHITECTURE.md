# Timeline Architecture - Technical Specification

## Overview

This document outlines the complete architectural redesign of the Session app's timeline system. The core change is separating the **timeline** (a time-based container with phases) from **modules** (activities within the timeline).

---

## 1. Core Concepts

### 1.1 Timeline vs Modules

**Timeline**: The overarching session structure that:
- Runs on a clock (2-8 hours)
- Contains three phases: Come-Up, Peak, Integration
- Has its own lifecycle independent of module completion
- Continues even if all modules are completed

**Modules**: Individual activities within the timeline that:
- Belong to a specific phase
- Can be added, removed, or reordered by the user
- Have phase-specific restrictions
- Are optional (user can have an empty phase)

### 1.2 The Three Phases

| Phase | Duration | End Trigger | Character |
|-------|----------|-------------|-----------|
| **Come-Up** | 20-60 min | User check-in ("Fully Arrived") | Calming, grounding, gentle |
| **Peak** | 60-120 min | Time-based (soft transition) | Light introspection, open awareness |
| **Integration** | Remaining time | Session end | Deeper work, journaling, therapy |

---

## 2. Module Library System

### 2.1 Module Definition Schema

```javascript
{
  id: string,                    // Unique identifier (e.g., 'grounding-breath-4-7-8')
  type: string,                  // Category: 'breathing', 'meditation', 'journaling', etc.
  title: string,                 // Display name
  description: string,           // Brief description for library browsing
  defaultDuration: number,       // Suggested duration in minutes
  minDuration: number,           // Minimum allowed duration
  maxDuration: number,           // Maximum allowed duration
  allowedPhases: string[],       // ['come-up', 'peak', 'integration']
  recommendedPhases: string[],   // Phases where this module works best
  intensity: 'gentle' | 'moderate' | 'deep',
  content: {
    instructions: string,
    prompts?: string[],
    audioGuide?: string,         // Future: audio file reference
    timerConfig?: object         // For timed exercises
  },
  tags: string[]                 // For filtering/search
}
```

### 2.2 Module Types

```javascript
const MODULE_TYPES = {
  // Gentle (Come-Up appropriate)
  'grounding': { intensity: 'gentle', allowedPhases: ['come-up', 'peak', 'integration'] },
  'breathing': { intensity: 'gentle', allowedPhases: ['come-up', 'peak', 'integration'] },
  'body-scan-light': { intensity: 'gentle', allowedPhases: ['come-up', 'peak'] },
  'music-listening': { intensity: 'gentle', allowedPhases: ['come-up', 'peak', 'integration'] },
  'gentle-movement': { intensity: 'gentle', allowedPhases: ['come-up', 'peak'] },

  // Moderate (Peak appropriate)
  'open-awareness': { intensity: 'moderate', allowedPhases: ['peak', 'integration'] },
  'light-journaling': { intensity: 'moderate', allowedPhases: ['peak', 'integration'] },
  'body-scan-deep': { intensity: 'moderate', allowedPhases: ['peak', 'integration'] },
  'self-compassion': { intensity: 'moderate', allowedPhases: ['peak', 'integration'] },

  // Deep (Integration appropriate)
  'deep-journaling': { intensity: 'deep', allowedPhases: ['integration'], recommendedPhases: ['integration'] },
  'therapy-exercise': { intensity: 'deep', allowedPhases: ['integration'], recommendedPhases: ['integration'] },
  'parts-work': { intensity: 'deep', allowedPhases: ['integration'], recommendedPhases: ['integration'] },
  'letter-writing': { intensity: 'deep', allowedPhases: ['peak', 'integration'], recommendedPhases: ['integration'] },
  'closing-ritual': { intensity: 'moderate', allowedPhases: ['integration'] },

  // Utility (Any phase)
  'check-in': { intensity: 'gentle', allowedPhases: ['come-up', 'peak', 'integration'] },
  'open-space': { intensity: 'gentle', allowedPhases: ['come-up', 'peak', 'integration'] },
  'break': { intensity: 'gentle', allowedPhases: ['come-up', 'peak', 'integration'] }
}
```

### 2.3 Module Library File Structure

```
src/content/modules/
├── index.js                 // Exports full library + helpers
├── library.js               // All module definitions
├── comeup/                  // Come-up specific modules
│   ├── grounding.js
│   ├── breathing.js
│   └── ...
├── peak/                    // Peak-focused modules
│   ├── open-awareness.js
│   ├── light-journaling.js
│   └── ...
└── integration/             // Integration modules
    ├── deep-journaling.js
    ├── therapy-exercises.js
    └── ...
```

---

## 3. State Architecture

### 3.1 New useSessionStore Structure

```javascript
{
  // === SESSION PHASE (unchanged) ===
  sessionPhase: 'not-started' | 'intake' | 'pre-session' | 'active' | 'paused' | 'completed',

  // === INTAKE (unchanged) ===
  intake: { ... },

  // === NEW: TIMELINE STATE ===
  timeline: {
    // Time configuration
    scheduledStartTime: Date | null,      // From intake (optional)
    actualStartTime: Date | null,         // When "Begin Session" clicked
    targetDuration: number,               // Total session length in minutes (from intake)
    minDuration: 120,                     // 2 hours minimum
    maxDuration: 480,                     // 8 hours maximum

    // Phase configuration
    currentPhase: 'come-up' | 'peak' | 'integration' | null,
    phases: {
      comeUp: {
        minDuration: 20,
        maxDuration: 60,
        allocatedDuration: 45,            // User can't exceed this with modules
        startedAt: Date | null,
        endedAt: Date | null,
        endedBy: 'user-checkin' | 'timeout' | null
      },
      peak: {
        estimatedDuration: 90,            // Soft estimate (60-120 min)
        allocatedDuration: 90,
        startedAt: Date | null,
        endedAt: Date | null
      },
      integration: {
        allocatedDuration: number,        // Calculated: targetDuration - comeUp - peak
        startedAt: Date | null,
        endedAt: Date | null
      }
    },

    // Computed (for display)
    elapsedMinutes: number,
    remainingMinutes: number
  },

  // === NEW: MODULES STATE ===
  modules: {
    // The actual timeline modules (editable in pre-session)
    items: [
      {
        instanceId: string,               // Unique instance ID (different from library id)
        libraryId: string,                // Reference to module library
        phase: 'come-up' | 'peak' | 'integration',
        title: string,                    // Can be customized from library default
        duration: number,                 // Can be adjusted within min/max
        status: 'upcoming' | 'active' | 'completed' | 'skipped',
        order: number,                    // Position within phase
        content: object,                  // Copied from library, can be customized
        startedAt: Date | null,
        completedAt: Date | null
      }
    ],

    // Runtime state
    currentModuleInstanceId: string | null,
    history: []                           // Completed/skipped modules with timestamps
  },

  // === COME-UP CHECK-IN STATE ===
  comeUpCheckIn: {
    promptCount: 0,                       // How many times we've asked
    lastPromptAt: Date | null,
    responses: [],                        // History of check-in responses
    currentResponse: null                 // 'waiting' | 'starting' | 'fully-arrived'
  }
}
```

### 3.2 New Actions

```javascript
// Timeline Management
setTargetDuration(minutes)
startSession()                            // Sets actualStartTime, currentPhase = 'come-up'
endSession()
pauseSession()
resumeSession()

// Phase Transitions
completeComeUp(response)                  // User check-in response
transitionToPeak()                        // Called after come-up ends
transitionToIntegration()                 // Called after peak time elapsed

// Module Management (Pre-Session Editing)
addModuleToPhase(libraryId, phase, position?)
removeModule(instanceId)
reorderModule(instanceId, newPosition)
updateModuleDuration(instanceId, duration)

// Module Runtime
startModule(instanceId)
completeModule(instanceId)
skipModule(instanceId)

// Come-Up Check-Ins
recordCheckInPrompt()
recordCheckInResponse(response)

// Validation
validatePhaseModules(phase)               // Returns { valid, totalDuration, errors }
canAddModuleToPhase(libraryId, phase)     // Returns { allowed, warning?, error? }
```

---

## 4. Timeline Editor Component

### 4.1 Component Structure

```
TimelineEditor/
├── TimelineEditor.jsx           // Main container
├── PhaseSection.jsx             // Renders one phase with its modules
├── ModuleCard.jsx               // Individual module (draggable)
├── ModuleLibraryDrawer.jsx      // Slide-out panel to browse/add modules
├── AddModuleButton.jsx          // "+ Add" button for each phase
├── PhaseDurationBar.jsx         // Visual indicator of phase time allocation
└── TimelineSummary.jsx          // Total duration, warnings, etc.
```

### 4.2 UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Your Session Timeline                          Total: 4h   │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─ COME-UP (20-60 min) ─────────────────────────────────┐  │
│  │ ████████████░░░░░░░░░░░░░░░░░░░░░░  35/60 min        │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │ ≡  Grounding Meditation              15 min  │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │ ≡  4-7-8 Breathing                   10 min  │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │ ≡  Body Scan (Light)                 10 min  │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │                                                       │  │
│  │  [ + Add Module ]                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ PEAK (60-120 min) ───────────────────────────────────┐  │
│  │ ██████████████████░░░░░░░░░░░░░░░░  75/120 min       │  │
│  │  ...modules...                                        │  │
│  │  [ + Add Module ]                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ INTEGRATION (remaining time) ────────────────────────┐  │
│  │ ████████████████████████████████░░  130/150 min      │  │
│  │  ...modules...                                        │  │
│  │  [ + Add Module ]                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  [ Begin Session ]                                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Validation Rules

**Come-Up Phase:**
- Max total module duration: 60 minutes
- Only `intensity: 'gentle'` modules allowed
- Error if user tries to add more than max duration
- Error if user tries to add non-gentle module

**Peak Phase:**
- Soft duration guide: 60-120 minutes
- `intensity: 'gentle'` or `'moderate'` modules allowed
- Warning (not error) if user adds `intensity: 'deep'` module
- Warning text: "This activity is designed for the Integration phase. You may find it more effective later in your session."

**Integration Phase:**
- Duration: Whatever remains after come-up + peak
- All module intensities allowed
- No restrictions

**Global:**
- Total session: 2-8 hours
- User can remove ALL modules from any phase (empty phases are valid)
- Reordering: Only within same phase (no cross-phase drag)

---

## 5. Come-Up Check-In System

### 5.1 Check-In Flow

```
Session Starts
     │
     ▼
┌─────────────────────────────────────────┐
│  Come-Up Phase Begins                    │
│  Timer starts (max 60 min)               │
└─────────────────────────────────────────┘
     │
     ▼ (Every 10-15 minutes, soft prompt)
┌─────────────────────────────────────────┐
│  "How are you feeling?"                  │
│                                          │
│  ○ Still waiting                         │
│  ○ Starting to feel something            │
│  ○ Fully arrived                         │
│                                          │
│  [ Continue ]                            │
└─────────────────────────────────────────┘
     │
     ├─── "Still waiting" ──────► Continue come-up, next prompt in 10-15 min
     │
     ├─── "Starting to feel" ───► Continue come-up, next prompt in 10 min
     │
     └─── "Fully arrived" ──────► Transition to Peak phase

     │
     ▼ (At 60 min mark, if not transitioned)
┌───────────────────────────���─────────────┐
│  "You've been in the come-up phase      │
│   for an hour. How would you like       │
│   to proceed?"                           │
│                                          │
│  ○ I need more time (extend 15 min)     │
│  ○ Move to peak phase                    │
│  ○ Something doesn't feel right (help)  │
│                                          │
└─────────────────────────────────────────┘
```

### 5.2 Check-In Component

```javascript
// Rendered as overlay during come-up phase
<ComeUpCheckIn
  promptType="periodic" | "timeout" | "user-initiated"
  elapsedMinutes={35}
  onResponse={(response) => handleCheckInResponse(response)}
/>
```

---

## 6. Active Session Flow

### 6.1 Phase-Based Rendering

```
ActiveView
├── ComeUpPhase (when currentPhase === 'come-up')
│   ├── PhaseHeader ("Come-Up", elapsed time, progress)
│   ├── CurrentModule (if any) OR OpenSpace
│   ├── CheckInOverlay (when prompted)
│   └── PhaseActions (skip module, need help)
│
├── PeakPhase (when currentPhase === 'peak')
│   ├── PhaseHeader ("Peak", elapsed time)
│   ├── CurrentModule OR OpenSpace
│   └── PhaseActions
│
└── IntegrationPhase (when currentPhase === 'integration')
    ├── PhaseHeader ("Integration", remaining time)
    ├── CurrentModule OR OpenSpace
    └── SessionEndPrompt (when time nearing end)
```

### 6.2 What Happens When Modules Run Out

If user completes all modules in a phase but time remains:

```
┌─────────────────────────────────────────┐
│                                          │
│           Open Space                     │
│                                          │
│   You've completed all planned           │
│   activities for this phase.             │
│                                          │
│   Take this time to:                     │
│   • Rest and integrate                   │
│   • Follow your inner guidance           │
│   • Simply be present                    │
│                                          │
│   ─────────────────────────────────────  │
│                                          │
│   [ Add an Activity ]  [ Continue ]      │
│                                          │
└─────────────────────────────────────────┘
```

---

## 7. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        INTAKE FLOW                                │
│  User answers questions → Generate default timeline               │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                     PRE-SESSION (Timeline Editor)                 │
│  User sees generated timeline → Can edit (add/remove/reorder)    │
│  Validation enforces phase rules                                  │
│  User clicks "Begin Session"                                      │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                     ACTIVE SESSION                                │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  COME-UP    │───►│    PEAK     │───►│    INTEGRATION      │  │
│  │  20-60 min  │    │   60-120m   │    │   Remaining time    │  │
│  │             │    │             │    │                     │  │
│  │ Check-ins   │    │ Time-based  │    │ Can end when ready  │  │
│  │ until user  │    │ transition  │    │ (after min 2h)      │  │
│  │ "arrived"   │    │ (soft)      │    │                     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                   │
│  Timeline clock runs continuously regardless of module status     │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SESSION COMPLETE                           │
│  Summary, journal prompt, option to export/save                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Order

### Phase 1: Foundation
1. Create module library structure and initial modules
2. Refactor `useSessionStore` with new timeline/modules architecture
3. Update `generateTimelineFromIntake()` to use module library

### Phase 2: Timeline Editor
4. Build `TimelineEditor` component with phase sections
5. Implement add/remove/reorder functionality
6. Add validation with error/warning modals
7. Update `PreSessionView` to use `TimelineEditor`

### Phase 3: Active Session
8. Implement come-up check-in system
9. Update `ActiveView` for phase-based rendering
10. Add phase transition logic
11. Implement "open space" state when modules exhausted

### Phase 4: Polish
12. Add timeline progress visualization to Home tab
13. Implement session summary/completion flow
14. Testing and edge cases

---

## 9. Open Questions / Decisions

1. **Module duration editing**: Should users be able to adjust individual module durations, or only add/remove?
   - **Recommendation**: Allow duration adjustment within module's min/max bounds

2. **Saving custom timelines**: Should users be able to save their edited timeline as a template for future sessions?
   - **Recommendation**: Future feature, not MVP

3. **Mid-session editing**: Can users add modules during an active session?
   - **Recommendation**: Yes, via "Add an Activity" in open space state

4. **Audio integration**: Some modules (breathing, meditation) benefit from audio guides.
   - **Recommendation**: Future feature, not MVP. Structure supports it.

---

## 10. File Changes Summary

### New Files
- `src/content/modules/library.js` - Module definitions
- `src/content/modules/index.js` - Library exports and helpers
- `src/components/timeline/TimelineEditor.jsx`
- `src/components/timeline/PhaseSection.jsx`
- `src/components/timeline/ModuleCard.jsx`
- `src/components/timeline/ModuleLibraryDrawer.jsx`
- `src/components/timeline/TimelineSummary.jsx`
- `src/components/active/ComeUpCheckIn.jsx`
- `src/components/active/OpenSpace.jsx`
- `src/components/active/PhaseHeader.jsx`

### Modified Files
- `src/stores/useSessionStore.js` - Major refactor
- `src/components/home/PreSessionView.jsx` - Use TimelineEditor
- `src/components/home/SessionTimeline.jsx` - Phase-aware display
- `src/components/active/ActiveView.jsx` - Phase-based rendering
- `src/components/active/ModuleRenderer.jsx` - Updated module handling

### Potentially Removed
- Old intake-to-timeline generation logic (replaced)
