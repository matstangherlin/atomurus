# Atomurus UI V2 — product shell

## BEFORE

```text
Public shell (#ps-shell)
Tool shell (topbar without Account)
Workspace shell (#ws-shell)
Study as the umbrella for the private app
Account with two mixed cards
Pro features buried behind a single Lab item
```

Login felt like entering another product. Tool pages dropped the user chip. Study flattened Library / Sets / Review / Insights / Lab / History into one row.

## AFTER

```text
One global shell (64 × 248)
Auth-aware Account chip on public, tools, and /app
Workspace as the private umbrella
Study / Lab / Activity hierarchy
Account Center (Overview, Profile, Security, Plan & Billing, Preferences)
Pro feature catalog (assets/pro-features.js)
```

### Terminology

| Name | Meaning |
| --- | --- |
| Atomurus | The product |
| Laboratory | Public chemistry environment |
| Workspace | Personal authenticated area (`/app`) |
| Study | Study system inside Workspace |
| Pro Lab | Advanced suite inside Workspace |
| Atomurus Pro | Plan that unlocks the advanced set |

Product names stay **Workspace**, **Study Sets**, **Smart Review**, **Pro Lab**, **Chemistry Solver** in EN and PT.

PT UI labels: Laboratório, Estudo, Lab, Atividade, Conta. Product names are not translated.

### Auth continuity

`ads-gate.js` sets `html.auth-pending` until `/api/ads-config` returns. `/app` keeps pending until `auth-app.js` `markReady()` so Account does not flash into the display name. `i18n.js` paints the same chip and badge on every public/tool page. `lab-tool-gate.js` does not treat pending as guest.

Deep links keep `next=` (path + query). After login, `auth-client.safeNextPath` returns to section, tool, tab, element, molecule, or calculator.

### Discoverability

A Pro trial opening `/app` sees Study, Solve & Analyze (Chemistry Solver, calculations, Element Compare), Visualize, and a Lab CTA. Pro Lab home is grouped as Solve / Compare / Visualize / Sessions with deep links (`?tool=`).

Free still has Periodic Table, free calculators, and Explore. Pro structure is visible with `PRO` marks, not removed.

## Tests

- `e2e/shell-parity.spec.js` — topbar 64, sidebar 248, brand, search, theme, language, Account; Pro chip on Home and Periodic Table
- `e2e/workspace.spec.js` — Account Center plan CTAs, context nav
- `e2e/public-chrome.spec.js` — login Open lab exception
- `e2e/auth.spec.js` — `next=` including calculator query strings
- `npm run test:ui-v2` / `npm run validate`

## Metrics (source)

- One shared account control template instead of landing CTA vs missing tool CTA
- Injector patched 323 HTML files that already had `#ps-shell`
- No DOM reparenting (`hoistToolShell` remains absent)
- Pending auth hides the chip with reserved width (no Login → Matheus swap)
- Workspace context nav is two rows (parent then local), not a flattened Study strip
