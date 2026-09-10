# Workspace Lab v1 audit

Atomurus Workspace is the personal chemistry workbench. Account is a separate settings product at `/account`. This audit covers the MVP shipped with prompts 43–49.

## Navigation

- Global sidebar is the same on Home, Periodic Table, Viewer, Calculators, Explore, Workspace, and Account.
- Footer is painted only by `assets/global-nav.js` `paintFoot()` from auth state.
- Guest: Create account (`/signup?next=`), Sign in, Plans.
- Free: Account (`/account`), Plan (`/account?tab=plan`), Sign out, Upgrade to Pro.
- Trial / Pro: Account, Plan, Sign out. No Upgrade CTA. Trial still shows the PRO TRIAL badge.
- Workspace local nav: Lab, Creations, Notebook, Study, Activity. Account is not a Workspace subsection.
- Compatibility: `/app?section=account` redirects to `/account` (query `tab` preserved).

## Account

- Dedicated page: `/account` (`account.html` + `assets/account-center.js`).
- Tabs: Overview, Profile, Security, Plan & Billing, Preferences, Chemistry Settings.
- Profile fields are read-only. Password change uses the existing reset flow. No fake delete-account or export buttons.
- Preferences write language, theme, reduced motion (`atomurus-reduced-motion`), and 3D quality (`atomurus-3d-quality` / `atomurusPaperLab.setQualityTier`).
- Chemistry Settings keep `/config` as the live lab-layout page.
- Stripe portal return URL is `/account?tab=plan`.

## Workspace

- `/app` is Workspace Home. The hero is Virtual Laboratory, not Study.
- Public tools stay in the global sidebar. Workspace does not rebuild Periodic Table / Viewer / Calculators / Explore as four dominant cards.
- Study remains under Workspace (Library, Sets, Practice, Review, Insights).
- Pro Lab solvers remain at `/app?section=pro-lab`.

## Lab

- Engine: `assets/lab/virtual-lab.js`. DOM/CSS bench. No Three.js loop.
- Modes: Guided Creations catalog + Open Bench.
- Equipment MVP: beaker, volume/mass/temperature/pH inspector.
- Materials MVP: water, NaCl, sucrose, citric acid, bicarbonate, virtual indicator, fragrance notes, carbon.
- Guided catalog: solution, fragrance accord, artificial diamond (educational allotrope), pH challenge, crystal growth.
- Persistence: `localStorage['atomurus-lab-v1']`, max 24 sessions. Authenticated and guest demo both save on-device in v1. No new backend table.
- Notebook is the observation timeline of the current / recent session.

## Safety

- Deny by default. Only allowlisted substances, reactions, and creations execute.
- Free-text search never invents a recipe. Unknown → catalog miss + Explore. Disallowed aliases → unavailable + Explore.
- Artificial diamond is a conceptual carbon-allotrope simulation. It does not describe high-pressure equipment.
- Fragrance is a virtual olfactory composition, not a manufacturing recipe.
- Client UI is not trusted: `addToContainer` / `resolveQuery` re-check the allowlist. There is no lab execution API in v1, so there is no server-side recipe endpoint to call.

## Performance

- No requestAnimationFrame loop in the Lab.
- Liquid fill uses a short CSS transition, disabled when `data-reduced-motion="1"`.
- Session snapshots are capped (history 24, observations 80, sessions 24).

## Accessibility

- Materials are buttons (keyboard). Drag-and-drop is not required.
- Search, Add, Measure, Undo, Reset, Save are labeled controls.
- Reduced motion is a real Account preference.

## Free / Pro

- Public chemistry (table, viewers, basic calculators) stays ungated.
- Free account: Workspace, Open Bench, selected guided creations, Study, limited on-device sessions.
- Pro: Pro Lab solvers, Study Intelligence, `virtualLabAdvanced` reserved for later instruments.
- Viewer is not behind a paywall.

## Follow-ups

- Server persistence and lab reports.
- Admin review workflow for new guided creations.
- Optional export of an educational lab report PDF.
- Do not add a free-text → AI recipe path.
