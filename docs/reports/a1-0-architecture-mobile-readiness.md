# A1.0 — Architecture foundation, performance and mobile readiness

**State reached: `ATOMURUS_MOBILE_ARCHITECTURE_READY`.** Not `ANDROID_RUNTIME_READY`, not `PLAY_BETA_READY`.
Nothing was merged, nothing was published, Capacitor was not installed.

| | |
| --- | --- |
| Base | `main` @ `f069c68d9feffcdc20e272589887eaabf3968c37` ("Workspace: three areas, the Lab as a full canvas, and a real camera"). `main` had not moved when work started or finished. |
| Branch | `claude/atomurus-web-android-foundation-kp12j8` (the branch this session is assigned to; the brief's `architecture/mobile-readiness` name was not used) |
| Final SHA | the commit that adds this report — see `git log` on the branch |
| Merge | **not merged** — for owner review |

All numbers below come from `tools/audit-architecture.mjs`, `tools/perf-baseline.mjs`,
`dist/app/build-manifest.json`, `e2e/a1-lifecycle.spec.js` (`a1-0-lifecycle-results.json`)
and `tools/test-a1-mutations.mjs`. Where something could not be measured it says so.

---

## 1. Baseline (before any change)

| Check | Result on `f069c68` |
| --- | --- |
| `npm run ci` (build + 15 suites + validate) | pass, ~6 s |
| `npx playwright test` (110 tests) | 98 passed, 12 failed — see §22 |
| Build side effect | `npm run build` rewrites 344 files (`?v=` stamps on 343 HTML pages + `assets/critical-lab.css`, which is already stale on `main`). This churn is never committed. |
| Pages | 334 HTML pages, 47 PT |
| `/app` CSS layers | fonts.css → critical-lab.css (18 KB) → atomurus-lab-console.css (199 KB) → workspace-foundation.css (3 KB) → app-workspace.css (78 KB) → ui/index.css → layouts/workspace.css |
| `/app` classic scripts | 17 |
| Largest JS | periodic-table.js 318 KB, assets/lab/virtual-lab.js 279 KB, auth-app.js 193 KB, viewer/runtime/atomic-viewer.js 105 KB, elements-data.js 95 KB |
| Largest CSS | atomurus-lab-console.css 199 KB, periodic-table.css 131 KB, app-workspace.css 78 KB, public-shell.css 53 KB |
| Images | 29 files, 14.9 MB; 14 OG images = 1.13 MB; six concept PNGs of 1.9–2.7 MB each in `assets/concepts/` |

## 2–3. Architecture before → proposed

Before: a web-first multipage site. Classic scripts expose `window.*` globals, each
API client carries its own `fetch` wrapper (Study's had **no timeout**), CSS
accretes in layers with 1 264 `!important`, 3D runtimes are page-level and
load Three.js r128 from cdnjs, and Netlify publishes the repository root.

After: a shared application core used by the web today and by Android later,
with no rewrite and no framework. Details and rules:
[`docs/architecture/README.md`](../architecture/README.md).

```text
Supabase + Netlify API  (one account, one user.id: cookie OR bearer → same requireUser)
          │
      src/core  ← platform-free: api · auth · config · lifecycle · platform · storage · sync · entitlement · routing · network · perf
          │
  ┌───────┴────────┐
 Web                Android (A1.4)
 multipage site     Capacitor 8 over dist/app
 + AppShell         (src/adapters/capacitor, injected plugins)
```

## 4. Files created

| Area | Files |
| --- | --- |
| Core | `src/core/{api/api-client,api-errors,retry-policy,static-loader}.js`, `auth/{auth-adapter,auth-errors,web-auth-adapter,native-auth-adapter}.js`, `config/runtime-config.js`, `entitlement/entitlement.js`, `lifecycle/{scope,app-lifecycle}.js`, `network/network-state.js`, `perf/perf.js`, `platform/{platform,web-adapter,safe-area}.js`, `routing/routes.js`, `storage/{storage-policy,preferences-storage,secure-storage,cache-storage}.js`, `sync/sync-contract.js` |
| Adapters | `src/adapters/capacitor/{capacitor-adapter,secure-storage-adapter}.js` |
| App | `src/app/bootstrap/{services,web-main,app-main,legacy-bridge}.js`, `src/app/router/{router,feature-registry}.js`, `src/app/shell/{app-shell,feature-host,strings}.js` |
| Features | `src/features/{home,explore,study,periodic-table,molecules,lab,account,legacy-link}/index.js`, `study/study-api.js`, `pro-lab/pro-lab-api.js`, `periodic-table/view-modes.js`, `viewer/{viewer-host,viewer-stats}.js` |
| UI | `src/ui/tokens/*.css` (8), `src/ui/components/{feedback,overlays,toast}.css`, `overlay.js`, `toast.js`, `src/ui/layouts/app-shell.css`, `src/ui/utilities/dom.js`, `src/ui/app.css` |
| Generated (committed, drift-checked) | `assets/ui/*` (now generated from `src/ui`), `assets/core/atomurus-core.js`, `assets/app/elements.json` |
| Dev harness | `dev/app-shell.html` (noindex) |
| Tools | `build-ui.mjs`, `build-core-bundle.mjs`, `build-app-data.mjs`, `build-app-bundle.mjs`, `audit-architecture.mjs`, `perf-baseline.mjs`, `test-a1-mutations.mjs` |
| Tests | `test-api-client`, `test-platform-adapter`, `test-auth-adapters`, `test-auth-bearer`, `test-core-contracts`, `test-architecture-boundaries`, `test-feature-lifecycle`, `test-viewer-lifecycle`, `test-app-bundle` (all `tools/*.mjs`); `e2e/a1-mobile.spec.js`, `e2e/a1-lifecycle.spec.js` |
| Docs | `docs/architecture/{README,auth,data,ui-and-mobile,performance,capacitor-preparation}.md`, this report, `a1-0-perf-{before,after}.json`, `a1-0-lifecycle-results.json`, `a1-0-screens/*.png` |

## 5. Modules migrated

| Legacy | Now | Effect |
| --- | --- | --- |
| `study-client.js` (255 lines, own `fetch`, **no timeout**) | 27-line shim → `src/features/study/study-api.js` on the core client | Same `window.AtomurusStudy` API, caching and error fields; gains 12 s/20 s timeouts (30 s for card generation and insights), bounded GET retries, canonical error kinds, no automatic write replay |
| `pro-lab-client.js` (82 lines, own `fetch`, no timeout) | shim → `src/features/pro-lab/pro-lab-api.js` | Same `window.AtomurusProLabApi`; solver calls get a 25 s timeout |
| `assets/ui/*.css` (hand-edited) | generated from `src/ui` | one source; imports cache-busted by content hash |
| Loaders | `app.html`, `study-boot.js`, `pro-lab.js` load `/assets/core/atomurus-core.js` first; hard-coded `?v=` stamps bumped | Immutable caches pick up the new files |
| Backend session resolver | `supabaseSessionFromRequest` accepts Bearer | dual auth, one `requireUser` |

Existing tests that read `study-client.js` as source (study-cloud, auth-provider,
insights, review) now read the shim **and** its implementation; no assertion was removed.

## 6–8. Remaining legacy (exact)

**Direct `fetch` left (12 calls, 9 files; was 14):**

| File:line | Call | Note |
| --- | --- | --- |
| auth-app.js:1504 | `/api/pro-lab/sessions` | duplicates `AtomurusProLabApi.listSessions` → migrate |
| auth-app.js:3050, assets/account-center.js:182 | `/api/billing/portal` | billing — keep explicit, migrate with the A1.5 entitlement work |
| auth-app.js:3447, assets/account-center.js:356 | `/api/private/dashboard` | migrate |
| pricing-page.js:643 | `/api/billing/checkout` | write, must never retry — migrate with `retry:false` semantics (default) |
| ads-gate.js:203 | `/api/ads-config` | web-only (ads never ship in the app) |
| assets/global-nav.js:217, i18n.js:381 | `/api/auth/logout` | **no timeout; `.finally()` can wait forever** → migrate first |
| auth-client.js:168 | generic `request()` (has a 20 s timeout) | stays until the legacy session UI is replaced by `WebAuthAdapter` |
| recaptcha.js:83 | contact form verify | web-only |
| viewer/runtime/molecule-viewer.js:262 | `/api/pro-lab/viewer/molecule` | page runtime; moves with the viewer port (A1.3) |

**Global listeners / timers / observers in legacy JS (unchanged by A1.0, not yet scoped):**
`window.addEventListener` 56 (15 files — atomic-viewer.js 14, periodic-table.js 9, molecule-viewer.js 8), `document.addEventListener` 68 (28 files), matching `removeEventListener` 11; `setInterval` 5 / `clearInterval` 9; `setTimeout` 70; `requestAnimationFrame` 24 / `cancelAnimationFrame` 5; `MutationObserver` 2, `ResizeObserver` 1, `IntersectionObserver` 5, `.disconnect()` 4.
These live in full-page runtimes where navigation reclaims them. New code only uses `createScope()`, which the gates prove is leak-free.

**Full-page navigations (`location.*`, 23):** auth 6, external/billing 4, account redirect 2, **legacy-migrable 11** (auth-app.js 8, study-save.js 4, auth-client.js 3, pricing-page.js 3, periodic-table.js 2, account-center.js, global-nav.js, pro-lab-discover.js 1 each). Auth and billing redirects are correct as full loads; the 11 migrable ones become router calls when their screens move into the AppShell.

**Still served by the web workspace, reached from the shell via `legacy-link`:** Insights, Atomic models, Calculators, Pro Lab analysis tools, Review session UI, Set detail, Notes/history, element pages.

## 9–10. CSS layers and `!important`

Total unchanged at **1 264** (sources counted once; generated `assets/ui` excluded). Heuristic classification: 678 on legacy-prefixed selectors (`.lc-/.ws-/.ps-`, body/html state), 88 inside media queries, 5 `[hidden]` guards, 5 reduced-motion guards, 488 unclassified. `public-shell.css` 583 + `atomurus-lab-console.css` 444 = 1 027 of them.
A1.0 adds **zero** (gated). Removal strategy: [`ui-and-mobile.md`](../architecture/ui-and-mobile.md#removing-css-accretion-strategy).

## 11–12. `app-workspace` size and large JS

`assets/app-workspace.css` 78 492 B (7 `!important`), unchanged. Largest JS unchanged (§1). The core bridge added to legacy pages is 15 398 B (5 908 B gzip); the old `study-client.js` it replaces on those pages was 8 341 B (1 634 B gzip).

## 13. Viewer lifecycle

New viewers mount through `src/features/viewer/viewer-host.js`: Three.js is imported on mount only, one renderer, one loop, paused in background and off-screen, DPR capped at 1.5 on mobile (starting value, to be benchmarked in A1.3), full dispose on leave. Measured (headless Chromium, SwiftShader WebGL, JS heap after forced GC):

| Procedure | Result |
| --- | --- |
| Molecule viewer open/close ×20 (AppShell) | always 1 renderer + 1 loop while open, 0/0 after close, no canvas left; heap 3.08 MB (cycle 1) → 3.31 (5) → 3.54 (10) → 3.60 (20); **+0.29 MB from cycle 5 to 20** |
| Background | zero WebGL draw calls while hidden, draws resume on visible |
| Navigation stress ×10 (Home → Study → Lab → Periodic → Molecule → Study) | 1 nav, constant shell listeners, 1 mounted feature, no viewer left; heap 3.38 → 3.80 MB (+0.42 MB over 8 rounds); median 162 ms per 6-route round |
| Auth stress ×5 (login → refresh → navigate → background → resume → logout) | 5 logins, 5 refreshes, 5 logouts, correct state each cycle, no page errors |
| Legacy molecule page, 20 molecule switches | `renderer.info` geometries 2 → 2, textures 0 → 0; heap 3.39 → 3.42 MB |

Legacy page runtimes are not ported yet (A1.3). Atomic models, isomerism and Pro Lab 3D: manual procedure documented in [`performance.md`](../architecture/performance.md); not automated in A1.0.

## 14. API client

`src/core/api/api-client.js`: `get/post/put/patch/delete`; AbortController timeouts (read 12 s, write 20 s, auth 20 s); kinds `NETWORK_ERROR · OFFLINE · TIMEOUT · ABORTED · UNAUTHORIZED · FORBIDDEN · NOT_FOUND · CONFLICT · RATE_LIMITED · CLIENT_ERROR · SERVER_ERROR · MALFORMED_RESPONSE`; GET retries ≤2 by default, hard cap 4; writes never replayed (one replay only with an `Idempotency-Key`, and no caller sends one until the backend honours it); short `Retry-After` honoured on reads; offline fails fast; bearer 401 → one refresh + one replay. One base URL: `''` on web, `https://atomurus.com` on native (localhost/relative refused).

## 15. Auth adapters

Web keeps HttpOnly/Secure/SameSite=Lax cookies and never touches a token. Native keeps the Supabase session in SecureStorage only, sends Bearer, refreshes single-flight and **persists the rotated refresh token**; an offline refresh keeps the session, a rejected one signs out and wipes storage. Backend: bearer and cookie both resolve through `supabaseSessionFromRequest` to the same Supabase `user.id`; a bad bearer never falls back to cookies; no `requireAndroidUser`. The token-issuing endpoint (`POST /api/auth/token`), CORS/CapacitorHttp and the `verifySameOrigin` bearer exemption are specified exactly for A1.1 in [`auth.md`](../architecture/auth.md#a11--exact-remaining-plan).

## 16. Storage architecture

PREFERENCE / CACHE / SECURE / CLOUD (+ UI_SESSION, LOCAL_STATE, SIGNAL). All 24 keys/prefixes in use are registered and classified; a gate scans the product for unregistered or credential-like keys. No token is ever in web storage. The Virtual Lab board and compare queue are device-local by design until they get a cloud model. See [`data.md`](../architecture/data.md).

## 17. Mobile breakpoints

360×740, 360×800, 390×844, 412×915, 432×960, landscape 844×390, desktop 1280×800 — all pass: no horizontal overflow, no right-edge clipping, bottom nav visible with 5 items ≥44 px, one scroll owner, header not clipped, primary CTA and list ends above the bottom bar, layout viewport = device width. Ten public pages (Home, Periodic Table, /app, Study, Review, login, pricing, calculators, explore, molecules) have no document overflow at 360 and 390.

## 18. Safe-area strategy

`--app-safe-*` = injected `--safe-area-inset-*` → `env(safe-area-inset-*)` → 0. Harness: top 0/24/32/48 × bottom 0/24/34/48 (6 combinations): brand below the status bar, nav above the gesture bar, toast above nav, sheet and its close button clear of the cutout, sheet content above the gesture bar, `Platform.getSafeArea()` reports the injected values.

## 19. Horizontal overflow

0 unexpected overflows across the matrix above. The periodic table's 18-column grid pans inside `[data-pan-x]` with ≥44 px cells (tested at 360×740).

## 20. Build

`npm run build` and `npm run validate` pass; `npm run ci` passes (now also runs `test:a1`). `npm run build:app` → `dist/app`: initial JS **48 352 B (18 644 B gzip)**, CSS 28 243 B (5 945 B gzip), 8 lazy feature chunks of 0.5–5.1 KB, Three.js 1 140 878 B vendored and lazy-only. `index.html` carries no SEO/OG/JSON-LD/ads. Budgets gated in `test-app-bundle`. `dist/` is gitignored, skipped by every site walker and scrubbed from the Netlify publish tree. Vite was evaluated; esbuild (already Netlify's function bundler) covers modules, splitting, dynamic import and hashing with one dependency and no framework — Vite remains an option if an HMR dev server is wanted in A1.2.

## 21. Tests

| Suite | Result |
| --- | --- |
| `npm run ci` (all 15 pre-existing suites + `test:a1` + validate) | **pass** |
| New Node suites | api-client 19/19 · platform-adapter 5/5 · auth-adapters 13/13 · auth-bearer pass · core-contracts 8/8 · architecture-boundaries 10/10 · feature-lifecycle 6/6 · viewer-lifecycle 7/7 · app-bundle 7/7 |
| New Playwright (`a1-mobile`, `a1-lifecycle`) | **28/28** |
| Full Playwright (138 tests) | 126 passed, 12 failed — the **same 12** as on `main` (§22) |
| Same 11 viewer tests with Three.js served locally (temporary, uncommitted URL swap) | **14/14** lab-access + viz-prototype pass on this branch |
| Mutation tests | **34/34 killed** (table below) |

Mutation results (`node tools/test-a1-mutations.mjs --markdown`). Two mutations first survived (#13 retry cap compared against its own constant; #4/#34 content clipped inside `overflow-x:hidden` without page overflow) and the gates were fixed before this run.

| # | Mutation | Caught by | Result |
| ---: | --- | --- | --- |
| 1 | safe top removed | a1-mobile "safe area top 48 / bottom 48" | killed |
| 2 | safe bottom removed | a1-mobile "safe area top 48 / bottom 48" | killed |
| 3 | CTA/content covered by the bottom bar | a1-mobile "app shell 390x844" | killed |
| 4 | 360 px viewport overflows | a1-mobile "app shell 360x740" | killed |
| 5 | bottom nav gets 6 destinations | test-architecture-boundaries | killed |
| 6 | critical touch target < 44 px | a1-mobile "touch targets" | killed |
| 7 | keyboard covers the login CTA | a1-mobile "keyboard: login" | killed |
| 8 | modal leaves the viewport | a1-mobile "sheet and dialog" | killed |
| 9 | nested scroll traps the page | a1-mobile "app shell 390x844" | killed |
| 10 | feature calls fetch directly | test-architecture-boundaries | killed |
| 11 | Android sends /api to localhost | test-api-client | killed |
| 12 | request timeout removed | test-api-client | killed (timeout) |
| 13 | unbounded retries | test-api-client | killed |
| 14 | POST replayed automatically | test-api-client | killed |
| 15 | 401 treated as a generic error | test-api-client | killed |
| 16 | Android relies only on the web cookie | test-auth-adapters | killed |
| 17 | token written to localStorage | test-auth-adapters | killed |
| 18 | refresh token not renewed | test-auth-adapters | killed |
| 19 | logout keeps the stored session | test-auth-adapters | killed |
| 20 | web auth weakened (HttpOnly dropped) | test-auth-bearer | killed |
| 21 | web and Android get different user ids | test-auth-bearer | killed |
| 22 | Three.js loaded at bootstrap | build:app + test-app-bundle | killed |
| 23 | viewer keeps rendering after leaving | test-viewer-lifecycle | killed |
| 24 | animation frame loop duplicates | test-feature-lifecycle | killed |
| 25 | listeners are never removed | test-feature-lifecycle | killed |
| 26 | geometry not disposed | test-viewer-lifecycle | killed |
| 27 | texture not disposed | test-viewer-lifecycle | killed |
| 28 | feature stays mounted invisibly | test-feature-lifecycle | killed |
| 29 | new component depends on legacy CSS | test-architecture-boundaries | killed |
| 30 | new component uses !important | test-architecture-boundaries | killed |
| 31 | login creates its own tokens | test-architecture-boundaries | killed |
| 32 | mobile is the desktop scaled down | a1-mobile "app shell 390x844" | killed |
| 33 | periodic table zoomed out until illegible | a1-mobile "periodic table: list" | killed |
| 34 | Lab keeps two impossible columns at 360 px | a1-mobile "app shell 360x740" | killed |

### Performance baseline (before → after)

Headless Chromium, 390×844 @2x, local static server **without compression** (bytes are uncompressed), third parties blocked, median of 3 runs, machine idle. Lab numbers for comparison only — not field data. Study/Review/Pro Lab are measured as a guest. AppShell rows are the **unbundled** dev harness (`/dev/app-shell.html`, one request per ES module); the packaged figure is §20.

| Page | Transfer KB | JS KB | CSS KB | Req | DOM | Load ms | Long-task ms | Heap MB | FPS | Three |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 920.8 → 935.7 | 195.2 → 203.4 | 505.5 → 512.1 | 54 → 55 | 791 → 792 | 279 → 275 | 64 → 61 | 1.1 | — | no |
| Periodic Table | 1543.5 → 1558.4 | 627.8 → 636.1 | 635.4 → 642.1 | 58 → 59 | 1464 → 1465 | 339 → 358 | 122 → 105 | 1.5 | — | no |
| App (/app) | 1122.4 → 1137.6 | 605.8 → 614.4 | 339 → 345.7 | 47 → 48 | 454 → 455 | 198 → 224 | 0 | 1.5 | — | no |
| Study | 1122.4 → 1137.6 | 605.8 → 614.4 | 339 → 345.7 | 47 → 48 | 372 → 373 | 193 → 190 | 0 | 1.3 | — | no |
| Review | 1122.4 → 1137.6 | 605.8 → 614.4 | 339 → 345.7 | 47 → 48 | 237 → 238 | 160 → 177 | 0 | 1.3 | — | no |
| Pro Lab | 1122.4 → 1137.6 | 605.8 → 614.4 | 339 → 345.7 | 47 → 48 | 272 → 273 | 168 → 178 | 0 | 1.3 | — | no |
| Molecules | 1627.3 → 1642.3 | 845.1 → 853.4 | 507.5 → 514.1 | 58 → 59 | 479 → 480 | 299 → 300 | 287 → 277 | 3.7 | 61 | yes |
| Atomic Models | 1731.8 → 1746.8 | 915.7 → 924 | 507.5 → 514.1 | 58 → 59 | 510 → 512 | 525 → 585 | 303 → 370 | 3.8 → 3.9 | 61 → 62 | yes |
| AppShell · Home | 241.1 | 108.6 | 65.9 | 56 | 70 | 175 | 0 | 1 | — | no |
| AppShell · Study | 250.2 | 117.4 | 65.9 | 58 | 63 | 169 | 0 | 1 | — | no |
| AppShell · Periodic | 296.6 | 116 | 65.9 | 60 | 778 | 166 | 0 | 1.2 | — | no |
| AppShell · Molecules | 1363.8 | 1231.2 | 65.9 | 58 | 62 | 160 | 69 | 3.4 | 61 | yes |

Reading it honestly: public pages pay **+15 KB uncompressed (+1 request)** — the core bridge replacing a smaller client, plus the token/component additions and cache-busted imports. That is the price of timeouts and one error model on Study/Pro Lab; a first cut cost more and was trimmed (bridge 24 → 15 KB; app-only components kept out of `index.css`). Timing differences on legacy pages (±10–60 ms) are within run-to-run noise on this machine (an earlier run under load showed Atomic Models at 798 ms); no legacy runtime code changed. The AppShell renders with ~70 DOM nodes versus 237–791 on the legacy screens, and no long tasks outside the viewer.

## 22. Known blockers and honest limits

1. **12 Playwright failures exist on `main` and here, identically.** 11 (lab-access ×10, viz-prototype ×1) fail because this sandbox blocks `cdnjs.cloudflare.com`, so Three.js never loads; with Three served locally they pass (§21). 1 (`workspace.spec.js` "Pro walkthrough") fails deterministically on `main`: its locator `.ws-toast, [role="status"]` matches two toasts that are correctly visible together (strict-mode violation). It is a test bug outside A1.0 and was left for a separate fix.
2. **Native auth is architected, not live.** The bearer path works server-side; the token-issuing endpoint, CORS/CapacitorHttp choice, bearer exemption from `verifySameOrigin`, and the secure-storage plugin are A1.1.
3. **No real device, no soft keyboard.** Keyboard behaviour is simulated by shrinking the viewport (Android `adjustResize`); safe areas by injected variables; WebGL is SwiftShader. Physical-device QA is A1.6.
4. **App ID not fixed.** `com.atomurus.app` is a proposal awaiting owner confirmation (irreversible after a Play upload).
5. **Legacy remains** as listed in §6–8; `!important` count unchanged (no legacy screen was migrated off its CSS in this wave).
6. **Web still publishes the repo root.** `dist/web` was not introduced: moving Netlify's publish directory is a deployment change that deserves its own review. The app output is separate (`dist/app`).
7. **Hosted dev harness** (`/dev/app-shell.html` on atomurus.com) imports un-versioned `/src/*.js` modules under the site's immutable cache policy; it is a noindex dev page, and the packaged app uses hashed files.
8. **Offline** is a baseline (explicit states, cached element index, no white screen), not an offline product. The mutation queue needs backend `Idempotency-Key` support first.
9. **Pre-existing `npm audit` findings** were not triaged in this wave.

## 23. Next wave — A1.1 Auth, sync and native platform bridge

1. `POST /api/auth/token` (password + refresh grants, no cookies) + tests; bearer exemption from `verifySameOrigin`; CapacitorHttp vs CORS decision.
2. Keystore-backed secure storage plugin behind `createCapacitorSecureStorage`.
3. Migrate the two timeout-less logout calls, `auth-app` dashboard/pro-lab fetches, and checkout/portal onto the core client.
4. Backend `Idempotency-Key` for Study writes → persisted mutation queue + reconcile.
5. Deep-link handling (`atomurus://`, App Links) wired to `router.openDeepLink`.
6. Continuity test: web session and native session on the same Supabase user see the same Study Sets and progress.

Then A1.2 (mobile product UX on the AppShell: Study/Review/Pro Lab/element pages, removing legacy CSS screen by screen), A1.3 (port page viewers to the viewer host, DPR benchmarks, IndexedDB cache), A1.4 (Capacitor 8 / API 36 shell), A1.5 (Play Billing, notifications), A1.6 (device QA, internal test).

## Screenshots

`docs/reports/a1-0-screens/`: shell Home/Explore/Study/Periodic/Account/Lab at 390×844, periodic grid at 360×740, Study sheet at 360×740, safe area 48/48, login with keyboard (390×330), offline Study, landscape rail (844×390), desktop sidebar (1280×800).

## Definition of done

| Area | Status |
| --- | --- |
| Architecture: `src/core`, `src/features`, `src/ui`, platform abstraction, API client, no direct fetch in new code, web/native base URL, lifecycle, storage contract, sync contract | done |
| Auth: web cookie intact; native architecture defined; backend Bearer **done** (token endpoint = A1.1 with exact plan); same Supabase user; no tokens in web storage; refresh lifecycle covered; error mapping | done (native runtime pending A1.1) |
| Mobile: 360/390/412 usable; no overflow; bottom nav; touch targets; forms; dialogs; sheets; safe-area foundation | done in the AppShell; legacy screens unchanged |
| Performance: no 3D in shell; lazy strategy; viewer lifecycle; loop/listener/timer cleanup; memory procedures; baseline | done for new code; legacy runtimes documented |
| Design: tokens V2; Button; Input; Card; Dialog/Sheet; Toast; no parallel system; override strategy | done |
| Web safety: site, SEO, public pages, Functions, Stripe web, Supabase, EN/PT | no public page markup changed (only `/app`, which is noindex, gained one `<script>` for the core bridge); Functions changed only in the shared session resolver; `npm run ci` + 126 e2e pass; the 12 failing tests fail identically on `main` |
