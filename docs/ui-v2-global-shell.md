# Atomurus global shell

**Scope:** Prompts 13, 18, and the global sidebar unification. One product chrome before and after login. **`/app` is the official sidebar.**

## Contract

```text
ATOMURUS SHELL
┌────────────────────────────────────────────────────┐
│ Atomurus     Search           PT   Theme   Account │
├───────────────┬────────────────────────────────────┤
│ LABORATORY    │ Page / Workspace context            │
│ Home          │                                    │
│ Periodic Table│ Local nav lives in the page        │
│ Viewer        │                                    │
│ Calculators   │                                    │
│ Explore       │                                    │
│ Workspace     │                                    │
│ ------------- │                                    │
│ Account / Plan│                                    │
└───────────────┴────────────────────────────────────┘
```

Geometry is the Design System scale:

| Token | Value |
| --- | --- |
| Topbar | 64px (`--ui-topbar` / `--atomurus-topbar`) |
| Sidebar | 248px (`--ui-sidebar` / `--atomurus-sidebar`) |

Public pages keep `#ps-shell`. `/app` keeps `#ws-shell`. Both mount the same `#ws-sidebar[data-atomurus-sidebar]`. Public pages are **not** wrapped in `.ui-root`.

## Official sidebar

One markup template: `templates/chrome/public-sidebar.html`. Injected into landing and tool pages. Copied into `app.html`. Classes are `.ws-sidebar` / `.ws-nav-item` / `.ws-nav-foot`.

Viewer children and calculator instruments are **not** in the global sidebar. Viewer uses in-page `.vz-tabs`. Calculators keep `.calc-menu` in the content.

Config (`/config`) is laboratory display settings. It stays reachable from the Account menu as **Lab settings**. It is not a global sidebar item.

## Guest vs signed-in (sidebar foot)

| Kind | Foot |
| --- | --- |
| guest | Account, Plans |
| free | Account, Plan, Sign out, Upgrade to Pro |
| trial | Account, Plan, Sign out |
| pro / admin | Account, Plan, Sign out |

The topbar chip can show the display name. The sidebar Account item stays a navigation label (**Account** / **Conta**). Both read `ads-gate.js` / `AtomurusAuth` — no invented frontend session.

`html.auth-pending` hides the chip and the sidebar foot so they cannot disagree while auth loads.

## Active state

| Route | Global current |
| --- | --- |
| `/` | Home |
| Periodic Table and subpages | Periodic Table |
| `viewer/*` | Viewer |
| Calculators | Calculators |
| Explore and articles (when the shell is present) | Explore |
| `/app` including Account | Workspace |

Account can be marked in the foot. Do not highlight two global destinations.

## Mobile

The drawer **is** `#ws-sidebar`. `atomurus-mobile-nav.js` only adds the landing hamburger. It does not clone a second route list. `assets/global-nav.js` toggles `.ps-shell.is-nav-open` / `.ws-shell.is-nav-open`.

## JavaScript

`assets/global-nav.js` owns `LAB_NAV`, active marking, auth foot, and the drawer.

`public-workspace.js` only enhances: search fallback, Account chip fallback, lab gate. It does not rebuild the sidebar.

Auth paint on public pages still comes from `ads-gate.js` → `i18n.js` `syncAuthNav` → `AtomurusNav.sync`. Do not load `auth-client.js` on every public page.

## Files

```text
templates/chrome/public-sidebar.html
templates/chrome/viewer-local-nav.html
assets/global-nav.js
assets/layouts/shell.css
tools/inject-ui-chrome.js
```
