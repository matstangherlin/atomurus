#!/usr/bin/env node
// One-shot repair for tools/element-content-source.js.
// The file was UTF-8 read as CP850 and saved as UTF-8 again. Each corrupted
// line is turned back with encode(CP850) + decode(UTF-8). Clean lines stay
// byte-for-byte. The leading BOM is dropped: build-element-content-chunks.js
// reads the file as UTF-8 and runs it in vm, which does not need a BOM.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'element-content-source.js');

// Byte -> Unicode, Python codecs 'cp850' / Unicode CP850.
const CP850 = [
  0x0000, 0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x000A, 0x000B, 0x000C, 0x000D, 0x000E, 0x000F,
  0x0010, 0x0011, 0x0012, 0x0013, 0x0014, 0x0015, 0x0016, 0x0017, 0x0018, 0x0019, 0x001A, 0x001B, 0x001C, 0x001D, 0x001E, 0x001F,
  0x0020, 0x0021, 0x0022, 0x0023, 0x0024, 0x0025, 0x0026, 0x0027, 0x0028, 0x0029, 0x002A, 0x002B, 0x002C, 0x002D, 0x002E, 0x002F,
  0x0030, 0x0031, 0x0032, 0x0033, 0x0034, 0x0035, 0x0036, 0x0037, 0x0038, 0x0039, 0x003A, 0x003B, 0x003C, 0x003D, 0x003E, 0x003F,
  0x0040, 0x0041, 0x0042, 0x0043, 0x0044, 0x0045, 0x0046, 0x0047, 0x0048, 0x0049, 0x004A, 0x004B, 0x004C, 0x004D, 0x004E, 0x004F,
  0x0050, 0x0051, 0x0052, 0x0053, 0x0054, 0x0055, 0x0056, 0x0057, 0x0058, 0x0059, 0x005A, 0x005B, 0x005C, 0x005D, 0x005E, 0x005F,
  0x0060, 0x0061, 0x0062, 0x0063, 0x0064, 0x0065, 0x0066, 0x0067, 0x0068, 0x0069, 0x006A, 0x006B, 0x006C, 0x006D, 0x006E, 0x006F,
  0x0070, 0x0071, 0x0072, 0x0073, 0x0074, 0x0075, 0x0076, 0x0077, 0x0078, 0x0079, 0x007A, 0x007B, 0x007C, 0x007D, 0x007E, 0x007F,
  0x00C7, 0x00FC, 0x00E9, 0x00E2, 0x00E4, 0x00E0, 0x00E5, 0x00E7, 0x00EA, 0x00EB, 0x00E8, 0x00EF, 0x00EE, 0x00EC, 0x00C4, 0x00C5,
  0x00C9, 0x00E6, 0x00C6, 0x00F4, 0x00F6, 0x00F2, 0x00FB, 0x00F9, 0x00FF, 0x00D6, 0x00DC, 0x00F8, 0x00A3, 0x00D8, 0x00D7, 0x0192,
  0x00E1, 0x00ED, 0x00F3, 0x00FA, 0x00F1, 0x00D1, 0x00AA, 0x00BA, 0x00BF, 0x00AE, 0x00AC, 0x00BD, 0x00BC, 0x00A1, 0x00AB, 0x00BB,
  0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x00C1, 0x00C2, 0x00C0, 0x00A9, 0x2563, 0x2551, 0x2557, 0x255D, 0x00A2, 0x00A5, 0x2510,
  0x2514, 0x2534, 0x252C, 0x251C, 0x2500, 0x253C, 0x00E3, 0x00C3, 0x255A, 0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256C, 0x00A4,
  0x00F0, 0x00D0, 0x00CA, 0x00CB, 0x00C8, 0x0131, 0x00CD, 0x00CE, 0x00CF, 0x2518, 0x250C, 0x2588, 0x2584, 0x00A6, 0x00CC, 0x2580,
  0x00D3, 0x00DF, 0x00D4, 0x00D2, 0x00F5, 0x00D5, 0x00B5, 0x00FE, 0x00DE, 0x00DA, 0x00DB, 0x00D9, 0x00FD, 0x00DD, 0x00AF, 0x00B4,
  0x00AD, 0x00B1, 0x2017, 0x00BE, 0x00B6, 0x00A7, 0x00F7, 0x00B8, 0x00B0, 0x00A8, 0x00B7, 0x00B9, 0x00B3, 0x00B2, 0x25A0, 0x00A0
];

const TO_BYTE = new Map(CP850.map((cp, byte) => [cp, byte]));

// These code points occur in the double-encoded source and in none of the
// repaired lines. Real Portuguese (é, ã, ç, —) is not in this set.
const MARKERS = new Set([
  0x00A1, 0x00A9, 0x00AC, 0x00AE, 0x00BD, 0x00BF, 0x00C2, 0x00C6, 0x00C7, 0x00D4,
  0x00E5, 0x00EB, 0x00EC, 0x00F1, 0x00F9, 0x00FF, 0x2502, 0x251C, 0x2524, 0x252C,
  0x253C, 0x2551, 0x2557, 0x255D, 0x2563, 0x256C, 0x2591, 0x2592, 0x2593
]);

export function lineHasMojibakeMarker(line) {
  for (const ch of line) {
    if (MARKERS.has(ch.codePointAt(0))) return true;
  }
  return false;
}

export function reverseCp850Line(line) {
  const bytes = [];
  for (const ch of line) {
    const byte = TO_BYTE.get(ch.codePointAt(0));
    if (byte === undefined) return { ok: false, reason: 'not-cp850' };
    bytes.push(byte);
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
    return { ok: true, text };
  } catch {
    return { ok: false, reason: 'utf8' };
  }
}

function snippet(line) {
  return line.length > 140 ? `${line.slice(0, 140)}…` : line;
}

function repairText(text) {
  const hadBom = text.charCodeAt(0) === 0xFEFF;
  const body = hadBom ? text.slice(1) : text;
  const newline = body.includes('\r\n') ? '\r\n' : '\n';
  const endsWithNewline = body.endsWith('\n');
  const lines = body.split(/\r?\n/);
  if (endsWithNewline) lines.pop();

  let changed = 0;
  let failed = 0;
  const samples = [];
  const failures = [];

  const next = lines.map((line, index) => {
    if (!lineHasMojibakeMarker(line)) return line;
    const reversed = reverseCp850Line(line);
    if (!reversed.ok || reversed.text === line || lineHasMojibakeMarker(reversed.text)) {
      failed += 1;
      if (failures.length < 8) failures.push({ line: index + 1, text: snippet(line) });
      return line;
    }
    changed += 1;
    samples.push({ line: index + 1, before: snippet(line), after: snippet(reversed.text) });
    return reversed.text;
  });

  const rebuilt = next.join(newline) + (endsWithNewline ? newline : '');
  return { text: rebuilt, changed, failed, samples, failures, hadBom };
}

function selfCheck() {
  const oxygen = reverseCp850Line('Oxig\u251C\u00ACnio');
  if (!oxygen.ok || oxygen.text !== 'Oxig\u00EAnio') {
    throw new Error('CP850 self-check failed for Oxigênio');
  }
}

function main() {
  selfCheck();
  const original = readFileSync(SOURCE, 'utf8');
  const result = repairText(original);
  console.log(`linhas alteradas: ${result.changed}`);
  console.log(`falhas: ${result.failed}`);
  console.log(`BOM removido: ${result.hadBom ? 'sim' : 'não (arquivo já não tinha)'}`);
  const step = Math.max(1, Math.floor(result.samples.length / 10));
  const picked = [];
  for (let i = 0; i < result.samples.length && picked.length < 10; i += step) picked.push(result.samples[i]);
  console.log('amostra:');
  for (const sample of picked) {
    console.log(`L${sample.line}`);
    console.log(`- ${sample.before}`);
    console.log(`+ ${sample.after}`);
  }
  for (const failure of result.failures) {
    console.error(`falha L${failure.line}: ${failure.text}`);
  }
  if (result.failed > 0) process.exitCode = 1;
  if (result.changed > 0 || result.hadBom) writeFileSync(SOURCE, result.text);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
