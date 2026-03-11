# ElevenLabs TTS Generation — Tips & Reference

A reference for writing and tuning TTS generation scripts in this project. Based on 10 meditation audio scripts and the ElevenLabs API docs.

---

## Voice Profiles

We use two voices. **Theo Silk is the current standard** — Oliver Silk is legacy and won't be regenerated.

| Voice | ID | Scripts |
|-------|-----|---------|
| **Theo Silk** | `UmQN7jS1Ee8B1czsUtQh` | 8 scripts (all newer meditations) |
| Oliver Silk (legacy) | `jfIS2w2yJi0grJZPyEsk` | 2 scripts (body-scan, self-compassion) |

### Theo Silk — Standard Settings

```js
const VOICE_SETTINGS = {
  stability: 0.80,
  similarity_boost: 0.80,
  style: 0.0,
  use_speaker_boost: true,
};
```

- **stability 0.80** — High enough for consistent volume and delivery across many sequential prompts. Lower values (0.50–0.65) give more expression but introduce volume inconsistency when generating large batches. Stay With It uses 0.85 for maximum consistency.
- **similarity_boost 0.80** — Strong adherence to the voice profile, reducing variation between generations.
- **style 0.0** — Always zero. Higher values amplify style exaggeration and add latency.
- **use_speaker_boost true** — Enhances voice clarity. Slight latency cost.
- **speed 0.85** — Best default for meditation content. Usable range is **0.81–0.88** for meditative delivery. See Speed section for per-module values.

### Oliver Silk — Legacy Settings (do not use for new scripts)

```js
{ stability: 0.88, similarity_boost: 0.88, style: 0.0, use_speaker_boost: false }
```

Higher stability + similarity for very predictable output at minimum speed (0.70).

---

## Speed

Range: **0.70** (minimum, very slow) to **1.20** (maximum). Default **1.0** = normal pace.

### Speed Reference Across Modules

| Speed | Module(s) | Character |
|-------|-----------|-----------|
| 0.70 | Body Scan, Self-Compassion, Leaves on a Stream | Extremely slow, deeply meditative (Oliver Silk legacy) |
| 0.81 | Stay With It | Slow, deep internal work |
| 0.84 | Pendulation — Section C (freeze) | Deepest somatic work |
| 0.85 | Pendulation — Sections B, B-Ground, D | Deep processing / integration |
| 0.86 | Pendulation — Voo, Pendulation | Deep somatic discharge |
| 0.87 | Felt Sense, Protector Dialogue, Simple Grounding | Standard meditative pace |
| 0.88–0.89 | Pendulation — settle, resource, track, activate | Moderate inward focus |
| 0.91 | The Descent, The Cycle Closing | Natural/conversational |

### Per-Prompt Speed (Advanced)

For meditations with varying intensity, map speeds to prompt ID prefixes instead of using a single global speed. See `generate-pendulation-audio.mjs` for the pattern:

```js
const SPEED_MAP = [
  { prefix: 'a-settle',   speed: 0.89 },  // Lightest
  { prefix: 'a-resource', speed: 0.89 },
  { prefix: 'a-track',    speed: 0.89 },
  // ...
  { prefix: 'c-',         speed: 0.84 },  // Deepest
];

function getSpeedForPrompt(promptId) {
  const match = SPEED_MAP.find(entry => promptId.startsWith(entry.prefix));
  return match ? match.speed : 0.87;
}
```

**Ordering matters:** More specific prefixes must come before less specific ones (e.g., `b-ground` before `b-`) since `.find()` returns the first match.

---

## Pacing Continuity (Preventing Rushed Audio)

Longer text chunks or sequences of prompts can sometimes result in the voice rushing or sounding sped up, especially mid-generation. The best fix is **splitting long prompts into shorter sub-chunks** (≤3 sentences, ≤~200 chars each).

### DO NOT use context chaining

The ElevenLabs API offers `previous_request_ids`, `previous_text`, and `next_text` parameters for chaining sequential generations. **Do not use these.** Despite being recommended in the official docs, they cause **cumulative volume drift** — audio gets progressively quieter (or louder) across successive generations. After ~10-15 chained prompts the volume swings become very noticeable.

Each prompt should be generated **independently** with no reference to previous or next generations. This produces consistent volume and pacing across the entire batch.

```js
// GOOD — each prompt is independent
const body = {
  text,
  model_id: MODEL_ID,
  voice_settings: { ...VOICE_SETTINGS, speed },
};

// BAD — causes cumulative volume drift
// body.previous_request_ids = recentIds.slice(-3);
// body.previous_text = previousPromptText;
// body.next_text = nextPromptText;
```

### `seed`

For deterministic, reproducible results across identical requests. Useful if you need to regenerate a prompt and get exactly the same output.

---

## Stability Tuning

| Stability | Effect | When to Use |
|-----------|--------|-------------|
| 0.50–0.65 | More expressive, natural variation between lines | Single-prompt or short meditations only — volume inconsistency in large batches |
| 0.70–0.80 | Consistent, steady delivery with some warmth | **Default (0.80)** — best balance for batch generation |
| 0.85–1.0 | Very uniform, potentially monotone | When the content demands maximum consistency (e.g., Stay With It at 0.85) |

Lower stability = more emotional range but less predictable. For batch generation of meditation audio, **0.80 is the sweet spot** — consistent volume across many prompts while still sounding warm and natural. Earlier scripts used 0.65 but this caused volume swings across large batches.

---

## Common Pitfalls

### Break Tags Can Cause Speeding

Using too many `<break time="x.xs" />` tags in a single generation can cause instability — the AI may speed up or introduce audio artifacts. Prefer natural punctuation (periods, ellipses, commas) for pacing. If you need explicit pauses, use them sparingly.

### Extreme Speed Values Affect Quality

Values below 0.75 or above 1.15 can degrade quality noticeably. Stay within 0.80–0.91 for meditation content unless you have a specific reason to go slower.

### Long Text Isn't Usually the Problem

The multilingual v2 model handles up to 10,000 characters per request. Our longest prompts are ~540 chars — well within safe range. If audio sounds rushed, it's more likely a speed/stability issue than a text length issue.

### The Model May Vary Between Runs

Even with identical settings, ElevenLabs output isn't perfectly deterministic (unless you use `seed`). If a specific prompt sounds off, regenerate it with `--only <prompt-id>`.

---

## Script Architecture

All scripts in this project follow the same template:

```
Configuration constants → Import meditation definition → Gather prompts →
Parse CLI args → Validate API key → Main loop (generate + save) → Summary
```

### Standard CLI Flags

Every script supports:

| Flag | Purpose |
|------|---------|
| `--dry-run` | Print prompts and filenames, no API calls |
| `--list-voices` | List all voices on your account |
| `--start N` | Resume from prompt index N (0-based) |
| `--end N` | Stop after prompt index N (use with `--start` for section ranges) |
| `--only ID` | Generate only one specific prompt |

Some scripts add extra flags for filtering by group or section.

### Standard Constants

```js
const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_FORMAT = 'mp3_44100_128';
const REQUEST_DELAY = 1200; // ms between API calls
```

### Error Recovery

On failure, scripts print two recovery hints:
```
To retry this prompt: --only <prompt-id>
To resume from here:  --start <index>
```

### After Generating Audio

Always regenerate the audio duration manifest:
```bash
node scripts/generate-audio-durations.mjs
```

This scans all `public/audio/meditations/*/` directories and writes `src/content/meditations/audio-durations.json`, which the app uses for accurate timing instead of word-count estimates.

---

## Model

We use **`eleven_multilingual_v2`** for everything. This model:
- Handles up to 10,000 characters per request
- Provides consistent quality for long-form content
- Supports all voice settings including speed control
- Is the recommended model for non-realtime TTS

---

## Quick Checklist for New Scripts

1. Copy an existing script as a template (e.g., `generate-felt-sense-audio.mjs` for standard, or `generate-pendulation-audio.mjs` for per-prompt speed)
2. Update voice settings if needed (usually keep Theo Silk standard)
3. Choose speed based on meditation intensity (see reference table above)
4. Consider per-prompt speed if the meditation has sections of varying depth
5. **Do NOT** add `previous_request_ids` or `previous_text` chaining — it causes volume drift (see Pacing Continuity section)
6. Run with `--dry-run` first to verify prompt IDs, text, and speed assignments
7. After generation, run `node scripts/generate-audio-durations.mjs`
8. Listen to the output — regenerate individual prompts with `--only` if any sound off
