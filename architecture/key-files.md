# Key Files Reference

| Purpose | File |
|---------|------|
| Main entry | `src/App.jsx` |
| Session state | `src/stores/useSessionStore.js` |
| Module routing | `src/components/active/moduleRegistry.js` |
| Module definitions | `src/content/modules/library.js` |
| MasterModule orchestrator | `src/components/active/modules/MasterModule/MasterModule.jsx` |
| MasterModule state | `src/components/active/modules/MasterModule/useMasterModuleState.js` |
| MasterModule content files | `src/content/modules/master/` |
| Block renderers | `src/components/active/modules/MasterModule/blockRenderers/` |
| Section renderers | `src/components/active/modules/MasterModule/sectionRenderers/` |
| Condition evaluator | `src/components/active/modules/MasterModule/utils/evaluateCondition.js` |
| Generator registry | `src/components/active/modules/MasterModule/generators/registry.js` |
| Image viewer modal | `src/components/active/capabilities/ImageViewerModal.jsx` |
| Timeline configurations | `src/content/timeline/configurations.js` |
| Breath engine | `src/components/active/hooks/useBreathController.js` |
| Orb animation | `src/components/active/capabilities/animations/BreathOrb.jsx` |
| ASCII moon | `src/components/active/capabilities/animations/AsciiMoon.jsx` |
| ASCII diamond | `src/components/active/capabilities/animations/AsciiDiamond.jsx` |
| Audio playback | `src/hooks/useAudioPlayback.js` |
| Meditation playback | `src/hooks/useMeditationPlayback.js` |
| Meditation content registry | `src/content/meditations/index.js` |
| Design tokens | `src/index.css` |
| Pre-session flow | `src/components/session/PreSessionIntro.jsx` |
| Pre-session activities | `src/components/session/activities/` |
| Substance checklist | `src/components/session/SubstanceChecklist.jsx` |
| Come-up check-in | `src/components/session/ComeUpCheckIn.jsx` |
| Peak transition | `src/components/session/PeakTransition.jsx` |
| Booster check-in | `src/components/session/BoosterConsiderationModal.jsx` |
| Integration transition | `src/components/session/IntegrationTransition.jsx` |
| Closing ritual | `src/components/session/ClosingRitual.jsx` |
| Closing ritual content | `src/components/session/transitions/content/closingRitualContent.js` |
| Data download modal | `src/components/session/DataDownloadModal.jsx` |
| Data export utility | `src/utils/downloadSessionData.js` |
| Follow-up activities | Library modules with `isFollowUpModule: true` in `src/content/modules/library.js` |
| Follow-up module modal | `src/components/home/AltSessionModuleModal.jsx` |
| AI assistant | `src/components/ai/AIAssistantModal.jsx` |
| Helper Modal orchestrator | `src/components/helper/HelperModal.jsx` |
| Helper Modal trigger | `src/components/helper/HelperButton.jsx` |
| Helper Modal store | `src/stores/useHelperStore.js` |
| Helper categories + trees | `src/content/helper/categories.js` |
| Helper resolver utils | `src/content/helper/resolverUtils.js` |
| Helper resolvers | `src/content/helper/resolvers/*.js` |
| Helper journal formatter | `src/content/helper/formatLog.js` |
| Triage step runner | `src/components/helper/TriageStepRunner.jsx` |
| Emergency contact card | `src/components/helper/EmergencyContactCard.jsx` |
| Emergency contact view | `src/components/helper/EmergencyContactView.jsx` |
| Session menu (hamburger) | `src/components/layout/SessionMenu.jsx` |
| Session history modal | `src/components/history/SessionHistoryModal.jsx` |
| Session history store | `src/stores/useSessionHistoryStore.js` |
| Values Compass content | `src/content/modules/valuesCompassContent.js` |
| The Cycle content | `src/content/modules/theCycleContent.js` |
| Deep Dive content | `src/content/modules/theDeepDiveReflectionContent.js` |
| Image storage | `src/utils/imageStorage.js` |
