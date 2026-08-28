/**
 * Public thermodynamics V1 — the same two relations already shown
 * on the calculators thermo tab:
 *   ΔG = ΔH − T·ΔS
 *   q = m·c·ΔT
 *
 * Do not add Hess, bond enthalpy, phase-change chains, or equilibrium
 * coupling here. Those belong to a later Thermochemistry Workbench.
 */
import { calcError, formatSig } from './chemistry-calc.mjs';

export const THERMO_HEAT_SUBSTANCES = Object.freeze({
  water: { c: 4.184, labelEn: 'Water (liquid)', labelPt: 'Água (líquido)' },
  ice: { c: 2.09, labelEn: 'Ice', labelPt: 'Gelo' },
  iron: { c: 0.449, labelEn: 'Iron', labelPt: 'Ferro' },
  aluminum: { c: 0.897, labelEn: 'Aluminum', labelPt: 'Alumínio' },
  copper: { c: 0.385, labelEn: 'Copper', labelPt: 'Cobre' }
});

const SUBSTANCE_KEYS = new Set(Object.keys(THERMO_HEAT_SUBSTANCES));

function requiredNumber(value, label) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) throw calcError(`${label} must be a finite number`);
  return n;
}

function toKelvin(value, unit) {
  const u = String(unit || 'C').trim().toUpperCase();
  if (u === 'K') return value;
  if (u === 'C') return value + 273.15;
  throw calcError('temperature unit must be C or K');
}

function spontaneity(dg) {
  if (Math.abs(dg) < 1e-9) return 'equilibrium';
  return dg < 0 ? 'spontaneous' : 'nonspontaneous';
}

function heatDirection(q) {
  if (Math.abs(q) < 1e-12) return 'none';
  return q > 0 ? 'endothermic' : 'exothermic';
}

export function solveThermodynamics(input = {}) {
  const gibbsIn = input.gibbs && typeof input.gibbs === 'object' ? input.gibbs : input;
  const heatIn = input.heat && typeof input.heat === 'object' ? input.heat : input;

  const deltaH = requiredNumber(gibbsIn.deltaH ?? gibbsIn.dh, 'ΔH');
  const deltaS = requiredNumber(gibbsIn.deltaS ?? gibbsIn.ds, 'ΔS');
  const Traw = requiredNumber(gibbsIn.T ?? gibbsIn.t, 'T');
  const TUnit = String(gibbsIn.TUnit || gibbsIn.tUnit || 'C').trim().toUpperCase() === 'K' ? 'K' : 'C';
  const Tkelvin = toKelvin(Traw, TUnit);
  if (!(Tkelvin > 0)) throw calcError('temperature must be above absolute zero');

  // ΔH is kJ/mol; ΔS is J/mol·K — convert ΔS to kJ before multiplying by T.
  const dg = deltaH - (deltaS / 1000) * Tkelvin;
  const gibbs = {
    deltaH,
    deltaS,
    T: Traw,
    TUnit,
    Tkelvin,
    deltaG: dg,
    deltaGDisplay: formatSig(dg),
    spontaneity: spontaneity(dg),
    crossover: null
  };
  if (deltaH !== 0 && deltaS !== 0 && (deltaH > 0) === (deltaS > 0)) {
    const tStarK = deltaH / (deltaS / 1000);
    gibbs.crossover = {
      Tkelvin: tStarK,
      Tcelsius: tStarK - 273.15,
      direction: deltaH > 0 ? 'above' : 'below'
    };
  }

  const substanceKey = String(heatIn.substance || heatIn.sub || '').trim().toLowerCase();
  if (!SUBSTANCE_KEYS.has(substanceKey)) throw calcError('unknown heat substance');
  const substance = THERMO_HEAT_SUBSTANCES[substanceKey];
  const mass = requiredNumber(heatIn.mass ?? heatIn.m, 'mass');
  const deltaT = requiredNumber(heatIn.deltaT ?? heatIn.dt, 'ΔT');
  const q = mass * substance.c * deltaT;

  return {
    ok: true,
    engine: 'chemistry-thermodynamics.v1',
    gibbs,
    heat: {
      substance: substanceKey,
      c: substance.c,
      mass,
      deltaT,
      q,
      qDisplay: formatSig(q),
      qkJ: q / 1000,
      direction: heatDirection(q)
    }
  };
}
