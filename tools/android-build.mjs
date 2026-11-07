#!/usr/bin/env node
// Android build wrapper (Windows + Unix). See docs/ANDROID.md.
//
//   npm run android:sync           build dist/app + cap sync android
//   npm run android:open           sync + open Android Studio
//   npm run android:debug          sync + assembleDebug + bundleDebug   (APK + AAB, debug key)
//   npm run android:release        sync + assembleRelease + bundleRelease (APK + AAB, upload key)
//
// Outputs are copied to release-artifacts/ with identifiable names:
//   atomurus-<versionName>-<versionCode>-<shortSha>-<debug|release>.{apk,aab}
// plus a .provenance.json (sha, branch, version, workflow run, sha256 of each file).
//
// Exit codes: 3 = no Android SDK, 4 = release without signing values.
// Only variable NAMES are printed, never secret values.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANDROID = path.join(ROOT, 'android');
const OUT = path.join(ROOT, 'release-artifacts');
const isWindows = process.platform === 'win32';
const SIGNING_ENV = ['ATOMURUS_ANDROID_KEYSTORE_PATH', 'ATOMURUS_ANDROID_KEYSTORE_PASSWORD', 'ATOMURUS_ANDROID_KEY_ALIAS', 'ATOMURUS_ANDROID_KEY_PASSWORD'];
const SIGNING_PROPS = ['storeFile', 'storePassword', 'keyAlias', 'keyPassword'];

function run(cmd, args, cwd = ROOT) {
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env, shell: isWindows });
  if (res.error) {
    console.error(`android-build: failed to run ${cmd}: ${res.error.message}`);
    process.exit(1);
  }
  if ((res.status ?? 1) !== 0) process.exit(res.status ?? 1);
}

function git(args) {
  const res = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return res.status === 0 ? res.stdout.trim() : '';
}

function readProps(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

function requireSdk() {
  for (const key of ['ANDROID_HOME', 'ANDROID_SDK_ROOT']) {
    if (process.env[key] && existsSync(process.env[key])) return;
  }
  const sdkDir = (readProps(path.join(ANDROID, 'local.properties'))['sdk.dir'] || '').replace(/\\(.)/g, '$1');
  if (sdkDir && existsSync(sdkDir)) return;
  console.error('BLOCKED_LOCAL_ANDROID_SDK: Android SDK not found. Set ANDROID_HOME or open android/ once in Android Studio.');
  process.exit(3);
}

function requireSigning() {
  const props = readProps(path.join(ANDROID, 'keystore.properties'));
  const missing = SIGNING_ENV.filter((name, i) => !(process.env[name] || '').trim() && !(props[SIGNING_PROPS[i]] || '').trim());
  if (missing.length) {
    console.error(`BLOCKED_SIGNING_SECRETS: missing ${missing.join(', ')} (env or android/keystore.properties). See docs/ANDROID.md.`);
    process.exit(4);
  }
}

function versionCode() {
  const floor = Number(readProps(path.join(ANDROID, 'version.properties')).versionCode || 1);
  const fromEnv = Number(process.env.ATOMURUS_ANDROID_VERSION_CODE || 0);
  const code = Math.max(floor, fromEnv || floor);
  process.env.ATOMURUS_ANDROID_VERSION_CODE = String(code);
  return code;
}

function sync() {
  run(process.execPath, [path.join(ROOT, 'tools/build-app-bundle.mjs')]);
  run(isWindows ? 'npx.cmd' : 'npx', ['cap', 'sync', 'android']);
}

function gradle(...tasks) {
  run(isWindows ? 'gradlew.bat' : './gradlew', [...tasks, '--no-daemon', '--stacktrace'], ANDROID);
}

function collect(buildType) {
  const code = Number(process.env.ATOMURUS_ANDROID_VERSION_CODE);
  const name = readProps(path.join(ANDROID, 'version.properties')).versionName || '0.0.0';
  const sha = process.env.GITHUB_PR_HEAD_SHA || git(['rev-parse', 'HEAD']);
  const base = `atomurus-${name}-${code}-${sha.slice(0, 8)}-${buildType}`;
  const outputs = [
    ['apk', `app/build/outputs/apk/${buildType}/app-${buildType}.apk`],
    ['aab', `app/build/outputs/bundle/${buildType}/app-${buildType}.aab`]
  ];
  mkdirSync(OUT, { recursive: true });
  const files = [];
  for (const [ext, rel] of outputs) {
    const src = path.join(ANDROID, rel);
    if (!existsSync(src)) continue;
    const target = path.join(OUT, `${base}.${ext}`);
    copyFileSync(src, target);
    files.push({ name: path.basename(target), bytes: statSync(target).size, sha256: createHash('sha256').update(readFileSync(target)).digest('hex') });
  }
  if (!files.length) {
    console.error(`android-build: no ${buildType} APK/AAB produced`);
    process.exit(1);
  }
  const runUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
  const provenance = {
    app: 'atomurus.com',
    buildType,
    versionName: name,
    versionCode: code,
    sha,
    branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || git(['rev-parse', '--abbrev-ref', 'HEAD']),
    dirtyTree: Boolean(git(['status', '--porcelain', '--untracked-files=no'])),
    workflowRun: runUrl,
    builtAt: new Date().toISOString(),
    files
  };
  writeFileSync(path.join(OUT, `${base}.provenance.json`), `${JSON.stringify(provenance, null, 2)}\n`);
  console.log(`android: ${files.map((f) => f.name).join(' + ')} in release-artifacts/ (versionCode ${code})`);
}

const COMMANDS = {
  sync,
  open() {
    sync();
    run(isWindows ? 'npx.cmd' : 'npx', ['cap', 'open', 'android']);
  },
  debug() {
    requireSdk();
    versionCode();
    sync();
    gradle('assembleDebug', 'bundleDebug');
    collect('debug');
  },
  release() {
    requireSdk();
    requireSigning();
    versionCode();
    sync();
    gradle('assembleRelease', 'bundleRelease');
    collect('release');
  }
};

const command = process.argv[2];
if (!COMMANDS[command]) {
  console.error(`usage: node tools/android-build.mjs <${Object.keys(COMMANDS).join('|')}>`);
  process.exit(2);
}
COMMANDS[command]();
