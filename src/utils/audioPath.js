/**
 * Prefix an audio path with the Vite base URL.
 * Ensures audio fetch() calls resolve correctly regardless of
 * whether the app is deployed at / or /app/.
 *
 * @param {string} path - Absolute audio path (e.g., '/audio/meditations/body-scan/settling-01.mp3')
 * @returns {string} Base-prefixed path (e.g., '/app/audio/meditations/body-scan/settling-01.mp3')
 */
export function audioPath(path) {
  const base = import.meta.env.BASE_URL;
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${clean}`;
}
