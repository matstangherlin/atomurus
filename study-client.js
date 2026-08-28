(function () {
  'use strict';

  if (window.AtomurusStudy) return;

  var overviewCache = null;
  var itemsCache = Object.create(null);
  var progressCache = Object.create(null);

  function request(path, options) {
    var headers = { Accept: 'application/json' };
    if (options && options.body != null) headers['Content-Type'] = 'application/json';
    return fetch(path, Object.assign({
      credentials: 'include',
      headers: headers
    }, options || {})).then(function (res) {
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
    });
  }

  function cacheKey(parts) {
    return parts.map(function (part) { return part == null ? '' : String(part); }).join('|');
  }

  function queryString(params) {
    var search = new URLSearchParams();
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value == null || value === '') return;
      search.set(key, String(value));
    });
    var text = search.toString();
    return text ? '?' + text : '';
  }

  function invalidate() {
    overviewCache = null;
    itemsCache = Object.create(null);
    progressCache = Object.create(null);
  }

  var api = {
    overview: function (force) {
      if (!force && overviewCache) return Promise.resolve(overviewCache);
      return request('/api/study/overview').then(function (data) {
        overviewCache = data;
        return data;
      });
    },
    items: function (params, force) {
      var key = cacheKey(['items', params && params.type, params && params.tag, params && params.hasNote, params && params.cursor, params && params.limit]);
      if (!force && itemsCache[key]) return Promise.resolve(itemsCache[key]);
      return request('/api/study/items' + queryString(params || {})).then(function (data) {
        itemsCache[key] = data;
        return data;
      });
    },
    saveItem: function (body) {
      return request('/api/study/item', {
        method: 'PUT',
        body: JSON.stringify(body || {})
      }).then(function (data) {
        invalidate();
        return data;
      });
    },
    deleteItem: function (id) {
      return request('/api/study/item?id=' + encodeURIComponent(id), { method: 'DELETE' }).then(function (data) {
        invalidate();
        return data;
      });
    },
    saveCalculatorRun: function (body) {
      return request('/api/study/calculator-history', {
        method: 'POST',
        body: JSON.stringify(body || {})
      }).then(function (data) {
        invalidate();
        return data;
      });
    },
    progressList: function (params, force) {
      var key = cacheKey(['progress', params && params.type, params && params.cursor, params && params.limit]);
      if (!force && progressCache[key]) return Promise.resolve(progressCache[key]);
      return request('/api/study/progress' + queryString(params || {})).then(function (data) {
        progressCache[key] = data;
        return data;
      });
    },
    putProgress: function (body) {
      return request('/api/study/progress', {
        method: 'PUT',
        body: JSON.stringify(body || {})
      }).then(function (data) {
        progressCache = Object.create(null);
        overviewCache = null;
        return data;
      });
    },
    invalidate: invalidate
  };

  window.AtomurusStudy = api;
})();
