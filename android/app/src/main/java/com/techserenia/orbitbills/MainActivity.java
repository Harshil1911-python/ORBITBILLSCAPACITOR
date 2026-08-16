package com.techserenia.orbitbills;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

/**
 * OrbitBills MainActivity — camera permission grant for barcode scan (getUserMedia).
 *
 * If your package name is different, change the package line above to match
 * android/app/src/main/java/... path and AndroidManifest activity name.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Grant WebView camera (and mic if requested) so billing.html getUserMedia works.
        // Capacitor Bridge usually handles this when CAMERA is in the manifest; this
        // forces the grant if the system dialog is skipped or blocked on some devices.
        try {
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        runOnUiThread(() -> {
                            try {
                                if (request != null && request.getResources() != null) {
                                    request.grant(request.getResources());
                                }
                            } catch (Exception ignored) {
                            }
                        });
                    }
                });
            }
        } catch (Exception ignored) {
        }
    }
}
