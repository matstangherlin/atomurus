# Capacitor preparation (A1.0, documentation only)

Status: **prepared, not installed**. A1.0 does not add `@capacitor/*`, does
not create an `android/` project, and does not publish anything. This page
fixes the decisions the Android wave (A1.4) starts from.

## Decisions to confirm (owner)

| Item | Proposal | Status |
| --- | --- | --- |
| `appId` / Android package | `com.atomurus.app` | **Proposed — owner must confirm before A1.4.** Changing it after a Play upload is impossible. |
| `appName` | `Atomurus` | Proposed |
| Capacitor line | Capacitor 8 (current major), no legacy version "to test quickly" | Decided |
| Android target | API 36 (`targetSdkVersion` / `compileSdkVersion` 36) | Decided |
| `webDir` | `dist/app` (built by `npm run build:app`) | Decided — never the repository root |
| Remote WebView | Not used. Assets ship inside the APK; only the API is remote | Decided |
| Deep links | `atomurus://…` and `https://atomurus.com/…` (App Links) → `resolveDeepLink()` | Contract ready (`src/core/routing/routes.js`) |

## Future `capacitor.config.json`

This is the configuration A1.4 creates. It is kept here (not at the repo
root) so nothing picks it up early. `tools/test-app-bundle.mjs` checks it.

```json
{
  "appId": "com.atomurus.app",
  "appName": "Atomurus",
  "webDir": "dist/app",
  "android": {
    "allowMixedContent": false,
    "captureInput": true,
    "webContentsDebuggingEnabled": false
  },
  "plugins": {
    "SystemBars": { "insetsHandling": "css" },
    "CapacitorHttp": { "enabled": true }
  }
}
```

Notes:

- **No `server.url`.** Pointing the app at `https://atomurus.com` would make it
  a remote WebView: slow first start, blank screen offline, no versioned build.
  `server.url` is allowed only in a local dev override, never committed.
- **SystemBars / insets.** The app is edge-to-edge. The CSS tokens already
  accept injected `--safe-area-inset-*` variables before falling back to
  `env(safe-area-inset-*)` (`src/ui/tokens/safe-area.css`).
- **CapacitorHttp.** Native HTTP avoids CORS preflights from
  `https://localhost` to `https://atomurus.com`. The alternative (CORS
  headers on Functions for the app origin) is decided in A1.1 together with
  the token endpoint.

## Plugins the adapters expect

| Adapter | Plugin | Used for |
| --- | --- | --- |
| `src/adapters/capacitor/capacitor-adapter.js` | `@capacitor/app` | `pause` / `resume` → `Platform.onPause/onResume`, later back button |
| | `@capacitor/network` | `Platform.isOnline()`, `onNetworkChange` |
| | `@capacitor/browser` | `Platform.openExternalUrl()` (Custom Tabs) |
| `src/adapters/capacitor/secure-storage-adapter.js` | a Keystore-backed secure storage plugin (chosen in A1.1), exposed as `Capacitor.Plugins.AtomurusSecureStorage` | Supabase access/refresh tokens |

`src/app/bootstrap/app-main.js` refuses to start the native app if the secure
storage plugin is missing — tokens are never downgraded to `localStorage`.

## Build flow (A1.4)

```text
npm ci
npm run build:app          # → dist/app (hashed, lazy chunks, local Three)
npx cap sync android       # copies dist/app into the Android project
./gradlew assembleDebug    # physical-device QA (A1.6)
```

## What stays out of the app bundle

SEO JSON-LD, Open Graph images, canonical/hreflang tags, sitemap, robots,
ads scripts, cookie banner (the app's consent flow is A1.5), Netlify
headers/redirects, editorial-only scripts, docs, tools and tests.
