# Atomurus UI V2 — forensic audit

**Scope:** Prompt 01 only. No visual redesign. No functional changes.  
**Baseline commit:** `e933377` (`fix(test): freeze insights clock and align locked free-tier e2e`)  
**Captured:** 2026-09-09  
**Screenshots:** [`docs/ui-v2-baseline/`](ui-v2-baseline/)

This document maps how the current presentation layer is produced so Atomurus UI V2 can replace three coexisting generations **without adding a fourth**.

Identity that must be preserved (already present; not invented):

| Role | Value |
| --- | --- |
| Cream background | `#F2EFE7` (`--lc-bg`) |
| Paper surface | `#F8F5EC` (`--lc-paper`) |
| Ink | `#14120E` (`--lc-ink`) |
| Green | `#1E6A50` (`--lc-green`) |
| Editorial titles | Instrument Serif |
| UI / body | Inter Tight |
| Chemistry / data | JetBrains Mono |

Conceptual rule for the rest of the remessa: **scientific instrument, not developer console.**

---

## 1. Executive summary

Atomurus already has the right palette and type families. The problem is **three complete visual systems stacked on the same pages**.

1. **Lab Console (generation 1)** — `atomurus-lab-console.css` (~199 KB, 7 247 lines) plus auto-generated `assets/critical-lab.css`. Bloomberg/Mathematica chrome: numbered nav (`.lc-tn-no`), status ticker, 4px radius, 220px sidebar, `body { font-size: 13px }`.
2. **Public patch (generation 2)** — `assets/public-shell.css` (~51 KB, **578 `!important`**) plus `assets/public-workspace.js`. Injected into **325 / 334** HTML files. At runtime the script **hoists** `nav.lc-topnav` / tool `aside.sidebar` into a workspace-like `.ps-shell` grid, hides ticker chrome, and rewrites brand copy via `::after`.
3. **Study Workspace (generation 3)** — `assets/workspace-foundation.css` + `assets/app-workspace.css`. Coherent shell: 64px topbar, 248px sidebar, 6/10/16 radius, 44px controls. **Not** wrapped by public-shell (`validate-site.js` forbids it).

Public pages therefore **look** a bit like `/app` only because generation 2 wins a cascade war against generation 1 after the document loads. That is the architecture UI V2 must retire — not by adding `assets/ui/` on top and leaving the war in place, but by making `assets/ui/` the source of truth and deleting the war **last**.

Highest-risk findings (do not “fix” in Prompt 01):

- `html.lang-pt-pending [data-i18n] { visibility: hidden !important }` is inlined on almost every page. Combined with `html.lc-loading` (≤4s) and `html.ps-boot` (≤2.5s), a slow or failed i18n path can leave **Home mobile blank**. Prompt 12/14 must replace this.
- `/app` HTML defaults to `data-theme="dark"`; public pages default to `light`. Theme is shared via `localStorage.atomurus-theme` **only after the user toggles**. First-visit Public → Workspace is a theme jump.
- Product copy is not one source of truth: Home stats say **“5 Calculators”** / “5 instruments”; `calculators.html` has **8** `data-target` tools (molar, scientific, unit, ideal, dilute, ph, stoich, thermo). `terms.html` still says the Site does not offer accounts while auth, billing and `/app` exist. Compiled `assets/i18n/*.js` chunks lag `*.json` / HTML fallbacks.
- Login is a fourth micro-language: ~261-line inline `<style>`, `auth.access`, “secure HttpOnly cookie”, “managed authentication”, CTA **Open lab** (not Account). E2E **requires** that login CTA stay `/periodic-table`.
- Periodic Table still declares **DM Sans / DM Serif Display** and cream `#F0EDE6` in `periodic-table.css`; public-shell then `!important`-overrides brand to Instrument Serif.

**This document is the Prompt 01 baseline.** Prompt 02 lives in [`docs/ui-v2-design-system.md`](ui-v2-design-system.md) and `assets/ui/` — production pages are still on Lab Console + public-shell.

---

## 2. Interface families

Confirmed from HTML class names, stylesheet links, and `public-workspace.js` early-return — not assumed.

### Public (landing / docs / auth)

| Route | Shell origin | Notes |
| --- | --- | --- |
| `/` `index.html` | `nav.lc-topnav` → **landing hoist** | `lc-landing`, 4 `.lc-mod-card` |
| `/about` `/contact` `/privacy` `/terms` `/404` | landing hoist | `.lc-doc` |
| `/login` `/signup` `/forgot-password` `/reset-password` | landing hoist | Pretty URLs all serve `login.html` |
| `/pricing` | landing hoist **+ `app-workspace.css`** | Only public page loading workspace CSS |

Hoist trigger: `body > nav.lc-topnav`. Script builds `#ps-pub-sidebar` from scratch.

### Tools

| Route | Shell origin | Extra CSS |
| --- | --- | --- |
| `/periodic-table` heatmap/trends/compare/isotopes | **tool hoist** (`aside.sidebar` + `main.main` + `.topbar`) | `periodic-table.css` (~131 KB) |
| Element pages `periodic-table/*.html` | tool hoist | lab-console `.lc-el-*` + often PT CSS |
| `/calculators` | tool hoist | large inline + lab-console `.calc-*` |
| `/explore` hub | tool hoist | **~427-line inline** `.ex-*` + **also loads `periodic-table.css`** |
| `/explore/<article>` | tool hoist | `explore-article.css` (`.art-*`) |
| `/config` | tool hoist | **loads `periodic-table.css` for visual convenience** |
| `/viewer/*` atomic-models, molecules, allotropes, isomerism | tool hoist | huge inline on atomic-models / molecules |

Hoist trigger: `body > aside.sidebar` **and** `body > main.main` with `:scope > .topbar`. Brand `.logo-wrap` is **moved** into the topbar.

### Workspace

| Route | Shell | Extra CSS |
| --- | --- | --- |
| `/app` `app.html` | native `.ws-shell` | foundation + `app-workspace.css` |

`public-workspace.js` returns immediately on `/app`. `validate-site.js` fails CI if `app.html` loads `public-shell.css`.

### Out of product chrome

- `propostas/` — design explorations; inject-public-shell skips the directory. Not linked from production HTML.
- `hanzi-logic/` — unrelated CSS; ignore for UI V2.

### Desktop vs mobile (confirmed)

| Concern | Public / tools | Workspace |
| --- | --- | --- |
| Desktop hamburger | Hidden when sidebar is in the grid (`public-chrome.spec.js` asserts calculators desktop hamburger hidden) | `#ws-menu-btn` exists; sidebar persistent ≥860px |
| Mobile nav | Landing: `.lc-mobile-hamb` + `#lc-mobile-menu`. Tools: `.mobile-menu-btn` slides `aside.sidebar` | Bottom nav 64px + drawer (`max-width: 860px`) |
| Breakpoints | Lab/public **760 / 761** (off-by-one: `max-width: 760px` vs `min-width: 761px`). PT also 720 / 768 / 900 | Workspace **860px** |
| Topbar | Forced **64px** (`--ps-topbar` / `--ws-topbar`) | Same 64px |
| Sidebar width | Lab token 220px; shell **overrides to 248px** `!important` | 248px native |

Baseline screenshots show Public Home, Login, Pricing, Table, Calculators sharing the same topbar + sidebar language. `/app` is the same palette and type, with **workspace-native** brand markup (no `::after` brand patch) and a different Account chip.

---

## 3. CSS map

### Load order (who wins)

```
fonts.css
  → critical-lab.css          (blocking, tokens + above-the-fold lc-*)
  → atomurus-lab-console.css    (async via media=print onload, except /app and login which load it sync)
  → public-shell.css          (blocking, injected after lab-console link)
  → [page-specific]
```

`/app` is:

```
critical-lab → lab-console (sync) → workspace-foundation → app-workspace
```

`tools/build-critical-css.js` **slices** lab-console. Editing critical-lab by hand is overwritten on `npm run build`.

`tools/inject-public-shell.js` + `tools/patch-perf-async-css.js` inject shell CSS/JS into every HTML that already references lab-console, except `app.html` and `propostas/`.

### File inventory (production CSS, excluding `hanzi-logic` / `propostas`)

| File | Size | Lines | `!important` | Role |
| --- | --- | --- | --- | --- |
| `atomurus-lab-console.css` | 199 KB | 7247 | **445** | Generation 1. Four `:root` blocks (tokens + later WCAG overrides). |
| `periodic-table.css` | 131 KB | 4111 | 23 | Independent token set + DM fonts + 210px sidebar |
| `assets/public-shell.css` | 51 KB | 1895 | **578** | Generation 2 cascade war |
| `assets/app-workspace.css` | 37 KB | 1380 | 4 | Workspace components |
| `assets/critical-lab.css` | 18 KB | 710 | 4 | FOUC + first-paint tokens (stale vs later lab-console ink) |
| `explore-article.css` | 16 KB | 588 | 0 | Editorial article layout |
| `assets/fonts/fonts.css` | 9 KB | 181 | 0 | Inter Tight, Instrument Serif, JetBrains Mono, **also DM Sans / DM Serif** |
| `assets/workspace-foundation.css` | 3 KB | 150 | 0 | Charts / session cards; comment: *do not replace lab-console* |

**Approximate CSS shipped per family (uncompressed):**

| Family | Stack | ≈ KB |
| --- | --- | --- |
| Public docs | fonts + critical + shell + lab-console | ~277 |
| Pricing | public + `app-workspace` | ~314 |
| Periodic Table | public + `periodic-table.css` | ~408 |
| Explore hub | public + PT CSS + 427-line inline | ~408 + inline |
| Workspace | critical + lab-console + foundation + app-ws | ~257 (no shell) |

### Cascade war (why public-shell exists)

Lab-console loads **after** public-shell on most public pages (`media="print"` → `all`). Shell therefore uses `!important` to beat async lab-console. Comment in `public-shell.css`: *“Beat lab-console :root (loads async after this file).”*

Lab-console also contains nuclear layout fixes:

```css
html, body { max-width: 100vw; overflow-x: hidden; }
body * { max-width: 100%; }
```

Public-shell and tool CSS spend many rules undoing that.

### What public-shell hides or “corrects”

Hidden (`display: none !important`):

- `.lc-statusbar`, `.data-strip`, `.av-substrip`
- Bloomberg kickers/numbers: `.lc-tn-no`, `.nl-no`, `.vz-num`, `.sub-num`, `.calc-menu-num`, `.lc-mobile-menu-num`, `.lc-btn-primary .lc-kbd`, `.ex-kicker .pill`, hero/doc kicker `::before` / `.pill`
- `.ps-shell > .lc-topnav .lc-topnav-links` (old inline nav; sidebar replaces it)

FOUC:

- `html.ps-boot body { visibility: hidden !important }` (removed when hoist finishes or after 2500ms)

Brand patches (not structural HTML):

- `.logo-tag { font-size: 0 }` + `.logo-tag::after { content: 'chemistry lab' }` (PT: `laboratório`) because the chip was hardcoded `v1.11` with CSS prefix `build `
- Instrument Serif forced on `.lc-topnav-name`, `.logo-text` with `!important`

Control patches: inputs/buttons forced to **44px** and `--ps-radius-md` (10px), including `#auth-email` — **e2e asserts `border-radius ≥ 10`**.

### Token drift inside lab-console

| Token | `critical-lab` / first `:root` | Later lab-console `:root` (WCAG rounds) |
| --- | --- | --- |
| `--lc-ink-3` | `#8E8978` | `#5F5953` |
| `--lc-ink-4` | `#B2AC9C` | `#6A645E` |

First paint uses lighter muted ink; full stylesheet darkens it. `--lc-serif` is **used** (with DM Serif fallback) but **never defined** in the primary `:root`.

---

## 4. JS visual map

### `assets/public-workspace.js`

Early-return on `/app`. Adds `html.ps-boot`, timeout `release()` at 2500ms → `ps-ready`.

| Function | What it does | Classification |
| --- | --- | --- |
| Injected by `inject-public-shell.js` | CSS/JS tags in 325 HTML files | **BUILD-TIME** |
| `hoistLandingShell()` | Creates `#ps-shell`, `#ps-pub-sidebar`, `#ps-main`; **moves** all non-script `body` children into main | **LEGACY PATCH** (should be build-time HTML) |
| `hoistToolShell()` | Moves `.logo-wrap` into `.topbar`, hides `.breadcrumb`, wraps topbar+overlay+aside+main | **LEGACY PATCH** |
| `ensureSearch()` | Creates `.ps-search` form if missing | **LEGACY PATCH** / BUILD-TIME |
| `buildPublicSidebar()` | Hardcoded Laboratory nav HTML (Home…Study + Login/Settings/Pricing) | **LEGACY PATCH** (Prompt 03 partials) |
| `ensureStudyNav` / `ensureMobileStudyLink` / `ensureToolFoot` | Inserts Study + Login/Pricing into existing tool sidebars | **LEGACY PATCH** |
| `normalizeLandingCta()` | Rewrites `.lc-topnav-cta` to Account → `login.html` except `/login` and `/404` | **LEGACY PATCH** |
| `markActive()` | `.active` on sidebar links | **RUNTIME BEHAVIOR** (keep) |
| `polishCopy()` | `ATOMURUS` → `Atomurus`; strip `§` kickers | **LEGACY PATCH** |
| `loadLabGate()` | Injects `/assets/lab-tool-gate.js` | **RUNTIME BEHAVIOR** — **CI contract**: `validate-site.js` requires this string |
| `applyI18n()` | Re-apply translations on hoisted DOM | **RUNTIME BEHAVIOR** |
| Password / auth / billing | none | not this file |

**Does not `remove()` nodes.** Layout is move + wrap.

**If the script disappeared today:**

- No `.ps-shell` grid → public-chrome e2e fails (`.ps-shell` visible, grid areas, brand in topbar).
- Landing pages keep Bloomberg ticker (hidden only by CSS, but sidebar would be missing).
- Tool pages keep brand in the sidebar, breadcrumb visible, no unified search.
- Landing CTA stays “Open lab” on Home/About/Pricing (e2e expects Account).
- `lab-tool-gate.js` might not load → validate-site + calculator gates.

### Other layout-touching scripts (not hoist)

| Script | Visual role |
| --- | --- |
| Inline theme/lang boot on every HTML | Sets `data-theme`, `lang-pt-pending` |
| `i18n.js` (defer) | Fills `[data-i18n]`; race vs 120ms pending timeout |
| `atomurus-mobile-nav.js` | Landing hamburger / drawer |
| `auth-login.js` / `auth-client.js` | Panels, overlay `#auth-session-boot`, submit states |
| `workspace-ui.js` | `/app` sections, dialogs, toasts |
| `cookie-consent.js` | Banner (e2e pre-rejects) |
| Viewer Three.js loaders | Canvas; gated; do not restyle in V2 |

### Build pipeline that already exists (Prompt 03 leverage)

There is **no `templates/` directory**. Chrome is duplicated in HTML and then mutated in JS.

Node already:

- `bump-version.js` — cache-bust query strings
- `build-i18n.js` + `assets/i18n/*.json`
- `inject-public-shell.js` — string replace on 325 files
- `build-critical-css.js` — CSS slice
- `build-element-content-chunks.js`, isomerism generators, home preview data

**Simplest Prompt 03 path:** HTML partials assembled by a small Node injector (same style as `inject-public-shell.js`), not a new framework.

---

## 5. Current tokens

### Colors

**Canonical (keep):**

| Token | Light | Dark |
| --- | --- | --- |
| `--lc-bg` | `#F2EFE7` | `#0E0D0C` |
| `--lc-paper` | `#F8F5EC` | `#16140F` |
| `--lc-surface` | `#ECE7DA` | `#1E1B16` |
| `--lc-rule` | `#D8D2BF` | `#2E2A22` |
| `--lc-ink` | `#14120E` | `#F2EFE7` |
| `--lc-ink-2` | `#58544A` | `#908A7C` |
| `--lc-green` | `#1E6A50` | `#34A872` |
| `--lc-green-soft` | `#DEE9DF` | `rgba(52,168,114,.14)` |
| `--lc-amber` | `#B96B0C` | `#E8941C` |

Aliases `--bg`, `--surface`, `--text-1`, `--accent` point at the same values **except in `periodic-table.css`**, which redefines `--bg: #F0EDE6`, `--text-1: #12100E`, `--accent-2: #D97706` (not lab amber), `--radius: 10px`, `--sidebar-w: 210px`.

**Duplicates / extras:**

- `--purple` / `--purple-light` in lab-console (molecules/allotropes pills; public-shell restyles active pills to green — e2e forbids leftover purple).
- `--ws-danger: #9A4338` / dark `#E08A82`
- Login/pricing error red hardcoded `#B03A2E` / `#8a2a20`
- PT category tokens `--c-nonmetal` … `--c-actinide` (scientific; belong with the table, not global UI)

### Typography

| Role | Specified | Actual drift |
| --- | --- | --- |
| Display / editorial | Instrument Serif | Also DM Serif Display in PT + `--lc-serif` fallback |
| UI | Inter Tight `--lc-sans` | PT `body { font-family: 'DM Sans' }` |
| Mono | JetBrains Mono (`--lc-mono`) | DM Mono listed as fallback in critical-lab |
| Body size | — | Lab `13px`; workspace 14px buttons; shell forces 14px inputs |
| Brand | Instrument 22px (shell `!important`) | PT `.logo-text` wants DM Serif 17px |

Mono is over-used on Public for HUD labels (`AUTH.ACCESS`, `LAB TOOLS`, `v1.11`, `ATOMURUS / LAB`). That is the “developer console” smell — not the font file itself.

### Spacing

Workspace already has a near-official scale: `--ws-space-1…6` = **4 / 8 / 12 / 16 / 24 / 32**.

Everywhere else: 6, 10, 14, 18, 22, 26, 28, 34, 40 appear as leftover evolution. Topbar padding is **18px** (not on the 4–64 scale). Login rail uses 22/26/28.

### Radius

| Token | Value | Where |
| --- | --- | --- |
| `--radius` | **4px** | lab-console (Bloomberg) |
| `--ps-radius-sm/md/lg` | **6 / 10 / 16** | public-shell |
| `--ws-radius-sm/md/lg` | **6 / 10 / 16** | workspace |
| `--radius` in PT | **10px** | periodic-table.css |

Literal radii still in CSS (count of declarations, production files): **8px (57), 999px (52), 4px (36), 6px (30), 10px (30), 7px (19), 2px (17), 12px (16), 3px (15), 14px (6)**. Login inline uses **18px / 22px** on `.auth-rail` / `.auth-stage`.

Prompt 02 should adopt workspace **sm/md/lg/pill** and stop new literals.

### Controls

| Control | Lab / PT | Shell override | Workspace |
| --- | --- | --- | --- |
| Input / select | often 28–38px, radius 4 | **44px**, radius 10 | 44px, radius 10 |
| Primary button | `.lc-btn-primary` ink fill, 4px | green `!important`, 10px | `.ws-btn-primary` green, 44px |
| Icon buttons | mixed | 40–44 | `.ws-icon-btn` 44 |
| Tabs / chips | `.pt-tab`, `.ex-pill`, `.vz-tab` | restyled green active | `.ws-*` pills |
| Checkbox | native / custom per tool | — | workspace settings |

### Shadows

Lab: `--shadow-sm/md/lg` cream-tinted. PT: heavier black shadows. Workspace: mostly borders, almost no drop shadow. Prefer workspace restraint.

### Breakpoints to unify later

`720` (PT, some lab), **`760/761` (public)**, `768` (foundation), **`860` (workspace)**, `900`. Prompt 03 should pick one mobile chrome breakpoint (recommend **860** to match `/app`, or keep 760 but delete the 761 off-by-one).

---

## 6. Duplicate components

Unique class prefixes in the **shared CSS files** (inline HTML styles add many more `.auth-*` / `.ex-*` / `.iso-*`):

| Prefix | Unique classes in CSS files |
| --- | --- |
| `.ws-` | 202 |
| `.lc-` | 135 |
| `.calc-` | 48 |
| `.scc-` | 26 |
| `.art-` | 22 |
| `.mol-` | 21 |
| `.nav-` / `.logo-` | 11 / 4 (tools sidebar, shared with hoist) |
| `.ps-` | **8** (thin wrapper around hoisted DOM) |
| `.ex-` | 7 in CSS files — **Explore hub lives in a 427-line `<style>`** |
| `.auth-` | 6 in CSS files — **Login lives in a 261-line `<style>`** |

### Unification matrix (Prompt 02 targets)

| Concept | Implementations today |
| --- | --- |
| Primary **product** button | `.lc-btn-primary` (ink, then shell→green), `.auth-primary-btn`, `.ws-btn-primary`, pricing CTA, `.dl-action-btn` |
| Scientific **run** button | `.calc-btn-run`, various `.vc-btn` / `.mzc-btn` / `.iso-*-btn` |
| Ghost / secondary | `.lc-btn-ghost`, `.ws-btn-secondary`, `.ws-btn-ghost`, `.auth-subtle-btn` |
| Destructive | `.ws-btn-danger` only (workspace) |
| Text input | `.lc-form input`, `.auth-panel .lc-form input`, `.calc-input`, `.ws-input` / `.settings-input`, `.mol-search` |
| Select | `.calc-select`, `.lc-form select`, workspace selects |
| Card | `.lc-mod-card`, `.price-card`, `.ex-card`, `.ws-card`, `.lc-doc-card`, `.mol-card`, `.ws-session-card`, viewer panels |
| Badge | `.price-popular`, `.ws-badge`, PT `$` Pro marks, `.pill`, Explore `.ex-pill` |
| Alert / feedback | `.feedback.ok/.err` (auth), `.price-checkout-err`, `.ws-toast`, `.ws-solver-error` |
| Empty / loading | `#app-loading`, `#auth-session-boot`, `html.auth-checking`, various tool empty copy |
| Dialog | `#ws-dialog-host` (workspace); PT modal; no shared public dialog |
| Search | `.ps-search`, `.ws-search`, PT `.search-box`, `.ex-search`, `.mol-search` |
| Topbar | `.lc-topnav` (patched), `.topbar` (tools), `.ws-topbar` |
| Sidebar | generated `#ps-pub-sidebar`, tool `aside.sidebar`, `#ws-sidebar` |
| Tabs | `.pt-tab`, `.vz-tab`, `.calc-menu-item`, `.ex-pill`, `.ws-nav` section tabs |

**Prompt 02 official set** (do not create a fifth name): `.ui-btn` / `-primary` / `-secondary` / `-accent` / `-danger`, `.ui-input` / `.ui-select` / `.ui-textarea` / `.ui-field` / `.ui-field-error`, `.ui-card`, `.ui-badge`, `.ui-alert`, `.ui-empty-state`, `.ui-spinner`. Compatibility aliases for `.lc-btn-primary` and `.ws-btn-primary` marked `/* UI-V2 COMPAT */`.

Accent (green) = Calculate / Run / Apply. Primary = Account / Sign in / Save / Upgrade.

---

## 7. Pages with CSS inline

`style=""` attributes: **4 552** across 334 HTML files (many are scientific canvas/layout on element and viewer pages — do not mass-delete).

**Structural `<style>` debt (lines inside `<style>`, key surfaces):**

| Page | Style lines | Why it exists |
| --- | --- | --- |
| `viewer/atomic-models.html` (+ `.pt.html`) | **1036** (max block 580) | Entire viewer UI in the document |
| `explore.html` / `.pt.html` | **429** | Hub cards/pills independent of Explore articles |
| `viewer/molecules.html` | **340** | Molecule chrome |
| `login.html` | **262** | Auth layout + fields + feedback |
| `isomerism.html` and constitutional/spatial pages | **190–234** | Isomerism chrome |
| `viewer/allotropes.html` | **203** | Allotrope chrome |
| `calculators.html` | **103** | Calculator extras on top of lab-console |
| `pricing.html` | **46** | Plan grid, toggles, checkout error |
| `config.html` | 33 | Settings extras |
| Almost every HTML | 1–8 | `lang-pt-pending` + theme icon swap + `lc-loading` |

**Login also has 3 `style=""` attributes.** Pricing has 9.

Every public HTML repeats the same boot `<style>` for i18n pending + theme icons. That is a **build-time partial**, not a design-system component.

---

## 8. Pages with the highest debt

Ranked by “how many visual systems + how much unique CSS + how hard to migrate”:

1. **Periodic Table family** — PT tokens + lab-console + public-shell + hoist + scientific grid. Do not restyle cells in Prompt 02–03.
2. **Viewer / atomic-models** — 1k lines inline + WebGL + Pro gate. Migrate chrome only.
3. **Calculators** — 8 instruments, `.calc-*` + `.scc-*` scientific calculator, Pro Lab cards, 49 inline styles.
4. **Login** — isolated `auth-*` language + inline CSS + auth DOM contract + e2e CTA exception.
5. **Explore hub** — looks like a separate site (`.ex-*` inline); articles already closer (`explore-article.css` + Instrument Serif).
6. **Pricing** — public-shell + **workspace CSS** + inline plan cards. Product truth mixed with layout.
7. **Home** — visually closest to V2 after hoist, but HUD copy (`v1.11`, `4 live`, `5 Calculators`) and `lang-pt-pending`.
8. **Legal (terms/privacy/about fallbacks)** — layout is `.lc-doc` (OK); **copy contradicts accounts**.
9. **Workspace `/app`** — lowest visual debt; align tokens/theme default; promote generic `.ws-btn` into `assets/ui`.

---

## 9. Legacy CSS dependencies (what blocks deleting Lab Console)

Cannot remove `atomurus-lab-console.css` until **all** of these have moved:

| Dependency | Evidence |
| --- | --- |
| `--lc-*` tokens | `/app` and articles consume them; workspace comments say do not replace lab-console |
| `.lc-*` HTML | ~128 unique class names in HTML; element pages `.lc-el-*` dominate volume |
| FOUC `html.lc-loading` | `critical-lab.css` + inline 4s timeout; `smoke`/validate expect async lab CSS on index |
| `.lc-topnav-mark` | Even `app.html` uses the lab brand mark class |
| Tool CSS assuming lab tokens | `.calc-*`, `.iso-*`, `.mol-*` inside lab-console itself |
| `validate-site.js` | Requires `critical-lab.css`, async lab-console on index, **no** public-shell on app |
| `public-shell.css` | Entirely a patch **on top of** lab-console selectors |

**`periodic-table.css` cannot be deleted** until the table grid, heatmap, trends, compare, isotopes, and element modal have a new home. Category colors are scientific, not chrome.

**`public-shell.css` cannot be deleted** until hoist is replaced by build-time chrome **and** lab-console Bloomberg rules are gone (or unused).

**`public-workspace.js` cannot be deleted** until: (1) HTML already has `.ps-shell` (or V2 shell), (2) `lab-tool-gate.js` is loaded another way, (3) e2e `public-chrome.spec.js` is updated, (4) `validate-site.js` assertion is updated.

---

## 10. Risks

| Risk | Why it matters |
| --- | --- |
| Hoist FOUC / 2.5s blank | `ps-boot` hides `body` |
| `lang-pt-pending` | `visibility:hidden` on all `[data-i18n]` trees; 120ms timeout vs deferred `i18n.js`; **Home mobile can stay invisible** if class is not cleared |
| `lc-loading` 4s | Same visibility trick for async CSS |
| Theme default mismatch | `app.html` `data-theme="dark"` vs public `light`; no `prefers-color-scheme` fallback |
| E2E chrome contracts | `.ps-shell`, Instrument Serif brand, green `rgb(30, 106, 80)`, hidden tickers, login CTA **Open lab**, auth `#auth-*` IDs, `#ws-*` |
| Auth DOM | Any Prompt 04 restyle must keep IDs/handlers (see § Login contract) |
| `body * { max-width: 100% }` | Breaks some tool layouts; do not copy into V2 |
| Product truth | 5 vs 8 calculators; terms “no accounts”; stale `about.js` vs `about.json` |
| EN fallback `Visualizador` | `login.html` topnav/footer hardcoded PT word; `common.nav.visualizador` EN dictionary is “Viewer” but HTML fallback is Portuguese |
| Pricing loads `app-workspace.css` | Mixing `.ws-*` on a public page; Prompt 05 must stop this |
| Do not run `npm run build` casually | `bump-version.js` mutates hundreds of HTML cache-bust query strings |

---

## Login — DOM CONTRACT (do not break)

Pretty URLs: `/login`, `/signup`, `/forgot-password`, `/reset-password` → `login.html`.

**HTML / classes**

- `html.auth-checking` (hides panels, shows boot)
- `#auth-session-boot` + `.auth-session-boot`
- Panels: `#auth-panel-login` `#auth-panel-signup` `#auth-panel-recover` `#auth-password-panel`
- `data-auth-panel="login|signup|recover|reset"`
- `data-auth-route="login|signup|recover"`
- Forms: `#auth-login-form` `#auth-signup-form` `#auth-reset-form` `#auth-password-form`
- Submit: `#auth-login-submit` `#auth-signup-submit` `#auth-reset-submit` `#auth-password-submit`
- Inputs: `#auth-email` `name="identifier"`; `#auth-password`; signup `#auth-signup-name` `fullName`, `#auth-signup-username`, `#auth-signup-email`, `#auth-signup-password`, `#auth-signup-password-confirm`; recover `#auth-reset-email`; reset `#auth-new-password`
- Feedback: `#auth-login-ok` `#auth-login-err` `#auth-signup-ok` `#auth-signup-err` `#auth-reset-ok` `#auth-reset-err` `#auth-password-err`
- `[data-password-toggle]` `[data-pw-for]` `[data-req="length|special"]`
- Scripts: `auth-sync.js`, `auth-client.js`, login page handlers (password visibility, panel routing)
- Overlay/boot copy uses `common.auth.checkingSession` / signing-in strings

**E2E (`e2e/auth.spec.js`, `public-chrome.spec.js`)**

- Login CTA on **login page** remains **Open lab** → periodic-table (not Account)
- `#auth-email` visible; computed radius **≥ 10px**
- Wrong password unsticks submit; signup confirmation; recovery generic success; signed-in `/login` → `/app`; logout stays on `/app` as guest

**Copy to remove from the primary experience (Prompt 04, not 01):** `auth.access`, `secure HttpOnly cookie`, `managed authentication`, `provider`, `secure account flow`. Keep 30-day Pro trial on signup as secondary.

---

## Pricing — why workspace CSS + inline

`pricing.html` loads the **full public stack plus** `assets/app-workspace.css` (without foundation). Used for comparison layout (`.price-compare`, step lists) rather than a public card system.

Inline owns: `.price-grid`, `.price-card`, `.price-popular`, currency/period toggles, checkout error.

Product hierarchy in the live UI (do not invent): **Open Lab (no account) → Free account ($0) → Pro**. 30-day trial on new accounts. Prompt 05 must read `plan-access` / i18n/pricing — not rewrite benefits.

---

## Product-truth inconsistencies (for Prompt 05 / 10)

| Surface | Claim | Reality in code |
| --- | --- | --- |
| Home `modules.card3.m1` | “5 instruments” / stat **5 Calculators** | 8 calculator targets in `calculators.html` |
| Home `modulesVal` | “4 live” | Product has Study workspace + Pro Lab + Solver as additional pillars |
| `terms.html` fallback / `terms.js` | “The Site does not offer user accounts” | `terms.json` already has “Public access and optional accounts”; **compiled JS/HTML fallback stale** |
| `privacy.html` | “there is no login” | Auth + cookies exist |
| `about.html` fallback | “completely open, no accounts required” | `about.json` already mentions optional accounts; HTML/JS chunk may lag |
| Login EN HTML | `Visualizador` | `common.nav.visualizador` EN = “Viewer” |

Legal copy changes in Prompt 05 must stay **factual and minimal**; flag for human legal review.

---

## 11. Test baseline (BEFORE UI V2)

Ran **without fixing** anything. Did **not** run `npm run ci`’s `build` step (it rewrites cache-bust query strings across HTML).

### Node (`npm run test:*` + `validate`)

```
BASELINE BEFORE UI V2
passed:
  test:plan          plan-access, lab-tool-access
  test:auth          provider, flows, rate-limit, auth-sync
  test:study         study-cloud
  test:review
  test:insights      (frozen clock)
  test:billing       geo + lifecycle
  test:ux            workspace-ux
  test:pro-lab
  test:solver
  test:lab-access
  validate           Site validation passed
failed:              (none)
skipped:             (none)
warnings:
  Expected [auth-session] 401 JSON logs from guest session fixtures
```

### Playwright (`npx playwright test`, Chromium, 1 worker)

```
61 passed
0 failed
0 skipped
~49.9s
warnings:
  Node (node:…) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
  (environment, not product)
```

Coverage that **locks current chrome** (must update when Prompt 03/04 land, not ignore):

- `e2e/public-chrome.spec.js` — `.ps-shell`, Instrument Serif, green RGB, hidden tickers, login Open lab, input radius, dark+mobile
- `e2e/auth.spec.js` — login/signup/recover/logout guest `/app`
- `e2e/workspace.spec.js` — `#ws-*`, mobile 390×844, dark shots
- `e2e/a11y.spec.js` — skip link, dialog trap, toasts
- `e2e/lab-access.spec.js`, `pro-lab.spec.js`, `solver.spec.js`, `insights.spec.js`

### Visual baseline

36 viewport screenshots: 9 routes × {desktop, mobile} × {light, dark} in [`docs/ui-v2-baseline/`](ui-v2-baseline/).

Observed from those shots (qualitative):

- Public chrome **is already one family** after hoist (Home / Login / Pricing / Table).
- Login still reads as a **security dashboard** (AUTH.ACCESS, HttpOnly, provider).
- Home still advertises **5 Calculators**.
- `/app` is the cleanest instrument UI; Account chip vs public **Account** vs login **Open lab**.
- Periodic Table keeps dense scientific chrome (correct); brand matches after shell override.
- Mobile Home is visible in EN; **PT pending path was not the capture language** — still a production risk.

---

## 12. Recommended migration order

Matches remessa Prompts 02–15. Do not skip ahead to Experiments / PT VNext.

1. **Prompt 02 — `assets/ui/` design system**  
   Tokens (light/dark), type scale, spacing 4–64, radius sm/md/lg/pill, official components, **compat aliases**. Dev showcase page if it can stay out of production indexing. **No page redesign.**
2. **Prompt 03 — build-time chrome partials**  
   One topbar/sidebar/footer for public / tool / workspace **modes**. Generate HTML; stop using JS to wrap the document. Keep `public-workspace.js` as fallback until a later prompt. Topbar 64px, same brand **in the DOM** (no `::after`).
3. **Prompt 04 — Auth**  
   `login.html` uses tokens/forms/buttons/cards/shell only. Move leftovers to `assets/layouts/auth.css`. Preserve DOM contract. Update auth + chrome e2e + screenshots.
4. **Prompt 05 — Pricing + docs + 404**  
   Stop loading `app-workspace.css` on pricing. Fix account/Pro product-truth using existing plan config. Legal = factual minimum.
5. **Prompt 06 — Home**  
   Four pillars Explore / Visualize / Solve / Study. Kill HUD. Fix `lang-pt-pending`. Derive counts from catalog.
6. **Prompt 07 — Explore**  
   Hub + articles share cards/badges/nav; keep editorial measure.
7. **Prompt 08–11 — Tools in small batches**  
   Calculators → Config → Periodic Table chrome → Viewer family. Never change chemistry, WebGL, or gates. Tests after **each** batch.
8. **Prompt 12 — Workspace alignment**  
   Promote generic `.ws-*` into `assets/ui`. Keep study-specific CSS. Same theme preference as public.
9. **Prompt 13 — Remove the war**  
   Delete hoist, then unused public-shell `!important`, then unused `.lc-*`. Never mass-delete by grep.
10. **Prompt 14–15 — Product catalog, i18n, visual regression, final report**

Prompts 16–20 (Study entry points, PT VNext, Experiments, strategy) start **only after** Home → Login → Pricing → Explore → Table → Viewer → Calculators → App feel like one product.

### SAFE TO MIGRATE FIRST

- Create `assets/ui/tokens.css` (map `--color-*` → existing `--lc-*` values; do not invent a new green)
- Type, spacing, radius, focus, reduced-motion
- Official `.ui-*` components unused by production pages
- Compat aliases `.lc-btn-primary` / `.ws-btn-primary` → `.ui-btn-*`
- Internal showcase (noindex)
- Documentation (`docs/ui-v2-design-system.md`)
- Chrome **partials on disk** without switching inject yet

### MIGRATE LATER

- Login / signup / recovery presentation
- Pricing, about, contact, privacy, terms, 404
- Home copy + pillar layout
- Explore hub `.ex-*`
- Calculators / config
- Periodic Table **chrome** (not cell science)
- Viewer toolbars/panels
- Workspace token/theme default
- Then delete hoist / public-shell war / dead `.lc-*`

### DO NOT TOUCH YET

- Auth APIs, cookies, Stripe, plan gates, `lab-tool-gate.js` semantics
- Element datasets, heatmap math, isotope data
- Three.js / shaders / molecule coordinates
- URLs, canonicals, hreflang
- `npm run build` HTML rewriting as a “cleanup”
- `propostas/` (unused; verify then archive)
- Chemistry copy that is not contradicted by code

### POSSIBLE DEAD CODE — NEEDS VERIFICATION

Do **not** delete in Prompt 02. Verify with search + e2e + screenshots:

- Bloomberg numbers already `display:none` (`.lc-tn-no`, `.data-strip`, `.lc-statusbar`) — CSS still required until HTML stops emitting them
- `propostas/` CSS (~large) — not injected, not linked
- Compiled `assets/i18n/*.js` vs JSON (stale legal strings)
- `--purple` once pills are globally green
- `hanzi-logic/` if unused by production routes
- Duplicate pretty-URL HTML (`index.pt.html` vs `?lang=pt`) — i18n strategy, not this audit’s delete list
- `--lc-serif` undefined token

### Files removable **only at the end** (Prompt 13+)

| File | Remove when |
| --- | --- |
| `assets/public-workspace.js` hoist + DOM rewrite | Chrome is in the HTML; gate script loaded elsewhere |
| `assets/public-shell.css` | No lab-console Bloomberg left to override |
| `atomurus-lab-console.css` | Zero remaining `.lc-*` / `--lc-*` consumers **or** tokens rehomed and selectors gone |
| `assets/critical-lab.css` generation | Replaced by `assets/ui` critical path |
| Page `<style>` blocks listed in §7 | Each page migrated |
| Compat aliases | After last `.lc-btn-primary` / `.auth-primary-btn` consumer gone |

---

## Appendix A — public-workspace.js destination table (Prompt 03)

| Current function | Destination |
| --- | --- |
| Create `.ps-shell` / move DOM | **Build-time partials** |
| Public sidebar HTML | **Build-time** |
| Move logo into topbar | **Build-time** |
| Hide breadcrumb / ticker | Delete HTML or CSS in component; not JS |
| `::after` brand | Real text in HTML |
| `normalizeLandingCta` | Correct CTA in the partial (login exception = Open lab **or** product decision + e2e update) |
| `ensureSearch` | Partial |
| `markActive` | **Keep runtime** |
| Mobile drawer open/close | **Keep runtime** |
| Account / user chip state | **Keep runtime** (`auth-sync`) |
| `loadLabGate` | `<script defer>` in tool partial |
| `polishCopy` | Fix source copy in i18n/HTML |

---

## Appendix B — screenshot index

Paths relative to `docs/ui-v2-baseline/`:

- `desktop-light/{home,login,pricing,about,periodic-table,calculators,explore,viewer,app}.png`
- `desktop-dark/…`
- `mobile-light/…`
- `mobile-dark/…`

---

*End of Prompt 01 audit. Next implementation step is Prompt 02 (design system only), on top of this baseline.*
