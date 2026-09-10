# Atomurus access-model V2

Source of truth for who can use which Atomurus capability.

**Do not duplicate this matrix in page scripts.** Presentation (`assets/lab-tool-gate.js`) and entitlements (`plan-access` / `requireFeature`) must read:

- Server: [`netlify/lib/feature-catalog.mjs`](../netlify/lib/feature-catalog.mjs)
- Browser: [`assets/access-policy.js`](../assets/access-policy.js)

`tools/test-feature-catalog.mjs` fails CI if the two catalogs drift.

## Product rule

| Layer | Intent |
| --- | --- |
| **Open Lab (`public`)** | Explore and visualize chemistry. No account. |
| **Free account (`account`)** | Save, organize and continue learning. |
| **Pro (`pro`)** | Solve, simulate, analyze and experiment. |

Do not use Pro as “pay to see this page.” Use Pro as “pay to **do** something significantly more powerful.”

Official access values: `public` | `account` | `pro`.

Inventory is from HEAD `5a2703a` (UI V2) **before** this change. New state is this branch.

## Architecture

| Surface | Role |
| --- | --- |
| `FEATURES` / `LAB_TABS` / `PAGE_TOOLS` | Access + category for every live flag |
| `featuresForAccess({ signedIn, isPro, isAdmin })` | Builds the boolean map on the server |
| `accessForUser()` | Plan, trial, Stripe, then `features` |
| `requireFeature(request, key)` | Server gate. Session required. Flag must be true. Not a client spoof. |
| `/api/ads-config` | Always returns `features` for the current session (guest included) |
| `ads-gate.js` | Stores `state.features` + `isPro` |
| `assets/lab-tool-gate.js` | Overlay / PRO badge **presentation only** |
| `viewer/load-three.js` | Public 3D boots immediately. Pro viewers wait for a true flag |
| `assets/pro-features.js` `grouped()` | Merchandises **Pro-only** live tools |

Guest 3D used to fail in three places: feature flags, lab-tool-gate overlay, and the 3D boot waiting on ads + Pro. All three now treat educational viewers as `public` (`atomurusBootLabViewer`).

Molecule coordinates stay on a **static allowlist** (`netlify/lib/viewer-molecule-coords.mjs`). `GET /api/pro-lab/viewer/molecule` is public **and still validates `isSafeMoleculeKey`**. That is not a security bypass of Pro Lab solvers.

No new endpoints were invented.

## Calculator vs solver

| Kind | Meaning | Access |
| --- | --- | --- |
| **Calculator** | One formula, one direct result (molar mass, dilution, scientific, unit, ideal gas, pH) | `public` |
| **Solver** | Multi-step reaction / stoichiometry / thermo / formula / solution workflow with interpretation | `pro` |

## Viewer split (existing vs planned)

**Free today (educational viewer):** rotate, zoom, inspect, basic properties, switch model, basic labels, 2D/3D toggle.

**Pro today (separate tools, not hidden viewer chrome):** Advanced Element / Molecule / Atomic Compare, saved lab sessions.

**Planned Pro (not built):** multi-structure compare inside a viewer, advanced measurement, saved annotations, advanced overlays, multi-model analysis, persistent lab session on a viewer canvas.

## Matrix

FEATURE | PUBLIC | ACCOUNT | PRO | CURRENT STATE (HEAD `5a2703a`) | NEW STATE | RATIONALE
--- | --- | --- | --- | --- | --- | ---
Periodic Table | yes | yes | yes | public | public | Open lab. No paywall to see the table.
Element pages | yes | yes | yes | public | public | Open lab.
Periodic properties / heatmaps / trends | yes | yes | yes | public | public | Open lab.
Isotopes | yes | yes | yes | public | public | Open lab.
Explore articles | yes | yes | yes | public | public | Open lab. Explore never ran the lab-tool gate.
`labWorkspace` (`/app` shell) | yes | yes | yes | public | public | Guest workspace already existed; do not hide the product.
Molar Mass | yes | yes | yes | public (tab, no flag) | public | Direct calculator.
Dilution | yes | yes | yes | public (tab, no flag) | public | Direct calculator.
Scientific Calculator | yes | yes | yes | **account** | **public** | Direct calculator; was a login wall in front of a formula.
Unit Converter | yes | yes | yes | **account** | **public** | Same.
Ideal Gas | yes | yes | yes | **account** | **public** | Same.
pH / pOH | yes | yes | yes | **account** | **public** | Same.
Atomic Models | yes | yes | yes | **pro** | **public** | Educational 3D. Stop charging to see chemistry.
Molecules | yes | yes | yes | **pro** (+ molecule GET required Pro) | **public** (GET allowlisted, no `requireFeature`) | Teaching models are static files, not a solver.
Allotropes | yes | yes | yes | **pro** | **public** | Educational 3D.
Isomerism visualizations | yes | yes | yes | **pro** | **public** | Educational 3D. Explore isomerism articles were already public.
Public Element Compare (`/periodic-table/compare`) | yes | yes | yes | **pro** | **public** | Two-element educational compare. Advanced compare stays Pro.
`studyCloud` (library save / list) | no | yes | yes | **pro** | **account** | Continuity, not a solver.
Favorites | no | yes | yes | **pro** | **account** | Personalization.
Calculator history | no | yes | yes | **pro** | **account** | Continuity of runs the user already computed.
Study notes / tags | no | yes | yes | **pro** | **account** | Continuity.
Study Sets | no | yes | yes | **pro** | **account** | Organize what you already study.
Manual flashcards (`flashcards`) | no | yes | yes | **pro** | **account** | Manual cards. Generation is separate.
Study progress | no | yes | yes | **pro** | **account** | Continue where you left off.
Automated practice (`/api/study/cards/generate`) | no | no | yes | **pro** (via `studyCloud` / generate UI) | **pro** (`automatedPractice`) | Generated practice is study intelligence, not a manual card.
Smart Review | no | no | yes | pro | pro | Spaced review engine.
Focus Review | no | no | yes | pro | pro | Weak-card queue.
Study Insights | no | no | yes | pro | pro | Weak-concept / forecast.
Spaced repetition / advanced study stats | no | no | yes | pro | pro | Study intelligence.
Export PDF | no | no | yes | pro (not live) | pro (planned) | Not built. Flag remains pro.
Premium lessons | no | no | yes | pro (coming) | pro (planned) | Not built.
Ads-free | no | no | yes | pro | pro | Paid platform, not chemistry.
Reaction Workbench | no | no | yes | pro | pro | Solver.
Reaction balancer | no | no | yes | pro | pro | Solver API.
Stoichiometry / limiting reagent / yield | no | no | yes | pro | pro | Solver.
Public stoich / thermo calculator tabs | no | no | yes | pro | pro | Same solvers, public-lab chrome.
Formula Solver | no | no | yes | pro | pro | Solver.
Solution Builder | no | no | yes | pro | pro | Multi-step solution workflow.
Advanced Calculations | no | no | yes | pro | pro | Multi-scenario.
Pro Lab | no | no | yes | pro | pro | Experiment / analysis workspace.
Advanced Element Compare | no | no | yes | pro | pro | Multi-property analysis (up to 4).
Advanced Molecule Compare | no | no | yes | pro | pro | Composition analysis, not the molecule viewer.
Advanced Atomic Compare | no | no | yes | pro | pro | Electronic-structure analysis.
Saved Lab Sessions | no | no | yes | pro | pro | Persistent analytical sessions.
Admin console | — | — | admin | admin | admin | Operators only. Not a plan SKU.

`account` flags resolve to `true` when `signedIn || isPro` so a Pro/admin session still has the free-account layer.

## WHAT BECAME FREE

Open Lab (no account):

- Atomic Models, Molecules, Allotropes, Isomerism 3D
- Public Element Compare
- Scientific, Unit, Ideal Gas, pH (already-open Molar Mass and Dilution stay open)
- Periodic table, element pages, trends, heatmaps, isotopes, Explore (already public)

Guest must not see a PRO overlay, login wall, or hidden WebGL on those viewers.

## WHAT REQUIRES ACCOUNT

Signed-in free (after trial, or never subscribed):

- Study Library (save / list items)
- Notes and tags
- Study Sets
- Manual flashcards
- Calculator history
- Study progress / continue where you left off
- Preferences already in the browser stay local; cloud sync uses the existing study APIs only

## WHAT REMAINS PRO

Solve:

- Reaction Workbench, balancer, stoichiometry, limiting reagent, yield
- Formula Solver, Solution Builder, Advanced Calculations
- Public stoich and thermo tabs (same solvers)

Analyze:

- Advanced Element / Molecule / Atomic Compare
- Saved Lab Sessions

Study intelligence:

- Smart Review, Focus Review, Insights, spaced repetition, advanced stats
- Automated practice generation

Platform:

- Ads-free
- Admin console (not sold)

## PLANNED PRO FEATURES

Documented only. **Not implemented in this change.**

- Virtual Laboratory
- Guided chemistry experiments
- Reaction / solution / acid-base / gas-law / thermodynamics **experiments** (as simulations, distinct from the existing solvers)
- Advanced viewer measurement, overlays, multi-model analysis
- Saved molecular analysis / annotations on a viewer
- Study-sheet PDF (`exportPdf`)
- Premium study tracks (`premiumLessons`)
- Weak-concept detection and study forecasting beyond current Insights
- Automated practice beyond today’s canonical card generator

## Gates after this change

Free tools must not:

- show PRO
- run a blocking overlay
- hide WebGL
- ask for login

Pro tools still overlay on the public calculators page (stoich / thermo) and stay `requireFeature` on the server.

## Pricing

Copy only. The ladder is Open Lab → Free account → Pro. Pricing must not sell 3D viewers or basic calculators as Pro. Study Library / notes / Sets belong on the free-account layer, with “Everything in Free” on the Pro card.

## Tests

- `npm run test:plan` (includes `test-feature-catalog.mjs`)
- `npm run test:lab-access`
- `npm run test:pro-lab`
- `npm run test:study`
- `npm run test:ux`
- Playwright: `e2e/lab-access.spec.js`, `e2e/workspace.spec.js`, `e2e/solver.spec.js`, `e2e/pro-lab.spec.js`
