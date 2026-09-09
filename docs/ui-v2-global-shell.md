# Atomurus global shell

**Scope:** Prompts 13 and 18. One product chrome before and after login.

## Contract

```text
ATOMURUS SHELL
┌────────────────────────────────────────────────────┐
│ Atomurus     Search           PT   Theme   Account │
├───────────────┬────────────────────────────────────┤
│ Laboratory    │ Page / Workspace context            │
│ Workspace     │                                    │
└───────────────┴────────────────────────────────────┘
```

Geometry is the Design System scale already used by UI V2:

| Token | Value |
| --- | --- |
| Topbar | 64px (`--ui-topbar` / `--ps-topbar` / `--ws-topbar`) |
| Sidebar | 248px (`--ui-sidebar` / `--ws-sidebar`) |

Public pages keep `#ps-shell`. `/app` keeps `#ws-shell`. They share `assets/layouts/shell.css` for account chip, plan badge, and pending auth. Public pages are **not** wrapped in `.ui-root`.

## Brand

Markup is **Atomurus** + `common.brandTag` (**chemistry lab**). `/app` brand goes to `/`. No CSS `::after` correcting a version tag.

## Guest vs signed-in

Guest topbar/sidebar verb is **Account** → login (with `next=` when the destination is known). Login page keeps **Open lab** → periodic table.

After auth, the same chip slot shows display name + plan badge from `planBadge()` / `planBadgeInfo()`:

| Kind | Label |
| --- | --- |
| guest | (hidden) |
| free | FREE |
| trial | PRO TRIAL |
| pro | PRO |
| admin | ADMIN |

`html.auth-pending` reserves the chip width so Account does not flash into a name.

Signed-in chip opens a short menu: Account, Plan & Billing, Preferences, Sign out. The Account Center remains `/app?section=account`.

## Navigation

Public/tool sidebar family:

```text
LABORATORY
  Home · Periodic Table · Viewer · Calculators · Explore
WORKSPACE
  Workspace → /app
```

Inside `/app`, Workspace stays the active global item. Context nav is Overview / Study / Lab / Activity. Study, Lab, and Activity keep their own local nav. Old `?section=` URLs still work.

Tool pages keep their local laboratory links (Viewer children, calculator list). The injector adds the Account chip to the topbar so login does not swap chrome.

## JavaScript

`public-workspace.js` only enhances: active state, search fallback, Account chip fallback, drawer, lab gate. It does not hoist the document.

Auth paint on public pages still comes from `ads-gate.js` → `i18n.js` `syncAuthNav`. Do not load `auth-client.js` on every public page.

## Files

```text
templates/chrome/account-control.html
templates/chrome/public-sidebar.html
assets/layouts/shell.css
assets/pro-features.js
tools/inject-ui-chrome.js
```
