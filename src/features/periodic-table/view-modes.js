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
