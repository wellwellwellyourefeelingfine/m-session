# Directory Structure

```
src/
├── components/
│   ├── active/                    # Active session (meditation playback)
│   │   ├── modules/               # 20+ lazy-loaded custom module components
│   │   │   ├── shared/            # Shared module sub-components (cycle/, matrix/)
│   │   │   └── MasterModule/      # Content-driven universal module framework
│   │   │       ├── MasterModule.jsx         # Main orchestrator
│   │   │       ├── useMasterModuleState.js  # Central state management
│   │   │       ├── sectionRenderers/        # Screens, Meditation, Timer, Generate
│   │   │       ├── blockRenderers/          # Header, Text, Prompt, Selector, Choice, etc.
│   │   │       ├── generators/              # PNG generator registry
│   │   │       └── utils/                   # expandScreenToBlocks, evaluateCondition, etc.
│   │   ├── capabilities/          # Composable UI building blocks
│   │   │   ├── animations/        # BreathOrb, AsciiMoon, AsciiDiamond, MorphingShapes,
│   │   │   │                      #   Compass, LeafDraw, RevealOverlay
│   │   │   ├── hooks/             # useModuleState, useModuleTimer
│   │   │   ├── ModuleLayout.jsx   # Consistent layout wrapper
│   │   │   ├── ModuleControlBar.jsx
│   │   │   ├── ImageViewerModal.jsx  # Shared full-screen image viewer
│   │   │   └── TranscriptModal.jsx
│   │   ├── hooks/                 # useBreathController (breath timing engine)
│   │   ├── moduleRegistry.js      # Module type → component mapping
│   │   └── ActiveView.jsx         # Main orchestrator
│   ├── session/                   # Session flow & transition components
│   │   ├── SubstanceChecklist.jsx  # Pre-session preparation (5 steps)
│   │   ├── PreSessionIntro.jsx     # Pre-session ritual (6 steps + intention sub-flow)
│   │   ├── ComeUpCheckIn.jsx       # Come-up phase check-in modal
│   │   ├── PeakTransition.jsx      # Come-up → peak transition (6 steps)
│   │   ├── PeakPhaseCheckIn.jsx    # Peak phase end-of-phase check-in
│   │   ├── BoosterConsiderationModal.jsx # Optional booster dose check-in
│   │   ├── IntegrationTransition.jsx # Peak → integration transition (5-9 steps)
│   │   ├── ClosingCheckIn.jsx      # Prompts user to begin closing ritual
│   │   ├── ClosingRitual.jsx       # 8-step closing ritual
│   │   ├── DataDownloadModal.jsx   # Session data download (text/JSON)
│   │   ├── activities/            # Pre-session activities
│   │   │   ├── IntentionSettingActivity.jsx  # Guided intention refinement
│   │   │   └── LifeGraphActivity.jsx         # Lifecycle visualization + PNG export
│   │   └── transitions/           # Transition step content & shared components
│   ├── ai/                        # AI Assistant components
│   │   ├── AIAssistantModal.jsx   # Main chat interface
│   │   ├── AIAssistantTab.jsx     # AI tab view
│   │   ├── AISettingsPanel.jsx    # Provider/model configuration
│   │   ├── ChatWindow.jsx
│   │   ├── ChatInput.jsx
│   │   ├── ChatMessage.jsx
│   │   └── ChatSidebar.jsx
│   ├── helper/                    # "What's happening?" support modal (heart icon in header)
│   │   ├── HelperModal.jsx        # Top-anchored sheet modal — major-view orchestrator
│   │   ├── HelperButton.jsx       # Heart icon trigger rendered inside Header
│   │   ├── HelperTopBar.jsx       # Back / title / close header bar
│   │   ├── CategoryGrid.jsx       # 2-column category card grid + slim emergency contact card
│   │   ├── CategoryHeader.jsx     # Wide category card shown above the triage flow
│   │   ├── RatingScale.jsx        # 0–10 bubble scale (supports `dimmed` completed state)
│   │   ├── TriageStepRunner.jsx   # V5 decision tree orchestrator (rating → choice(s) → result)
│   │   ├── TriageChoiceStep.jsx   # Single-select option cards inside the triage flow
│   │   ├── TriageResultStep.jsx   # Resolver result + activity suggestions + I-need-more-help expand
│   │   ├── ActivitySuggestions.jsx # Activity card list (reuses timeline ModuleCard)
│   │   ├── EmergencyFlow.jsx      # Emergency contact card / 911-112 / Fireside Project (rating 10)
│   │   ├── EmergencyContactCard.jsx # Shared bordered contact card with Call/Text + tap-to-copy
│   │   ├── EmergencyContactView.jsx # Dedicated contact page (header + card + edit + notes)
│   │   ├── AcknowledgeClose.jsx   # Acknowledge text shown when rating is 0
│   │   ├── PlaceholderCategory.jsx # "Coming soon" view for stub categories (low-mood, integration)
│   │   └── PreSessionContent.jsx  # Pre-session dimmed preview + explanatory overlay
│   ├── history/                   # Session history browsing
│   │   └── SessionHistoryModal.jsx # Accordion-style past sessions panel
│   ├── home/                      # Home view, follow-up section, pre-session view
│   ├── journal/                   # Entry list + editor + settings
│   ├── tools/                     # FAQ, dosage, settings, resources, philosophy, about
│   ├── intake/                    # Questionnaire components
│   ├── timeline/                  # Timeline editor components
│   ├── shared/                    # Reusable UI components (Icons, AlarmPrompt, etc.)
│   └── layout/                    # AppShell, Header, TabBar, SessionMenu
├── stores/
│   ├── useSessionStore.js         # Core session logic (~2,700 lines)
│   ├── useAppStore.js             # Global state (tabs, dark mode)
│   ├── useJournalStore.js         # Journal entries
│   ├── useAIStore.js              # AI assistant state + conversations
│   ├── useToolsStore.js           # Tools panel state
│   ├── useHelperStore.js          # Helper Modal open/closed state (transient, not persisted)
│   └── useSessionHistoryStore.js  # Archived session management
├── services/
│   ├── aiService.js               # AI provider API integration
│   ├── audioComposerService.js    # Composes TTS clips + silence + gong into single MP3 blob
│   ├── audioCacheService.js       # Caches fetched audio files (IndexedDB)
│   └── cryptoService.js           # API key encryption
├── hooks/
│   ├── useAudioPlayback.js        # Single <audio> element lifecycle (play/pause/resume)
│   ├── useMeditationPlayback.js   # Shared TTS meditation playback orchestration
│   ├── useSilenceTimer.js         # Gong-bookended silence timer (for non-TTS modules)
│   ├── useSyncedDuration.js       # Two-way duration sync between module UI and session store
│   ├── useInstallPrompt.js        # PWA install prompt detection
│   └── useTranscriptModal.js      # Meditation transcript viewer
├── content/
│   ├── modules/                   # Module definitions + content
│   │   ├── library.js             # All module definitions (metadata only — content extracted)
│   │   ├── journaling/            # Extracted journaling module content
│   │   │   ├── journalingContent.js           # Light, deep, gratitude, time capsule
│   │   │   ├── integrationReflectionContent.js
│   │   │   ├── relationshipsReflectionContent.js
│   │   │   ├── lifestyleReflectionContent.js
│   │   │   ├── spiritMeaningContent.js
│   │   │   ├── bodySomaticContent.js
│   │   │   └── natureConnectionContent.js
│   │   ├── protectorDialogueContent.js
│   │   ├── theCycleContent.js
│   │   ├── theDeepDiveReflectionContent.js
│   │   ├── valuesCompassContent.js
│   │   ├── musicRecommendations.js
│   │   ├── danceRecommendations.js
│   │   └── master/                # MasterModule content config files
│   ├── meditations/               # Meditation content + audio mappings (one file per meditation)
│   ├── intake/                    # 4-section questionnaire
│   ├── helper/                    # Helper Modal content
│   │   ├── categories.js          # 8 categories with `phases` arrays + decision-tree `steps`
│   │   ├── formatLog.js           # Journal entry formatter (V5 step-path format)
│   │   ├── resolverUtils.js       # classifyPhaseWindow, formatTimeContext, ACT id constants
│   │   └── resolvers/             # 6 per-category pure resolver functions (one per active category)
│   └── timeline/
│       └── configurations.js      # 11 timeline configs (5 focuses × 2 guidance + minimal)
├── utils/
│   ├── buildSystemPrompt.js       # AI context builder
│   ├── downloadSessionData.js     # Session data export (text + images)
│   ├── imageStorage.js            # IndexedDB image persistence
│   └── audioPath.js               # Audio file path resolution
└── App.jsx                        # Tab routing (views kept mounted)

public/
└── audio/
    ├── meditations/
    │   ├── open-awareness/        # default voice + relaxing-rachel/ subfolder
    │   ├── body-scan/             # default voice + relaxing-rachel/ subfolder
    │   ├── self-compassion/       # default voice + relaxing-rachel/ subfolder
    │   ├── simple-grounding/      # default voice + relaxing-rachel/ subfolder
    │   ├── short-grounding/       # default voice + relaxing-rachel/ subfolder
    │   ├── felt-sense/            # default voice + relaxing-rachel/ subfolder
    │   ├── leaves-on-a-stream/    # default voice + relaxing-rachel/ subfolder
    │   ├── stay-with-it/          # default voice + relaxing-rachel/ subfolder
    │   ├── protector-dialogue/    # default voice + relaxing-rachel/ subfolder
    │   ├── pendulation/           # default voice only (branching audio)
    │   ├── the-descent/           # default voice only (Deep Dive)
    │   ├── the-cycle-closing/     # default voice only
    │   ├── transition-opening/    # default voice only
    │   ├── transition-centering-breath/
    │   └── transition-closing/
    ├── voice-previews/            # <voiceId>.mp3 sample clips for Settings preview
    └── silence/                   # pre-rendered silence blocks (60s, 30s, 10s, 5s, 1s, 0.5s)
```
