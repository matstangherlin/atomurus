# Atomurus UI V2 — shared chrome

**Scope:** Prompt 03. One product chrome for public, tool, and workspace **modes**. Layout is HTML. JavaScript does not rebuild the document when `#ps-shell` is already in the source.

Production pages still use Lab Console + `public-shell.css`. **Login** loads `assets/ui/index.css` (Prompt 04). Prompt 13 removed the hoist: layout is HTML only.

## Modes

| Mode | Pages | Shell in HTML | Runtime |
| --- | --- | --- | --- |
| **Public** | Home, Login, Pricing, About, docs, 404 | `#ps-shell` > topbar + `#ws-sidebar` + main | `global-nav.js` paints active/auth/drawer. Login CTA stays **Open lab**. |
| **Tool** | Calculators, Periodic Table, Explore, Viewer, Config, element pages | `#ps-shell` > `.topbar` + `#ws-sidebar` + `main.main` | Same sidebar. Viewer local nav is `.vz-tabs`. |
| **Workspace** | `/app` | Native `.ws-shell` / `#ws-sidebar` | Same sidebar markup. Context nav stays in main. |

Topbar is 64px (`--ps-topbar` / `--ui-topbar` / `--ws-topbar`). Sidebar is 248px. Brand copy in the DOM is **chemistry lab** (`data-i18n="common.brandTag"`), not a CSS `::after` on `v1.11`.

## Source of truth

```text
templates/chrome/
    brand.html              logo + chemistry lab (tool / docs)
    search.html             .ps-search → periodic-table
    public-sidebar.html      official #ws-sidebar (Laboratory + Account foot)
    viewer-local-nav.html   Viewer in-page tabs
    account-control.html
assets/global-nav.js        active, auth foot, mobile drawer
tools/inject-ui-chrome.js   replaces landing and tool asides with the official sidebar
```

`npm run build` runs the injector after isomerism variants and `patch-perf-async-css.js`. Committed HTML already contains the shell so local pages match production without a rebuild.

`/app` is skipped. `propostas/`, `dev/`, `docs/`, `templates/` are not walked.

## Account CTA

| Page | Topnav CTA |
| --- | --- |
| Login, 404 | Keep existing (**Open lab** → periodic table on login; 404 stays as authored) |
| Other public pages | **Account** → `login.html` |

Auth user chip is runtime. Do not fake it in HTML.

## `public-workspace.js` destination

| Function | After Prompt 03 |
| --- | --- |
| Create `.ps-shell` / move DOM | Build-time. **No hoist** (Prompt 13) |
| Public sidebar HTML | `templates/chrome/public-sidebar.html` |
| Move logo into topbar | Build-time |
| Brand `::after` | Real `.logo-tag` text; CSS `::after` is `none` |
| `normalizeLandingCta` | Baked in HTML; JS still runs as fallback |
| `ensureSearch` | Partial; JS if missing |
| `ensureStudyNav` / `ensureToolFoot` | Build-time; JS if missing |
| `markActive` | **Runtime** (`enhanceExistingShell`) |
| Mobile drawer | **Runtime** (landing: `atomurus-mobile-nav.js`; tools: existing `toggleMobileSidebar`) |
| Account / user chip | **Runtime** (`auth-sync`) |
| `loadLabGate` | **Runtime** (validate-site contract) |
| `polishCopy` | Runtime belt for leftover kicker marks (Prompt 14 cleaned the HTML source) |

When `#ps-shell` is already in the document, `enhanceExistingShell()` runs `markActive` / search / CTA / Study. There is no `ps-boot` hide and no document rebuild if the shell is missing (two compact `explore/viewer/methyl-isocyanate` pages keep their own chrome).

## What this step does not do

- Home content, login body, Viewer science, Periodic Table cells
- Loading `assets/ui/` on Home or `/app` (login loads it in Prompt 04)
- Removing `public-workspace.js` or `public-shell.css`
- New `!important` war (logo-tag still uses the existing override so Lab Console cannot resurrect `v1.11`)
- URL, SEO, auth, or i18n changes
- Protecting `/app` again

## Tests

- `npm run test:ui-v2` — templates, injector, key pages contain `#ps-shell` in **source**, `/app` does not
- `e2e/public-chrome.spec.js` — existing chrome lock
- `e2e/ui-v2.spec.js` — gallery + source-chrome on the six product pages
