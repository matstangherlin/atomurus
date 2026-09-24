/*
 * Pro Lab API — migrated from pro-lab-client.js (A1.0).
 *
 * Solvers are pure computations on the server, so their POSTs are safe to
 * send again only when the *user* asks; the client never replays them.
 * Session writes (create/update/delete) are account changes: never replayed.
 * Pro access is still enforced by requireFeature on every Function.
 */

const SOLVER_TIMEOUT_MS = 25000;

export function createProLabApi(api) {
  if (!api || typeof api.request !== 'function') throw new Error('createProLabApi needs the core API client');
  const solve = (path, body) => api.post(path, body || {}, { timeoutMs: SOLVER_TIMEOUT_MS });

  return {
    listSessions: () => api.get('/api/pro-lab/sessions'),
    getSession: (id) => api.get('/api/pro-lab/session', { query: { id } }),
    createSession: (body) => api.post('/api/pro-lab/sessions', body || {}),
    updateSession: (body) => api.put('/api/pro-lab/session', body || {}),
    deleteSession: (id) => api.delete('/api/pro-lab/session', { query: { id } }),
    calculate: (body) => solve('/api/pro-lab/calculate', body),
    elementMeta: () => api.get('/api/pro-lab/elements/compare'),
    compareElements: (body) => solve('/api/pro-lab/elements/compare', body),
    moleculeCatalog: (lang) => api.get('/api/pro-lab/molecules/compare', { query: lang ? { lang } : undefined }),
    compareMolecules: (body) => solve('/api/pro-lab/molecules/compare', body),
    compareAtomic: (body) => solve('/api/pro-lab/atomic/compare', body),
    balanceReaction: (body) => solve('/api/pro-lab/reaction/balance', body),
    solveReaction: (body) => solve('/api/pro-lab/reaction/solve', body),
    solveFormula: (body) => solve('/api/pro-lab/formula/solve', body),
    solveSolution: (body) => solve('/api/pro-lab/solutions/solve', body)
  };
}
