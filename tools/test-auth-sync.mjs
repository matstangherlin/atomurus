import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { createAuthSync, interpretRemoteAuthEvent, sanitizeIncoming } = createRequire(import.meta.url)('../auth-sync.js');

assert.equal(interpretRemoteAuthEvent(null).action, 'ignore');
assert.equal(interpretRemoteAuthEvent('signed-out').action, 'ignore');
assert.equal(interpretRemoteAuthEvent({ type: 'explode' }).action, 'ignore');
assert.equal(interpretRemoteAuthEvent({ type: 'signed-out' }).action, 'sign-out');
assert.equal(interpretRemoteAuthEvent({ type: 'signed-in', email: 'alice@atomurus.com', accessToken: 'secret' }).action, 'revalidate');
assert.equal(interpretRemoteAuthEvent({ type: 'session-changed' }).action, 'revalidate');

const sanitized = sanitizeIncoming({
  type: 'signed-in',
  timestamp: 42,
  email: 'alice@atomurus.com',
  accessToken: 'secret',
  user: { id: 'u1' }
});
assert.deepEqual(sanitized, { type: 'signed-in', timestamp: 42 });
assert.equal(Object.prototype.hasOwnProperty.call(sanitized, 'email'), false);
assert.equal(Object.prototype.hasOwnProperty.call(sanitized, 'accessToken'), false);

const local = sanitizeIncoming({ type: 'signed-out', originId: 'tab-a' }, 'tab-a');
assert.equal(local, null);

function pairedChannels() {
  const listeners = { a: [], b: [] };
  function make(side) {
    return function BroadcastChannel() {
      this.onmessage = null;
      this.postMessage = function (data) {
        const others = side === 'a' ? listeners.b : listeners.a;
        others.slice().forEach((fn) => fn({ data }));
      };
      this.close = function () {};
      listeners[side].push((event) => {
        if (this.onmessage) this.onmessage(event);
      });
    };
  }
  return { a: make('a'), b: make('b') };
}

const channels = pairedChannels();
const tabA = createAuthSync({ originId: 'a', BroadcastChannel: channels.a, storage: null });
const tabB = createAuthSync({ originId: 'b', BroadcastChannel: channels.b, storage: null });

const received = [];
tabB.subscribe((event, action) => received.push({ event, action }));

tabA.publish('signed-out');
assert.equal(received.length, 1);
assert.equal(received[0].action, 'sign-out');
assert.equal(received[0].event.type, 'signed-out');
assert.equal(Object.keys(received[0].event).sort().join(','), 'timestamp,type');

tabA.publish('signed-in');
assert.equal(received[1].action, 'revalidate');
assert.equal(received[1].event.type, 'signed-in');

const echoed = [];
tabA.subscribe((event, action) => echoed.push({ event, action }));
const postedBeforeRemote = tabA.posted.length;
tabB.publish('signed-out');
assert.equal(echoed.length, 1);
tabB.publish('signed-out');
assert.equal(echoed.length, 2);
assert.equal(tabA.posted.length, postedBeforeRemote);

tabA.publish('signed-in');
assert.equal(tabA.posted.every((item) => !('email' in item) && !('accessToken' in item) && !('user' in item)), true);

tabA.close();
tabB.close();

const store = new Map();
const storage = {
  setItem(key, value) { store.set(key, value); },
  getItem(key) { return store.get(key) || null; }
};
const storageListeners = [];
const tabC = createAuthSync({
  originId: 'c',
  BroadcastChannel: null,
  storage,
  addStorageListener(fn) { storageListeners.push(fn); },
  removeStorageListener() {}
});
const tabD = createAuthSync({
  originId: 'd',
  BroadcastChannel: null,
  storage,
  addStorageListener(fn) { storageListeners.push(fn); },
  removeStorageListener() {}
});
const fromStorage = [];
tabD.subscribe((event, action) => fromStorage.push(action));
tabC.publish('signed-out');
storageListeners.forEach((fn) => fn({ key: 'atomurus-auth-sync', newValue: store.get('atomurus-auth-sync') }));
assert.ok(fromStorage.includes('sign-out'));

tabC.close();
tabD.close();

console.log('test-auth-sync: ok');
