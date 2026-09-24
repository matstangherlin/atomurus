/*
 * Feature registry — one lazy loader per feature. Opening /study/review loads
 * Review; nothing loads until its route is shown. `migrated: false` marks
 * areas the app shell still hands to the existing web page (listed in the
 * A1.0 report as remaining legacy).
 */

const legacy = () => import('../../features/legacy-link/index.js');

export const FEATURE_REGISTRY = Object.freeze({
  home: { load: () => import('../../features/home/index.js'), migrated: true },
  explore: { load: () => import('../../features/explore/index.js'), migrated: true },
  study: { load: () => import('../../features/study/index.js'), migrated: true },
  review: { load: () => import('../../features/study/index.js'), migrated: true },
  sets: { load: () => import('../../features/study/index.js'), migrated: true },
  insights: { load: legacy, migrated: false },
  'periodic-table': { load: () => import('../../features/periodic-table/index.js'), migrated: true },
  molecules: { load: () => import('../../features/molecules/index.js'), migrated: true },
  'atomic-models': { load: legacy, migrated: false },
  calculators: { load: legacy, migrated: false },
  lab: { load: () => import('../../features/lab/index.js'), migrated: true },
  'pro-lab': { load: legacy, migrated: false },
  account: { load: () => import('../../features/account/index.js'), migrated: true }
});

/* Features whose modules (or dependencies) pull in WebGL. The shell must not
   touch them until the user opens one. */
export const HEAVY_FEATURES = Object.freeze(['molecules', 'atomic-models']);
