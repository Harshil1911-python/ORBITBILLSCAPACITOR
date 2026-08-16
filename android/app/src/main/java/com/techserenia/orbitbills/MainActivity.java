package com.techserenia.orbitbills;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

/**
 * OrbitBills MainActivity
 * Grants WebView camera access for barcode scanning (getUserMedia in billing.html)
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
