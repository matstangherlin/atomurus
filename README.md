# Atomurus

Atomurus is a static chemistry site published on Netlify. The project mixes hand-authored HTML, shared runtime scripts, generated language variants, Netlify Functions and a large periodic-table knowledge base.

## Architecture

- Main pages live at the repository root, with section-specific content under `periodic-table/`, `viewer/` and `explore/`.
- The Netlify build runs `bump-version.js` and `build-i18n.js`, plus the helper scripts in `tools/`.
- Runtime translations are handled by `i18n.js`.
- Element pages use `elements-data.js`, `elements-data-en.js`, `element-page.js` and generated chunks in `assets/element-content/`.
- Authentication uses **Supabase Auth** through Netlify Functions. The browser API is `auth-client.js` (`window.AtomurusAuth`). See `SUPABASE-SETUP.md`.

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
