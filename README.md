# Atomurus

Atomurus is a static chemistry site published on Netlify. The project mixes hand-authored HTML, shared runtime scripts, generated language variants, Netlify Functions and a large periodic-table knowledge base.

## Architecture

- Main pages live at the repository root, with section-specific content under `periodic-table/`, `viewer/` and `explore/`.
- The Netlify build runs `bump-version.js` and `build-i18n.js`, plus the helper scripts in `tools/`.
- Runtime translations are handled by `i18n.js`.
- Element pages use `elements-data.js`, `elements-data-en.js`, `element-page.js` and generated chunks in `assets/element-content/`.
- Authentication uses **Supabase Auth** through Netlify Functions. The browser API is `auth-client.js` (`window.AtomurusAuth`). See `SUPABASE-SETUP.md`.

## Remake 2026 (visual layer)

The public site follows the Claude Design "Atomurus — Remake" screens:

- **One top navigation, no sidebar.** `templates/chrome/site-header.html` and `site-footer.html` are written into every public page by `tools/apply-remake-chrome.js` (runs in `npm run build`, after `inject-ui-chrome.js`). Edit the templates, never the copies in the pages.
- **Design system:** `assets/remake/remake.css` (tokens, header/footer, primitives, and a skin for the legacy page components) and `assets/remake/site-nav.js` (dropdowns, mobile drawer, footer language/theme switches). Figtree is the only text face; old family names in `assets/fonts/fonts.css` are aliases to it.
- **Rebuilt pages:** home (`index.html` + `assets/remake/home.js`), articles index (`explore.html` / `explore.pt.html`), and the 118 element pages (`tools/remake-element-pages.js`, data baked from `elements-data.js` and `isotopes-data.js`). The periodic table, calculators, 3D viewers, articles, login and document pages keep their markup and scripts and are restyled by `remake.css`.
- **Data for the mini table:** `tools/build-remake-data.js` → `assets/remake/elements-lite.js` (also regenerates the tile colours block inside `remake.css`).
- **App shell (`src/`):** Home and Periodic table features follow the "App" screens; category colours live in `src/ui/tokens/colors.css`.
- Copy lives in `tools/i18n-dict-source.js` under `common.rm`, `home.rm`, `el.rm` and `explore.rm`.

## Build Flow

1. `node tools/build-element-content-chunks.js`
2. `node tools/generate-isomerism-pt-variants.js`
3. `node bump-version.js`
4. `node build-i18n.js`

Netlify runs the same flow through [`netlify.toml`](netlify.toml).

## Quality Checks

- `npm run build` regenerates derived artifacts.
- `npm run validate` checks deploy guards, generated PT variants, chunk output and required docs.
- `npm run ci` runs build, auth/plan/billing tests, and validation.

## Language Model

- Root pages are EN-default with generated `.pt.html` SEO variants.
- Element pages are PT-default with generated `.en.html` variants.
- Isomerism subpages now also have generated `.pt.html` variants for consistent `?lang=pt-BR` rewrites.

## Deployment Notes

- The repository still uses `publish = "."`, so deploy guards matter.
- `.netlifyignore` and `netlify.toml` block internal docs, tooling, backups, logs and archives from public delivery.
- Secrets must stay only in Netlify environment variables and local `.env` files excluded from Git.
