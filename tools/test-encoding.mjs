#!/usr/bin/env node
// Fails when public pages or element content still contain CP850/UTF-8 mojibake.
// The only allowlisted hit is the runtime guard in periodic-table.js.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reverseCp850Line } from './fix-element-content-encoding.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PATTERN = /├|Ô[ÇÉ]|â€|âœ|Ã[\u0080-\u00BF\u00A1-\u00FF]/;
const GUARD = "s !== '\u00E2\u20AC\u201D'";
const SKIP_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.map']);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function isAllowlisted(rel, line) {
  if (rel !== 'periodic-table.js') return false;
  return line.includes(GUARD) && !/├|Ô[ÇÉ]|âœ|Ã[\u0080-\u00BF\u00A1-\u00FF]/.test(line);
}

export function mojibakeHits(rel, text) {
  const hits = [];
  const lines = text.split(/\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isAllowlisted(rel, line)) continue;
    const match = line.match(PATTERN);
    if (!match) continue;
    const at = match.index;
    const excerpt = line.slice(Math.max(0, at - 24), Math.min(line.length, at + 24)).replace(/\s+/g, ' ');
    hits.push({ file: rel, line: i + 1, excerpt });
  }
  return hits;
}

function addTree(relDir, acc) {
  const full = path.join(ROOT, relDir);
  for (const name of readdirSync(full)) {
    const rel = path.join(relDir, name).split(path.sep).join('/');
    const abs = path.join(ROOT, rel);
    const st = statSync(abs);
    if (st.isDirectory()) addTree(rel, acc);
    else if (!SKIP_EXT.has(path.extname(name).toLowerCase())) acc.push(rel);
  }
}

function filesToScan() {
  const files = [];
  for (const name of readdirSync(ROOT)) {
    if (name.endsWith('.html')) files.push(name);
  }
  files.push('periodic-table.js', 'tools/element-content-source.js');
  for (const name of readdirSync(path.join(ROOT, 'assets/element-content'))) {
    if (name.endsWith('.js')) files.push(`assets/element-content/${name}`);
  }
  for (const dir of ['periodic-table', 'explore', 'viewer', 'isomerism']) addTree(dir, files);
  return files;
}

function assertConverter() {
  const oxygen = reverseCp850Line('Oxig\u251C\u00ACnio');
  if (!oxygen.ok || oxygen.text !== 'Oxig\u00EAnio') fail(`CP850: expected Oxigênio, got ${oxygen.text}`);
  if (oxygen.text && oxygen.text.includes('Ã©')) fail('CP850: reversed Oxigênio still contains Ã©');
  const clean = reverseCp850Line('\u00E9');
  if (clean.ok) fail('CP850: a clean é must not decode as UTF-8 via CP850');
  if ('\u00E9'.includes('Ã©')) fail('a clean é must not contain Ã©');
}

function assertScannerCases() {
  if (mojibakeHits('clean.html', '<p>Oxigênio — título limpo</p>').length !== 0) {
    fail('scanner: clean text should pass');
  }
  const bad = mojibakeHits('chunk.js', 'valor ├® quebrado');
  if (bad.length !== 1 || bad[0].line !== 1) fail('scanner: ├® should fail');
  const guard = `  return !!s && s !== '\\u2014' && s !== '&mdash;' && ${GUARD};`;
  if (mojibakeHits('periodic-table.js', guard).length !== 0) fail('scanner: periodic-table.js guard should be allowlisted');
  if (mojibakeHits('other.js', guard).length !== 1) fail('scanner: the guard is allowlisted only in periodic-table.js');
}

function scanRepo() {
  const hits = [];
  for (const rel of filesToScan()) {
    let text;
    try {
      text = readFileSync(path.join(ROOT, rel), 'utf8');
    } catch {
      continue;
    }
    hits.push(...mojibakeHits(rel, text));
  }
  return hits;
}

assertConverter();
assertScannerCases();
const hits = scanRepo();
if (hits.length) {
  for (const hit of hits.slice(0, 30)) {
    console.error(`${hit.file}:${hit.line}:${hit.excerpt}`);
  }
  if (hits.length > 30) console.error(`… e mais ${hits.length - 30}`);
  fail(`${hits.length} ocorrência(s) de mojibake`);
}
if (!process.exitCode) console.log('encoding ok');
process.exit(process.exitCode || 0);
