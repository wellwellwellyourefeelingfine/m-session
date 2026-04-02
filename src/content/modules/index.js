/**
 * Module Library Index
 * Re-exports all module library functionality
 */

export {
  MODULE_CATEGORIES,
  MODULE_TYPES,
  CATEGORY_ICONS,
  MODULE_ICONS,
  FRAMEWORKS,
  VALID_PHASES,
  moduleLibrary,
  getModuleById,
  getModulesForPhase,
  getRecommendedModulesForPhase,
  canAddModuleToPhase,
  getModulesGroupedByIntensity,
  getFollowUpModules,
} from './library';

import { FRAMEWORKS as _FRAMEWORKS } from './library';

export function getFrameworkById(id) {
  return _FRAMEWORKS[id] || null;
}
