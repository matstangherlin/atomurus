#!/usr/bin/env node
/**
 * Optional responsive WebP/AVIF helper. No package.json dependency.
 * Default is a dry-run. Pass --write to emit files next to the originals.
 * Widths above the source are skipped (no upscaling).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WIDTHS = [480, 960, 1600];
const IMAGE_RE = /\.(png|jpe?g)$/i;

export function readPngSize(buf) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!Buffer.isBuffer(buf) || buf.length < 24 || !buf.subarray(0, 8).equals(sig)) return null;
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { type: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export function readJpegSize(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 10 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    if (i + 4 > buf.length) return null;
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      if (i + 9 > buf.length) return null;
      return { type: 'jpeg', width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

export function readImageSize(buf) {
  return readPngSize(buf) || readJpegSize(buf);
}

function hasBinary(name) {
  const probe = spawnSync(name, ['-version'], { stdio: 'ignore' });
  return probe.status === 0;
}

async function loadSharp() {
  try {
    const mod = await import('sharp');
    return mod.default || mod;
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const write = argv.includes('--write');
  const dirFlag = argv.indexOf('--dir');
  const dir = dirFlag >= 0 ? argv[dirFlag + 1] : '';
  return { write, dir };
}

function listImages(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listImages(full));
    else if (IMAGE_RE.test(entry.name) && !/-\d+\.(webp|avif)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function targetsFor(file, size) {
  const parsed = path.parse(file);
  const widths = WIDTHS.filter((width) => !size || width <= size.width);
  return widths.map((width) => ({
    width,
    webp: path.join(parsed.dir, `${parsed.name}-${width}.webp`),
    avif: path.join(parsed.dir, `${parsed.name}-${width}.avif`)
  }));
}

function printInstructions() {
  console.log('No encoder available. Nothing was written.');
  console.log('Install one of these, then re-run with --write:');
  console.log('  npx --yes -p sharp node tools/optimize-images.mjs --dir <folder> --write');
  console.log('  cwebp (WebP) and, optionally, avifenc (AVIF)');
  console.log('Do not add sharp to package.json. Originals are never deleted.');
}

async function writeWithSharp(sharp, file, target) {
  const pipeline = sharp(file).resize({ width: target.width, withoutEnlargement: true });
  await pipeline.clone().webp({ quality: 75, effort: 4 }).toFile(target.webp);
  await pipeline.clone().avif({ quality: 50, effort: 4 }).toFile(target.avif);
}

function writeWithCwebp(file, target) {
  const result = spawnSync('cwebp', ['-q', '75', '-resize', String(target.width), '0', file, '-o', target.webp], {
    stdio: 'inherit'
  });
  if (result.status !== 0) throw new Error(`cwebp failed for ${target.webp}`);
}

async function main() {
  const { write, dir } = parseArgs(process.argv.slice(2));
  if (!dir) {
    console.log('Usage: node tools/optimize-images.mjs --dir <folder> [--write]');
    console.log('Default is dry-run. Widths: 480, 960, 1600. Originals stay in place.');
    return 0;
  }
  const root = path.resolve(dir);
  const files = listImages(root);
  const sharp = await loadSharp();
  const cwebp = hasBinary('cwebp');
  const avifenc = hasBinary('avifenc');
  const canWebp = Boolean(sharp) || cwebp;
  const canAvif = Boolean(sharp);
  console.log(write ? 'write' : 'dry-run');
  console.log(`encoder: ${sharp ? 'sharp' : cwebp ? 'cwebp' : 'none'}${canAvif ? ' + avif' : avifenc ? ' (avifenc present, resize needs sharp)' : ''}`);
  if (!files.length) {
    console.log(`No PNG/JPEG files in ${root}`);
  }
  for (const file of files) {
    const size = readImageSize(fs.readFileSync(file));
    const targets = targetsFor(file, size);
    const label = size ? `${size.width}×${size.height}` : 'unknown size';
    console.log(`${path.relative(process.cwd(), file)} (${label})`);
    if (!targets.length) {
      console.log('  skip: source is narrower than 480');
      continue;
    }
    for (const target of targets) {
      console.log(`  ${path.basename(target.webp)}${canAvif ? ` + ${path.basename(target.avif)}` : ''}`);
      if (!write || !canWebp) continue;
      if (sharp) await writeWithSharp(sharp, file, target);
      else writeWithCwebp(file, target);
    }
  }
  if (!canWebp) printInstructions();
  else if (!write) console.log('Dry-run only. Pass --write to create the files.');
  return 0;
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  main().then((code) => process.exit(code)).catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
