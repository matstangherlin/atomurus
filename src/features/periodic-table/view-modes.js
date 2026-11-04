/*
 * Periodic table on a phone is not the desktop table scaled down.
 *
 *   list      portrait phones: one element per row, big touch targets
 *   table     the real 18-column table inside a horizontal pan container
 *             (a controlled overflow exception; cells never shrink below 44px)
 *   property  sort/compare by a property (mass, electronegativity, Z)
 *   trends / compare  → later waves; listed so the mode switch is stable
 */

export const VIEW_MODES = Object.freeze(['list', 'table', 'property']);
export const PLANNED_MODES = Object.freeze(['trends', 'compare']);
export const MIN_CELL_PX = 44;
export const TABLE_COLUMNS = 18;

/* Portrait phones start in list mode; anything with room for a legible
   table (≥ 18 × 44px + gutters) starts in table mode. */
export function defaultMode({ width = 1024, height = 768 } = {}) {
  const portrait = height >= width;
  if (width < TABLE_COLUMNS * MIN_CELL_PX + 32) return portrait ? 'list' : 'table';
  return 'table';
}

export const SORTS = Object.freeze({
  z: (a, b) => a.z - b.z,
  mass: (a, b) => (a.mass ?? Infinity) - (b.mass ?? Infinity),
  chi: (a, b) => (b.chi ?? -Infinity) - (a.chi ?? -Infinity)
});

export function filterElements(elements, query, lang = 'en') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return elements;
  return elements.filter((el) => String(el.z) === q ||
    el.sym.toLowerCase() === q ||
    el.sym.toLowerCase().startsWith(q) ||
    String(lang === 'pt' ? el.pt : el.en).toLowerCase().includes(q));
}

/* Remake 2026 categories (same mapping as the public site's tiles). */
export const CATEGORIES = Object.freeze(['alc', 'alt', 'tra', 'pos', 'smt', 'nmt', 'hal', 'nob', 'lan', 'act']);
const CAT_SETS = {
  alc: [3, 11, 19, 37, 55, 87],
  alt: [4, 12, 20, 38, 56, 88],
  nob: [2, 10, 18, 36, 54, 86, 118],
  hal: [9, 17, 35, 53, 85, 117],
  nmt: [1, 6, 7, 8, 15, 16, 34],
  smt: [5, 14, 32, 33, 51, 52],
  pos: [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116]
};
export function categoryOf(z) {
  for (const id of ['alc', 'alt', 'nob', 'hal', 'nmt', 'smt', 'pos']) {
    if (CAT_SETS[id].includes(z)) return id;
  }
  if (z >= 57 && z <= 71) return 'lan';
  if (z >= 89 && z <= 103) return 'act';
  return 'tra';
}
