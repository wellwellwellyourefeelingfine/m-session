# Timeline Generation

The intake questionnaire captures a **primary focus** and **guidance level**, which together determine the activity timeline generated for the session. This produces 11 distinct configurations.

### Focus Areas

| Focus | Theme | Unique Modules |
|-------|-------|----------------|
| Self-Understanding | Values, patterns, inner parts | Values Compass, Open Awareness |
| Emotional Healing | Self-compassion, processing, release | Protector Dialogue (linked pair), Stay With It |
| Relationship | Attachment, EFT exploration | The Descent + The Cycle (linked pair), Let's Dance |
| Creativity & Insight | Open flow, embodiment, play | Let's Dance, Open Awareness, Felt Sense |
| Open Exploration | Balanced mix (default) | Broad sampling across all module types |

### Guidance Levels

| Level | Description |
|-------|-------------|
| Full | Pre-session activities (intention setting, life graph) + fuller module set per phase |
| Moderate | Fewer pre-session activities + lighter module set (removes ~2-3 modules vs full) |
| Minimal | No pre-session activities, lightweight structure across all phases |

### Configuration Structure

Defined in `src/content/timeline/configurations.js`:

```javascript
TIMELINE_CONFIGS[focus][guidanceLevel] = {
  preSession: [{ libraryId, duration }],  // optional
  comeUp:     [{ libraryId, duration }],
  peak:       [{ libraryId, duration }],
  integration:[{ libraryId, duration }],
}
// Linked modules add: { linkedGroup, linkedRole }
// Minimal is a flat object (no guidance sub-keys)
```

### Generation Flow

`generateTimelineFromIntake()` in `useSessionStore.js`:
1. Reads `sessionProfile.primaryFocus` (fallback: `'open'`) and `sessionProfile.guidanceLevel` (fallback: `'full'`)
2. Looks up the matching configuration from `TIMELINE_CONFIGS`
3. Builds module instances from the config (assigns `instanceId`, `order`, `phase`, library content)
4. Resolves linked module groups (e.g., `'protector'` → shared `linkedGroupId`)
5. Inserts booster check-in as post-processing — auto-seeded into peak at order 1. The stored `phase`/`order` is bookkeeping only; visual placement is recomputed at render time (see [module-misc.md](module-misc.md) "Booster Card Placement").
6. Calculates phase durations and precaches audio
