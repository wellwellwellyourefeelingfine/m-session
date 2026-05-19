/**
 * Analytics Service
 * Privacy-preserving usage analytics via Plausible.
 *
 * Every tracking call in the app flows through this module so there is a
 * single, auditable place to see exactly what data leaves the device.
 *
 * What is collected:
 *   - Anonymous event counts (no user IDs, no cookies, no IP storage)
 *   - Categorical properties only (e.g. sessionMode: 'solo', phase: 'peak')
 *   - Never: journal content, intake free-text, timestamps, device fingerprints
 *
 * Opt-out: Users can disable analytics in Settings. When disabled,
 * `localStorage.plausible_ignore` is set to 'true' and Plausible's own
 * script silently stops sending events — no wrapper logic needed.
 *
 * Offline: When the PWA is running offline, `window.plausible` is still
 * defined (queued by the inline init snippet) but network requests will
 * fail silently. This is fine — offline sessions simply aren't counted.
 */

/**
 * Send an anonymous analytics event.
 *
 * @param {string} eventName  Short, kebab-case event name (e.g. 'session-complete')
 * @param {Object} [props]    Optional flat object of categorical properties.
 *                             Values should be short strings or numbers — never
 *                             free-text, PII, or anything user-entered.
 *
 * @example
 *   track('intake-complete', { sessionMode: 'solo', duration: '4-6h' });
 *   track('emergency-support', { action: 'Call Fireside Project' });
 */
export function track(eventName, props) {
  try {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      if (props && Object.keys(props).length > 0) {
        window.plausible(eventName, { props });
      } else {
        window.plausible(eventName);
      }
    }
  } catch {
    // Silently ignore — analytics should never break the app
  }
}

/**
 * Derive an anonymous dose-range bucket from a milligram value.
 *
 * Used for both initial and booster doses in analytics events. The bucket
 * is deliberately coarse enough that no individual can be identified from
 * it, while still providing useful aggregate data for harm reduction research.
 *
 * Ranges are aligned with standard MDMA harm reduction guidance:
 *   - light:      1–75mg   (sub-therapeutic / cautious)
 *   - moderate:   76–125mg (standard therapeutic range)
 *   - strong:     126–150mg (upper common range)
 *   - heavy:      151–200mg (above typical therapeutic doses)
 *   - very-heavy: 201mg+   (significantly elevated risk)
 *
 * @param {number|string|null} mg  Dose in milligrams
 * @returns {string} Bucket label, or 'unknown' if input is invalid
 */
export function getDoseBucket(mg) {
  const dose = Number(mg);
  if (!dose || dose <= 0) return 'unknown';
  if (dose <= 75) return 'light';
  if (dose <= 125) return 'moderate';
  if (dose <= 150) return 'strong';
  if (dose <= 200) return 'heavy';
  return 'very-heavy';
}

/**
 * Sync the Plausible opt-out flag with the app preference.
 * Called by useAppStore whenever analyticsEnabled changes.
 *
 * When `enabled` is false, sets `localStorage.plausible_ignore = 'true'`
 * which Plausible's script checks before sending any event.
 * When `enabled` is true, removes the key so events flow normally.
 */
export function syncAnalyticsOptOut(enabled) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (enabled) {
        localStorage.removeItem('plausible_ignore');
      } else {
        localStorage.setItem('plausible_ignore', 'true');
      }
    }
  } catch {
    // localStorage may be unavailable in some contexts
  }
}
