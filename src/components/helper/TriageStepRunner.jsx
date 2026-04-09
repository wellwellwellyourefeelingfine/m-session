/**
 * TriageStepRunner
 * Orchestrates the V5 phase-aware decision tree for a single category.
 *
 * Walks `category.steps` sequentially, collecting the user's responses into
 * a local `triageState` object. Each completed step stays visible — the next
 * step fades in beneath it. Previously-rendered steps stay constant on screen
 * while only the new content runs an animate-fadeIn.
 *
 * Step types:
 *   - 'rating'  → RatingScale (0–10)
 *   - 'choice'  → TriageChoiceStep (single-select)
 *   - 'result'  → resolver function called with (triageState, sessionContext)
 *                 returning a ResultPayload, rendered by TriageResultStep
 *
 * Hardcoded overrides on the rating step:
 *   - rating 0   → AcknowledgeClose with the category's acknowledgeText
 *   - rating ≥ 9 → EmergencyFlow (rating-9 emergency override)
 *
 * Animation model:
 *   - FORWARD nav: no fade-out. The just-completed step stays in place. After
 *     a 400ms beat (so the user sees their selection register on the bubble
 *     or card), the next step appears below. The new step has the
 *     `animate-fadeIn` CSS animation, which runs ONCE on mount — existing
 *     steps don't re-mount and don't re-run the animation.
 *   - RETROACTIVE editing: snap-update. The user's tap on a previous step
 *     immediately updates triageState; downstream steps re-render with the
 *     new content. There's no fade-out here because the user is making a
 *     direct correction and expects an instant response.
 *   - BACK nav: a 200ms fade-out of the most-recent step (via opacity
 *     transition on its container), then the step unmounts and the previous
 *     step becomes active again.
 *
 * Reports `hasRatingCommitted` upward via `onRatingCommittedChange` so the
 * parent HelperModal can drive the modal's height transition.
 */

import { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import CategoryHeader from './CategoryHeader';
import RatingScale from './RatingScale';
import TriageChoiceStep from './TriageChoiceStep';
import TriageResultStep from './TriageResultStep';
import AcknowledgeClose from './AcknowledgeClose';
import EmergencyFlow from './EmergencyFlow';

const FADE_DURATION_MS = 200;
// Beat between the user tapping an option and the next step appearing.
// Long enough that the user sees their selection register on the bubble or
// card, short enough that the flow doesn't feel sluggish. The auto-scroll
// fires AFTER this beat, when the new content has actually mounted.
const AUTO_ADVANCE_MS = 300;

// Returns true if a step should be visible given the current triageState.
// Steps without a `showWhen` predicate are always visible.
function stepIsVisible(step, triageState) {
  if (!step.showWhen) return true;
  return step.showWhen(triageState);
}

// Walk the steps array forward from a starting index, returning the next
// visible step's index, or `steps.length` if none remain.
function nextVisibleIndex(steps, fromIndex, triageState) {
  for (let i = fromIndex; i < steps.length; i++) {
    if (stepIsVisible(steps[i], triageState)) return i;
  }
  return steps.length;
}

// Returns true if a numeric rating value triggers an override branch
// (rating 0 → acknowledge, rating 10 → emergency).
// Only the literal value 10 escalates to emergency; 9 falls into the
// normal high-intensity range and walks the regular decision tree.
function isOverrideRating(value) {
  return value === 0 || value === 10;
}

const TriageStepRunner = forwardRef(function TriageStepRunner(
  {
    category,
    sessionContext,
    onActivitySelect,
    onEmergencyAction,
    onRatingCommittedChange,
  },
  ref,
) {
  // Live read of the saved emergency contact object — passed into EmergencyFlow
  // when the rating-9 emergency override fires. Read here (not from
  // sessionContext) so any in-flight edits to the contact propagate immediately.
  const emergencyContact = useSessionStore(
    (state) => state.sessionProfile?.emergencyContactDetails,
  );

  // The user's responses keyed by step id. Result steps don't write here.
  const [triageState, setTriageState] = useState({});

  // Index of the currently-active step. All steps with index < activeIndex
  // are "completed" and rendered with their locked-in state. The step at
  // activeIndex is rendered interactively. Steps with index > activeIndex
  // are not rendered.
  // The first visible step on mount is whichever step at index 0 has its
  // showWhen pass (typically the rating step, which has no showWhen).
  const [activeIndex, setActiveIndex] = useState(() =>
    nextVisibleIndex(category.steps, 0, {}),
  );

  // When set during back navigation, steps with index > fadingOutFromIndex
  // (and the override block, if visible) render at opacity 0 with a 200ms
  // transition, fading out before being unmounted. Cleared after the timer
  // fires and the state is updated.
  const [fadingOutFromIndex, setFadingOutFromIndex] = useState(null);

  // Has the user committed to any rating value yet? Drives the parent's
  // modal height. Reset to false when the rating gets cleared.
  const [hasRatingCommitted, setHasRatingCommitted] = useState(false);

  // ============================================
  // AUTO-SCROLL
  // ============================================
  // When new content mounts (forward step advance, override appearance,
  // or "I need more help" expansion in a child), we smooth-scroll the
  // bottommost rendered element into view so the user can see the new
  // content without manually scrolling.
  //
  // The scroll runs SIMULTANEOUSLY with the fade-in (no delay between
  // them) so the visual feels like a single coordinated motion: new
  // content appearing while the page glides down to meet it.
  //
  // `bottomRef` is attached to the runner's bottommost child during render
  // (the override block when visible, otherwise the active step container).
  // `scrollTick` is incremented whenever new content has been added; the
  // useEffect below scrolls bottomRef into view when the tick changes.
  // Initial value 0 means the very first render does NOT auto-scroll
  // (the rating step is already visible at the top of the modal).
  const bottomRef = useRef(null);
  const [scrollTick, setScrollTick] = useState(0);

  const requestScroll = useCallback(() => {
    setScrollTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (scrollTick === 0) return; // skip the initial mount
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollTick]);

  // Notify the parent whenever the rating-committed flag flips.
  useEffect(() => {
    if (typeof onRatingCommittedChange === 'function') {
      onRatingCommittedChange(hasRatingCommitted);
    }
  }, [hasRatingCommitted, onRatingCommittedChange]);

  // Resolve a result step in place — runs the resolver function and returns
  // its payload. Pure read of the resolver, no state mutation.
  const resolveResultAt = useCallback(
    (index, stateForResolve) => {
      const step = category.steps[index];
      if (!step || step.type !== 'result') return null;
      try {
        return step.resolve(stateForResolve, sessionContext);
      } catch (err) {
        console.error('[TriageStepRunner] resolver threw:', err);
        return null;
      }
    },
    [category, sessionContext],
  );

  // Forward-walk from a starting index until we land on the next visible step
  // (or fall off the end of the steps array). Used after every value commit.
  const advanceFrom = useCallback(
    (fromIndex, stateForWalk) => {
      const next = nextVisibleIndex(category.steps, fromIndex, stateForWalk);
      setActiveIndex(next);
    },
    [category],
  );

  // Build a fresh triageState that contains only the keys for steps with
  // index <= changedIndex (inclusive), plus the new value for the changed
  // step. Used to wipe stale answers when the user retroactively edits a
  // previous step.
  const truncateStateAfter = useCallback(
    (changedIndex, newValue, changedStepId) => {
      const keptIds = new Set();
      for (let i = 0; i <= changedIndex; i++) {
        const step = category.steps[i];
        if (step && step.id) keptIds.add(step.id);
      }
      const next = {};
      for (const [key, value] of Object.entries(triageState)) {
        if (keptIds.has(key)) next[key] = value;
      }
      next[changedStepId] = newValue;
      return next;
    },
    [category, triageState],
  );

  // Commit a value for the step at `index`. Branches on whether this is a
  // forward step (current active step) or a retroactive edit.
  const commitValue = useCallback(
    (index, value) => {
      const step = category.steps[index];
      if (!step || !step.id) return;

      // No-op if the value isn't actually changing — prevents accidental
      // re-advance / re-truncate when the user re-taps their existing answer.
      if (triageState[step.id] === value) return;

      const isForward = index === activeIndex;
      const isRetroactive = index < activeIndex;

      if (isForward) {
        // FORWARD: write the value immediately so the user's selection
        // registers visually on the bubble or card. Then schedule the
        // advance after a 300ms beat. The previously-completed step stays
        // in place; only the new step (or override) mounts and fades in
        // via animate-fadeIn. Auto-scroll fires alongside the advance so
        // the new content slides into view as it appears.
        const nextState = { ...triageState, [step.id]: value };
        setTriageState(nextState);

        if (step.type === 'rating') {
          setHasRatingCommitted(true);
        }

        setTimeout(() => {
          // For rating-override values (0 or 9+), the override block renders
          // automatically based on triageState — we just need to request a
          // scroll so it animates into view alongside its fade-in.
          if (step.type === 'rating' && isOverrideRating(value)) {
            requestScroll();
            return;
          }
          advanceFrom(index + 1, nextState);
          requestScroll();
        }, AUTO_ADVANCE_MS);
        return;
      }

      if (isRetroactive) {
        // RETROACTIVE edit: update state immediately so the user's tap
        // registers on the locked card. Truncate any downstream values that
        // no longer apply. Re-advance to the next visible step (or stay on
        // the rating step if the new value triggers an override). No fade
        // animations — the response is instant.
        const nextState = truncateStateAfter(index, value, step.id);
        setTriageState(nextState);

        if (step.type === 'rating') {
          // Still committed (just to a new value).
          setHasRatingCommitted(true);
          if (isOverrideRating(value)) {
            // Stay at the rating step's index so the override is the only
            // thing rendered below it.
            setActiveIndex(index);
            requestScroll();
            return;
          }
        }
        advanceFrom(index + 1, nextState);
        requestScroll();
        return;
      }
    },
    [activeIndex, triageState, truncateStateAfter, advanceFrom, category, requestScroll],
  );

  // ============================================
  // BACK NAVIGATION
  // ============================================
  // Pop the most recently completed step. Returns true if the runner handled
  // the back, false if there's nothing left to pop (parent should navigate
  // back to the category grid).
  const goBack = useCallback(() => {
    const ratingStep = category.steps.find((s) => s.type === 'rating');
    const ratingStepIndex = ratingStep ? category.steps.indexOf(ratingStep) : 0;
    const ratingValue = ratingStep ? triageState[ratingStep.id] : undefined;
    const overrideActive = isOverrideRating(ratingValue);

    // Case A: at the rating step with an override active. Clear the rating
    // value and let the override fade out.
    if (activeIndex === ratingStepIndex && overrideActive) {
      setFadingOutFromIndex(ratingStepIndex);
      setTimeout(() => {
        const nextState = { ...triageState };
        if (ratingStep && ratingStep.id) delete nextState[ratingStep.id];
        setTriageState(nextState);
        setHasRatingCommitted(false);
        setFadingOutFromIndex(null);
      }, FADE_DURATION_MS);
      return true;
    }

    // Case B: at the rating step with no override (just the rating awaiting
    // input or the rating just cleared). Nothing to pop in the runner — let
    // the parent handle navigation back to the category grid.
    if (activeIndex === ratingStepIndex) {
      return false;
    }

    // Case C: past the rating step. Fade out the current active step, then
    // decrement activeIndex and clear that step's stored value.
    let prevIndex = activeIndex - 1;
    while (prevIndex >= 0 && !stepIsVisible(category.steps[prevIndex], triageState)) {
      prevIndex--;
    }
    if (prevIndex < 0) return false;

    setFadingOutFromIndex(prevIndex);
    setTimeout(() => {
      const currentStep = category.steps[activeIndex];
      const nextState = { ...triageState };
      if (currentStep && currentStep.id) delete nextState[currentStep.id];
      setTriageState(nextState);
      setActiveIndex(prevIndex);
      setFadingOutFromIndex(null);
    }, FADE_DURATION_MS);
    return true;
  }, [activeIndex, category, triageState]);

  // Expose goBack imperatively to the parent so the top bar's back button
  // can call it without prop-drilling extra state.
  useImperativeHandle(ref, () => ({
    goBack,
    hasCompletedSteps: () => activeIndex > 0,
  }), [goBack, activeIndex]);

  // ============================================
  // ACTIVITY / EMERGENCY ACTION HANDLERS
  // ============================================
  // The runner builds a result payload on demand by re-resolving the current
  // active result step. We pass triageState + the resolved payload up to
  // the parent so it can build a journal entry at action time.

  const getCurrentResolvedResult = useCallback(() => {
    for (let i = Math.min(activeIndex, category.steps.length - 1); i >= 0; i--) {
      const step = category.steps[i];
      if (step && step.type === 'result') {
        return resolveResultAt(i, triageState);
      }
    }
    return null;
  }, [activeIndex, category, triageState, resolveResultAt]);

  const handleActivitySelect = useCallback(
    (activity) => {
      onActivitySelect(activity, triageState, getCurrentResolvedResult());
    },
    [onActivitySelect, triageState, getCurrentResolvedResult],
  );

  const handleEmergencyAction = useCallback(
    (label) => {
      onEmergencyAction(label, triageState, getCurrentResolvedResult());
    },
    [onEmergencyAction, triageState, getCurrentResolvedResult],
  );

  // ============================================
  // RENDER
  // ============================================

  // Detect rating override branches once based on the rating step's value.
  // Only the literal value 10 triggers the emergency override; 9 falls into
  // the normal high-intensity range so the user still walks the decision tree.
  const ratingStep = category.steps.find((s) => s.type === 'rating');
  const ratingValue = ratingStep ? triageState[ratingStep.id] : null;
  const ratingIsZero = ratingValue === 0;
  const ratingIsEmergency = ratingValue === 10;
  const overrideVisible = ratingIsZero || ratingIsEmergency;

  // Pre-compute which step index is the bottom-most so we can attach the
  // auto-scroll ref to it. When an override is active, the override block
  // is the bottommost element instead — handled separately below.
  let bottomStepIndex = -1;
  if (!overrideVisible) {
    for (let i = activeIndex; i >= 0; i--) {
      if (i < category.steps.length && stepIsVisible(category.steps[i], triageState)) {
        bottomStepIndex = i;
        break;
      }
    }
  }

  // Helper to compute the per-step container classes. Steps that are NOT
  // fading out get `animate-fadeIn`, which only runs on first mount (so
  // existing steps don't re-fade when sibling steps change). Steps that ARE
  // fading out get a 200ms opacity transition to 0.
  // The `attachBottomRef` flag attaches `bottomRef` to the container so the
  // auto-scroll effect can target it.
  const stepContainerProps = (i, attachBottomRef = false) => {
    const isFadingOut = fadingOutFromIndex !== null && i > fadingOutFromIndex;
    const refProp = attachBottomRef ? { ref: bottomRef } : {};
    if (isFadingOut) {
      return {
        ...refProp,
        className: 'transition-opacity',
        style: {
          opacity: 0,
          transitionDuration: `${FADE_DURATION_MS}ms`,
        },
      };
    }
    return { ...refProp, className: 'animate-fadeIn' };
  };

  // The override block (acknowledge or emergency) participates in the fade-out
  // when fadingOutFromIndex is non-null. Its key is tied to the rating value
  // so it re-mounts (and re-fades-in) when the user changes the rating.
  // Always attaches bottomRef when present — it's the bottommost element
  // when an override is active.
  const overrideContainerProps = () => {
    if (fadingOutFromIndex !== null) {
      return {
        ref: bottomRef,
        className: 'transition-opacity',
        style: {
          opacity: 0,
          transitionDuration: `${FADE_DURATION_MS}ms`,
        },
      };
    }
    return { ref: bottomRef, className: 'animate-fadeIn' };
  };

  // Render every visible step from index 0 through activeIndex. The active
  // step is rendered in its interactive form; earlier steps are rendered as
  // "completed" (visually dimmed but still tappable for retroactive editing).
  const renderedSteps = [];
  for (let i = 0; i <= activeIndex && i < category.steps.length; i++) {
    const step = category.steps[i];
    if (!stepIsVisible(step, triageState)) continue;

    const isCompleted = i < activeIndex;
    const isBottom = i === bottomStepIndex;
    const containerProps = stepContainerProps(i, isBottom);

    if (step.type === 'rating') {
      renderedSteps.push(
        <div key={`step-${i}`} {...containerProps}>
          <div className="space-y-3">
            <p
              className="text-lg leading-snug"
              style={{
                fontFamily: "'DM Serif Text', serif",
                textTransform: 'none',
                color: 'var(--color-text-primary)',
              }}
            >
              {step.prompt}
            </p>
            <RatingScale
              value={ratingValue}
              onChange={(v) => commitValue(i, v)}
              dimmed={isCompleted}
              lowLabel={step.lowLabel}
              highLabel={step.highLabel}
            />
          </div>
        </div>,
      );

      // If the rating value triggers an override, stop walking the rest of
      // the steps array — the override block will render below.
      if (ratingIsZero || ratingIsEmergency) {
        break;
      }
      continue;
    }

    if (step.type === 'choice') {
      renderedSteps.push(
        <div key={`step-${i}`} {...containerProps}>
          <TriageChoiceStep
            prompt={step.prompt}
            options={step.options}
            value={triageState[step.id]}
            onChange={(v) => commitValue(i, v)}
            isCompleted={isCompleted}
          />
        </div>,
      );
      continue;
    }

    if (step.type === 'result') {
      const payload = resolveResultAt(i, triageState);
      renderedSteps.push(
        <div key={`step-${i}`} {...containerProps}>
          <TriageResultStep
            result={payload}
            onSelectActivity={handleActivitySelect}
            onContactAction={handleEmergencyAction}
          />
        </div>,
      );
      continue;
    }
  }

  // Override content for rating 0 (acknowledge) and rating ≥ 9 (emergency).
  // Keyed by the rating value so the block re-mounts (and re-fades-in) when
  // the user retroactively changes the rating to a different override value.
  let overrideBlock = null;
  if (ratingIsZero) {
    overrideBlock = (
      <div key={`override-${ratingValue}`} {...overrideContainerProps()}>
        <AcknowledgeClose text={category.acknowledgeText} />
      </div>
    );
  } else if (ratingIsEmergency) {
    overrideBlock = (
      <div key={`override-${ratingValue}`} {...overrideContainerProps()}>
        <EmergencyFlow
          emergencyContact={emergencyContact}
          onAction={handleEmergencyAction}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category header — always visible at the top of the triage flow.
          The 4px top margin gives the circular icon escutcheon (which
          overhangs the card by 8px) enough clearance to clear the modal's
          top bar after pt-0 tightened the parent scroll container. */}
      <div style={{ marginTop: '8px' }}>
        <CategoryHeader category={category} />
      </div>

      {/* Stack of steps. Each step manages its own enter/exit animation
          via the per-step container props above. */}
      {renderedSteps}
      {overrideBlock}
    </div>
  );
});

export default TriageStepRunner;
