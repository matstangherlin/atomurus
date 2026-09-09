# Atomurus UI V2 — design system

**Scope:** Prompt 02. Tokens and primitive components only. Production pages are **not** restyled yet.

**Gallery:** [`/dev/ui`](../dev/ui.html) (`noindex`). Load `assets/ui/index.css` after `assets/fonts/fonts.css`.

## Architecture

```text
assets/ui/
    tokens.css        color, type, space, radius, shadow, chrome, motion
    base.css          scoped to .ui-root (reset, focus, reduced motion)
    typography.css
    buttons.css
    forms.css
    cards.css
    badges.css
    states.css
    navigation.css    primitives — full chrome is Prompt 03
    dialogs.css
    tables.css        extra vs the original sketch; scientific data tables
    utilities.css     extra; stack/cluster using the official scale
    compat.css        opt-in aliases — UI-V2 COMPAT: remove after migration
    index.css         @import bundle
```

`base.css` is scoped to `.ui-root` so linking the bundle on a production page later cannot silently reset `body` until that page opts in.

`tables.css` and `utilities.css` were not in the shortest sketch; they exist so calculators and Explore do not invent local data tables and spacing helpers.

## Tokens

Light / dark via `[data-theme="light"|"dark"]`. Components do not duplicate palettes.

| Semantic token | Light | Dark |
| --- | --- | --- |
| `--color-bg` | `#F2EFE7` | `#0E0D0C` |
| `--color-surface` | `#F8F5EC` | `#16140F` |
| `--color-surface-raised` | `#ECE7DA` | `#1E1B16` |
| `--color-border` | `#D8D2BF` | `#2E2A22` |
| `--color-text` | `#14120E` | `#F2EFE7` |
| `--color-text-muted` | `#58544A` | `#908A7C` |
| `--color-brand` | `#1E6A50` | `#34A872` |
| `--color-danger` | `#9A4338` | `#E08A82` |
| `--color-warning` | `#B96B0C` | `#E8941C` |

These match the existing `--lc-*` identity. UI V2 does **not** reassign `--lc-*` yet (that would restyle Lab Console consumers).

### Type

| Role | Family | Classes |
| --- | --- | --- |
| Titles / editorial / element names | Instrument Serif | `.ui-display` `.ui-h1` `.ui-h2` `.ui-em` |
| UI / body / labels / buttons | Inter Tight | `.ui-body` `.ui-label` `.ui-btn` |
| Formulas, units, Z, masses | JetBrains Mono | `.ui-formula` `.ui-num` `.ui-meta` `.ui-kicker` |

Scale: `xs sm base lg xl 2xl 3xl 4xl display`.

Mono is not for kickers like `auth.access` on product screens — those go away in Prompt 04. `.ui-kicker` may use mono only when the string is genuinely metadata.

### Spacing

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64` → `--space-1` … `--space-8`.

Chrome extras (not for page padding): `--ui-topbar: 64px`, `--ui-sidebar: 248px`.

### Radius

Only `--radius-sm` 6px, `--radius-md` 10px, `--radius-lg` 16px, `--radius-pill` 999px. Same as `/app` workspace.

### Controls

Height 44px (`--control-height`), small 36px. Focus: 2px brand outline, offset 2px, `:focus-visible` only.

## Buttons

| Class | Use |
| --- | --- |
| `.ui-btn-primary` | Product: Sign in, Account, Save, Upgrade — **ink fill** |
| `.ui-btn-accent` | Science: Calculate, Run, Apply, Simulate — **Atomurus green** |
| `.ui-btn-secondary` | Alternate |
| `.ui-btn-ghost` | Low emphasis |
| `.ui-btn-danger` | Destructive |
| `.ui-btn-sm` `.ui-btn-icon` `.is-loading` `[disabled]` | sizes / states |

Primary is ink on purpose so green stays the laboratory action, not every CTA. Public-shell currently paints `.lc-btn-primary` green with `!important`; that stays until those pages migrate.

## Forms, cards, badges, states

- `.ui-field` `.ui-label` `.ui-input` `.ui-select` `.ui-textarea` `.ui-field-error` `.ui-field-hint` `.ui-password-toggle`
- `.ui-card` `.ui-card-interactive` `.ui-card-selected` `.ui-card-compact` `.ui-card-data`
- `.ui-badge` + `neutral` `brand` `success` `warning` `danger` `info` `pro` `beta`
- `.ui-alert` (info/success/warning/error) `.ui-empty-state` `.ui-spinner`

## Compatibility

`compat.css` is marked `/* UI-V2 COMPAT: remove after migration */`.

It does **nothing** on production until:

1. `class="ui-compat"` on `html`/`body`, or
2. Dual class, e.g. `class="calc-btn-run ui-btn ui-btn-accent"`.

| Legacy | Official |
| --- | --- |
| `.lc-btn-primary` `.auth-primary-btn` `.ws-btn-primary` | `.ui-btn-primary` |
| `.calc-btn-run` | `.ui-btn-accent` |
| `.lc-form input` `.ws-input` `.calc-input` | `.ui-input` |
| `.ws-card` `.lc-mod-card` `.price-card` `.ex-card` | `.ui-card` |

Do not wrap the public site in `.ui-compat` in this step.

## What this step does not do

- No Home / Login / Pricing / Table restyle
- No `public-workspace.js` changes except that `dev/` is skipped by `inject-public-shell.js`
- No removal of `.lc-*` / `.ws-*` CSS
- No new `!important` cascade war (gallery `[hidden]` and reduced-motion only)

## Tests

- `npm run test:ui-v2` — files, scale, almost no `!important`, no inline styles on the gallery
- `e2e/ui-v2.spec.js` — focus-visible, disabled, hover, form error, password toggle, dialog Escape, dark panel, mobile overflow, Home still not loading `/assets/ui/`
