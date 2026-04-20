/**
 * SubstanceChecklist — "Opening Checklist" (user-facing name)
 *
 * Pre-session logistical checklist. Runs after the user clicks Begin Session
 * on Home, before the Opening Ritual. Backend file/slice names retained for
 * store-migration compatibility; user-facing copy says "Opening Checklist".
 *
 * Flow:
 *   index    → welcoming cover page with Part 1 / Part 2 TOC (no status bar)
 *   setting  → interactive checklist (water, space, etc.) with confirm-if-unchecked
 *   journal  → physical-journal-compatibility notice
 *   substance → "Do you have your MDMA ready?"
 *   tested   → "Have you tested your substance?"
 *   dosage   → dose input + real-time feedback + Dosage Assistant link
 *   booster  → (conditional on booster.considerBooster) supplemental-dose prep
 *   contact  → trusted contact display/edit
 *   handoff  → "Ready to Begin" closing — fires transition to Opening Ritual
 */

import { useState, useMemo } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { calculateBoosterDose } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import { useToolsStore } from '../../stores/useToolsStore';
import AsciiDiamond from '../active/capabilities/animations/AsciiDiamond';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import ModuleStatusBar from '../active/ModuleStatusBar';
import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ConfirmModal from '../journal/ConfirmModal';
import { NotebookPenIcon, ArrowUpRightIcon } from '../shared/Icons';
import ChecklistCheckbox from './openingChecklist/ChecklistCheckbox';
import SketchyCircle from './openingChecklist/SketchyCircle';
import OpeningIndex from './openingChecklist/OpeningIndex';

const DOSAGE_FEEDBACK = {
  light: {
    range: '0-75mg',
    label: 'Light',
    description: 'A light dose. Effects will be subtle—gentle mood lift, mild openness. Good if you\'re sensitive to substances or easing in cautiously. You may not reach the full "window" for deeper work.',
  },
  moderate: {
    range: '76-125mg',
    label: 'Moderate (Therapeutic Range)',
    description: 'This is the therapeutic sweet spot. Most guided sessions use doses in this range—enough to open the window without overwhelming. A good balance of depth and manageability.',
  },
  strong: {
    range: '126-150mg',
    label: 'Strong',
    description: 'A strong dose. Expect more intense effects and potentially more physical side effects (jaw tension, temperature swings). Can be harder to stay grounded. Not necessarily more productive than moderate doses.',
  },
  heavy: {
    range: '151mg+',
    label: 'Heavy',
    description: 'This is above typical therapeutic doses. Higher doses increase physical strain and don\'t reliably produce better outcomes. Consider whether a moderate dose might serve you better. If proceeding, extra preparation and support is important.',
  },
};

const DOSAGE_THRESHOLDS = {
  HEAVY: 151,
  DANGEROUS: 300,
};

const DOSAGE_WARNINGS = {
  heavy: {
    title: 'High Dose Warning',
    message: 'Are you sure you have calculated this dose correctly? This is above the typical therapeutic range (75-150mg). Higher doses increase physical strain, neurotoxicity risk, and side effects without reliably improving outcomes. Clinical research uses doses of 75-125mg.',
    confirmLabel: 'I understand, continue',
    canProceed: true,
  },
  dangerous: {
    title: 'Dangerous Dose',
    message: 'This dose could cause serious harm including hyperthermia, serotonin syndrome, cardiac complications, or overdose. Doses this high have been associated with fatalities. Please recalculate your dose with therapeutic guidelines in mind.',
    confirmLabel: null,
    canProceed: false,
  },
};

// Setting Checklist items — ids are local-only, used for tracking checked state
const SETTING_ITEMS = [
  { id: 'water', label: 'Water on hand' },
  { id: 'space', label: 'Enough space to move and settle' },
  { id: 'blanket', label: 'A place to lay down and a blanket' },
  { id: 'eye-mask', label: 'An eye mask (optional)' },
  { id: 'audio', label: 'External speakers or headphones for music and voice guidance' },
  { id: 'phone-dnd', label: 'Phone on Do Not Disturb' },
  // Booster item appended conditionally
];

const BOOSTER_CHECKLIST_ITEM = {
  id: 'booster-ready',
  label: 'Booster dose weighed out and ready',
};

export default function SubstanceChecklist() {
  // Step navigation as string keys (clearer than numeric index once the flow has
  // multiple conditional branches)
  const [stepKey, setStepKey] = useState('index');
  const [isVisible, setIsVisible] = useState(true);
  const [showDosageWarning, setShowDosageWarning] = useState(null);

  // Start in edit mode if the user has no saved contact yet. Without this,
  // `showInputs = editingContact || !hasSavedContact` would flip to false the
  // moment the user typed their first letter (because `hasSavedContact`
  // becomes true), unmounting the input and losing focus. Initializing here
  // ensures the inputs stay visible through the whole typing session.
  const [editingContact, setEditingContact] = useState(() => {
    const c = useSessionStore.getState().sessionProfile?.emergencyContactDetails;
    return !(c?.name || c?.phone);
  });

  // Setting-checklist local state. Keys match SETTING_ITEMS ids + booster id.
  // Not persisted — resets on unmount.
  const [checkedItems, setCheckedItems] = useState({});
  const [showSettingConfirm, setShowSettingConfirm] = useState(false);

  const sessionProfile = useSessionStore((state) => state.sessionProfile);
  const updateSessionProfile = useSessionStore((state) => state.updateSessionProfile);
  const setSubstanceChecklistSubPhase = useSessionStore((state) => state.setSubstanceChecklistSubPhase);
  const booster = useSessionStore((state) => state.booster);
  const updateBoosterPrepared = useSessionStore((state) => state.updateBoosterPrepared);

  const emergencyContactDetails = sessionProfile.emergencyContactDetails || { name: '', phone: '' };
  const sessionMode = sessionProfile.sessionMode;
  const isSitterSession = sessionMode === 'with-sitter';

  const showBoosterStep = booster.considerBooster;

  // Active step sequence — built dynamically so conditionals land in the right
  // spot when the user has / doesn't have booster flow.
  const stepSequence = useMemo(() => {
    const seq = ['index', 'setting', 'journal', 'substance', 'tested', 'dosage'];
    if (showBoosterStep) seq.push('booster');
    seq.push('contact', 'handoff');
    return seq;
  }, [showBoosterStep]);

  // Flow steps (the ones that appear in the "X of N" counter) exclude the index.
  const countedSteps = stepSequence.filter((k) => k !== 'index');
  const countedIndex = countedSteps.indexOf(stepKey);
  const totalCountedSteps = countedSteps.length;

  // Setting checklist items (booster conditional)
  const settingItems = useMemo(() => {
    return showBoosterStep ? [...SETTING_ITEMS, BOOSTER_CHECKLIST_ITEM] : SETTING_ITEMS;
  }, [showBoosterStep]);

  const allSettingChecked = settingItems.every((item) => checkedItems[item.id]);

  const handleContactFieldChange = (field, value) => {
    updateSessionProfile('emergencyContactDetails', {
      ...emergencyContactDetails,
      [field]: value,
    });
  };

  const fadeTransition = (callback) => {
    setIsVisible(false);
    setTimeout(() => {
      callback();
      setIsVisible(true);
    }, 300);
  };

  const goToStep = (key) => {
    fadeTransition(() => setStepKey(key));
  };

  const handleNext = () => {
    const idx = stepSequence.indexOf(stepKey);
    if (idx >= 0 && idx < stepSequence.length - 1) {
      goToStep(stepSequence[idx + 1]);
    }
  };

  const handleBack = () => {
    const idx = stepSequence.indexOf(stepKey);
    if (idx > 0) {
      goToStep(stepSequence[idx - 1]);
    }
  };

  // Final handoff to Opening Ritual
  const handleContinueToIntro = () => {
    setIsVisible(false);
    setTimeout(() => {
      setSubstanceChecklistSubPhase('pre-session-intro');
    }, 300);
  };

  // Setting step — Continue handler with confirm-if-unchecked
  const handleSettingContinue = () => {
    if (allSettingChecked) {
      handleNext();
    } else {
      setShowSettingConfirm(true);
    }
  };

  const handleSettingConfirmProceed = () => {
    setShowSettingConfirm(false);
    handleNext();
  };

  const toggleSettingItem = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Dosage Assistant navigation — matches intake's pattern
  const handleOpenDosageTool = () => {
    const { openTools, toggleTool } = useToolsStore.getState();
    if (!openTools.includes('dosage')) {
      toggleTool('dosage');
    }
    useAppStore.getState().setCurrentTab('tools');
  };

  // Dosage warning flow
  const getDosageWarningLevel = () => {
    const dose = parseInt(sessionProfile.plannedDosageMg, 10);
    if (!dose || isNaN(dose)) return null;
    if (dose >= DOSAGE_THRESHOLDS.DANGEROUS) return 'dangerous';
    if (dose >= DOSAGE_THRESHOLDS.HEAVY) return 'heavy';
    return null;
  };

  const handleDosageContinue = () => {
    const warningLevel = getDosageWarningLevel();
    if (warningLevel) {
      setShowDosageWarning(warningLevel);
    } else {
      updateSessionProfile('hasPreparedDosage', true);
      handleNext();
    }
  };

  const handleDosageWarningAcknowledge = () => {
    setShowDosageWarning(null);
    updateSessionProfile('hasPreparedDosage', true);
    handleNext();
  };

  // ──────────────────────────────────────────────────────────────────────
  // Per-step content
  // ──────────────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (stepKey) {
      case 'index':
        return <OpeningIndex />;

      case 'setting':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h2
                className="text-lg text-[var(--color-text-primary)]"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
              >
                Setting the Space
              </h2>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                Take a moment to make sure you have everything you need for your session. You don&apos;t have to check every box, just the ones that apply.
              </p>
            </div>

            <div className="space-y-1">
              {settingItems.map((item) => (
                <ChecklistCheckbox
                  key={item.id}
                  label={item.label}
                  checked={!!checkedItems[item.id]}
                  onToggle={() => toggleSettingItem(item.id)}
                />
              ))}
            </div>
          </div>
        );

      case 'journal':
        return (
          <div className="space-y-8">
            {/* Header at top */}
            <h2
              className="text-2xl text-[var(--color-text-primary)] text-center"
              style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
            >
              Journal Friendly
            </h2>

            {/* Icon with animated sketchy ring — both accent-colored */}
            <div className="flex justify-center">
              <div className="relative" style={{ width: 140, height: 140 }}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <SketchyCircle size={140} strokeWidth={3} color="var(--accent)" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-[var(--accent)]">
                  <NotebookPenIcon size={48} />
                </div>
              </div>
            </div>

            {/* Body copy — primary font inherits the app's uppercase default */}
            <div className="space-y-4">
              <p
                className="text-xl mb-3 text-[var(--color-text-primary)] leading-relaxed text-center"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
              >
                m-session is designed to work alongside a physical journal.
              </p>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                When you answer a prompt by hand, note the time in your journal. m-session records a timestamp for any prompt you skip on screen, so you can line your handwritten entries up with the moment each prompt came up.
              </p>

              {/* Example block — shows the literal journal-entry marker so the
                  user knows exactly what a "timestamp" looks like. textTransform:
                  'none' preserves the real casing of the journal output. */}
              <div className="py-2 px-4 border border-[var(--color-border)]">
                <p
                  className="text-center text-sm text-[var(--color-text-secondary)]"
                  style={{ textTransform: 'none' }}
                >
                  [no entry — 3:45 PM]
                </p>
              </div>

              <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed">
                Whether you type, write by hand, or both, follow what feels natural.
              </p>
            </div>
          </div>
        );

      case 'substance':
        return (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2
                className="text-lg text-[var(--color-text-primary)]"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
              >
                Your Substance
              </h2>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                Do you have your MDMA ready?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  updateSessionProfile('hasSubstance', true);
                  handleNext();
                }}
                className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-xs"
              >
                Yes, I have it ready
              </button>
              <button
                onClick={() => {
                  updateSessionProfile('hasSubstance', false);
                }}
                className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-[var(--color-text-tertiary)] text-xs"
              >
                Not yet
              </button>
            </div>
          </div>
        );

      case 'tested':
        return (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2
                className="text-lg text-[var(--color-text-primary)]"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
              >
                Testing
              </h2>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                Testing your substance helps ensure safety. We encourage using an at-home testing kit or sending a sample to a lab.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  updateSessionProfile('hasTestedSubstance', true);
                  handleNext();
                }}
                className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-xs"
              >
                Yes, I&apos;ve tested it
              </button>
              <button
                onClick={() => {
                  updateSessionProfile('hasTestedSubstance', false);
                  handleNext();
                }}
                className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-xs"
              >
                No, but I&apos;m confident in my source
              </button>
            </div>

            <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
              Testing resources are available in the Tools tab.
            </p>
          </div>
        );

      case 'dosage':
        return (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2
                className="text-lg text-[var(--color-text-primary)]"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
              >
                Dosage
              </h2>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                What dose are you planning to take?
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={sessionProfile.plannedDosageMg || ''}
                  onChange={(e) => updateSessionProfile('plannedDosageMg', e.target.value)}
                  className="flex-1 py-3 px-4 border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-text-primary)]"
                />
                <span className="text-[var(--color-text-secondary)]">mg</span>
              </div>

              {/* Dangerous dose inline warning */}
              {(parseInt(sessionProfile.plannedDosageMg, 10) || 0) >= DOSAGE_THRESHOLDS.DANGEROUS && (
                <div className="p-4 border border-red-500/50 bg-red-500/10">
                  <p className="font-medium mb-2 text-red-400">Dangerous Dose</p>
                  <p className="text-[var(--color-text-secondary)] text-sm">
                    This dose could cause serious harm. Please recalculate your dose with therapeutic guidelines in mind.
                  </p>
                </div>
              )}

              {/* Standard dosage feedback */}
              {sessionProfile.dosageFeedback && (parseInt(sessionProfile.plannedDosageMg, 10) || 0) < DOSAGE_THRESHOLDS.DANGEROUS && (
                <div className="p-4 border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <p className="font-medium mb-2">
                    {DOSAGE_FEEDBACK[sessionProfile.dosageFeedback].range} · {DOSAGE_FEEDBACK[sessionProfile.dosageFeedback].label}
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm">
                    {DOSAGE_FEEDBACK[sessionProfile.dosageFeedback].description}
                  </p>
                </div>
              )}
            </div>

            {/* Dosage Assistant link — matches intake styling */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenDosageTool}
                className="inline-flex items-center gap-1 uppercase tracking-wider text-xs"
                style={{ color: 'var(--accent)' }}
              >
                <span>Dosage Assistant</span>
                <ArrowUpRightIcon size={12} />
              </button>
            </div>
          </div>
        );

      case 'booster': {
        const boosterDose = sessionProfile.plannedDosageMg
          ? calculateBoosterDose(sessionProfile.plannedDosageMg)
          : null;

        return (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2
                className="text-lg text-[var(--color-text-primary)]"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
              >
                Supplemental Dose
              </h2>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                Do you have your supplemental dose prepared?
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed">
                We highly recommend weighing out your supplemental booster dose ahead of time. Measuring a dose while under the effects of your initial dose can be difficult and may lead to impaired judgement.
              </p>
            </div>

            {boosterDose && (
              <div className="p-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Based on your initial dose, your supplemental dose would be approximately{' '}
                  <span className="text-[var(--color-text-primary)] font-medium">{boosterDose}mg</span>.
                </p>
                <p className="text-[var(--color-text-tertiary)] text-sm mt-2">
                  This is approximately half your initial dose.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => {
                  updateBoosterPrepared('yes');
                  handleNext();
                }}
                className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-xs"
              >
                Yes, I have it ready
              </button>
              <button
                onClick={() => {
                  updateBoosterPrepared('no');
                  handleNext();
                }}
                className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-xs"
              >
                No, I&apos;ll prepare it now
              </button>
              <button
                onClick={() => {
                  updateBoosterPrepared('decided-not-to');
                  handleNext();
                }}
                className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-[var(--color-text-tertiary)]"
              >
                I&apos;ve decided not to take a booster
              </button>
            </div>
          </div>
        );
      }

      case 'contact': {
        const hasSavedContact = Boolean(
          emergencyContactDetails.name || emergencyContactDetails.phone
        );
        const showInputs = editingContact || !hasSavedContact;

        return (
          <div className="space-y-6 flex flex-col items-center text-center">
            <h2
              className="text-lg text-[var(--color-text-primary)]"
              style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
            >
              Trusted Contact
            </h2>

            <div className="py-2">
              <AsciiDiamond />
            </div>

            {isSitterSession && (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                You&apos;ve indicated you&apos;re using this app with a sitter, but if you&apos;d still like to add or update emergency details below, you can.
              </p>
            )}

            {showInputs ? (
              <>
                <p className="text-[var(--color-text-primary)] text-sm">
                  Save the details of someone you trust so you can quickly reach them if needed during the session.
                </p>

                <div className="w-full space-y-3 text-left">
                  <input
                    type="text"
                    placeholder="Emergency Name"
                    value={emergencyContactDetails.name || ''}
                    onChange={(e) => handleContactFieldChange('name', e.target.value)}
                    className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="Emergency Number"
                    value={emergencyContactDetails.phone || ''}
                    onChange={(e) => handleContactFieldChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <textarea
                    placeholder="Contact Info (optional)"
                    rows={3}
                    value={emergencyContactDetails.notes || ''}
                    onChange={(e) => handleContactFieldChange('notes', e.target.value)}
                    className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors resize-none leading-relaxed"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>

                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  Optional. You can leave this blank and continue.
                </p>
              </>
            ) : (
              <>
                <p className="text-[var(--color-text-primary)] text-sm">
                  If things get difficult, this is who you said you&apos;d reach out to.
                </p>

                <div
                  className="w-full border p-4 space-y-2 text-left"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <p
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    Emergency Contact
                  </p>
                  {emergencyContactDetails.name && (
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {emergencyContactDetails.name}
                    </p>
                  )}
                  {emergencyContactDetails.phone && (
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {emergencyContactDetails.phone}
                    </p>
                  )}
                  {emergencyContactDetails.notes && (
                    <p
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ color: 'var(--color-text-tertiary)', textTransform: 'none' }}
                    >
                      {emergencyContactDetails.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setEditingContact(true)}
                  className="text-xs underline"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Edit details
                </button>
              </>
            )}
          </div>
        );
      }

      case 'handoff':
        return (
          <div className="space-y-6 text-center">
            <h2
              className="text-2xl text-[var(--color-text-primary)]"
              style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
            >
              Ready to Begin
            </h2>
            <div className="flex justify-center">
              <AsciiMoon />
            </div>

            {/* Primary affirmation — each sentence on its own line, centered */}
            <div className="space-y-1">
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                The setting is prepared.
              </p>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                Your substance is on hand.
              </p>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                Your safety measures are in place.
              </p>
            </div>

            {/* Secondary closing — left-aligned, slightly smaller */}
            <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed text-left">
              You&apos;ve taken care of what needs to be taken care of. When you&apos;re ready, we&apos;ll move into the opening ritual together.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // Controls
  // ──────────────────────────────────────────────────────────────────────

  // Steps whose Continue button the control bar renders (steps with inline
  // selection buttons, or where the index screen handles its own Continue,
  // don't use this slot).
  const getPrimaryButton = () => {
    const dose = parseInt(sessionProfile.plannedDosageMg, 10);
    const isDangerousDose = dose >= DOSAGE_THRESHOLDS.DANGEROUS;

    switch (stepKey) {
      case 'index':
        return { label: 'Continue', onClick: handleNext };

      case 'setting':
        return { label: 'Continue', onClick: handleSettingContinue };

      case 'journal':
        return { label: 'Continue', onClick: handleNext };

      case 'dosage':
        return {
          label: 'Continue',
          onClick: handleDosageContinue,
          disabled: !sessionProfile.plannedDosageMg || isDangerousDose,
        };

      case 'contact':
        return { label: 'Continue', onClick: handleNext };

      case 'handoff':
        return { label: 'Begin', onClick: handleContinueToIntro };

      // 'substance', 'tested', 'booster' have inline-select buttons — no primary.
      default:
        return null;
    }
  };

  const canGoBack = stepKey !== 'index';

  const showStatusBar = stepKey !== 'index';
  const progress = stepKey === 'index'
    ? 0
    : ((countedIndex + 1) / totalCountedSteps) * 100;

  return (
    <>
      {showStatusBar && (
        <ModuleStatusBar
          progress={progress}
          leftLabel="Opening Checklist"
          rightContent={
            <span className="text-[var(--color-text-tertiary)] text-xs">
              {countedIndex + 1} of {totalCountedSteps}
            </span>
          }
        />
      )}

      {/* Main content container */}
      <div
        className="fixed left-0 right-0 overflow-auto"
        style={{
          top: showStatusBar ? 'var(--header-plus-status)' : 'var(--header-height)',
          bottom: 'var(--bottom-chrome)',
        }}
      >
        <div className="max-w-md mx-auto px-6 py-6">
          <div
            className="transition-opacity duration-300"
            style={{ opacity: isVisible ? 1 : 0 }}
          >
            {renderStep()}
          </div>
        </div>
      </div>

      <ModuleControlBar
        phase="active"
        primary={getPrimaryButton()}
        showBack={canGoBack}
        onBack={handleBack}
        backConfirmMessage={null}
        showSkip={false}
      />

      {/* Confirm dialog when Continue is pressed with unchecked setting items */}
      {showSettingConfirm && (
        <ConfirmModal
          title="Are you ready to begin?"
          message="There are still items on the checklist that you haven't addressed. Take your time here and make sure you have everything you need before moving on."
          confirmLabel="I'm ready"
          cancelLabel="Go Back"
          onConfirm={handleSettingConfirmProceed}
          onCancel={() => setShowSettingConfirm(false)}
        />
      )}

      {/* Dosage Warning Modal */}
      {showDosageWarning && DOSAGE_WARNINGS[showDosageWarning] && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 px-6">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm p-6 animate-fadeIn">
            <h3 className="text-[var(--color-text-primary)] mb-4 uppercase tracking-wider text-xs">
              {DOSAGE_WARNINGS[showDosageWarning].title}
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
              {DOSAGE_WARNINGS[showDosageWarning].message}
            </p>
            <div className="space-y-3">
              {DOSAGE_WARNINGS[showDosageWarning].canProceed ? (
                <>
                  <button
                    type="button"
                    onClick={handleDosageWarningAcknowledge}
                    className="w-full py-3 border border-[var(--color-border)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    {DOSAGE_WARNINGS[showDosageWarning].confirmLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDosageWarning(null)}
                    className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
                  >
                    Adjust My Dose
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDosageWarning(null)}
                  className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
                >
                  Adjust My Dose
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
