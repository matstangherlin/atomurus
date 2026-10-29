// Content-Security-Policy, measured in the browser. tools/e2e-serve.mjs does
// not apply netlify.toml headers, so each page document is fetched as served
// and answered again with both policies from netlify.toml. Every request to a
// third party is answered locally with an empty 200: nothing leaves the
// machine. The applied policy must cause zero violations, with consent
// refused and accepted. Report-Only violations are collected; with
// CSP_WRITE_REPORT=1 they are written to docs/security/csp-violacoes.md.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ROOT = path.join(__dirname, '..');
const TOML = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');

function header(name) {
  const m = new RegExp('^\\s*' + name.replace(/-/g, '\\-') + '\\s*=\\s*"([^"]*)"', 'm').exec(TOML);
  return m ? m[1] : '';
}

const APPLIED = header('Content-Security-Policy');
const REPORT_ONLY = header('Content-Security-Policy-Report-Only');
const PAGES = ['/', '/periodic-table', '/calculators', '/pricing', '/login', '/contact', '/periodic-table/hydrogen'];
const SCENARIOS = {
  refused: { analytics: false, ads: false },
  accepted: { analytics: true, ads: true }
};
// What GA4 and reCAPTCHA request once they run. The scripts themselves are
// answered empty here, so the page makes these calls on their behalf.
const BEACONS = [
  'https://www.google-analytics.com/g/collect?v=2',
  'https://region1.google-analytics.com/g/collect?v=2',
  'https://region1.analytics.google.com/g/collect?v=2',
  'https://www.googletagmanager.com/td?id=test',
  'https://www.google.com/recaptcha/api2/clr?k=test'
];
const FRAMES = ['https://www.google.com/recaptcha/api2/anchor?k=test', 'https://recaptcha.google.com/recaptcha/api2/bframe?k=test'];

const collected = [];

async function arm(page, consent) {
  const thirdParty = [];
  await page.addInitScript((choice) => {
    try {
      localStorage.setItem('atomurus-cookie-consent-v2', JSON.stringify({ v: 2, analytics: choice.analytics, ads: choice.ads, ts: Date.now() }));
      localStorage.setItem('atomurus-cookie-consent', choice.analytics && choice.ads ? 'accepted' : 'rejected');
    } catch (_err) {}
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__cspViolations.push({
        disposition: event.disposition,
        directive: event.effectiveDirective || event.violatedDirective,
        blocked: event.blockedURI,
        sample: (event.sample || '').slice(0, 40)
          .replace(/(zoneId\s*:\s*)(['"])[^'"]*\2/gi, '$1$2…$2')
          .replace(/ca-pub-\d+/g, 'ca-pub-…')
          .replace(/\bG-[A-Z0-9]{6,}\b/g, 'G-…')
      });
    }, true);
  }, consent);
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const local = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
    if (!local) {
      thirdParty.push(url.origin + url.pathname);
      const type = request.resourceType();
      const contentType = type === 'script' ? 'text/javascript' : type === 'document' ? 'text/html' : 'text/plain';
      await route.fulfill({ status: 200, contentType, body: '', headers: { 'access-control-allow-origin': '*' } });
      return;
    }
    if (request.resourceType() === 'document') {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          'content-security-policy': APPLIED,
          'content-security-policy-report-only': REPORT_ONLY
        }
      });
      return;
    }
    await route.fallback();
  });
  return thirdParty;
}

test.describe.configure({ mode: 'serial' });

test('netlify.toml has both policies', () => {
  expect(APPLIED).toContain("object-src 'none'");
  expect(REPORT_ONLY).toContain("script-src-attr 'none'");
  expect(REPORT_ONLY.split(';').find((d) => d.trim().startsWith('script-src '))).not.toContain("'unsafe-inline'");
});

for (const [scenario, consent] of Object.entries(SCENARIOS)) {
  for (const pagePath of PAGES) {
    test(`${scenario} consent: ${pagePath} has no violation of the applied CSP`, async ({ page }) => {
      const thirdParty = await arm(page, consent);
      await page.goto(pagePath, { waitUntil: 'load' });
      // The ad loader waits for a first interaction or a short idle delay.
      await page.mouse.move(40, 40);
      await page.keyboard.press('Shift');
      if (scenario === 'accepted') {
        await page.evaluate(async ({ beacons, frames, withFrames }) => {
          for (const url of beacons) {
            try { await fetch(url, { method: 'POST', mode: 'no-cors', body: 'x' }); } catch (_err) {}
          }
          if (withFrames) {
            for (const src of frames) {
              const frame = document.createElement('iframe');
              frame.src = src;
              frame.hidden = true;
              document.body.appendChild(frame);
            }
          }
        }, { beacons: BEACONS, frames: FRAMES, withFrames: pagePath === '/contact' });
      }
      await page.waitForTimeout(scenario === 'accepted' ? 4000 : 800);
      const violations = await page.evaluate(() => window.__cspViolations || []);
      const enforced = violations.filter((row) => row.disposition === 'enforce');
      expect(enforced, JSON.stringify(enforced, null, 2)).toEqual([]);
      if (scenario === 'refused') {
        expect(thirdParty.filter((url) => /googletagmanager|google-analytics|googlesyndication|acscdn|doubleclick/.test(url)),
          'nothing is measured or advertised before consent').toEqual([]);
      }
      violations.filter((row) => row.disposition === 'report').forEach((row) => collected.push({ ...row, page: pagePath, scenario }));
    });
  }
}

test.afterAll(() => {
  if (!process.env.CSP_WRITE_REPORT) return;
  const groups = new Map();
  collected.forEach((row) => {
    const blocked = /^https?:/.test(row.blocked) ? new URL(row.blocked).origin : row.blocked;
    const key = [row.directive, blocked, row.sample].join('|');
    if (!groups.has(key)) groups.set(key, { directive: row.directive, blocked, sample: row.sample, pages: new Set(), scenarios: new Set(), count: 0 });
    const g = groups.get(key);
    g.pages.add(row.page);
    g.scenarios.add(row.scenario);
    g.count += 1;
  });
  const rows = [...groups.values()].sort((a, b) => b.pages.size - a.pages.size || b.count - a.count || a.directive.localeCompare(b.directive) || a.sample.localeCompare(b.sample));
  const byDirective = {};
  rows.forEach((g) => { byDirective[g.directive] = (byDirective[g.directive] || 0) + g.count; });
  const lines = [
    '# Violações da CSP Report-Only (etapa 2)',
    '',
    'Gerado por `CSP_WRITE_REPORT=1 npx playwright test e2e/csp.spec.js`: ' + PAGES.length + ' páginas × consentimento recusado e aceito, terceiros respondidos localmente. A política **aplicada** teve 0 violações nesses mesmos carregamentos (o teste falha se houver alguma).',
    '',
    'Só aparece o que **executou** durante o carregamento: manipuladores `onclick`/`onchange` não disparados não entram aqui (veja as contagens em `csp-inventario.md`).',
    '',
    '## Por diretiva',
    '',
    '| Diretiva | Ocorrências |',
    '|---|---|',
    ...Object.entries(byDirective).sort((a, b) => b[1] - a[1]).map(([d, n]) => `| \`${d}\` | ${n} |`),
    '',
    '## Detalhe',
    '',
    '| Diretiva | Bloqueado | Amostra | Páginas | Cenários | Ocorrências |',
    '|---|---|---|---|---|---|',
    ...rows.map((g) => `| \`${g.directive}\` | ${g.blocked} | \`${(g.sample || '—').replace(/\s+/g, ' ').replace(/\|/g, '\\|').replace(/`/g, "'")}\` | ${[...g.pages].join(', ')} | ${[...g.scenarios].sort().join(', ')} | ${g.count} |`),
    ''
  ];
  fs.mkdirSync(path.join(ROOT, 'docs', 'security'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs', 'security', 'csp-violacoes.md'), lines.join('\n'));
});
