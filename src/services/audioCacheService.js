/**
 * Audio Cache Service
 * On-demand caching of meditation audio files using the Cache API.
 * Shares the 'audio-cache' cacheName with the Workbox runtime CacheFirst strategy
 * so that manually precached files are served by the service worker on subsequent requests.
 */

import { getModuleById } from '../content/modules/library';
import { getMeditationById } from '../content/meditations';

const CACHE_NAME = 'audio-cache';

// Silence blocks and soft gong used by the audio composer
const COMPOSER_ASSETS = [
  '/audio/silence/silence-0.5s.mp3',
  '/audio/silence/silence-1s.mp3',
  '/audio/silence/silence-5s.mp3',
  '/audio/silence/silence-10s.mp3',
  '/audio/silence/silence-30s.mp3',
  '/audio/silence/silence-60s.mp3',
  '/audio/meditation-bell-soft.mp3',
];

/**
 * Precache the silence blocks and soft gong used by the audio composer.
 * These are shared across all meditations and should be cached early.
 */
export async function precacheComposerAssets() {
  try {
    if (!('caches' in window)) return;

    const cache = await caches.open(CACHE_NAME);
    let cached = 0;

    await Promise.all(
      COMPOSER_ASSETS.map(async (url) => {
        try {
          const existing = await cache.match(url);
          if (existing) return;
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            cached++;
          }
        } catch {
          // Non-critical — silence blocks will be fetched on demand
        }
      })
    );

    if (cached > 0) {
      console.log(`[AudioCache] Composer assets: cached ${cached} files`);
    }
  } catch (err) {
    console.warn('[AudioCache] precacheComposerAssets error:', err);
  }
}

/**
 * Get all audio URLs for a given module's meditation content.
 * Handles both standard meditations (flat prompts array) and
 * variation-based meditations like self-compassion (assembleVariation + variations).
 */
function getAudioUrlsForModule(libraryId) {
  const libraryModule = getModuleById(libraryId);
  if (!libraryModule?.meditationId) return [];

  const meditation = getMeditationById(libraryModule.meditationId);
  if (!meditation?.audio) return [];

  const { basePath, format } = meditation.audio;
  const allClipIds = new Set();

  if (meditation.prompts) {
    // Standard structure: open-awareness, body-scan, simple-grounding
    meditation.prompts.forEach((p) => allClipIds.add(p.id));
  } else if (meditation.assembleVariation && meditation.variations) {
    // Variation structure: self-compassion
    // Cache all variations so any runtime selection is covered
    Object.keys(meditation.variations).forEach((variationKey) => {
      const clips = meditation.assembleVariation(variationKey);
      clips.forEach((clip) => allClipIds.add(clip.id));
    });
  }

  return Array.from(allClipIds).map((id) => `${basePath}${id}.${format}`);
}

/**
 * Precache all audio files for a single module.
 * Idempotent: skips files already in cache.
 * Non-blocking: catches all errors individually.
 */
export async function precacheAudioForModule(libraryId) {
  try {
    if (!('caches' in window)) return;

    const urls = getAudioUrlsForModule(libraryId);
    if (urls.length === 0) return;

    const cache = await caches.open(CACHE_NAME);

    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const existing = await cache.match(url);
          if (existing) return 'skipped';

          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            return 'cached';
          }
          return 'failed';
        } catch {
          return 'failed';
        }
      })
    );

    const cached = results.filter((r) => r === 'cached').length;
    const skipped = results.filter((r) => r === 'skipped').length;
    const failed = results.filter((r) => r === 'failed').length;

    if (cached > 0) {
      console.log(`[AudioCache] "${libraryId}": cached ${cached}, skipped ${skipped}, failed ${failed}`);
    }
  } catch (err) {
    console.warn('[AudioCache] precacheAudioForModule error:', err);
  }
}

/**
 * Precache audio for all modules in a timeline.
 * Deduplicates by libraryId so shared modules aren't cached twice.
 */
export async function precacheAudioForTimeline(modules) {
  if (!modules || !Array.isArray(modules)) return;

  const uniqueLibraryIds = [...new Set(modules.map((m) => m.libraryId))];
  await Promise.all(uniqueLibraryIds.map((id) => precacheAudioForModule(id)));
}
