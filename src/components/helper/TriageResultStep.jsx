/**
 * TriageResultStep
 * Renders a resolved ResultPayload from a per-category resolver. Lives at the
 * bottom of a triage flow inside the V5 helper modal.
 *
 * Renders (top to bottom, all conditional):
 *   1. Time context line (small uppercase mono — "You're about 40 minutes in.")
 *      Only present in come-up / early-peak windows.
 *   2. Main message paragraph (body copy).
 *   3. Optional secondary message paragraph (used by Intense Feeling chest-heart
 *      come-up to point at the emergency contact card without bundling that
 *      pointer into the same paragraph as the main reassurance).
 *   4. Optional EmergencyContactCard (chest-heart come-up sets `showEmergencyCard`).
 *   5. Activity suggestions — either a flat list (default) or two parallel
 *      labeled groups (`activityPaths`, used by the ego-dissolution identity branch).
 *   6. "I need more help" expand/collapse button. Tapping it expands the full
 *      EmergencyFlow beneath. Tapping again fades it out and removes it. The
 *      button itself behaves like a true expand/collapse — the plus icon flips
 *      to a circle-skip (close) icon when expanded.
 *
 * The "I need more help" interaction is fully local to this component. The
 * runner does NOT see it as a state change and does NOT alter the rating. The
 * runner does pass an `onRequestScroll` callback so this component can ask
 * the runner to smooth-scroll the new emergency content into view when it
 * expands.
 */

import { useState, useEffect, useRef } from 'react';
import ActivitySuggestions from './ActivitySuggestions';
import EmergencyContactCard from './EmergencyContactCard';
import EmergencyFlow from './EmergencyFlow';
import SupportResourceCard from './SupportResourceCard';
import { CirclePlusIcon, CircleSkipIcon } from '../shared/Icons';
import { useSessionStore } from '../../stores/useSessionStore';

const FADE_DURATION_MS = 200;

export default function TriageResultStep({
  result,
  onSelectActivity,
  onContactAction,
}) {
  // Read the saved emergency contact directly so the result can show the
  // shared contact card without prop-drilling through the runner. Same path
  // used by EmergencyContactView and HelperModal. Hook must run unconditionally,
  // before any early returns.
  const emergencyContact = useSessionStore(
    (state) => state.sessionProfile?.emergencyContactDetails
  );

  // Three-state toggle for the "I need more help" expansion:
  //   'closed'  — button shows a plus icon, no emergency content rendered
  //   'open'    — button shows the close (CircleSkip) icon, EmergencyFlow
  //               mounts and runs animate-fadeIn
  //   'closing' — EmergencyFlow gets opacity 0 with a 200ms transition; once
  //               the timer fires, state moves to 'closed' and EmergencyFlow
  //               unmounts
  const [emergencyState, setEmergencyState] = useState('closed');

  // Ref to the EmergencyFlow wrapper so we can scroll it into view on expand.
  // Also used as a fallback when the runner's scroll request fires before
  // the new content has fully mounted.
  const emergencyRef = useRef(null);

  // When the user expands "I need more help", smooth-scroll the emergency
  // wrapper into view using `block: 'end'` so the BOTTOM of the EmergencyFlow
  // (the Fireside Project card) lands at the bottom of the visible area —
  // revealing the contact card, 911/112, and Fireside as much as the
  // viewport allows. We don't request a scroll from the runner here because
  // the runner's bottomRef points at the entire result step container, which
  // would scroll the wrong target (the top of the result, not the bottom of
  // the EmergencyFlow we just expanded).
  useEffect(() => {
    if (emergencyState !== 'open') return;
    // Wait for the next frame to ensure the EmergencyFlow has mounted in
    // the DOM and contributed its full height before we measure & scroll.
    const id = requestAnimationFrame(() => {
      if (emergencyRef.current) {
        emergencyRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [emergencyState]);

  const handleNeedMoreHelpToggle = () => {
    if (emergencyState === 'closed') {
      setEmergencyState('open');
    } else if (emergencyState === 'open') {
      setEmergencyState('closing');
      setTimeout(() => setEmergencyState('closed'), FADE_DURATION_MS);
    }
    // 'closing' is a transient state — taps during the fade-out are ignored
  };

  if (!result) return null;

  const {
    timeContextLine,
    message,
    secondaryMessage,
    activityIntro,
    activities,
    activityPaths,
    showEmergencyCard,
    supportResources,
  } = result;

  const isExpanded = emergencyState === 'open' || emergencyState === 'closing';
  const isClosing = emergencyState === 'closing';

  return (
    <div className="space-y-4">
      {/* Time context line — small uppercase mono, tertiary color */}
      {timeContextLine && (
        <p
          className="text-xs uppercase tracking-wider"
          style={{
            color: 'var(--color-text-tertiary)',
            fontFamily: "'Azeret Mono', monospace",
          }}
          aria-live="polite"
        >
          {timeContextLine}
        </p>
      )}

      {/* Main message */}
      <p
        className="text-sm leading-relaxed whitespace-pre-line"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {message}
      </p>

      {/* Optional secondary message — used by chest-heart come-up to keep the
          contact-card pointer separate from the reassurance paragraph */}
      {secondaryMessage && (
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {secondaryMessage}
        </p>
      )}

      {/* Optional emergency contact card — shown for chest-heart come-up.
          Reuses the shared card with no edit toggle (read-only). */}
      {showEmergencyCard && (
        <EmergencyContactCard
          emergencyContact={emergencyContact}
          onContactAction={onContactAction}
        />
      )}

      {/* Activity paths — two parallel labeled groups (ego-identity branch).
          When present, takes precedence over the flat `activities` list. */}
      {activityPaths && activityPaths.length > 0 ? (
        <div className="space-y-5">
          {activityPaths.map((path) => (
            <div
              key={path.label}
              role="group"
              aria-label={path.label}
              className="space-y-2"
            >
              <p
                className="text-[10px] uppercase tracking-wider"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {path.label}
              </p>
              <ActivitySuggestions
                activities={path.activities}
                onSelectActivity={onSelectActivity}
              />
            </div>
          ))}
        </div>
      ) : activities && activities.length > 0 ? (
        <ActivitySuggestions
          introText={activityIntro}
          activities={activities}
          onSelectActivity={onSelectActivity}
        />
      ) : null}

      {/* Support resource cards — follow-up categories provide these for
          Fireside, emergency contact, and find-a-therapist suggestions.
          Rendered between activity suggestions and the "I need more help" button. */}
      {supportResources && supportResources.length > 0 && (
        <div className="space-y-3">
          {supportResources.map((resource) => (
            <SupportResourceCard
              key={resource.type}
              resource={resource}
              emergencyContact={emergencyContact}
              onAction={onContactAction}
            />
          ))}
        </div>
      )}

      {/* "I need more help" expand/collapse button. Plus icon when closed,
          CircleSkip (close) icon when open. The icon swap and the emergency
          content fade run in sync. */}
      <div className="flex justify-center" style={{ marginTop: '-0.25rem' }}>
        <button
          type="button"
          onClick={handleNeedMoreHelpToggle}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider"
          style={{
            color: 'var(--accent)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
          aria-expanded={isExpanded && !isClosing}
        >
          <span>I need more help</span>
          {isExpanded ? <CircleSkipIcon size={14} /> : <CirclePlusIcon size={14} />}
        </button>
      </div>

      {/* Emergency content — only mounted when expanded or closing */}
      {isExpanded && (
        <div
          ref={emergencyRef}
          className={isClosing ? 'transition-opacity' : 'animate-fadeIn'}
          style={
            isClosing
              ? { opacity: 0, transitionDuration: `${FADE_DURATION_MS}ms` }
              : undefined
          }
        >
          <EmergencyFlow
            emergencyContact={emergencyContact}
            onAction={onContactAction}
          />
        </div>
      )}
    </div>
  );
}
