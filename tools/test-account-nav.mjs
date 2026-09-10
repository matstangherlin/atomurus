import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(rel) {
  return readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}

const nav = read('assets/global-nav.js');
assert.match(nav, /function guestSignupHref/);
assert.match(nav, /function accountHref/);
assert.match(nav, /\/account/);
assert.match(nav, /kind === 'free'/);
assert.doesNotMatch(nav, /\/app\?section=account/);
assert.match(nav, /paintFoot\(\)/);
assert.doesNotMatch(nav, /ws-body[\s\S]{0,80}paintFoot/);

const app = read('app.html');
assert.match(app, /data-nav="signup"/);
assert.match(app, /common\.auth\.createAccount/);
assert.match(app, /toLowerCase\(\)!=='account'/);
assert.match(app, /assets\/lab\/virtual-lab\.js/);
assert.match(app, /Your Atomurus workspace/);

const auth = read('auth-app.js');
assert.match(auth, /accountRedirectFromWorkspace/);
assert.match(auth, /section=account/);
assert.match(auth, /ws-account-tabs/);
assert.match(auth, /labHeroTitle/);
assert.match(auth, /navCreations/);
assert.match(auth, /AtomurusLab\.mount/);
assert.doesNotMatch(auth, /userChip\.href = user \? '\/app\?section=account'/);

const account = read('account.html');
assert.match(account, /id="app-study"/);
assert.match(account, /account-center\.js/);
assert.match(account, /id="ws-nav-foot"/);

const center = read('assets/account-center.js');
assert.match(center, /\/account\?tab=/);
assert.match(center, /atomurus-3d-quality/);
assert.match(center, /atomurus-reduced-motion/);
assert.doesNotMatch(center, /delete account|Delete account/);

const toml = read('netlify.toml');
assert.match(toml, /from\s+=\s+"\/account"/);

console.log('account nav tests passed');
