# Hide battery bar + Back/Home buttons (Capacitor Android)

These files make the OrbitBills APK run **immersive fullscreen**:
- Status bar (time / battery / wifi) hidden
- Navigation bar (Back / Home / Recents) hidden
- Bars can briefly reappear on edge swipe (Android behaviour), then auto-hide again

Desktop browser is unchanged (no system bars to hide).

## Files to edit / copy

| Zip path | Put into Capacitor project at |
|----------|-------------------------------|
| `orbit-native.js` | Hosted web root **and** optional `www/orbit-native.js` |
| `android/app/src/main/res/values/styles.xml` | same path in your project |
| `android/app/src/main/res/values-v27/styles.xml` | same path in your project |
| `MAINACTIVITY_SNIPPET.java` | merge into `MainActivity.java` `onCreate` + `onWindowFocusChanged` |

## Steps

1. Copy the two `styles.xml` files (merge if you already customised themes).
2. Open `MainActivity.java`, uncomment/paste the immersive code from the snippet.
3. Upload `orbit-native.js` to your Render/site root (APK loads remote URL).
4. Rebuild:

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Notes

- Hardware **Back** still works via Capacitor `App` plugin (closes cart/menu first).
- If bars keep showing, confirm `@capacitor/status-bar` is installed in `package.json`.
