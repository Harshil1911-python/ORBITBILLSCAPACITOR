#!/usr/bin/env bash
# Inject CAMERA permission + robust MainActivity (runtime permission + BridgeWebChromeClient)
set -euo pipefail

MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: $MANIFEST not found. Run npx cap add android / cap sync first."
  exit 1
fi

echo "Patching $MANIFEST for CAMERA..."
echo "--- manifest head ---"
head -n 8 "$MANIFEST" || true

if ! grep -q 'android.permission.CAMERA' "$MANIFEST"; then
  python3 - <<'PY'
from pathlib import Path
import re
p = Path("android/app/src/main/AndroidManifest.xml")
text = p.read_text(encoding="utf-8")
snippet = """
    <uses-permission android:name=\"android.permission.CAMERA\" />
    <uses-feature android:name=\"android.hardware.camera\" android:required=\"false\" />
    <uses-feature android:name=\"android.hardware.camera.autofocus\" android:required=\"false\" />
"""
m = re.search(r"(<manifest[^>]*>)", text, re.I)
if not m:
    print("WARN: <manifest> tag not found; dumping first 300 chars:")
    print(repr(text[:300]))
    raise SystemExit("Could not find <manifest> in AndroidManifest.xml")
insert_at = m.end()
text = text[:insert_at] + "\n" + snippet + text[insert_at:]
p.write_text(text, encoding="utf-8")
print("CAMERA permission added.")
PY
else
  echo "CAMERA permission already present."
fi

MAIN=$(find android/app/src/main/java -name 'MainActivity.java' 2>/dev/null | head -1 || true)
if [ -z "${MAIN}" ]; then
  echo "WARNING: MainActivity.java not found — skip WebChromeClient patch."
  exit 0
fi

echo "Patching $MAIN for WebView camera grant + runtime permission..."

python3 - <<'PY'
from pathlib import Path
import re
paths = list(Path("android/app/src/main/java").rglob("MainActivity.java"))
if not paths:
    print("No MainActivity.java found")
    raise SystemExit(0)
p = paths[0]
text = p.read_text(encoding="utf-8")

if "requestPermissions" in text and "onPermissionRequest" in text and "BridgeWebChromeClient" in text:
    print("MainActivity already has full camera patch — leave as-is.")
    raise SystemExit(0)

pm = re.search(r"package\s+([\w.]+)\s*;", text)
pkg = pm.group(1) if pm else "com.techserenia.orbitbills"

new = f'''package {pkg};

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

/**
 * OrbitBills MainActivity
 * - Requests Android runtime CAMERA permission
 * - Grants WebView getUserMedia (barcode scan) via BridgeWebChromeClient
 */
public class MainActivity extends BridgeActivity {{
    private static final int CAMERA_PERMISSION_REQUEST = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        ensureCameraPermission();
        setupWebViewCameraGrant();
    }}

    private void ensureCameraPermission() {{
        try {{
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                    != PackageManager.PERMISSION_GRANTED) {{
                ActivityCompat.requestPermissions(
                    this,
                    new String[]{{ Manifest.permission.CAMERA }},
                    CAMERA_PERMISSION_REQUEST
                );
            }}
        }} catch (Exception ignored) {{}}
    }}

    private void setupWebViewCameraGrant() {{
        try {{
            if (bridge == null || bridge.getWebView() == null) {{
                getWindow().getDecorView().post(this::setupWebViewCameraGrant);
                return;
            }}
            bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(bridge) {{
                @Override
                public void onPermissionRequest(final PermissionRequest request) {{
                    runOnUiThread(() -> {{
                        try {{
                            if (request != null && request.getResources() != null) {{
                                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                                        != PackageManager.PERMISSION_GRANTED) {{
                                    ActivityCompat.requestPermissions(
                                        MainActivity.this,
                                        new String[]{{ Manifest.permission.CAMERA }},
                                        CAMERA_PERMISSION_REQUEST
                                    );
                                }}
                                request.grant(request.getResources());
                            }}
                        }} catch (Exception ignored) {{}}
                    }});
                }}
            }});
        }} catch (Exception ignored) {{}}
    }}
}}
'''
p.write_text(new, encoding="utf-8")
print(f"Wrote camera-capable MainActivity to {p}")
PY

echo "Camera patch done."
grep -n "CAMERA\|camera" "$MANIFEST" || true
