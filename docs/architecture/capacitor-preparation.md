# Android app (Capacitor)

Status: **installed** (Capacitor 8.6, Android project in `android/`). The
first Google Play build is the internal-testing release. Step-by-step
instructions for building and uploading are in `ANDROID.md` at the repo root.

## Decisions

| Item | Value | Notes |
| --- | --- | --- |
| `appId` / Android package (`applicationId`) | `atomurus.com` | The package name reserved in Play Console. **Permanent after the first Play upload.** The Java namespace stays `com.atomurus` (code only). |
| `appName` (launcher label) | `Atomurus` | The Play listing name is set in Play Console. |
| Capacitor | 8.6 | `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` |
| Android SDK | compile/target 36, min 24 | `android/variables.gradle` |
| `webDir` | `dist/android-web` | Built by `tools/build-android-web.mjs` from the whole static site |
| Remote WebView (`server.url`) | **Not used** | Pages ship inside the APK and open offline |
| Insets | `SystemBars.insetsHandling = native` | The WebView is padded below the status bar; pages need no change |
| Accounts, plans, payments | **Off in the app for now** | See "App layer". Paid features (e.g. `/vision`) stay web-only until accounts + Google Play Billing ship in the app |
| Back button | `@capacitor/app` `backButton` listener in android-app.js | Closes overlays → history.back() → minimizeApp() |
| Ads / analytics | **Off in the app** | AdSense is not allowed in apps; tags are stripped from the APK copy |

## App layer

`tools/build-android-web.mjs` copies the published site into
`dist/android-web`, strips ad/analytics tags and puts two files first in every
page's `<head>`:

- `tools/android/android-app.js`
  - maps extension-less paths (`/app`, `/periodic-table/ferrum`) to their
    `.html` files — Capacitor's local server answers those with `index.html`;
  - sends `/login`, `/signup`, `/account`, `/pricing` (and their `.html`) home;
  - answers `/api/*` with `401 session_expired` locally, so every page behaves
    as a signed-out visitor without waiting on the network;
  - records "no ads, no analytics" consent so the cookie banner never shows;
  - keeps links to atomurus.com inside the app; other hosts open in the browser.
- `tools/android/android-app.css` hides sign-in, create-account, account
  menus, plans/pricing, upgrade and Pro unlock entries, save-to-account, the
  cookie banner and ad slots.

Libraries the website loads from CDNs (three.js r128, Chart.js 4.4.4 + zoom
plugin, Hammer.js, html2canvas, jsPDF) are copied from `node_modules` into
`dist/android-web/vendor/` and every CDN URL is rewritten to the local copy,
so the app makes no requests to third-party servers. `ads-gate.js`,
`lazy-ads.js` and `recaptcha.js` do not ship; the contact form is hidden
(the email address stays). `tools/test-android-web.mjs` fails if any page
or script still points at a CDN, ad or analytics host.

The website never loads either file. To bring accounts to the app later,
remove the matching rules and the `/api/*` stub, and add the token flow from
`docs/architecture/auth.md` (the `src/adapters/capacitor/*` adapters and the
`dist/app` shell were prepared for that).

## Build

```text
npm run android:release            # AAB + APK, signed, in release/android/
npm run android:release -- --bump  # next versionCode first (every new upload)
```

`tools/test-android-web.mjs` (in `npm run ci`) checks the config, the bundle
and the app layer's routing and API stub.
