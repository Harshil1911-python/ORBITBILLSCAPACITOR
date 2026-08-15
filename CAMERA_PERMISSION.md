# Camera / barcode scanner — Capacitor Android

The Sale **Camera scan** uses the device camera. On Capacitor Android this needs:

1. **CAMERA** permission in `AndroidManifest.xml`
2. WebView permission grants (Capacitor Bridge usually handles this once the permission is declared)
3. Rebuild the APK after changing the manifest

## 1) `android/app/src/main/AndroidManifest.xml`

Inside `<manifest>`, add (if missing):

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
```

Do **not** remove other existing permissions.

## 2) Optional — force WebView camera permission (MainActivity)

If the system dialog never appears, merge this into `MainActivity` (Capacitor 5+ / 8):

```java
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

// In onCreate after super.onCreate(...):
bridge.getWebView().setWebChromeClient(new WebChromeClient() {
  @Override
  public void onPermissionRequest(final PermissionRequest request) {
    runOnUiThread(() -> request.grant(request.getResources()));
  }
});
```

Prefer the standard Capacitor approach first (declare permission + let Bridge handle it). Only add a custom `WebChromeClient` if needed — it can override other Capacitor WebChrome behavior.

## 3) Rebuild

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

On first **Camera scan**, Android should prompt for camera access. Allow it.

## Web-side behavior (already in billing.html)

- Capacitor / missing `BarcodeDetector` → loads **html5-qrcode** from CDN for live decode
- Progressive `getUserMedia` constraints for Android WebView
- Manual **Enter code** remains available if camera is blocked
