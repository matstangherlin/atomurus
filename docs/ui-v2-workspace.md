# Atomurus UI V2 — Workspace `/app`

**Scope:** Prompt 12. `/app` loads UI V2 tokens. Study JS, Pro Lab science, auth, and Stripe are unchanged. `/app` stays a **public guest workspace**.

## What changed

`app.html` loads `assets/ui/index.css` and [`assets/layouts/workspace.css`](../assets/layouts/workspace.css) after `app-workspace.css`. It still does **not** load `public-shell.css` or emit `#ps-shell`.

Chrome only:

- HTML default theme is **light**, same as public pages. `localStorage.atomurus-theme` still wins after a toggle.
- `.ws-brand-name` Instrument Serif; body Inter Tight
- `.ws-btn-primary` stays **green** (`--color-brand` / `.ui-btn-accent`), never ink `.ui-btn-primary`
- Dialog confirm actions dual-class `.ws-btn-primary.ui-btn.ui-btn-accent`

Study-specific CSS stays in `workspace-foundation.css` / `app-workspace.css` (charts, review, library, Pro Lab).

## DOM / JS contract (do not break)

Keep:

- `#ws-shell`, `#ws-search-q`, `#ws-userchip`, `#ws-study-nav`, `#app-study`, `#ws-bottom`, `#ws-menu-btn`
- `workspace-logic.js`, `workspace-ui.js`, `auth-app.js`, `pro-lab.js`
- Guest `/app` (no `requireSession`, no `protect-app`)
- `noindex,nofollow`

## What this step does not do

- Protecting `/app` again
- Wrapping `/app` in `.ui-compat` or `.ui-root`
- Hoist / public-shell deletion (Prompt 13)
- Restyling 118 element pages
- Mass-rewriting study HTML in `auth-app.js`

## Tests

- `test:ui-v2` / `validate` — `app.html` loads UI V2 + `workspace.css`; still no `#ps-shell`; hydrogenium stays legacy
- `test:ux` — HTML default `data-theme="light"`
- `e2e/ui-v2.spec.js` — `/app` stylesheet includes `/assets/ui/`; brand Instrument Serif
- `e2e/workspace.spec.js` / `auth.spec.js` — `#ws-*` ids and guest `/app` stay
