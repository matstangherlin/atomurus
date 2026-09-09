#!/usr/bin/env node
/**
 * Production smoke checks for Atomurus after deploy.
 * Usage: ATOMURUS_SITE_URL=https://atomurus.com node tools/smoke-prod.js
 */
const BASE = (process.env.ATOMURUS_SITE_URL || 'https://atomurus.com').replace(/\/$/, '') || 'https://atomurus.com';

const CHECKS = [
  {
    name: 'home has critical CSS + async lab CSS',
    path: '/',
    test: (html, headers) => {
      assert(html.includes('critical-lab.css'), 'missing critical-lab.css');
      assert(/atomurus-lab-console\.css[^>]*media=["']print["']/.test(html) || /media=["']print["'][^>]*atomurus-lab-console/.test(html), 'lab CSS not async');
      assert(!/acscdn\.com\/script\/aclib\.js/.test(html), 'eager AdCash still in HTML');
      const csp = headers.get('content-security-policy') || '';
      assert(csp.includes('acscdn.com'), 'CSP missing acscdn.com for AdCash');
    }
  },
  {
    name: 'molecules lazy-boots Three.js',
    path: '/viewer/molecules',
    test: (html) => {
      assert(html.includes('load-three.js'), 'missing load-three.js');
      assert(html.includes('atomurusBootProViewer'), 'missing atomurusBootProViewer');
      assert(html.includes('atomurusLoadViewerRuntime'), 'missing lazy viewer runtime');
      assert(!html.includes('WebGLRenderer'), 'interactive runtime still in HTML');
      assert(!/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js/.test(html), 'eager three.min.js still present');
    }
  },
  {
    name: 'periodic table uses ensure-elements-en',
    path: '/periodic-table',
    test: (html) => {
      assert(html.includes('ensure-elements-en.js'), 'missing ensure-elements-en.js');
      assert(!/src=["'][^"']*elements-data-en\.js/.test(html), 'eager elements-data-en.js still present');
    }
  },
  {
    name: 'ads-config API',
    path: '/api/ads-config',
    json: true,
    test: (data) => {
      assert(data.ok === true, 'ads-config not ok');
      assert(typeof data.adsEnabled === 'boolean', 'adsEnabled missing');
    }
  },
  {
    name: 'auth/me anonymous returns 401',
    path: '/api/auth/me',
    allowStatus: [401],
    json: true,
    test: (data, _h, status) => {
      assert(status === 401, 'expected 401');
      assert(data.ok === false, 'expected ok:false');
    }
  },
  {
    name: 'auth/login does not hang to 504',
    path: '/api/auth/login',
    method: 'POST',
    json: true,
    timeoutMs: 12000,
    body: { identifier: 'smoke-dummy@atomurus.test', password: 'not-a-real-password' },
    allowStatus: [401, 403, 429, 503],
    test: (data, _h, status) => {
      assert(status !== 504, 'login hung until gateway 504');
      assert([401, 403, 429, 503].includes(status), `unexpected ${status}`);
      assert(data && data.ok === false, 'expected ok:false');
    }
  }
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function runCheck(check) {
  const timeoutMs = Number(check.timeoutMs) > 0 ? Number(check.timeoutMs) : 0;
  const controller = timeoutMs ? new AbortController() : null;
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  let res;
  try {
    res = await fetch(BASE + check.path, {
      method: check.method || 'GET',
      redirect: 'follow',
      signal: controller ? controller.signal : undefined,
      headers: {
        Accept: check.json ? 'application/json' : 'text/html',
        'User-Agent': 'AtomurusSmoke/1.0',
        ...(check.body ? { 'Content-Type': 'application/json', Origin: BASE } : {})
      },
      body: check.body != null ? JSON.stringify(check.body) : undefined
    });
  } catch (err) {
    if (err && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
      throw new Error(`timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
  const status = res.status;
  const allowed = check.allowStatus || [200];
  if (!allowed.includes(status) && status !== 200) {
    throw new Error(`HTTP ${status}`);
  }
  if (check.json) {
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_err) {
      data = { error: text };
    }
    check.test(data, res.headers, status);
  } else {
    const html = await res.text();
    check.test(html, res.headers, status);
  }
}

async function main() {
  console.log(`Smoke against ${BASE}`);
  let failed = 0;
  for (const check of CHECKS) {
    try {
      await runCheck(check);
      console.log(`OK  ${check.name}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${check.name}: ${err.message}`);
    }
  }
  if (failed) {
    console.error(`${failed} check(s) failed`);
    process.exitCode = 1;
  } else {
    console.log('All smoke checks passed');
  }
}

main();
