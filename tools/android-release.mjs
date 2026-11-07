#!/usr/bin/env node
// Builds the Android app for Google Play.
//
//   npm run android:release        → release/android/atomurus-<versão>.aab + .apk (signed)
//   npm run android:release -- --bump   raise versionCode first (needed for every new upload)
//   npm run android:apk / android:aab   only one of them
//
// Steps: site → dist/android-web → npx cap sync android → Gradle (release).
// Signing uses android/keystore.properties or the ATOMURUS_* env vars
// (see android/app/build.gradle). Works on Windows, macOS and Linux.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAndroidWeb } from './build-android-web.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANDROID = path.join(ROOT, 'android');
const PROPS = path.join(ANDROID, 'gradle.properties');
const OUT = path.join(ROOT, 'release/android');
const args = new Set(process.argv.slice(2));
const wantApk = !args.has('--aab-only');
const wantAab = !args.has('--apk-only');

function run(cmd, cmdArgs, cwd) {
  const res = spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) {
    console.error(`\n✖ ${cmd} ${cmdArgs.join(' ')} failed (exit ${res.status}).`);
    process.exit(res.status || 1);
  }
}

function readVersion() {
  const txt = readFileSync(PROPS, 'utf8');
  const code = Number(process.env.ATOMURUS_VERSION_CODE || (txt.match(/^atomurusVersionCode=(\d+)/m) || [])[1] || 1);
  const name = (process.env.ATOMURUS_VERSION_NAME || (txt.match(/^atomurusVersionName=(.+)$/m) || [])[1] || '1.0.0').trim();
  return { txt, code, name };
}

export function bumpVersion() {
  const v = readVersion();
  const parts = v.name.split('.').map((n) => Number(n) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  const next = { code: v.code + 1, name: parts.join('.') };
  writeFileSync(PROPS, v.txt
    .replace(/^atomurusVersionCode=\d+/m, `atomurusVersionCode=${next.code}`)
    .replace(/^atomurusVersionName=.+$/m, `atomurusVersionName=${next.name}`));
  console.log(`version → ${next.name} (versionCode ${next.code})`);
  return next;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (args.has('--bump-only')) { bumpVersion(); process.exit(0); }
  if (args.has('--bump')) bumpVersion();
  const { code, name } = readVersion();
  const signed = existsSync(path.join(ANDROID, 'keystore.properties')) || process.env.ATOMURUS_KEYSTORE_FILE;
  if (!signed) {
    console.warn('⚠ No upload key (android/keystore.properties or ATOMURUS_KEYSTORE_FILE): the release will be UNSIGNED and Google Play will reject it.');
  }

  buildAndroidWeb();
  run('npx', ['cap', 'sync', 'android'], ROOT);

  const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const tasks = [];
  if (wantAab) tasks.push('bundleRelease');
  if (wantApk) tasks.push('assembleRelease');
  run(gradlew, ['--no-daemon', ...tasks], ANDROID);

  mkdirSync(OUT, { recursive: true });
  const base = `atomurus-${name}-v${code}`;
  const made = [];
  if (wantAab) {
    const aab = path.join(ANDROID, 'app/build/outputs/bundle/release/app-release.aab');
    copyFileSync(aab, path.join(OUT, `${base}.aab`));
    made.push(`release/android/${base}.aab   ← envie este ao Google Play`);
  }
  if (wantApk) {
    const apk = path.join(ANDROID, 'app/build/outputs/apk/release/app-release.apk');
    copyFileSync(apk, path.join(OUT, `${base}.apk`));
    made.push(`release/android/${base}.apk   ← instale direto no celular para testar`);
  }
  console.log(`\n✔ Atomurus ${name} (versionCode ${code})${signed ? ', assinado' : ', SEM assinatura'}:\n  ${made.join('\n  ')}`);
}
