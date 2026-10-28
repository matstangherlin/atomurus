# Inventário de CSP

Gerado por `node tools/audit-csp.mjs` (somente leitura). Os IDs de anúncio e de medição são ocultados nas prévias.

## Resumo

| Item | Quantidade |
|---|---|
| Páginas HTML publicáveis | 334 |
| Scripts inline executáveis | 1613 |
| Scripts inline distintos (sha256) | 171 |
| Manipuladores `on*=` | 1490 em 327 páginas |
| Blocos `<style>` | 645 (19 distintos) |
| Atributos `style=` | 3856 em 325 páginas |
| Origens externas | 10 |

## Manipuladores inline por atributo

| Atributo | Ocorrências | Páginas |
|---|---|---|
| `onclick` | 1096 | 325 |
| `onload` | 324 | 324 |
| `onchange` | 48 | 14 |
| `oninput` | 14 | 10 |
| `onkeyup` | 4 | 4 |
| `onfocus` | 2 | 2 |
| `onkeydown` | 2 | 2 |

## Scripts inline mais repetidos

| # | Páginas | Usos | Bytes | sha256 | Prévia |
|---|---|---|---|---|---|
| 1 | 324 | 324 | 138 | `Aaiofhy819Is…` | `document.documentElement.classList.add('lc-loading');setTimeout(function(){document.docume` |
| 2 | 320 | 320 | 87 | `Od4vphTIx8Vz…` | `(window.atomurusRunAutoTag\|\|function(){})({ zoneId: '…', });` |
| 3 | 304 | 304 | 620 | `f3FuP1ud9GH4…` | `(function(){try{var t=localStorage.getItem('atomurus-theme');if(t)document.documentElement` |
| 4 | 254 | 254 | 323 | `PL7BJuyyFcjJ…` | `function toggleTheme(){var h=document.documentElement;var d=h.getAttribute('data-theme')==` |
| 5 | 23 | 23 | 2574 | `ULJY4DKV3WqA…` | `function applyTheme(isDark){ document.documentElement.setAttribute('data-theme', isDark ? ` |
| 6 | 21 | 21 | 847 | `xHY5CHbSXXjP…` | `(function initIsoSelector(){ var wrap = document.querySelector('[data-iso-selector]'); var` |
| 7 | 20 | 20 | 1209 | `L1xzaNTyOkCV…` | `(function(){try{var t=localStorage.getItem('atomurus-theme');if(t)document.documentElement` |
| 8 | 14 | 14 | 207 | `AFr8y2RkwTdx…` | `atomurusBootLabViewer(document.getElementById('iso-3d-canvas') \|\| document.querySelector('` |
| 9 | 12 | 12 | 74 | `YqQhGW8jXzNN…` | `(window.atomurusRunAutoTag\|\|function(){})({ zoneId: '…' });` |
| 10 | 10 | 10 | 591 | `4hzkJ9B2exDn…` | `(function() { var fs = localStorage.getItem('atomurus-fontsize') \|\| 'md'; var fsSizes = { ` |
| 11 | 8 | 8 | 3418 | `eneonJ9+uEDf…` | `(function(){ 'use strict'; window.toggleTheme = function() { var html = document.documentE` |
| 12 | 7 | 7 | 3417 | `gF3iftwDK0uK…` | `(function(){ 'use strict'; window.toggleTheme = function() { var html = document.documentE` |
| 13 | 3 | 3 | 202 | `6n/kR2Bfe5+b…` | `function toggleTheme(){var h=document.documentElement;var d=h.getAttribute('data-theme')==` |
| 14 | 2 | 2 | 19 | `/Rz/7LZ1fa3R…` | `window.PAGE_Z = 23;` |
| 15 | 2 | 2 | 19 | `+hNhZjUfVAwC…` | `window.PAGE_Z = 12;` |
| 16 | 2 | 2 | 20 | `+nn2htX5aglf…` | `window.PAGE_Z = 105;` |
| 17 | 2 | 2 | 205 | `08MTPMViTr1J…` | `(function(){try{var p=new URLSearchParams(window.location.search);if(p.get('embed')==='1')` |
| 18 | 2 | 2 | 2515 | `0I0CIqnb1itl…` | `(function(){ var form = document.getElementById('cform'); var ok = document.getElementById` |
| 19 | 2 | 2 | 6609 | `0v7ytiBTge8y…` | `/* ── Theme ── */ function applyTheme(isDark){ document.documentElement.setAttribute('data` |
| 20 | 2 | 2 | 19 | `0YmKIgcmzCU3…` | `window.PAGE_Z = 84;` |
| 21 | 2 | 2 | 19 | `1h/9NtGb7RS/…` | `window.PAGE_Z = 62;` |
| 22 | 2 | 2 | 19 | `1K54gca8trMZ…` | `window.PAGE_Z = 72;` |
| 23 | 2 | 2 | 19 | `1N85WcUu/h3M…` | `window.PAGE_Z = 40;` |
| 24 | 2 | 2 | 19 | `2aNpjJpiQPBL…` | `window.PAGE_Z = 11;` |
| 25 | 2 | 2 | 20 | `30w10ZHQJ17J…` | `window.PAGE_Z = 102;` |

23 dos 171 scripts distintos aparecem em uma única página. Lista completa (com o hash inteiro) em `csp-inventario.json`.

## Origens externas

| Origem | Arquivos | Como aparece | Exemplos |
|---|---|---|---|
| https://acscdn.com | 1 | js literal | ads-gate.js |
| https://atomurus.com | 1 | js literal | assets/core/atomurus-core.js |
| https://cdn.jsdelivr.net | 1 | js literal | periodic-table.js |
| https://cdnjs.cloudflare.com | 3 | js literal | periodic-table.js, viewer/isomerism/isomerism-3d.js, viewer/load-three.js |
| https://pagead2.googlesyndication.com | 1 | js literal | ads-gate.js |
| https://t.me | 1 | js literal | share-button.js |
| https://twitter.com | 1 | js literal | share-button.js |
| https://wa.me | 1 | js literal | share-button.js |
| https://www.google.com | 1 | js literal | recaptcha.js |
| https://www.googletagmanager.com | 1 | js literal | lazy-ads.js |

Atenção: «js literal» inclui URLs que só aparecem em texto (links, documentação, mensagens). Uma origem só precisa estar na CSP se a página **carregar** algo dela; veja a tabela por finalidade em `csp-plano.md`.

## Report-Only (etapa 2)

- Cabeçalho: 4091 bytes (orçamento 4096).
- Hashes incluídos: 55 (cobrem 1404 dos 1613 usos de script inline).
- Fora do orçamento: 116 scripts distintos (209 usos) — vão aparecer como violação no Report-Only e são a lista de externalização.
- Com `?v=` (mudam a cada deploy, nunca entram por hash): 2 scripts distintos.
