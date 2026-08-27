(function (root) {
  'use strict';

  var CHANNEL_NAME = 'atomurus-auth';
  var STORAGE_KEY = 'atomurus-auth-sync';
  var ALLOWED = {
    'signed-in': true,
    'signed-out': true,
    'session-changed': true
  };

  function sanitizeIncoming(raw, originId) {
    if (!raw || typeof raw !== 'object') return null;
    if (originId && raw.originId === originId) return null;
    if (!ALLOWED[raw.type]) return null;
    return {
      type: raw.type,
      timestamp: Number(raw.timestamp) || 0
    };
  }

  function interpretRemoteAuthEvent(raw, originId) {
    var msg = sanitizeIncoming(raw, originId);
    if (!msg) return { action: 'ignore' };
    if (msg.type === 'signed-out') return { action: 'sign-out', event: msg };
    if (msg.type === 'signed-in' || msg.type === 'session-changed') {
      return { action: 'revalidate', event: msg };
    }
    return { action: 'ignore' };
  }

  function createAuthSync(options) {
    options = options || {};
    var originId = options.originId || (Date.now() + '-' + Math.random().toString(16).slice(2));
    var listeners = [];
    var closed = false;
    var channel = null;
    var hasBroadcastOption = Object.prototype.hasOwnProperty.call(options, 'BroadcastChannel');
    var Broadcast = hasBroadcastOption
      ? options.BroadcastChannel
      : (typeof BroadcastChannel !== 'undefined' ? BroadcastChannel : null);
    var storage = Object.prototype.hasOwnProperty.call(options, 'storage')
      ? options.storage
      : (options.useLocalStorage === false ? null : (typeof localStorage !== 'undefined' ? localStorage : null));
    var addStorageListener = options.addStorageListener;
    var removeStorageListener = options.removeStorageListener;
    var storageHandler = null;
    var posted = [];
    if (!addStorageListener && typeof window !== 'undefined') {
      addStorageListener = function (fn) { window.addEventListener('storage', fn); };
      removeStorageListener = function (fn) { window.removeEventListener('storage', fn); };
    }

    function emit(raw) {
      var decision = interpretRemoteAuthEvent(raw, originId);
      if (decision.action === 'ignore') return;
      listeners.slice().forEach(function (fn) {
        try { fn(decision.event, decision.action); } catch (_err) {}
      });
    }

    function publish(type) {
      if (closed || !ALLOWED[type]) return;
      var payload = {
        type: type,
        timestamp: Date.now(),
        originId: originId
      };
      posted.push(payload);
      if (channel) {
        try { channel.postMessage(payload); } catch (_err) {}
        return;
      }
      if (storage) {
        try { storage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (_err) {}
      }
    }

    function subscribe(fn) {
      if (typeof fn !== 'function') return function () {};
      listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (item) { return item !== fn; });
      };
    }

    function close() {
      closed = true;
      listeners = [];
      if (channel && typeof channel.close === 'function') {
        try { channel.close(); } catch (_err) {}
      }
      channel = null;
      if (storageHandler && removeStorageListener) {
        try { removeStorageListener(storageHandler); } catch (_err) {}
      }
    }

    if (Broadcast) {
      try {
        channel = new Broadcast(CHANNEL_NAME);
        channel.onmessage = function (event) {
          emit(event && event.data);
        };
      } catch (_err) {
        channel = null;
      }
    }

    if (!channel && storage && addStorageListener) {
      storageHandler = function (event) {
        if (!event || event.key !== STORAGE_KEY || !event.newValue) return;
        try { emit(JSON.parse(event.newValue)); } catch (_err) {}
      };
      addStorageListener(storageHandler);
    }

    return {
      publish: publish,
      subscribe: subscribe,
      close: close,
      originId: originId,
      posted: posted
    };
  }

  var api = {
    CHANNEL_NAME: CHANNEL_NAME,
    STORAGE_KEY: STORAGE_KEY,
    createAuthSync: createAuthSync,
    sanitizeIncoming: sanitizeIncoming,
    interpretRemoteAuthEvent: interpretRemoteAuthEvent
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.AtomurusAuthSync = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
