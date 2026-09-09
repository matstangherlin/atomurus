#!/usr/bin/env node
/**
 * Emit shared public/tool chrome into HTML so public-workspace.js does not
 * have to rebuild the layout. Idempotent. Skips /app, propostas/, dev/, docs/.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TPL = path.join(ROOT, 'templates', 'chrome');
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase',
  'hanzi-logic', 'propostas', 'dev', 'docs', 'templates'
]);
const SKIP_FILES = new Set(['app.html']);

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr'
]);

function readTpl(name) {
  return fs.readFileSync(path.join(TPL, name), 'utf8').trim();
}

function fill(tpl, prefix) {
  return tpl.replace(/\{\{prefix\}\}/g, prefix);
}

function prefixFor(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const dir = path.dirname(rel);
  if (dir === '.') return '';
  return dir.split('/').filter(Boolean).map(() => '..').join('/') + '/';
}

function findBalancedFrom(html, start) {
  const openMatch = html.slice(start).match(/^<([a-zA-Z][\w:-]*)([^>]*)>/);
  if (!openMatch) return null;
  const tag = openMatch[1];
  const openLen = openMatch[0].length;
  const lower = tag.toLowerCase();
  if (VOID.has(lower) || /\/\s*$/.test(openMatch[0])) {
    return { start, end: start + openLen, html: html.slice(start, start + openLen), tag: lower };
  }
  let i = start + openLen;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const lt = html.indexOf('<', i);
    if (lt === -1) return null;
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    const rest = html.slice(lt);
    if (/^<!\[CDATA\[/i.test(rest)) {
      const end = html.indexOf(']]>', lt + 9);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    if (lower !== 'script' && /^<script\b/i.test(rest)) {
      const close = html.slice(lt).search(/<\/script\s*>/i);
      if (close === -1) return null;
      i = lt + close + html.slice(lt + close).match(/^<\/script\s*>/i)[0].length;
      continue;
    }
    if (lower !== 'style' && /^<style\b/i.test(rest)) {
      const close = html.slice(lt).search(/<\/style\s*>/i);
      if (close === -1) return null;
      i = lt + close + html.slice(lt + close).match(/^<\/style\s*>/i)[0].length;
      continue;
    }
    const close = rest.match(new RegExp(`^</${tag}\\s*>`, 'i'));
    if (close) {
      depth -= 1;
      i = lt + close[0].length;
      if (depth === 0) {
        return { start, end: i, html: html.slice(start, i), tag: lower };
      }
      continue;
    }
    const nested = rest.match(new RegExp(`^<${tag}\\b[^>]*>`, 'i'));
    if (nested) {
      if (!VOID.has(lower) && !/\/\s*>$/.test(nested[0])) depth += 1;
      i = lt + nested[0].length;
      continue;
    }
    i = lt + 1;
  }
  return null;
}

function classList(attrString) {
  const m = attrString.match(/\bclass=["']([^"']*)["']/i);
  return m ? m[1].trim().split(/\s+/).filter(Boolean) : [];
}

function findElementWithClass(html, className, from) {
  const re = /<([a-zA-Z][\w:-]*)(\s[^>]*?)?>/g;
  re.lastIndex = from || 0;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1];
    if (tag.startsWith('!') || tag.toLowerCase() === 'script' || tag.toLowerCase() === 'style') continue;
    if (!classList(m[2] || '').includes(className)) continue;
    const found = findBalancedFrom(html, m.index);
    if (found) return found;
  }
  return null;
}

function addClass(openHtml, name) {
  if (new RegExp(`\\bclass=["'][^"']*\\b${name}\\b`).test(openHtml)) return openHtml;
  if (/\bclass=["']/.test(openHtml)) {
    return openHtml.replace(/\bclass=["']/, `class="${name} `);
  }
  return openHtml.replace(/>$/, ` class="${name}">`);
}

function addBodyClass(html, name) {
  return html.replace(/<body([^>]*)>/i, (full, attrs) => {
    if (new RegExp(`\\b${name}\\b`).test(attrs)) return full;
    if (/\bclass=["']/.test(attrs)) {
      return `<body${attrs.replace(/\bclass=["']/, `class="${name} `)}>`;
    }
    return `<body class="${name}"${attrs}>`;
  });
}

function splitTrailingScripts(inner) {
  let rest = inner;
  let trailing = '';
  const endScript = /<script\b[\s\S]*?<\/script>\s*$/i;
  while (endScript.test(rest)) {
    const m = rest.match(/(<script\b[\s\S]*?<\/script>)(\s*)$/i);
    if (!m) break;
    trailing = m[1] + m[2] + trailing;
    rest = rest.slice(0, rest.length - m[1].length - m[2].length);
  }
  return { rest, trailing };
}

function retagLogo(html) {
  return html.replace(
    /<div class="logo-tag"[^>]*>\s*v?[\d.]+<\/div>/g,
    '<div class="logo-tag" data-i18n="common.brandTag">chemistry lab</div>'
  );
}

function hideBreadcrumb(topbarHtml) {
  return topbarHtml.replace(
    /<(div|nav|ol|ul)\b([^>]*\bclass=["'][^"']*\bbreadcrumb\b[^"']*["'][^>]*)>/i,
    (full, tag, attrs) => {
      if (/\bhidden\b/.test(attrs)) return full;
      return `<${tag}${attrs} hidden>`;
    }
  );
}

function insertBeforeActions(topbarHtml, snippet) {
  const markers = ['theme-btn', 'lc-topnav-btn', 'lc-topnav-spacer', 'share-host-compact'];
  let best = null;
  for (const cls of markers) {
    const el = findElementWithClass(topbarHtml, cls);
    if (el && (best === null || el.start < best.start)) best = el;
  }
  const close = topbarHtml.lastIndexOf('</');
  if (best) {
    return topbarHtml.slice(0, best.start) + snippet + '\n    ' + topbarHtml.slice(best.start);
  }
  if (close === -1) return topbarHtml + snippet;
  return topbarHtml.slice(0, close) + snippet + '\n  ' + topbarHtml.slice(close);
}

function ensureSearch(barHtml, prefix) {
  if (/\b(search-box|lc-topnav-search|ps-search)\b/.test(barHtml)) return barHtml;
  return insertBeforeActions(barHtml, fill(readTpl('search.html'), prefix));
}

function hasAppHref(html) {
  return /href=["'](?:\/app(?:\.html)?(?:\?[^"']*)?|[^"']*app\.html)["']/.test(html);
}

function ensureStudy(asideHtml) {
  if (hasAppHref(asideHtml)) return asideHtml;
  const study = readTpl('study-nav-item.html');
  const re = /<a\b[^>]*\bclass=["'][^"']*\bnav-item\b[^"']*["'][^>]*href=["'][^"']*explore[^"']*["'][^>]*>[\s\S]*?<\/a>/gi;
  let last = null;
  let m;
  while ((m = re.exec(asideHtml))) last = m;
  if (last) {
    const idx = last.index + last[0].length;
    return asideHtml.slice(0, idx) + '\n      ' + study + asideHtml.slice(idx);
  }
  const section = findElementWithClass(asideHtml, 'nav-section');
  if (!section) return asideHtml;
  const close = section.html.lastIndexOf('</div>');
  if (close === -1) return asideHtml;
  const nextSection = asideHtml.slice(0, section.start) +
    section.html.slice(0, close) + '      ' + study + '\n    ' + section.html.slice(close) +
    asideHtml.slice(section.end);
  return nextSection;
}

function ensureFoot(asideHtml, prefix) {
  const foot = findElementWithClass(asideHtml, 'sidebar-foot');
  if (!foot) return asideHtml;
  let inner = foot.html;
  if (!/href=["'][^"']*login/i.test(inner)) {
    inner = inner.replace(
      /(<div\b[^>]*\bsidebar-foot\b[^>]*>)/i,
      `$1\n    ${fill(readTpl('login-nav-item.html'), prefix)}`
    );
  }
  if (!/href=["'][^"']*pricing/i.test(inner)) {
    inner = inner.replace(
      /<\/div>\s*$/i,
      `    ${fill(readTpl('pricing-nav-item.html'), prefix)}\n  </div>`
    );
  }
  return asideHtml.slice(0, foot.start) + inner + asideHtml.slice(foot.end);
}

function moveLogoIntoTopbar(asideHtml, topbarHtml) {
  if (/\blogo-wrap\b/.test(topbarHtml)) {
    return { asideHtml: retagLogo(asideHtml), topbarHtml: retagLogo(topbarHtml) };
  }
  const logo = findElementWithClass(asideHtml, 'logo-wrap');
  if (!logo) return { asideHtml: retagLogo(asideHtml), topbarHtml };
  let logoHtml = logo.html;
  const openEnd = logoHtml.indexOf('>') + 1;
  logoHtml = addClass(logoHtml.slice(0, openEnd), 'ps-brand') + logoHtml.slice(openEnd);
  logoHtml = retagLogo(logoHtml);
  asideHtml = asideHtml.slice(0, logo.start) + asideHtml.slice(logo.end);
  const innerStart = topbarHtml.indexOf('>') + 1;
  topbarHtml = topbarHtml.slice(0, innerStart) + '\n    ' + logoHtml + topbarHtml.slice(innerStart);
  return { asideHtml, topbarHtml };
}

function normalizeLandingCta(navHtml, basename, prefix) {
  if (/^login(\.pt)?\.html$/i.test(basename)) return navHtml;
  if (/^404(\.pt)?\.html$/i.test(basename)) return navHtml;
  const cta = findElementWithClass(navHtml, 'lc-topnav-cta');
  if (!cta) return navHtml;
  if (/href=["'][^"']*(login|signup|account)/i.test(cta.html)) return navHtml;
  let next = cta.html;
  next = next.replace(/href=["'][^"']*["']/, `href="${prefix}login.html"`);
  if (/\baria-label=/.test(next)) {
    next = next.replace(/\baria-label=["'][^"']*["']/, 'aria-label="Account"');
  } else {
    next = next.replace(/<a\b/, '<a aria-label="Account"');
  }
  next = next.replace(/\sdata-i18n-attr=["'][^"']*["']/, '');
  if (/<span\b/i.test(next)) {
    next = next.replace(
      /<span\b[^>]*>[\s\S]*?<\/span>/,
      '<span data-i18n="pricing.ctaAccount">Account</span>'
    );
  } else {
    next = next.replace(
      /(>)([\s\S]*?)(<svg\b|<\/a>)/i,
      '$1<span data-i18n="pricing.ctaAccount">Account</span>$3'
    );
  }
  return navHtml.slice(0, cta.start) + next + navHtml.slice(cta.end);
}

function injectLanding(html, file) {
  const bodyOpen = html.match(/<body[^>]*>/i);
  if (!bodyOpen) return null;
  const bodyStart = html.search(/<body[^>]*>/i) + bodyOpen[0].length;
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyEnd === -1) return null;
  const inner = html.slice(bodyStart, bodyEnd);
  const { rest, trailing } = splitTrailingScripts(inner);
  const nav = findElementWithClass(rest, 'lc-topnav');
  if (!nav || nav.tag !== 'nav') return null;
  const prefix = prefixFor(file);
  const basename = path.basename(file);
  let navHtml = ensureSearch(nav.html, prefix);
  navHtml = normalizeLandingCta(navHtml, basename, prefix);
  const sidebar = fill(readTpl('public-sidebar.html'), prefix);
  const before = rest.slice(0, nav.start);
  const after = rest.slice(nav.end);
  const wrapped =
    before +
    '<div class="ps-shell" id="ps-shell">\n' +
    navHtml + '\n' +
    sidebar + '\n' +
    '<main class="ps-main" id="ps-main">\n' +
    after +
    '</main>\n</div>\n' +
    trailing;
  return addBodyClass(html.slice(0, bodyStart) + wrapped + html.slice(bodyEnd), 'ps-body');
}

function injectTool(html, file) {
  const aside = findElementWithClass(html, 'sidebar');
  const main = findElementWithClass(html, 'main');
  if (!aside || aside.tag !== 'aside') return null;
  if (!main || main.tag !== 'main') return null;
  const topbar = findElementWithClass(main.html, 'topbar');
  if (!topbar) return null;
  const prefix = prefixFor(file);
  const overlay = findElementWithClass(html, 'mobile-overlay');
  const rangeStart = Math.min(aside.start, main.start);
  const rangeEnd = Math.max(aside.end, main.end);
  const overlayInRange = overlay && overlay.start >= rangeStart && overlay.end <= rangeEnd;

  let asideHtml = aside.html;
  let topbarHtml = topbar.html;
  const moved = moveLogoIntoTopbar(asideHtml, topbarHtml);
  asideHtml = moved.asideHtml;
  topbarHtml = hideBreadcrumb(moved.topbarHtml);
  topbarHtml = ensureSearch(topbarHtml, prefix);
  asideHtml = ensureStudy(asideHtml);
  asideHtml = ensureFoot(asideHtml, prefix);

  const mainWithout = main.html.slice(0, topbar.start) + main.html.slice(topbar.end);
  const start = rangeStart;
  const end = rangeEnd;
  const overlayHtml = overlayInRange ? overlay.html + '\n' : '';
  const wrapped =
    '<div class="ps-shell" id="ps-shell">\n' +
    topbarHtml + '\n' +
    overlayHtml +
    asideHtml + '\n' +
    mainWithout + '\n' +
    '</div>';
  return addBodyClass(html.slice(0, start) + wrapped + html.slice(end), 'ps-body');
}

function injectHtml(html, file) {
  if (/id=["']ps-shell["']/.test(html)) return { html, status: 'exists' };
  if (/\bws-body\b/.test(html) || path.basename(file) === 'app.html') {
    return { html, status: 'skip-app' };
  }
  if (!/public-workspace\.js|public-shell\.css/.test(html)) {
    return { html, status: 'skip-no-shell' };
  }
  const aside = findElementWithClass(html, 'sidebar');
  const main = findElementWithClass(html, 'main');
  if (aside && aside.tag === 'aside' && main && main.tag === 'main') {
    const next = injectTool(html, file);
    if (next) return { html: next, status: 'tool' };
    return { html, status: 'skip-tool-incomplete' };
  }
  const nav = findElementWithClass(html, 'lc-topnav');
  if (nav && nav.tag === 'nav') {
    const next = injectLanding(html, file);
    if (next) return { html: next, status: 'landing' };
    return { html, status: 'skip-landing-incomplete' };
  }
  return { html, status: 'skip-no-pattern' };
}

function walkDir(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkDir(full, out);
    } else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function injectFile(file) {
  if (SKIP_FILES.has(path.basename(file))) return { status: 'skip-app', changed: false };
  const original = fs.readFileSync(file, 'utf8');
  const result = injectHtml(original, file);
  if (result.html !== original) {
    fs.writeFileSync(file, result.html);
    return { status: result.status, changed: true };
  }
  return { status: result.status, changed: false };
}

module.exports = {
  injectHtml,
  injectFile,
  prefixFor,
  SKIP_DIRS,
  SKIP_FILES
};

if (require.main === module) {
  const files = walkDir(ROOT, []);
  const counts = {};
  let changed = 0;
  for (const file of files) {
    if (SKIP_FILES.has(path.basename(file))) {
      counts['skip-app'] = (counts['skip-app'] || 0) + 1;
      continue;
    }
    const result = injectFile(file);
    counts[result.status] = (counts[result.status] || 0) + 1;
    if (result.changed) changed += 1;
  }
  console.log(`ui chrome injected on ${changed} / ${files.length} HTML files.`);
  Object.keys(counts).sort().forEach((k) => console.log(`  ${k}: ${counts[k]}`));
}
