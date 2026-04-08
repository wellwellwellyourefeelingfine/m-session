/**
 * Application Constants
 * Single source of truth for app-wide constants
 *
 * APP_VERSION and BUILD_SHA are injected at build time by vite.config.js's
 * `define` block. APP_VERSION comes from package.json so there's no manual
 * sync. BUILD_SHA is the short git hash of the commit that built the bundle,
 * or an empty string if git wasn't available at build time.
 */

/* global __APP_VERSION__, __BUILD_SHA__ */
export const APP_VERSION = __APP_VERSION__;
export const BUILD_SHA = __BUILD_SHA__;
