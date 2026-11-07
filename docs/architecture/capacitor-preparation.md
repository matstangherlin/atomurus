# Capacitor configuration

Status: **installed**. Capacitor 8 and the `android/` project are in the
repository; CI builds an APK + AAB on every PR (`.github/workflows/android-build.yml`).
Build, signing and Play release steps: [`docs/ANDROID.md`](../ANDROID.md).

## Decisions to confirm (owner)

| Item | Proposal | Status |
| --- | --- | --- |
| `appId` / Android package | `atomurus.com` | **Confirmed by the owner.** Changing it after a Play upload is impossible. |
| `appName` | `Atomurus` | Proposed |
| Capacitor line | Capacitor 8 (current major), no legacy version "to test quickly" | Decided |
| Android target | API 36 (`targetSdkVersion` / `compileSdkVersion` 36) | Decided |
| `webDir` | `dist/app` (built by `npm run build:app`) | Decided — never the repository root |
| Remote WebView | Not used. Assets ship inside the APK; only the API is remote | Decided |
| Deep links | `atomurus://…` and `https://atomurus.com/…` (App Links) → `resolveDeepLink()` | Contract ready (`src/core/routing/routes.js`) |

## `capacitor.config.json`

The file at the repository root must match this block;
`tools/test-app-bundle.mjs` checks both.

```json
{
  "appId": "atomurus.com",
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
| `src/adapters/capacitor/secure-storage-adapter.js` | `AtomurusSecureStorage`, an in-app plugin (`android/app/src/main/java/atomurus/com/AtomurusSecureStoragePlugin.java`, AES-GCM with an Android Keystore key) | Supabase access/refresh tokens |

`src/app/bootstrap/app-main.js` refuses to start the native app if the secure
storage plugin is missing — tokens are never downgraded to `localStorage`.

## Build flow

```text
npm ci
npm run android:debug      # build:app + cap sync + assembleDebug/bundleDebug → release-artifacts/
```

## What stays out of the app bundle

SEO JSON-LD, Open Graph images, canonical/hreflang tags, sitemap, robots,
ads scripts, cookie banner (the app's consent flow is A1.5), Netlify
headers/redirects, editorial-only scripts, docs, tools and tests.
