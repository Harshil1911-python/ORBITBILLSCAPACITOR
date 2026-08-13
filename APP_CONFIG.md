# App settings (`app-config.json`)

Edit **only** `app-config.json` to change the app name, website link, offline mode, colors, and more.

Then rebuild:

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```

Or push to GitHub and run **Actions → Build APK**.

---

## Offline vs live website

| `useLiveWebsite` | Behavior |
|------------------|----------|
| `false` (default) | APK uses files inside the app (`www/`). Works **fully offline**, including login screen. |
| `true` | APK opens `websiteUrl` from the internet. Needs network on first open. |

```json
"useLiveWebsite": false,
"websiteUrl": "https://orbitbillsdemo1.onrender.com"
```

---

## Fields

| Field | What it does |
|--------|----------------|
| `appName` | Name under the icon |
| `appId` | Android package id |
| `websiteUrl` | Live site (only if `useLiveWebsite` is true) |
| `useLiveWebsite` | `false` = offline app bundle, `true` = load remote site |
| `brandColor` | Status bar / splash color |
| `statusBarStyle` | `LIGHT` or `DARK` |
| `splashDurationMs` | Splash time (ms) |
| `allowHttp` | Allow HTTP for local testing |
| `extraAllowedHosts` | Extra domains |

---

## Offline banner

When offline, a red bar appears at the top. Tap **×** to dismiss it for the current session.
