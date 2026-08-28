(function () {
  'use strict';

  if (window.AtomurusProLabApi) return;

  function request(path, options) {
    var headers = { Accept: 'application/json' };
    if (options && options.body != null) headers['Content-Type'] = 'application/json';
    var init = Object.assign({
      credentials: 'include',
      headers: headers
    }, options || {});
    return fetch(path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || data.ok === false) {
          var err = new Error(data.error || 'Request failed');
          err.status = res.status;
          err.code = data.code;
          err.feature = data.feature;
          err.upgradeUrl = data.upgradeUrl || '/pricing';
          err.body = data;
          throw err;
        }
        return data;
      });
    }).catch(function (err) {
      if (err && err.status) throw err;
      var network = new Error('network');
      network.status = 0;
      network.code = 'network';
      throw network;
    });
  }

  window.AtomurusProLabApi = {
    listSessions: function () {
      return request('/api/pro-lab/sessions');
    },
    getSession: function (id) {
      return request('/api/pro-lab/session?id=' + encodeURIComponent(id));
    },
    createSession: function (body) {
      return request('/api/pro-lab/sessions', { method: 'POST', body: JSON.stringify(body || {}) });
    },
    updateSession: function (body) {
      return request('/api/pro-lab/session', { method: 'PUT', body: JSON.stringify(body || {}) });
    },
    deleteSession: function (id) {
      return request('/api/pro-lab/session?id=' + encodeURIComponent(id), { method: 'DELETE' });
    },
    calculate: function (body) {
      return request('/api/pro-lab/calculate', { method: 'POST', body: JSON.stringify(body || {}) });
    },
    elementMeta: function () {
      return request('/api/pro-lab/elements/compare');
    },
    compareElements: function (body) {
      return request('/api/pro-lab/elements/compare', { method: 'POST', body: JSON.stringify(body || {}) });
    },
    moleculeCatalog: function (lang) {
      return request('/api/pro-lab/molecules/compare' + (lang ? ('?lang=' + encodeURIComponent(lang)) : ''));
    },
    compareMolecules: function (body) {
      return request('/api/pro-lab/molecules/compare', { method: 'POST', body: JSON.stringify(body || {}) });
    },
    compareAtomic: function (body) {
      return request('/api/pro-lab/atomic/compare', { method: 'POST', body: JSON.stringify(body || {}) });
    },
    balanceReaction: function (body) {
      return request('/api/pro-lab/reaction/balance', { method: 'POST', body: JSON.stringify(body || {}) });
    },
    solveReaction: function (body) {
      return request('/api/pro-lab/reaction/solve', { method: 'POST', body: JSON.stringify(body || {}) });
    },
    solveFormula: function (body) {
      return request('/api/pro-lab/formula/solve', { method: 'POST', body: JSON.stringify(body || {}) });
    },
    solveSolution: function (body) {
      return request('/api/pro-lab/solutions/solve', { method: 'POST', body: JSON.stringify(body || {}) });
    }
  };
})();
