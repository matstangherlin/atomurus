#!/usr/bin/env node
// D03 (parte 1) — Lighthouse mobile baseline.
//
//   node tools/lighthouse-baseline.mjs --label before|after [--root <checkout>] [--pages /,/login] [--runs 3]
//
// Serves `--root` (default: this repo) with tools/e2e-serve.mjs, blocks
// third-party hosts, and runs `npx --yes lighthouse@12` (mobile default:
// Moto G Power + simulated slow 4G). Writes the median summary to
// docs/perf/ and the full Lighthouse JSON under docs/perf/raw/<label>/
// (gitignored). Does not optimize the site and does not add dependencies.
//
// tools/perf-baseline.mjs is intentionally left untouched; the static server
// is the same one that script already spawns.
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const DEFAULT_PAGES = [
  { id: 'home', path: '/' },
  { id: 'periodic-table', path: '/periodic-table' },
  { id: 'calculators', path: '/calculators' },
  { id: 'pricing', path: '/pricing' },
  { id: 'login', path: '/login' }
];

// Suffixes covered even when a file only names one subdomain. Patterns are
// matched by Chrome's Network.setBlockedURLs ('*' is a wildcard).
const BLOCK_SUFFIXES = [
  'googlesyndication.com',
  'googletagmanager.com',
  'googletagservices.com',
  'google-analytics.com',
  'googleadservices.com',
  'googleapis.com',
  'gstatic.com',
  'google.com',
  'recaptcha.net',
  'doubleclick.net',
  'adtrafficquality.google',
  'acscdn.com',
  'adcash.com',
  'jsdelivr.net',
  'cloudflare.com',
  'youtube.com',
  'ytimg.com',
  'stripe.com',
  'supabase.co'
];

const SOURCE_FILES = ['ads-gate.js', 'lazy-ads.js', 'recaptcha.js', 'netlify.toml'];

function usage() {
  console.log(`Uso: node tools/lighthouse-baseline.mjs [opções]

Mede Lighthouse (perfil mobile padrão) nas páginas /, /periodic-table,
/calculators, /pricing e /login. Não altera o site.

Opções:
  --root <dir>     Checkout servido (padrão: raiz deste repositório)
  --port <n>       Porta do servidor estático local (padrão: 4310)
  --label <nome>   before, after ou outro rótulo seguro (ex.: smoke)
  --pages <lista>  Subconjunto, separado por vírgula (ex.: /,/login)
  --runs <n>       Execuções por página (padrão: 3; o resumo usa a mediana)
  --help           Esta ajuda
`);
}

function parseArgs(argv) {
  const out = { root: SCRIPT_ROOT, port: 4310, label: 'before', pages: null, runs: 3, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`Falta o valor de ${arg}`);
      i += 1;
      return value;
    };
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--root') out.root = path.resolve(next());
    else if (arg === '--port') out.port = Number(next());
    else if (arg === '--label') out.label = next();
    else if (arg === '--pages') out.pages = next();
    else if (arg === '--runs') out.runs = Number(next());
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }
  if (!Number.isInteger(out.port) || out.port < 1 || out.port > 65535) throw new Error('--port inválida');
  if (!Number.isInteger(out.runs) || out.runs < 1 || out.runs > 10) throw new Error('--runs deve ser de 1 a 10');
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(out.label)) throw new Error('--label deve ser um token curto (letras, números, hífen)');
  return out;
}

function selectPages(spec) {
  if (!spec) return DEFAULT_PAGES;
  const wanted = spec.split(',').map((s) => s.trim()).filter(Boolean);
  return wanted.map((pagePath) => {
    if (!pagePath.startsWith('/')) throw new Error(`Página inválida (use caminho absoluto): ${pagePath}`);
    const known = DEFAULT_PAGES.find((p) => p.path === pagePath);
    const id = known ? known.id : pagePath.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'page';
    return { id, path: pagePath };
  });
}

function median(values) {
  const nums = values.filter((n) => typeof n === 'number' && Number.isFinite(n)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  if (nums.length % 2) return nums[mid];
  return (nums[mid - 1] + nums[mid]) / 2;
}

function extent(values) {
  const nums = values.filter((n) => typeof n === 'number' && Number.isFinite(n));
  if (!nums.length) return { min: null, max: null };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

function roundScore(score) {
  return typeof score === 'number' && Number.isFinite(score) ? Math.round(score * 100) : null;
}

function roundMs(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;
}

function hostsIn(file) {
  if (!existsSync(file)) return [];
  const text = readFileSync(file, 'utf8');
  const found = new Set();
  const re = /https?:\/\/([a-z0-9.-]+)/gi;
  let match = re.exec(text);
  while (match) {
    found.add(match[1].toLowerCase());
    match = re.exec(text);
  }
  return [...found];
}

function blockedPatterns(root) {
  const hosts = new Set(BLOCK_SUFFIXES);
  for (const rel of SOURCE_FILES) {
    for (const host of hostsIn(path.join(root, rel))) hosts.add(host);
  }
  return [...hosts].sort().map((host) => `*${host}*`);
}

function chromePath() {
  const { chromium } = require('playwright');
  return process.env.CHROME_PATH || chromium.executablePath();
}

function gitShort(root) {
  try {
    return execFileSync('git', ['-C', root, 'rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function cpuLabel() {
  const cpus = os.cpus();
  const model = (cpus[0]?.model || 'CPU desconhecida').replace(/\s+/g, ' ').trim();
  return `${model} × ${cpus.length}`;
}

function saoPauloStamp(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || '00';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')} (America/Sao_Paulo)`;
}

function fmt(value, digits = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function fmtRange(span, digits = 0) {
  if (!span || span.min == null || span.max == null) return '—';
  return `${fmt(span.min, digits)}–${fmt(span.max, digits)}`;
}

function isLoopback(hostname) {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1' || hostname === '[::1]';
}

function classifyRequests(items) {
  const completedUrls = [];
  const seenHosts = new Set();
  let blockedOrFailed = 0;
  for (const item of items) {
    const url = String(item.url || '');
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) continue;
    let hostname = '';
    try { hostname = new URL(url).hostname; } catch { continue; }
    if (!hostname || isLoopback(hostname)) continue;
    seenHosts.add(hostname);
    const status = Number(item.statusCode || 0);
    const transferred = Number(item.transferSize || 0);
    if (status >= 200 && status < 400 && transferred > 0) completedUrls.push(url);
    else blockedOrFailed += 1;
  }
  return {
    completed: completedUrls.length,
    completedUrls,
    blockedOrFailed,
    hosts: [...seenHosts].sort()
  };
}

function extractRun(lhr) {
  const audits = lhr.audits || {};
  const items = audits['network-requests']?.details?.items || [];
  const third = classifyRequests(items);
  const totalBytes = typeof audits['total-byte-weight']?.numericValue === 'number'
    ? audits['total-byte-weight'].numericValue
    : null;
  const unused = audits['unused-javascript']?.details?.overallSavingsBytes;
  const unusedBytes = typeof unused === 'number'
    ? unused
    : (typeof audits['unused-javascript']?.numericValue === 'number' ? audits['unused-javascript'].numericValue : null);
  const networkItems = items.filter((item) => {
    const url = String(item.url || '');
    return url && !url.startsWith('data:') && !url.startsWith('blob:');
  });
  return {
    performance: roundScore(lhr.categories?.performance?.score),
    accessibility: roundScore(lhr.categories?.accessibility?.score),
    bestPractices: roundScore(lhr.categories?.['best-practices']?.score),
    seo: roundScore(lhr.categories?.seo?.score),
    lcpMs: roundMs(audits['largest-contentful-paint']?.numericValue),
    tbtMs: roundMs(audits['total-blocking-time']?.numericValue),
    cls: typeof audits['cumulative-layout-shift']?.numericValue === 'number' ? audits['cumulative-layout-shift'].numericValue : null,
    fcpMs: roundMs(audits['first-contentful-paint']?.numericValue),
    speedIndexMs: roundMs(audits['speed-index']?.numericValue),
    totalBytes,
    totalKiB: totalBytes == null ? null : Math.round(totalBytes / 1024),
    requests: networkItems.length,
    unusedJsBytes: unusedBytes,
    unusedJsKiB: unusedBytes == null ? null : Math.round(unusedBytes / 1024),
    thirdPartyCompleted: third.completed,
    thirdPartyCompletedUrls: third.completedUrls,
    thirdPartyBlockedOrFailed: third.blockedOrFailed,
    thirdPartyHosts: third.hosts,
    finalUrl: lhr.finalUrl || null,
    benchmarkIndex: typeof lhr.environment?.benchmarkIndex === 'number' ? lhr.environment.benchmarkIndex : null
  };
}

function profileFrom(lhr) {
  const settings = lhr.configSettings || {};
  return {
    lighthouseVersion: lhr.lighthouseVersion || null,
    formFactor: settings.formFactor || null,
    throttlingMethod: settings.throttlingMethod || null,
    screenEmulation: settings.screenEmulation || null,
    emulatedUserAgent: settings.emulatedUserAgent || null
  };
}

function summarizePage(page, runs) {
  const keys = ['performance', 'accessibility', 'bestPractices', 'seo', 'lcpMs', 'tbtMs', 'cls', 'fcpMs', 'speedIndexMs', 'totalKiB', 'requests', 'unusedJsKiB', 'benchmarkIndex'];
  const summary = {
    id: page.id,
    path: page.path,
    finalUrl: runs.find((r) => r.finalUrl)?.finalUrl || null,
    runs: runs.map((r) => ({
      performance: r.performance,
      accessibility: r.accessibility,
      bestPractices: r.bestPractices,
      seo: r.seo,
      lcpMs: r.lcpMs,
      tbtMs: r.tbtMs,
      cls: r.cls,
      fcpMs: r.fcpMs,
      speedIndexMs: r.speedIndexMs,
      totalKiB: r.totalKiB,
      requests: r.requests,
      unusedJsKiB: r.unusedJsKiB,
      thirdPartyCompleted: r.thirdPartyCompleted,
      thirdPartyBlockedOrFailed: r.thirdPartyBlockedOrFailed,
      thirdPartyHosts: r.thirdPartyHosts
    }))
  };
  for (const key of keys) summary[key] = median(runs.map((r) => r[key]));
  if (typeof summary.cls === 'number') summary.cls = Math.round(summary.cls * 1000) / 1000;
  summary.variation = {
    performance: extent(runs.map((r) => r.performance)),
    lcpMs: extent(runs.map((r) => r.lcpMs))
  };
  summary.thirdPartyCompleted = runs.reduce((sum, r) => sum + r.thirdPartyCompleted, 0);
  summary.thirdPartyBlockedOrFailed = runs.reduce((sum, r) => sum + r.thirdPartyBlockedOrFailed, 0);
  summary.thirdPartyHosts = [...new Set(runs.flatMap((r) => r.thirdPartyHosts))].sort();
  summary.thirdPartyCompletedUrls = [...new Set(runs.flatMap((r) => r.thirdPartyCompletedUrls))].sort();
  return summary;
}

function renderMarkdown(report) {
  const profile = report.profile || {};
  const screen = profile.screenEmulation || {};
  const lines = [];
  lines.push(`# Lighthouse mobile — linha de base (\`${report.label}\`)`);
  lines.push('');
  lines.push('Medição de laboratório local, com terceiros bloqueados. Estes números não são dados de campo e não são comparáveis em valor absoluto com o site ao vivo. Servem para comparar antes × depois na mesma máquina.');
  lines.push('');
  lines.push('| Campo | Valor |');
  lines.push('| --- | --- |');
  lines.push(`| Início | ${report.measuredAtSaoPaulo} |`);
  lines.push(`| Fim | ${report.finishedAtSaoPaulo} |`);
  lines.push(`| Lighthouse | ${report.lighthouseVersion} |`);
  lines.push(`| Node | ${report.node} |`);
  lines.push(`| Commit medido | \`${report.commit || 'desconhecido'}\` |`);
  lines.push(`| CPU | ${report.cpu} |`);
  lines.push(`| Form factor | ${profile.formFactor || '—'} |`);
  lines.push(`| Throttling | ${profile.throttlingMethod || '—'} |`);
  lines.push(`| Emulação de tela | ${screen.width || '—'}×${screen.height || '—'} @${screen.deviceScaleFactor || '—'}x, mobile=${String(screen.mobile)} |`);
  lines.push(`| User-Agent emulado | ${profile.emulatedUserAgent || '—'} |`);
  lines.push(`| Execuções por página | ${report.runs} (valores da tabela = mediana) |`);
  lines.push(`| Checkout servido | \`${report.root}\` |`);
  lines.push(`| Requisições de terceiros concluídas | ${report.thirdPartyCompleted} |`);
  lines.push('');
  lines.push('## Resultados');
  lines.push('');
  lines.push('| Página | Performance | A11y | Best Practices | SEO | LCP (ms) | TBT (ms) | CLS | FCP (ms) | Speed Index (ms) | Peso (KiB) | Requisições | JS não usado (KiB) |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const page of report.pages) {
    lines.push(`| \`${page.path}\` | ${fmt(page.performance)} | ${fmt(page.accessibility)} | ${fmt(page.bestPractices)} | ${fmt(page.seo)} | ${fmt(page.lcpMs)} | ${fmt(page.tbtMs)} | ${fmt(page.cls, 3)} | ${fmt(page.fcpMs)} | ${fmt(page.speedIndexMs)} | ${fmt(page.totalKiB)} | ${fmt(page.requests)} | ${fmt(page.unusedJsKiB)} |`);
  }
  lines.push('');
  lines.push('## Variação (min–máx) entre as execuções');
  lines.push('');
  lines.push('Performance é a nota 0–100 de cada execução. LCP é o valor de cada execução, em milissegundos.');
  lines.push('');
  lines.push('| Página | Performance (min–máx) | LCP (min–máx, ms) |');
  lines.push('| --- | ---: | ---: |');
  for (const page of report.pages) {
    lines.push(`| \`${page.path}\` | ${fmtRange(page.variation.performance)} | ${fmtRange(page.variation.lcpMs)} |`);
  }
  lines.push('');
  lines.push('## Terceiros');
  lines.push('');
  lines.push(`Requisições de terceiros concluídas (status 2xx/3xx e bytes transferidos): **${report.thirdPartyCompleted}**.`);
  const hosts = [...new Set(report.pages.flatMap((p) => p.thirdPartyHosts || []))];
  if (hosts.length) {
    lines.push('');
    lines.push(`Hosts de terceiros vistos no relatório e não concluídos (bloqueados ou sem resposta): ${hosts.map((h) => `\`${h}\``).join(', ')}.`);
  } else {
    lines.push('');
    lines.push('Nenhum host fora de 127.0.0.1 apareceu na lista de requisições de rede do Lighthouse.');
  }
  lines.push('');
  lines.push('## Meta (a definir pelo dono)');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function startServer(root, port) {
  const script = path.join(root, 'tools/e2e-serve.mjs');
  if (!existsSync(script)) throw new Error(`Não achei tools/e2e-serve.mjs em ${root}`);
  const child = spawn(process.execPath, [script], {
    cwd: root,
    env: { ...process.env, E2E_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let log = '';
  child.stdout.on('data', (chunk) => { log += chunk; });
  child.stderr.on('data', (chunk) => { log += chunk; });
  child.serverLog = () => log;
  return child;
}

async function waitForServer(port, child) {
  const deadline = Date.now() + 20000;
  let lastError = null;
  while (Date.now() < deadline) {
    if (child.exitCode != null) {
      throw new Error(`O servidor estático encerrou (código ${child.exitCode}).\n${child.serverLog()}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, { redirect: 'manual' });
      if (response.status > 0) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Servidor não respondeu em 127.0.0.1:${port}. ${lastError ? lastError.message : ''}\n${child.serverLog()}`);
}

function stopServer(child) {
  if (!child || child.exitCode != null) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 2000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill('SIGTERM');
  });
}

function runLighthouse({ url, outputPath, chrome, patterns }) {
  const chromeFlags = [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-component-update',
    '--no-first-run',
    '--disable-default-apps'
  ].join(' ');
  // Repeat the flag: this Lighthouse build does not split --blocked-url-patterns on commas.
  const blocked = patterns.map((pattern) => `--blocked-url-patterns=${pattern}`);
  const args = [
    '--yes',
    'lighthouse@12',
    url,
    '--output=json',
    `--output-path=${outputPath}`,
    '--only-categories=performance,accessibility,best-practices,seo',
    '--form-factor=mobile',
    '--throttling-method=simulate',
    '--no-enable-error-reporting',
    `--chrome-flags=${chromeFlags}`,
    ...blocked,
    '--quiet'
  ];
  return new Promise((resolve, reject) => {
    const child = spawn('npx', args, {
      cwd: SCRIPT_ROOT,
      env: { ...process.env, CHROME_PATH: chrome },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Lighthouse excedeu 4 minutos em ${url}\n${stderr.slice(-2000)}`));
    }, 240000);
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0 && existsSync(outputPath)) resolve();
      else reject(new Error(`Lighthouse saiu com código ${code} em ${url}\n${stderr.slice(-4000)}`));
    });
  });
}

async function measurePage({ page, runs, port, chrome, patterns, rawDir }) {
  const collected = [];
  let profile = null;
  for (let index = 1; index <= runs; index += 1) {
    const outputPath = path.join(rawDir, `${page.id}-run-${index}.json`);
    rmSync(outputPath, { force: true });
    const url = `http://127.0.0.1:${port}${page.path}`;
    process.stderr.write(`lighthouse ${page.path} execução ${index}/${runs}\n`);
    let lastError = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await runLighthouse({ url, outputPath, chrome, patterns });
        const lhr = JSON.parse(readFileSync(outputPath, 'utf8'));
        const extracted = extractRun(lhr);
        if (extracted.performance == null) throw new Error('relatório sem nota de performance');
        if (!profile) profile = profileFrom(lhr);
        collected.push(extracted);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        process.stderr.write(`tentativa ${attempt} falhou: ${error.message.split('\n')[0]}\n`);
      }
    }
    if (lastError) throw lastError;
  }
  return { summary: summarizePage(page, collected), profile };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  const pages = selectPages(args.pages);
  const chrome = chromePath();
  if (!existsSync(chrome)) throw new Error(`Chromium não encontrado em ${chrome}. Rode: npx playwright install chromium`);
  const patterns = blockedPatterns(args.root);
  const startedAt = new Date();
  const rawDir = path.join(SCRIPT_ROOT, 'docs/perf/raw', args.label);
  mkdirSync(rawDir, { recursive: true });

  process.stderr.write(`Lighthouse ${execFileSync('npx', ['--yes', 'lighthouse@12', '--version'], { encoding: 'utf8', cwd: SCRIPT_ROOT }).trim()} · Chrome ${chrome}\n`);
  const server = startServer(args.root, args.port);
  const summaries = [];
  let profile = null;
  try {
    await waitForServer(args.port, server);
    for (const page of pages) {
      const result = await measurePage({ page, runs: args.runs, port: args.port, chrome, patterns, rawDir });
      summaries.push(result.summary);
      profile = profile || result.profile;
      if (result.summary.thirdPartyCompleted > 0) {
        throw new Error(`Requisição de terceiro concluída em ${page.path}: ${result.summary.thirdPartyCompletedUrls.join(', ')}`);
      }
    }
  } finally {
    await stopServer(server);
  }

  const finishedAt = new Date();
  const report = {
    label: args.label,
    measuredAt: startedAt.toISOString(),
    measuredAtSaoPaulo: saoPauloStamp(startedAt),
    finishedAt: finishedAt.toISOString(),
    finishedAtSaoPaulo: saoPauloStamp(finishedAt),
    lighthouseVersion: profile?.lighthouseVersion || null,
    node: process.version,
    commit: gitShort(args.root),
    cpu: cpuLabel(),
    root: args.root,
    port: args.port,
    runs: args.runs,
    thirdPartiesBlocked: true,
    blockedUrlPatterns: patterns,
    thirdPartyCompleted: summaries.reduce((sum, page) => sum + page.thirdPartyCompleted, 0),
    profile,
    pages: summaries
  };

  const outJson = path.join(SCRIPT_ROOT, 'docs/perf', `lighthouse-${args.label}.json`);
  const outMd = path.join(SCRIPT_ROOT, 'docs/perf', `lighthouse-${args.label}.md`);
  writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(outMd, renderMarkdown(report));
  process.stdout.write(renderMarkdown(report));
  process.stderr.write(`resumo: ${path.relative(SCRIPT_ROOT, outMd)}\n`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
