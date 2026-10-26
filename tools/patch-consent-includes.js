#!/usr/bin/env node
// Idempotent HTML patch for consent.js, deferred ads-gate.js, and the
// Manage cookies control. Usage: node tools/patch-consent-includes.js includes|manage
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const mode = process.argv[2];
if (mode !== 'includes' && mode !== 'manage') {
  console.error('Usage: node tools/patch-consent-includes.js includes|manage');
  process.exit(1);
}

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

function portuguese(file, html) {
  if (file.endsWith('.pt.html')) return true;
  if (file.endsWith('.en.html')) return false;
  return /<html[^>]*lang="pt/i.test(html);
}

function withDefer(tag) {
  if (/\sdefer(\s|>)/.test(tag)) return tag;
  return tag.replace('<script', '<script defer');
}

function hasConsentScript(html) {
  return /src="(?:(?:\.\.\/)+)?consent\.js/.test(html);
}

function patchIncludes(html) {
  if (hasConsentScript(html)) {
    return html.replace(/<script(?![^>]*\sdefer)([^>]*src="[^"]*ads-gate\.js[^"]*"[^>]*)>/g, '<script defer$1>');
  }
  const gate = html.match(/<script[^>]*src="([^"]*?)ads-gate\.js(\?[^"]*)?"[^>]*>/);
  if (gate) {
    const prefix = gate[1];
    const version = gate[2] || '';
    const consent = `<script src="${prefix}consent.js${version}" defer></script>\n`;
    const deferred = withDefer(gate[0]);
    return html.replace(gate[0], consent + deferred);
  }
  const cookie = html.match(/<script[^>]*src="([^"]*?)cookie-consent\.js(\?[^"]*)?"[^>]*>/);
  if (!cookie) return html;
  const prefix = cookie[1];
  const version = cookie[2] || '';
  const consent = `<script src="${prefix}consent.js${version}" defer></script>\n`;
  return html.replace(cookie[0], consent + cookie[0]);
}

function manageButton(file, html) {
  const label = portuguese(file, html) ? 'Gerenciar cookies' : 'Manage cookies';
  return `<button type="button" class="aco-manage-cookies" data-consent-manage data-i18n="common.consent.manage">${label}</button>`;
}

function patchManage(file, html) {
  if (!html.includes('cookie-consent.js') && !html.includes('ads-gate.js') && !html.includes('data-consent-manage')) return html;
  const button = manageButton(file, html);
  let next = html.replace(/(<div class="lc-statusbar">)<button type="button" class="aco-manage-cookies" data-consent-manage data-i18n="common\.consent\.manage">[^<]*<\/button>/, '$1');
  if (next.includes('data-consent-manage')) return next;
  if (next.includes('class="lc-footer-bottom"')) {
    return next.replace('class="lc-footer-bottom">', `class="lc-footer-bottom">${button}`);
  }
  if (next.includes('class="lc-el-nav"')) {
    return next.replace('class="lc-el-nav">', `class="lc-el-nav">${button}`);
  }
  return next.replace('</body>', `<p class="aco-manage-wrap">${button}</p>\n</body>`);
}

const files = walk(ROOT, []);
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = mode === 'includes' ? patchIncludes(before) : patchManage(file, before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
  }
}
console.log(`${mode}: ${changed} html files updated`);
