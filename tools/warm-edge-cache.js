#!/usr/bin/env node
/**
 * Warm Netlify edge cache for the highest-traffic Atomurus URLs.
 *
 * Usage:
 *   ATOMURUS_SITE_URL=https://atomurus.com node tools/warm-edge-cache.js
 *
 * No Netlify login required — just HTTP GETs against the public site.
 * Run after production deploys (GitHub Action on main) so the first
 * Brazilian visitor does not pay a cold TTFB.
 */

const BASE = (process.env.ATOMURUS_SITE_URL || 'https://atomurus.com').replace(/\/$/, '') || 'https://atomurus.com';

const PATHS = [
  '/',
  '/?lang=pt-BR',
  '/?lang=en',
  '/periodic-table',
  '/periodic-table?lang=pt-BR',
  '/calculators',
  '/calculators?lang=pt-BR',
  '/explore',
  '/explore?lang=pt-BR',
  '/viewer/molecules',
  '/viewer/molecules?lang=pt-BR',
  '/viewer/atomic-models',
  '/viewer/atomic-models?lang=pt-BR',
  '/viewer/allotropes',
  '/viewer/allotropes?lang=pt-BR',
  '/pricing',
  '/pricing?lang=pt-BR',
  '/about',
  '/contact',
  '/login',
  '/assets/fonts/inter-tight-normal-latin.woff2',
  '/assets/fonts/instrument-serif-400-italic-latin.woff2',
  '/atomurus-lab-console.css',
  '/ads-gate.js',
  '/i18n.js',
];

async function warm(path) {
  const url = BASE + path;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'AtomurusCacheWarm/1.0',
        Accept: '*/*',
      },
    });
    // Drain body so the edge actually finishes the response.
    await res.arrayBuffer();
    const ms = Date.now() - started;
    const cache = res.headers.get('cache-status') || res.headers.get('x-nf-cache-status') || '-';
    console.log(`${res.status} ${ms}ms  cache=${cache}  ${path}`);
    return res.ok;
  } catch (err) {
    console.error(`ERR ${path}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`Warming ${PATHS.length} URLs on ${BASE}`);
  let ok = 0;
  // Gentle concurrency — enough to warm, not enough to look like a spike.
  const queue = PATHS.slice();
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const path = queue.shift();
      if (await warm(path)) ok += 1;
    }
  });
  await Promise.all(workers);
  console.log(`Done: ${ok}/${PATHS.length} OK`);
  if (ok < PATHS.length / 2) process.exitCode = 1;
}

main();
