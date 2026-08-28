import { molarMassOf } from './chemistry-calc.mjs';
import { studyError } from './study-cloud.mjs';

/** Canonical molecule catalog. Formulas only — 3D coordinates are visualization aids, not measured geometry. */
export const MOLECULE_CATALOG = Object.freeze([
  { id: 'water', formula: 'H2O', nameEn: 'Water', namePt: 'Água' },
  { id: 'ethanol', formula: 'C2H5OH', nameEn: 'Ethanol', namePt: 'Etanol' },
  { id: 'butane', formula: 'C4H10', nameEn: 'Butane', namePt: 'Butano' },
  { id: 'isobutane', formula: 'C4H10', nameEn: 'Isobutane', namePt: 'Isobutano' },
  { id: 'but1ene', formula: 'C4H8', nameEn: '1-Butene', namePt: '1-Buteno' },
  { id: 'but2ene', formula: 'C4H8', nameEn: '2-Butene', namePt: '2-Buteno' },
  { id: 'cis2butene', formula: 'C4H8', nameEn: 'cis-2-Butene', namePt: 'cis-2-Buteno' },
  { id: 'trans2butene', formula: 'C4H8', nameEn: 'trans-2-Butene', namePt: 'trans-2-Buteno' },
  { id: 'dimethylether', formula: 'C2H6O', nameEn: 'Dimethyl ether', namePt: 'Éter dimetílico' },
  { id: 'acetone', formula: 'C3H6O', nameEn: 'Acetone', namePt: 'Acetona' },
  { id: 'methyl-isocyanate', formula: 'C2H3NO', nameEn: 'Methyl isocyanate', namePt: 'Isocianato de metila' },
  { id: 'co2', formula: 'CO2', nameEn: 'Carbon dioxide', namePt: 'Dióxido de carbono' },
  { id: 'ammonia', formula: 'NH3', nameEn: 'Ammonia', namePt: 'Amônia' },
  { id: 'methane', formula: 'CH4', nameEn: 'Methane', namePt: 'Metano' },
  { id: 'hcl', formula: 'HCl', nameEn: 'Hydrochloric acid', namePt: 'Ácido clorídrico' },
  { id: 'nacl', formula: 'NaCl', nameEn: 'Sodium chloride', namePt: 'Cloreto de sódio' },
  { id: 'h2so4', formula: 'H2SO4', nameEn: 'Sulfuric acid', namePt: 'Ácido sulfúrico' },
  { id: 'h3po4', formula: 'H3PO4', nameEn: 'Phosphoric acid', namePt: 'Ácido fosfórico' },
  { id: 'fe2o3', formula: 'Fe2O3', nameEn: 'Iron(III) oxide', namePt: 'Óxido de ferro(III)' },
  { id: 'chfclbr', formula: 'CHFClBr', nameEn: 'Bromochlorofluoromethane', namePt: 'Bromoclorofluorometano' },
  { id: 'bromobutane', formula: 'C4H9Br', nameEn: '2-Bromobutane', namePt: '2-Bromobutano' },
  { id: 'lacticacid', formula: 'C3H6O3', nameEn: 'Lactic acid', namePt: 'Ácido láctico' },
  { id: 'alanine', formula: 'C3H7NO2', nameEn: 'Alanine', namePt: 'Alanina' },
  { id: 'glyceraldehyde', formula: 'C3H6O3', nameEn: 'Glyceraldehyde', namePt: 'Gliceraldeído' },
  { id: 'n2', formula: 'N2', nameEn: 'Nitrogen', namePt: 'Nitrogênio' },
  { id: 'o2', formula: 'O2', nameEn: 'Oxygen', namePt: 'Oxigênio' },
  { id: 'benzene', formula: 'C6H6', nameEn: 'Benzene', namePt: 'Benzeno' },
  { id: 'methanol', formula: 'CH3OH', nameEn: 'Methanol', namePt: 'Metanol' },
  { id: 'aceticacid', formula: 'C2H4O2', nameEn: 'Acetic acid', namePt: 'Ácido acético' },
  { id: 'h2o2', formula: 'H2O2', nameEn: 'Hydrogen peroxide', namePt: 'Peróxido de hidrogênio' },
  { id: 'ethylene', formula: 'C2H4', nameEn: 'Ethylene', namePt: 'Etileno' },
  { id: 'acetylene', formula: 'C2H2', nameEn: 'Acetylene', namePt: 'Acetileno' },
  { id: 'formaldehyde', formula: 'CH2O', nameEn: 'Formaldehyde', namePt: 'Formaldeído' },
  { id: 'co', formula: 'CO', nameEn: 'Carbon monoxide', namePt: 'Monóxido de carbono' },
  { id: 'so2', formula: 'SO2', nameEn: 'Sulfur dioxide', namePt: 'Dióxido de enxofre' },
  { id: 'hno3', formula: 'HNO3', nameEn: 'Nitric acid', namePt: 'Ácido nítrico' },
  { id: 'propane', formula: 'C3H8', nameEn: 'Propane', namePt: 'Propano' },
  { id: 'cyclohexane', formula: 'C6H12', nameEn: 'Cyclohexane', namePt: 'Cicloexano' },
  { id: 'hcn', formula: 'HCN', nameEn: 'Hydrogen cyanide', namePt: 'Cianeto de hidrogênio' },
  { id: 'cs2', formula: 'CS2', nameEn: 'Carbon disulfide', namePt: 'Dissulfeto de carbono' },
  { id: 'pcl3', formula: 'PCl3', nameEn: 'Phosphorus trichloride', namePt: 'Tricloreto de fósforo' },
  { id: 'sf6', formula: 'SF6', nameEn: 'Sulfur hexafluoride', namePt: 'Hexafluoreto de enxofre' }
]);

export const MAX_COMPARE_MOLECULES = 2;

const BY_ID = new Map(MOLECULE_CATALOG.map((row) => [row.id, row]));

export function moleculeCatalogPublic(lang = 'en') {
  return MOLECULE_CATALOG.map((row) => ({
    id: row.id,
    formula: row.formula,
    name: lang === 'pt' ? row.namePt : row.nameEn
  }));
}

export function canonicalMolecule(id, lang = 'en') {
  const key = String(id || '').trim().toLowerCase();
  const row = BY_ID.get(key);
  if (!row) return null;
  const computed = molarMassOf(row.formula);
  return {
    id: row.id,
    formula: row.formula,
    name: lang === 'pt' ? row.namePt : row.nameEn,
    nameEn: row.nameEn,
    namePt: row.namePt,
    href: `/viewer/molecules?mol=${encodeURIComponent(row.id)}`,
    itemKey: row.id,
    molarMass: computed.molarMass,
    molarMassDisplay: Number(computed.molarMass.toPrecision(5)).toString(),
    atomCount: computed.atomCount,
    composition: computed.composition.map((part) => ({
      symbol: part.symbol,
      count: part.count,
      massPercent: Number(part.massPercent.toFixed(2))
    }))
  };
}

export function normalizeMoleculeIds(raw, max = MAX_COMPARE_MOLECULES) {
  const source = Array.isArray(raw) ? raw : [];
  if (!source.length) throw studyError('at least one molecule id is required', 400);
  if (source.length > max) throw studyError(`at most ${max} molecules can be compared`, 400);
  const seen = new Set();
  const ids = [];
  for (const entry of source) {
    const id = String(typeof entry === 'object' ? entry.id || entry.moleculeId : entry).trim().toLowerCase();
    if (!BY_ID.has(id)) throw studyError(`unknown molecule ${id}`, 400);
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  if (!ids.length) throw studyError('at least one molecule id is required', 400);
  return ids;
}

export function compareMolecules({ moleculeIds, lang } = {}) {
  const ids = normalizeMoleculeIds(moleculeIds);
  return {
    molecules: ids.map((id) => canonicalMolecule(id, lang))
  };
}
