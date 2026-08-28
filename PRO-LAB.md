# Atomurus Pro Lab V1

Pro Lab is the analysis workspace on top of the public chemistry lab. Free tools stay free. Pro adds batch comparison, saved sessions, and Study Cloud hand-off.

## Product split

**Free — explore and calculate chemistry**

- Periodic Table, 118 element pages
- Basic two-element compare on the heatmap (unchanged, two slots)
- Trends and isotopes
- Public calculators (molar mass, dilution, ideal gas, pH/pOH, scientific)
- Atomic models
- Molecule viewer
- Explore and public content

**Pro — analyze, compare, organize, and save**

- Advanced Calculations (batch scenarios + pin + save)
- Element Compare Pro (up to 4 elements, custom properties, one-property chart, save)
- Molecule Compare Pro (side-by-side, canonical composition only)
- Atomic Compare Pro (electronic structure side-by-side)
- Saved Lab Sessions (server-side, RLS)
- Send selected elements/molecules to a Study Set and generate canonical flashcards

Trial (first 30 days) = full Pro Lab.

## Entitlements

Defined in `netlify/lib/plan-access.mjs`. All currently follow `isPro`, but they are separate keys:

| Feature | Meaning |
|---|---|
| `proLab` | Workspace section and discovery |
| `advancedCalculations` | `POST /api/pro-lab/calculate` |
| `advancedElementCompare` | Element compare API |
| `advancedMoleculeCompare` | Molecule compare API |
| `advancedAtomicCompare` | Atomic compare API |
| `savedLabSessions` | Session CRUD |

Server authority is `requireFeature(...)`. Unsigned → `401 session_expired`. Free → `403 feature_locked`. Trial / paid / admin → allowed.

The frontend must not call Pro APIs when `features.proLab === false`. It still cannot bypass the server.

## Navigation

`/app?section=pro-lab` with optional `tool=calculations|elements|molecules|atomic|sessions`.

Sidebar: Pro Lab after Smart Review. Overview shows a small Pro Lab card (smaller than the Smart Review hero).

## APIs

Private responses use `Cache-Control: no-store`.

| Method | Path | Feature |
|---|---|---|
| GET, POST | `/api/pro-lab/sessions` | `savedLabSessions` |
| GET, PUT, DELETE | `/api/pro-lab/session` | `savedLabSessions` |
| POST | `/api/pro-lab/calculate` | `advancedCalculations` |
| GET, POST | `/api/pro-lab/elements/compare` | `advancedElementCompare` |
| GET, POST | `/api/pro-lab/molecules/compare` | `advancedMoleculeCompare` |
| POST | `/api/pro-lab/atomic/compare` | `advancedAtomicCompare` |

Clients send identifiers only (atomic numbers, molecule ids, numeric inputs). The server resolves canonical data. Spoofed masses and molecular properties from the browser are ignored.

No `eval`, `new Function`, or executable payloads. Scientific calculator is not in batch mode.

## Session schema

Table `public.pro_lab_sessions` (migration `009_pro_lab_sessions.sql`):

- `id` uuid
- `user_id` uuid → `profiles(id)` on delete cascade
- `session_type` `calculation | element_compare | molecule_compare | atomic_compare`
- `title` 1–120 chars
- `state` jsonb object, max 24576 bytes, validated per type
- `created_at`, `updated_at`

RLS policies use `(select auth.uid()) = user_id` for select/insert/update/delete.

Quota: **200 sessions / user**. Updates do not consume create quota.

## Canonical data sources

- Calculators: `netlify/lib/chemistry-calc.mjs` (IUPAC 2024 atomic weights copied from the public calculator page, `C1V1=C2V2`, `PV=nRT` with `R=8.314`, `Kw=1e-14` at 25 °C)
- Elements: `elements-data.js` (`ELEMENTS`, `ELEMENT_LATIN`, `EXTRA`, `EXTRA2`, `IONIZATION`)
- Molecules: catalog in `netlify/lib/canonical-molecules.mjs` plus molar mass from the shared calculator
- Atomic shells / configuration: `EXTRA.shells` and `EXTRA.econfig`

Missing values render as `—`. Nothing is invented.

## Deliberately not in V1

- Bond length / bond angle measurement (3D coordinates are visualization aids)
- Invented molecular properties (boiling point, polarity, toxicity, …)
- Scientific calculator batch mode
- Chart.js / extra 3D engines on `/app`
- AI tutor, chat, LLM
- Sync camera for atomic models (Bohr diagrams are static SVG)

## Public discovery

Discrete CTAs on calculators, heatmap, molecule viewer, and atomic models. Unsigned visitors get an Unlock dialog (`next` preserved). Free users get Upgrade. Trial/Pro open the tool.

## Tests

```bash
npm run test:pro-lab
npm run test:plan
npm run test:e2e
```
