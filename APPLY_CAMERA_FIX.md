# OrbitBills — Camera (barcode scan) fix

This zip fixes **Camera scan** on Capacitor Android APKs built from ORBITBILLSCAPACITOR.

The billing screen uses `navigator.mediaDevices.getUserMedia` (not `@capacitor/camera`).  
Android needs:

1. `CAMERA` permission in the manifest  
2. WebView permission grant (MainActivity)  
3. Rebuild + reinstall the APK  
4. User allows Camera in system settings  

---

## Files in this zip

| Path | What to do |
|------|------------|
| `android/app/src/main/AndroidManifest.xml` | **Merge** camera lines into your existing manifest (do not blindly overwrite if you already customized it) |
| `android/app/src/main/java/com/techserenia/orbitbills/MainActivity.java` | Copy or merge into your MainActivity (adjust package name if different) |
| `CAMERA_MANIFEST_SNIPPET.xml` | Minimal permission lines only |
| `CAMERA_PERMISSION.md` | Original project notes |
| `APPLY_CAMERA_FIX.md` | This file |

---

## Step-by-step

### 1) AndroidManifest.xml

Open your real file:

```
android/app/src/main/AndroidManifest.xml
```

Inside the root `<manifest>` tag (before `<application>`), add if missing:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
```

Keep all your existing permissions and activities.

### 2) MainActivity.java

Open:

```
android/app/src/main/java/com/techserenia/orbitbills/MainActivity.java
```

(If the package folder differs, use that path.)

Ensure it extends `BridgeActivity` and in `onCreate` **after** `super.onCreate(...)` you have the WebChromeClient `onPermissionRequest` grant (see the file in this zip).

If you already have custom status-bar / fullscreen code in `onCreate`, **keep that code** and only add the camera WebChromeClient block.

### 3) Rebuild APK

From project root:

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```

APK path is usually:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 4) On the phone

1. Uninstall the old OrbitBills APK  
2. Install the new APK  
3. Open app → Billing → Scan → **Camera scan**  
4. When Android asks for Camera → **Allow**  

If you denied it before:

**Settings → Apps → OrbitBills → Permissions → Camera → Allow**

---

## Still not working?

| Symptom | Fix |
|---------|-----|
| No permission popup | Manifest missing CAMERA + rebuild |
| Popup appeared, you denied | App settings → Camera → Allow |
| Black video / “unavailable” | MainActivity WebChromeClient grant + rebuild |
| “BarcodeDetector not supported” | Use **Enter code** or ensure Chrome WebView is updated |
| Offline + CDN scanner | Manual Enter code still works; live decode may need network for html5-qrcode CDN |

---

## Note on package name

Default in this zip: `com.techserenia.orbitbills`  

If your `appId` in `capacitor.config.ts` / `app-config.json` is different, change the Java `package` line and the folder path under `java/` to match.
