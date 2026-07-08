// ───────────────────────────────────────────────────────────────────
// Atomurus — one-time migration + repair: data-i18n on element pages
// ───────────────────────────────────────────────────────────────────
// The 122 /periodic-table/<latin>.html pages were authored with sidebar,
// breadcrumb, nav buttons, and statusbar labels hardcoded — a mix of EN
// ("Home", "Calculators") and PT ("Visualizador", "Moléculas") with NO
// `data-i18n` attributes. i18n.js can't translate them, so PT users see
// EN labels and EN users see PT labels.
//
// This script:
//   1. Repairs any prior broken migration (literal $1/$2 left behind
//      from the buggy first run that wrapped a function around
//      String.prototype.replace — function-mode doesn't expand $1/$2).
//   2. Adds the missing `data-i18n` attributes idempotently.
//
// Safe to re-run: every transform skips already-migrated markup.
// Pages excluded: heatmap/trends/compare/isotopes (different markup,
// already use data-i18n properly).
// ───────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIR  = path.join(ROOT, 'periodic-table');
const EXCLUDE = new Set([
  'heatmap.html', 'trends.html', 'compare.html', 'isotopes.html',
]);

// Constant SVG content originally inside the Table nav anchor — the
// first migration replaced it with a literal "$1" by accident, so we
// need to restore it verbatim.
const TABLE_SVG =
  '<svg width="13" height="13" viewBox="0 0 13 13" fill="none">' +
  '<rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="currentColor" opacity=".9"/>' +
  '<rect x="7.5" y="1" width="4.5" height="4.5" rx="1" fill="currentColor" opacity=".5"/>' +
  '<rect x="1" y="7.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity=".5"/>' +
  '<rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity=".3"/>' +
  '</svg>';

// String.prototype.replace honors $1/$2 in the replacement when called
// with a string. We use this (not a function callback) to avoid the bug
// from the first version of this script.
function applyReplace(html, pattern, replacement) {
  const m = html.match(pattern);
  const n = m ? m.length : 0;
  if (n === 0) return { html, applied: 0 };
  return { html: html.replace(pattern, replacement), applied: n };
}

function getPageZ(html) {
  const m = html.match(/window\.PAGE_Z\s*=\s*(\d+)\s*;/);
  return m ? parseInt(m[1], 10) : null;
}

// ── Repair: undo damage from the first run ─────────────────────────
function repairFile(html, pageZ) {
  const counts = {};
  let r;

  // 1. card:massLabel — restore the opening <div class="lc-el-card-mass">
  // that was consumed by the broken $1.
  r = applyReplace(
    html,
    /\$1<span data-i18n="el\.massLabel">mass<\/span>/g,
    '<div class="lc-el-card-mass">\n          <span data-i18n="el.massLabel">mass</span>'
  );
  html = r.html; counts.massLabel = r.applied;

  // 2. nav:table — restore the SVG (was $1) and the closing </a> (was $2).
  r = applyReplace(
    html,
    /        \$1\n        <span data-i18n="el\.bcTable">Table<\/span>\n      \$2/g,
    '        ' + TABLE_SVG + '\n        <span data-i18n="el.bcTable">Table</span>\n      </a>'
  );
  html = r.html; counts.tableBtn = r.applied;

  // 3. nav:next — `$1` should be the dynamic "· Z (Z+1) →" suffix.
  if (pageZ != null) {
    const suffix = pageZ < 118 ? `· Z ${pageZ + 1} →` : '→';
    r = applyReplace(
      html,
      /<span class="dir"><span data-i18n="el\.navNext">Next<\/span> \$1<\/span>/g,
      `<span class="dir"><span data-i18n="el.navNext">Next</span> ${suffix}</span>`
    );
    html = r.html; counts.navNext = r.applied;
  }

  // 4. status:ready — $1 should be the `<span class="lc-st-dot"></span>`.
  r = applyReplace(
    html,
    /<span>\$1 <span data-i18n="el\.statusReady">ready<\/span>/g,
    '<span><span class="lc-st-dot"></span> <span data-i18n="el.statusReady">ready</span>'
  );
  html = r.html; counts.statusReady = r.applied;

  return { html, counts };
}

// ── Migration: add data-i18n where still missing ───────────────────
function migrateFile(html, pageZ) {
  const counts = {};
  let r;

  // Sidebar (9 items) — unique text matches, the same labels don't
  // appear bare anywhere else on the element page.
  const sidebarMap = [
    ['Home',             'common.nav.home'],
    ['Laboratory',       'common.nav.laboratory'],
    ['Visualizador',     'common.nav.visualizador'],
    ['Modelos Atômicos', 'common.nav.atomicModels'],
    ['Moléculas',        'common.nav.molecules'],
    ['Alótropos',        'common.nav.allotropes'],
    ['Calculators',      'common.nav.calc'],
    ['Settings',         'common.nav.settings'],
  ];
  let sidebarTotal = 0;
  for (const [text, key] of sidebarMap) {
    // Escape regex special chars in the text (only `.` here)
    const esc = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    r = applyReplace(html, new RegExp(`<span>${esc}<\\/span>`, 'g'),
      `<span data-i18n="${key}">${text}</span>`);
    html = r.html; sidebarTotal += r.applied;
  }
  counts.sidebar = sidebarTotal;

  // Sidebar "Periodic Table" — distinguish from breadcrumb by the closing
  // </svg> immediately before the span.
  r = applyReplace(
    html,
    /<\/svg><span>Periodic Table<\/span><\/a>/g,
    '</svg><span data-i18n="common.nav.periodic">Periodic Table</span></a>'
  );
  html = r.html; counts.sidebarPeriodic = r.applied;

  // Breadcrumb Workspace
  r = applyReplace(
    html,
    /<a href="\.\.\/index\.html" style="color:inherit;text-decoration:none">Workspace<\/a>/g,
    '<a href="../index.html" style="color:inherit;text-decoration:none" data-i18n="el.bcWorkspace">Workspace</a>'
  );
  html = r.html; counts.bcWorkspace = r.applied;

  // Breadcrumb Periodic Table
  r = applyReplace(
    html,
    /<a href="\.\.\/periodic-table\.html" style="color:inherit;text-decoration:none">Periodic Table<\/a>/g,
    '<a href="../periodic-table.html" style="color:inherit;text-decoration:none" data-i18n="el.backToTable">Periodic Table</a>'
  );
  html = r.html; counts.bcPeriodic = r.applied;

  // Card mass label — only matches the pristine (un-touched) source.
  r = applyReplace(
    html,
    /(<div class="lc-el-card-mass">\s*)<span>mass<\/span>/g,
    '$1<span data-i18n="el.massLabel">mass</span>'
  );
  html = r.html; counts.massLabel = r.applied;

  // Nav Prev — disabled case (Z=1): `<span class="dir">← Prev</span>`
  r = applyReplace(
    html,
    /<span class="dir">← Prev<\/span>/g,
    '<span class="dir" data-i18n="el.navPrev">← Prev</span>'
  );
  html = r.html; counts.navPrevDisabled = r.applied;

  // Nav Prev — active case (Z=2-118): `<span class="dir">← Prev · Z N</span>`
  // Wrap "← Prev" so the dynamic "· Z N" stays as-is.
  r = applyReplace(
    html,
    /<span class="dir">← Prev (· Z \d+)<\/span>/g,
    '<span class="dir"><span data-i18n="el.navPrev">← Prev</span> $1</span>'
  );
  html = r.html; counts.navPrevActive = r.applied;

  // Nav Table button — `Table` text between SVG and </a>
  r = applyReplace(
    html,
    /(<svg width="13" height="13"[^<]*<rect[^>]*\/><rect[^>]*\/><rect[^>]*\/><rect[^>]*\/><\/svg>)\s+Table\s+(<\/a>)/g,
    '$1\n        <span data-i18n="el.bcTable">Table</span>\n      $2'
  );
  html = r.html; counts.navTable = r.applied;

  // Nav Next — active (Z=1-117): `<span class="dir">Next · Z N →</span>`
  r = applyReplace(
    html,
    /<span class="dir">Next (· Z \d+ →)<\/span>/g,
    '<span class="dir"><span data-i18n="el.navNext">Next</span> $1</span>'
  );
  html = r.html; counts.navNextActive = r.applied;

  // Nav Next — disabled (Z=118): `<span class="dir">Next →</span>`
  r = applyReplace(
    html,
    /<span class="dir">Next →<\/span>/g,
    '<span class="dir"><span data-i18n="el.navNext">Next</span> →</span>'
  );
  html = r.html; counts.navNextDisabled = r.applied;

  // Statusbar — `<span><span class="lc-st-dot"></span> ready</span>`
  r = applyReplace(
    html,
    /(<span class="lc-st-dot"><\/span>) ready<\/span>/g,
    '$1 <span data-i18n="el.statusReady">ready</span></span>'
  );
  html = r.html; counts.statusReady = r.applied;

  // Statusbar → table
  r = applyReplace(
    html,
    /<a href="\.\.\/periodic-table\.html">→ table<\/a>/g,
    '<a href="../periodic-table.html" data-i18n="el.statusToTable">→ table</a>'
  );
  html = r.html; counts.statusToTable = r.applied;

  // Statusbar → visualizer
  r = applyReplace(
    html,
    /<a href="\.\.\/viewer\/atomic-models\.html">→ visualizer<\/a>/g,
    '<a href="../viewer/atomic-models.html" data-i18n="el.statusToVisualizer">→ visualizer</a>'
  );
  html = r.html; counts.statusToVisualizer = r.applied;

  return { html, counts };
}

function listElementPages() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter(f => f.endsWith('.html') &&
                 !f.endsWith('.en.html') &&
                 !f.endsWith('.pt.html') &&
                 !EXCLUDE.has(f))
    .map(f => path.join(DIR, f));
}

function main() {
  const files = listElementPages();
  console.log(`Processing ${files.length} element pages…`);

  const repairTotals = {};
  const migrateTotals = {};

  let touched = 0;
  for (const f of files) {
    const original = fs.readFileSync(f, 'utf8');
    const pageZ = getPageZ(original);
    let html = original;

    const rep = repairFile(html, pageZ);
    html = rep.html;
    for (const k in rep.counts) repairTotals[k] = (repairTotals[k] || 0) + rep.counts[k];

    const mig = migrateFile(html, pageZ);
    html = mig.html;
    for (const k in mig.counts) migrateTotals[k] = (migrateTotals[k] || 0) + mig.counts[k];

    if (html !== original) {
      fs.writeFileSync(f, html, 'utf8');
      touched++;
    }
  }

  console.log(`Files modified: ${touched}/${files.length}`);
  console.log('Repair edits:');
  for (const k of Object.keys(repairTotals)) {
    console.log(`  ${k.padEnd(22)} ${String(repairTotals[k]).padStart(4)}`);
  }
  console.log('Migration edits:');
  for (const k of Object.keys(migrateTotals)) {
    console.log(`  ${k.padEnd(22)} ${String(migrateTotals[k]).padStart(4)}`);
  }
}

main();
