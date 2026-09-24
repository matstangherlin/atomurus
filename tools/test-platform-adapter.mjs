// A1.0 — Platform service, Web/Capacitor adapters, app lifecycle, network state.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlatform, isSafeExternalUrl, PLATFORM_METHODS } from '../src/core/platform/platform.js';
import { createWebAdapter } from '../src/core/platform/web-adapter.js';
import { createCapacitorAdapter } from '../src/adapters/capacitor/capacitor-adapter.js';
import { createAppLifecycle } from '../src/core/lifecycle/app-lifecycle.js';
import { createNetworkState, NetworkStatus, statusForError } from '../src/core/network/network-state.js';
import { ApiError, ApiErrorKind } from '../src/core/api/api-errors.js';

function eventTarget() {
  const map = new Map();
  return {
    addEventListener(type, fn) { if (!map.has(type)) map.set(type, new Set()); map.get(type).add(fn); },
    removeEventListener(type, fn) { map.get(type)?.delete(fn); },
    dispatch(type, detail) { for (const fn of Array.from(map.get(type) || [])) fn(detail); },
    count(type) { return map.get(type)?.size || 0; }
  };
}

function fakeWindow() {
  const win = eventTarget();
  const doc = eventTarget();
  doc.visibilityState = 'visible';
  win.document = doc;
  win.navigator = { onLine: true };
  win.opened = [];
  win.open = (url, target, features) => { win.opened.push({ url, target, features }); return {}; };
  return win;
}

test('web adapter: identity, pause/resume via visibility, online/offline, external links', async () => {
  const win = fakeWindow();
  const platform = createPlatform(createWebAdapter(win));
  assert.equal(platform.getPlatform(), 'web');
  assert.equal(platform.isWeb(), true);
  assert.equal(platform.isNative(), false);
  assert.equal(platform.isOnline(), true);

  const seen = [];
  const offPause = platform.onPause(() => seen.push('pause'));
  const offResume = platform.onResume(() => seen.push('resume'));
  const offNet = platform.onNetworkChange((d) => seen.push(d.online ? 'online' : 'offline'));
  win.document.visibilityState = 'hidden'; win.document.dispatch('visibilitychange');
  win.document.visibilityState = 'visible'; win.document.dispatch('visibilitychange');
  win.navigator.onLine = false; win.dispatch('offline');
  assert.equal(platform.isOnline(), false);
  win.dispatch('online');
  assert.deepEqual(seen, ['pause', 'resume', 'offline', 'online']);

  offPause(); offResume(); offNet();
  assert.equal(win.document.count('visibilitychange'), 0, 'unsubscribe removes listeners');
  assert.equal(win.count('online') + win.count('offline'), 0);

  assert.equal(await platform.openExternalUrl('https://example.org/a'), true);
  assert.equal(win.opened[0].features, 'noopener,noreferrer');
  assert.equal(await platform.openExternalUrl('javascript:alert(1)'), false);
  assert.equal(win.opened.length, 1);
  assert.deepEqual(platform.getSafeArea(), { top: 0, right: 0, bottom: 0, left: 0 });
});

test('capacitor adapter maps plugins without core importing Capacitor', async () => {
  const listeners = {};
  const plugin = (name) => ({
    addListener(event, fn) {
      listeners[`${name}:${event}`] = fn;
      return Promise.resolve({ remove: () => { delete listeners[`${name}:${event}`]; } });
    }
  });
  const opened = [];
  const bridge = {
    Capacitor: { getPlatform: () => 'android' },
    App: plugin('App'),
    Network: { ...plugin('Network'), getStatus: async () => ({ connected: false }) },
    Browser: { open: async ({ url }) => { opened.push(url); } }
  };
  const platform = createPlatform(createCapacitorAdapter(bridge, fakeWindow()));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(platform.isNative(), true);
  assert.equal(platform.getPlatform(), 'android');
  assert.equal(platform.isOnline(), false, 'initial Network.getStatus respected');

  const seen = [];
  const off = platform.onPause(() => seen.push('pause'));
  platform.onResume(() => seen.push('resume'));
  platform.onNetworkChange((d) => seen.push(`net:${d.online}`));
  await new Promise((r) => setTimeout(r, 0));
  listeners['App:pause']();
  listeners['App:resume']();
  listeners['Network:networkStatusChange']({ connected: true, connectionType: 'wifi' });
  assert.deepEqual(seen, ['pause', 'resume', 'net:true']);
  assert.equal(platform.isOnline(), true);
  off();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(listeners['App:pause'], undefined, 'plugin listener removed');

  assert.equal(await platform.openExternalUrl('https://atomurus.com/pricing'), true);
  assert.deepEqual(opened, ['https://atomurus.com/pricing']);
});

test('platform rejects incomplete adapters', () => {
  assert.throws(() => createPlatform({ getPlatform: () => 'web' }), /missing/);
  assert.equal(PLATFORM_METHODS.length, 7);
  assert.equal(isSafeExternalUrl('mailto:a@b.c'), true);
  assert.equal(isSafeExternalUrl('file:///etc/passwd'), false);
});

test('app lifecycle: pause/resume dedupe, route enter/leave, cleanup', () => {
  const win = fakeWindow();
  const platform = createPlatform(createWebAdapter(win));
  const lifecycle = createAppLifecycle(platform);
  const log = [];
  const offs = [
    lifecycle.onAppPause(() => log.push('pause')),
    lifecycle.onAppResume(() => log.push('resume')),
    lifecycle.onNetworkChange((d) => log.push(`net:${d.online}`)),
    lifecycle.onRouteEnter((r) => log.push(`enter:${r.id}`)),
    lifecycle.onRouteLeave((r) => log.push(`leave:${r.id}`))
  ];
  lifecycle.onAppPause(() => { throw new Error('bad subscriber'); });
  const origError = console.error; console.error = () => {};
  win.document.visibilityState = 'hidden'; win.document.dispatch('visibilitychange');
  win.document.dispatch('visibilitychange'); /* duplicate hidden → one pause */
  console.error = origError;
  assert.equal(lifecycle.state().paused, true);
  win.document.visibilityState = 'visible'; win.document.dispatch('visibilitychange');
  win.dispatch('offline');
  lifecycle.enterRoute({ id: 'study' });
  lifecycle.enterRoute({ id: 'lab' });
  assert.deepEqual(log, ['pause', 'resume', 'net:false', 'enter:study', 'leave:study', 'enter:lab']);
  offs.forEach((off) => off());
  assert.equal(lifecycle.subscriberCount(), 1);
  lifecycle.destroy();
  assert.equal(lifecycle.subscriberCount(), 0);
  assert.equal(win.document.count('visibilitychange'), 0, 'lifecycle removes its platform listeners');
});

test('network state distinguishes offline, slow, server error and auth expired', () => {
  let t = 0;
  const win = fakeWindow();
  const platform = createPlatform(createWebAdapter(win));
  const net = createNetworkState({ platform, now: () => t, recoverAfterMs: 1000 });
  assert.equal(net.status, NetworkStatus.ONLINE);
  net.onApiEvent({ type: 'timeout' });
  assert.equal(net.status, NetworkStatus.SLOW);
  t = 2000;
  assert.equal(net.status, NetworkStatus.ONLINE, 'transient states decay');
  net.onApiEvent({ type: 'server_error' });
  assert.equal(net.status, NetworkStatus.SERVER_ERROR);
  net.onApiEvent({ type: 'unauthorized' });
  assert.equal(net.status, NetworkStatus.AUTH_EXPIRED);
  win.dispatch('offline');
  assert.equal(net.status, NetworkStatus.OFFLINE);
  t = 99999;
  assert.equal(net.status, NetworkStatus.OFFLINE, 'offline only clears on a real event');
  win.dispatch('online');
  assert.equal(net.status, NetworkStatus.ONLINE);
  assert.equal(statusForError(new ApiError(ApiErrorKind.OFFLINE)), NetworkStatus.OFFLINE);
  assert.equal(statusForError(new ApiError(ApiErrorKind.TIMEOUT)), NetworkStatus.SLOW);
  assert.equal(statusForError(new ApiError(ApiErrorKind.UNAUTHORIZED)), NetworkStatus.AUTH_EXPIRED);
  assert.equal(statusForError(new ApiError(ApiErrorKind.SERVER_ERROR)), NetworkStatus.SERVER_ERROR);
  assert.equal(statusForError(new ApiError(ApiErrorKind.FORBIDDEN)), null);
  net.destroy();
});
