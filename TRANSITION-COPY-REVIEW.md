# Session App — Transition Copy Review

A condensed transcript of all phase transitions for copy editing review.

---

## Overview: The Arc of Transitions

The app guides users through four major transition points:

1. **Opening Ritual** (Pre-Session → Come-Up) — Grounding, intention-setting, substance intake
2. **Come-Up Check-Ins** — Ongoing pulse checks during the onset period
3. **Peak Transition** (Come-Up → Peak) — Celebration, reorientation, hydration
4. **Integration Transition** (Peak → Integration) — Softening, reflection guidance
5. **Closing Ritual** — Final journaling to honor the experience

**Design Philosophy:** Transitions are *supportive, not directive*. They celebrate progress, set gentle expectations, encourage autonomy ("your session, your way"), and remind users to care for themselves physically (hydrate, nourish).

---

## 1. OPENING RITUAL (PreSessionIntro)

**Context:** After completing the substance checklist, before the session begins.
**Visual:** AsciiMoon animation throughout, fades out at the end.
**Pacing:** 6 main steps + optional 3-step intention sub-flow.

### Step 0: Arrival

> Close your eyes for a moment.
>
> Notice your breath. Notice where your body meets the surface beneath you.
>
> *There's nowhere else to be right now.*

**Purpose:** Ground the user in the present moment. Establish a contemplative, unhurried tone.

---

### Step 1: Intention Menu

> Would you like to spend a few minutes with your intention before taking your substance?

**Options:**
- **Review My Intention** → Enters intention sub-flow (3 steps)
- **Brief Centering Breath** → *(Coming Soon)*
- **Skip** → Proceeds to Step 2

**Purpose:** Offer choice. Some users want structured intention work; others prefer to dive in.

---

### Intention Sub-Flow (if selected)

#### Sub-Step 0: Your Focus

> During your preparation, you said you were drawn to this session for **[primary focus]**.
>
> *Before you begin, take a moment with what brought you here.*

**Purpose:** Reconnect user with their stated motivation from intake.

#### Sub-Step 1: Touchstone

> Is there a word or phrase that captures what feels most important right now?
>
> *This will be available as a touchstone you can return to throughout your session.*

**Input:** Single word or short phrase
**Purpose:** Distill intention to something portable and retrievable.

#### Sub-Step 2: Your Intention

> Here is the intention you set during your preparation. Does this still hold true?
>
> *You can edit or add to it if you like.*

**Input:** Editable textarea with their original intention
**Purpose:** Final confirmation/refinement before session begins.

---

### Step 2: Letting Go

> You've prepared. You've set your intention.
>
> Now let it go.
>
> You don't need to direct what happens next or make sure it "works." The MDMA will soften the part of your mind that reacts to difficult thoughts with avoidance or defense.
>
> *Your only task is to stay present with whatever arises—curious rather than controlling.*

**Purpose:** Release attachment to outcomes. Shift from "doing" to "being" mode. Key therapeutic concept.

---

### Step 3: Take Substance

> When you're ready.
>
> *There's no rush.*
>
> Find a comfortable position. Take your substance with a few sips of water.

**Button:** "I've Taken It"

**Purpose:** Mark the official start. Records ingestion timestamp for booster timing.

---

### Step 4: Confirm Time

> We've recorded your start time as:
>
> **[HH:MM]**

**Options:**
- "Yes, that's correct"
- "Adjust time"

*After confirmation:*
> Time confirmed. Continue when ready.

**Purpose:** Accuracy matters for booster timing window (90-180 min post-ingestion).

---

### Step 5: Begin Session

> The session has begun.
>
> *For the next 30-60 minutes, the MDMA will come on gradually. There's nothing you need to do.*

**Button:** "Begin"

**What happens next:** Screen fades out → TransitionBuffer (quote + animation) → Session starts

---

### TransitionBuffer (Between Opening Ritual and Session)

**Visual:** AsciiDiamond animation + random inspirational quote
**Duration:** ~4 seconds (fade in, hold, fade out)

**Quote Pool:**
- *"The curious paradox is that when I accept myself just as I am, then I can change."* — Carl Rogers
- *"The only journey is the one within."* — Rilke
- *"The ability to observe without evaluating is the highest form of intelligence."* — Krishnamurti
- *"Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig."* — Marcus Aurelius
- *"It is only with the heart that one can see rightly; what is essential is invisible to the eye."* — Antoine de Saint-Exupéry
- *"All of humanity's problems stem from man's inability to sit quietly in a room alone."* — Blaise Pascal
- *"Be patient toward all that is unsolved in your heart and try to love the questions themselves."* — Rilke

**Purpose:** Palate cleanser. Creates a meaningful pause between ritual and active session.

---

## 2. COME-UP CHECK-INS (ComeUpCheckIn)

**Context:** Appears during the come-up phase (first 20-60 minutes).
**Display:** Minimized bar above tab bar; expands to modal between modules.

### Check-In Prompt

> How are you feeling?
>
> *[X] minutes since ingestion*

### Response Options

| Option | Label | Description |
|--------|-------|-------------|
| `waiting` | Nothing yet | Still waiting to feel effects |
| `starting` | Starting to feel something | Subtle shifts beginning |
| `fully-arrived` | Fully arrived | Clearly feeling the effects |

---

### Reassurance Messages

**If "Nothing yet":**
> That's completely normal. Most people feel the first effects between 20-45 minutes after taking MDMA. Continue to relax and let the experience unfold.

**If "Starting to feel something":**
> Good. The experience is beginning to open. Stay relaxed and continue to breathe gently. The effects will continue to build over the next little while.

*Footer:*
> You can change your response anytime by tapping the check-in bar.

---

### Early "Fully Arrived" Confirmation (< 20 minutes)

> **Are you sure?**
>
> It's only been [X] minutes since you took your substance. Usually the onset happens between the 20-45 minute mark.
>
> If you're certain you're feeling the full effects, we'll move to the next phase.

**Options:**
- "Yes, I'm fully arrived"
- "Actually, let me continue the come-up"

**Purpose:** Gentle guardrail. Prevents premature transition while respecting user's experience.

---

### End-of-Phase Choice (after "Fully Arrived")

> **Ready for the Peak?**
>
> You've indicated you're fully arrived. Would you like to continue to the peak phase?

**Options:**
- "Continue to the Peak Phase"
- "Remain Here"

**Purpose:** User-driven transition. They control when they're ready.

---

## 3. PEAK TRANSITION (PeakTransition)

**Context:** User selected "Continue to Peak Phase" from check-in.
**Visual:** AsciiMoon animation, progress bar, elapsed time display.
**Pacing:** 6 steps + optional intention reflection.

---

### Header (all steps)

> TRANSITION
> *[X] minutes into session*

---

### Step 1: Congratulations

**Label:** Transition
**Title:** Well Done

> You've moved through the come-up phase. This initial period can sometimes feel intense or uncertain. You handled it beautifully.

**Purpose:** Acknowledgment. Validate what they just went through.

---

### Step 2: What's Ahead

**Label:** What's Ahead
**Title:** The Peak

> For the next hour or two, you'll be in a heightened state of openness and connection. There's no need to force anything or make anything happen.

**Purpose:** Set expectations. Reduce performance anxiety.

---

### Step 3: Trust Yourself

**Label:** Guidance
**Title:** Trust Yourself

> Go with your intuition and how you feel. If something calls to you, follow it. If you need rest, rest. Your inner wisdom knows what it needs.

**Purpose:** Empower autonomy. Reinforce self-trust.

---

### Step 4: Flexibility

**Label:** Flexibility
**Title:** Your Session, Your Way

> Remember: you can adjust your session anytime. On the Home tab, you can add, remove, or reorder activities to match what feels right in the moment.

**Purpose:** Remind user they have control. Reduce rigidity.

---

### Step 5: Hydration

**Label:** Care
**Title:** Hydrate

> Take a moment now to drink some water. Small sips are best. Staying hydrated helps your body process the experience smoothly.

*Footer:*
> Take your time. Continue when ready.

**Purpose:** Physical care prompt. Actionable pause.

---

### Step 6: Intention (conditional)

**Label:** Intention
**Title:** Your Intention

> Before your session, you set an intention. Would you like to be reminded of what you wrote?

**Options:**
- "Yes, remind me"
- "No, continue without"

*If no intention was set:*
> **Ready to Continue**
>
> Take a moment to check in with yourself. When you're ready, we'll move into the peak phase.

**Purpose:** Offer connection point without forcing it.

---

### Intention Reflection (if "Yes, remind me")

**Label:** Reflection
**Title:** Your Intention

> *"[User's intention text]"*

> How does this intention feel to you now? Do you notice any new insights or feelings arising around it?
>
> *If you'd like to write about it, you can access your journal anytime.*

**Button:** "Open Journal"

**Purpose:** Mid-session touchpoint. Opportunity for integration journaling.

---

### Final Step: Ready

**Label:** Ready
**Title:** Begin the Peak

> When you're ready, we'll move into the peak phase of your journey. Take your time.

**Button:** "Begin Peak"

**Purpose:** Clear handoff. User initiates the transition.

---

## 4. INTEGRATION TRANSITION (IntegrationTransition)

**Context:** All peak modules completed, user continues from check-in.
**Visual:** AsciiMoon animation, progress bar, elapsed time display.
**Pacing:** 5 steps.

*Note: This component is marked as placeholder — content may need further development.*

---

### Header (all steps)

> TRANSITION
> *[X] hours and [Y] minutes into session*

---

### Step 1: Acknowledgment

**Label:** Transition
**Title:** Entering Integration

> You've moved through the peak of your experience. The intensity may be beginning to soften, and a sense of clarity may be emerging.

**Purpose:** Name the shift. Acknowledge what's changing.

---

### Step 2: What's Ahead

**Label:** What's Ahead
**Title:** The Integration Phase

> This next phase is about gently processing and reflecting on what you've experienced. There's no rush — let things settle at their own pace.

**Purpose:** Reframe the experience. From intensity to integration.

---

### Step 3: Guidance

**Label:** Guidance
**Title:** Be Gentle

> You may feel a natural desire to reflect, journal, or simply rest. Trust what feels right. This is a time for gentle self-care and quiet insight.

**Purpose:** Permission to slow down. Validate multiple paths.

---

### Step 4: Hydration & Nourishment

**Label:** Care
**Title:** Hydrate & Nourish

> Take a moment to drink some water and have a small snack if you feel ready. Your body has been working hard — give it what it needs.

*Footer:*
> Take your time. Continue when ready.

**Purpose:** Physical care. Add nourishment to hydration prompt.

---

### Step 5: Ready

**Label:** Ready
**Title:** Begin Integration

> When you're ready, we'll move into the integration phase of your journey. Take your time.

**Button:** "Begin Integration"

**Purpose:** Clear handoff to final phase.

---

## 5. CLOSING RITUAL (Module)

**Context:** Final module in the integration phase.
**Type:** Journaling module with structured prompts.

### Instructions

> Take a moment to honor this experience. Acknowledge what you've explored, what you've learned, what you want to carry forward.

### Journaling Prompts

1. What am I taking away from this session?
2. What do I want to remember?
3. How do I want to be in the days ahead?

**Input placeholder:** "As I close this session..."

**Button:** "Save & Continue" (or Skip)

**Purpose:** Structured reflection. Bridge between session and aftercare.

---

## Copy Review Questions

For your copy editor to consider:

### Tone & Voice
1. Does the language feel warm without being saccharine?
2. Is the balance between guidance and autonomy ("your session, your way") maintained throughout?
3. Are there any moments that feel preachy or overly directive?

### Narrative Arc
4. Do the transitions build on each other? Is there a coherent emotional journey?
5. Does "Letting Go" (Opening Ritual Step 2) land as the key therapeutic concept it's meant to be?
6. Is the shift from "doing" (come-up) to "being" (peak) to "integrating" (integration) clear?

### Practical Clarity
7. Are the reassurance messages during come-up check-ins genuinely reassuring?
8. Is "hydrate" repeated too often (appears in both Peak and Integration transitions)?
9. Should the Integration Transition have more distinct content from Peak Transition?

### Missing Elements
10. The "Brief Centering Breath" option is marked "Coming Soon" — is this a gap?
11. Should there be a transition or acknowledgment when the Closing Ritual completes?
12. Is there enough support for difficult experiences, or is the tone too "everything is fine"?

### Quote Selection
13. Are the TransitionBuffer quotes well-chosen? Any to add or remove?
14. Should quotes be used elsewhere (e.g., in the Peak/Integration transitions)?

---

## Technical Notes

- **Skip Option:** All transitions can be skipped entirely.
- **Journal Integration:** Intention and insights are saved to the journal with timestamps.
- **Elapsed Time:** Displayed in transitions to orient users without pressure.
- **Visual Continuity:** AsciiMoon appears in Opening Ritual and both phase transitions, creating visual through-line.
