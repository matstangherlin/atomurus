#!/usr/bin/env node
/**
 * Idempotent markup patch for the element modal (#overlay / #modal) on the
 * periodic table pages (prompt 23):
 *   - the closed overlay starts with aria-hidden="true" and inert, so its
 *     content is neither read nor reachable with Tab; periodic-table.js
 *     removes both on open and puts them back on close;
 *   - the dialog gets an aria-label fallback (ptable.mDialogAria) for the
 *     moments #m-nm is still empty.
 *
 *   node tools/patch-a11y-modal.js            → dry run: lists what would change
 *   node tools/patch-a11y-modal.js --apply    → writes the files
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = [
  'periodic-table.html', 'periodic-table.pt.html',
  'periodic-table/trends.html', 'periodic-table/trends.pt.html',
  'periodic-table/compare.html', 'periodic-table/compare.pt.html',
  'periodic-table/heatmap.html', 'periodic-table/heatmap.pt.html',
  'periodic-table/isotopes.html', 'periodic-table/isotopes.pt.html'
];
const DIALOG_NAME = { en: 'Element details', pt: 'Detalhes do elemento' };

function patchModal(html, lang) {
  let out = html.replace(/<div class="overlay" id="overlay"([^>]*)>/, (tag, rest) => {
    let next = rest;
    if (!/\saria-hidden=/.test(next)) next += ' aria-hidden="true"';
    if (!/\sinert\b/.test(next)) next += ' inert';
    return `<div class="overlay" id="overlay"${next}>`;
  });
  out = out.replace(/<div class="modal" id="modal"([^>]*)>/, (tag, rest) => {
    if (/\saria-label=/.test(rest)) return tag;
    return `<div class="modal" id="modal"${rest} aria-label="${DIALOG_NAME[lang]}" data-i18n-attr="aria-label:ptable.mDialogAria">`;
  });
  return out;
}

function run(apply) {
  const changed = [];
  for (const rel of PAGES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    const out = patchModal(src, rel.endsWith('.pt.html') ? 'pt' : 'en');
    if (out === src) continue;
    changed.push(rel);
    if (apply) fs.writeFileSync(file, out);
  }
  return changed;
}

module.exports = { patchModal, PAGES, DIALOG_NAME };

if (require.main === module) {
  const apply = process.argv.includes('--apply');
  const changed = run(apply);
  const verb = apply ? 'patched' : 'would patch (dry run; pass --apply to write)';
  console.log(`patch-a11y-modal: ${verb} ${changed.length} / ${PAGES.length} pages`);
  changed.forEach((rel) => console.log('  ' + rel));
}
