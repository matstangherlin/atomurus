# UI V2 and mobile foundation (A1.0)

## Design System V2 — one source

`src/ui` is canonical; `assets/ui` is generated (`npm run build:ui`, drift
check in CI). Pages link `assets/ui/index.css` as before; each `@import` now
carries a content hash because `/assets/*` is served `immutable` for a year.

```text
src/ui/tokens/     colors · typography · spacing · radius · elevation · motion · layout · safe-area
src/ui/components/ base · typography · buttons (+ IconButton) · forms · cards · badges · states
                   · navigation (Tabs) · dialogs · tables · utilities · compat
                   app-only (not in index.css yet): feedback (Skeleton/Loading/Error) · overlays (Sheet/Dialog) · toast
                   JS: overlay.js (Sheet/Dialog with focus trap) · toast.js
src/ui/layouts/    app-shell.css (mobile / tablet / desktop)
src/ui/utilities/  dom.js (text-safe element builder, scope-bound listeners)
```

Identity is unchanged: cream paper `#F2EFE7`, ink `#14120E`, laboratory green
`#1E6A50` / `#34A872`, muted earth tones. All 88 pre-A1.0 tokens keep their
exact values (checked when the file was split). Type roles: Instrument Serif
for titles/elements/headline numbers, Inter Tight for interface, JetBrains
Mono for formulas, units and data (`--font-display/-element/-interface/-data`).

Primitives map: Button `.ui-btn*` · IconButton `.ui-icon-btn` · Input/Select/
Textarea `.ui-input/.ui-select/.ui-textarea` · Card `.ui-card` · Badge
`.ui-badge` · Tabs `.ui-tabs/.ui-tab` · Sheet/Dialog `overlay.js` +
`.ui-overlay*` · Toast `toast.js` + `.ui-toast*` · Skeleton `.ui-skeleton` ·
EmptyState `.ui-empty-state` · ErrorState `.ui-error-state` · LoadingState
`.ui-loading-state`.

## Removing CSS accretion (strategy)

Today `/app` stacks `critical-lab.css → atomurus-lab-console.css (199 KB) →
workspace-foundation.css → app-workspace.css (78 KB) → ui/index.css →
layouts/workspace.css`. The codebase has 1 264 `!important` (unchanged by
A1.0; heuristic breakdown in the report): ~678 sit on legacy-prefixed
selectors (`.lc-* .ws-* .ps-*`, body/html state), 88 inside media queries,
10 are `[hidden]`/reduced-motion guards, 488 unclassified.

Rule going forward: **a component knows its own appearance.** New UI is
written only against `src/ui`, never overrides a legacy class, and adds no
`!important` (gate: `test-architecture-boundaries`). Migration order, one
screen at a time:

1. Move the screen's markup to `.ui-*` / `.app-*` classes (dual-class via
   `compat.css` while both exist).
2. Delete that screen's rules from `public-shell.css` / `lab-console.css`
   (the two files that hold 1 027 of the 1 264 `!important`).
3. When a legacy file has no consumers left, stop loading it.
4. Track the count in `tools/audit-architecture.mjs`; it may only go down.

## Mobile layouts

| Layout | Width | Navigation | Secondary nav |
| --- | --- | --- | --- |
| Mobile | < 768 | bottom bar, 5 destinations: Home · Explore · Lab · Study · Account | sheet (e.g. Study: Overview, Sets, Review, Practice, Insights, Notes & history) |
| Tablet | 768–1023 | navigation rail | side sheet |
| Desktop | ≥ 1024 | sidebar with labels | side sheet / in-page |

Desktop stays desktop; mobile is not a zoomed-out desktop (the layout
viewport equals the device width — tested).

Rules the gates enforce (`e2e/a1-mobile.spec.js`):

- no document horizontal overflow and no content clipped at the right edge;
  the periodic table is the explicit exception and pans inside its own
  `[data-pan-x]` box with ≥44 px cells
- one vertical scroll owner (`.app-main`); the document never scrolls
- critical touch targets ≥ 44 px (48 px for list rows and the bottom bar)
- the end of long content is reachable above the bottom bar
- sheets/dialogs fit the dynamic viewport and safe areas; Escape closes; focus returns
- first screen answers "what can I do now?": one primary action, no metric wall

## Safe areas

```css
--app-safe-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px));
/* …right, bottom, left */
```

Top bar, bottom bar, sheets, dialogs and toasts consume only `--app-safe-*`.
`viewport-fit=cover` is set on the AppShell and the app bundle. The harness
simulates top 0/24/32/48 and bottom 0/24/34/48 px by injecting
`--safe-area-inset-*`, and `Platform.getSafeArea()` reads the same values.

## Keyboard and forms

- inputs are ≥16 px on touch devices (no focus zoom), correct `type`,
  `inputmode`, `autocomplete`, `enterkeyhint`
- the shell height is `100dvh` so the content area shrinks with the keyboard;
  the login CTA is scrolled into view on focus and on `visualViewport` resize
- on phones the bottom bar steps aside while a content field has focus
- Chromium cannot open a soft keyboard in tests; the gate shrinks the viewport
  the way Android `adjustResize` does. Real-device verification is A1.6.

## Periodic table on phones

`src/features/periodic-table/view-modes.js`: portrait phones start in **List**
(one row per element), **Table** is the real 18-column grid panning inside its
container, **Properties** sorts by Z / mass / electronegativity. Trends and
Compare are reserved modes for A1.2. One delegated listener per container
(not 118), data from a cached 17 KB index.

## Element page (A1.2 target, not built in A1.0)

Above the fold on phones: Z · symbol · name · atomic mass · state · group,
then **Compare** and **Save**; below: Overview, Properties, Atomic structure,
Isotopes, History, Applications.
