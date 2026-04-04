/**
 * Generator Registry
 *
 * Maps generatorId strings to async functions that produce PNG blobs.
 * Each generator receives the full collected MasterModule data and returns { blob, url }.
 *
 * Usage:
 *   registerGenerator('my-generator', async (data) => {
 *     const blob = await myCanvasExport(data);
 *     return { blob, url: URL.createObjectURL(blob) };
 *   });
 *
 * Content config references generators by ID:
 *   { type: 'generate', generatorId: 'my-generator', ... }
 */

const GENERATORS = {};

/**
 * Register a PNG generator function
 * @param {string} id - Generator ID (referenced in content config)
 * @param {function} fn - Async function: (data) => Promise<{ blob: Blob, url: string }>
 */
export function registerGenerator(id, fn) {
  GENERATORS[id] = fn;
}

/**
 * Get a registered generator by ID
 * @param {string} id
 * @returns {function|null}
 */
export function getGenerator(id) {
  return GENERATORS[id] || null;
}

/**
 * Test generator — creates a simple solid-color PNG for validation.
 * Registered by default so the test module can exercise the generate flow.
 */
registerGenerator('test-solid-color', async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  // Theme-aware background
  const isDark = document.documentElement.classList.contains('dark');
  ctx.fillStyle = isDark ? '#1A1A1A' : '#F5F5F0';
  ctx.fillRect(0, 0, 800, 600);

  // Accent-colored rectangle
  ctx.fillStyle = isDark ? '#9D8CD9' : '#E8A87C';
  ctx.fillRect(100, 100, 600, 400);

  // Title text
  ctx.fillStyle = isDark ? '#F5F5F0' : '#3A3A3A';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MasterModule Test Image', 400, 320);

  // Date
  ctx.font = '14px monospace';
  ctx.fillText(new Date().toLocaleDateString(), 400, 350);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({ blob, url: URL.createObjectURL(blob) });
    }, 'image/png');
  });
});
