#!/usr/bin/env bash
# Inject CAMERA permission + ML Kit metadata into AndroidManifest and
# ensure MainActivity grants WebView camera for getUserMedia fallback.
set -euo pipefail

MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: $MANIFEST not found. Run npx cap add android / cap sync first."
  exit 1
fi

echo "Patching $MANIFEST for CAMERA + ML Kit..."
echo "--- manifest head ---"
head -n 8 "$MANIFEST" || true
echo "---"

python3 << 'PY'
from pathlib import Path
import re

p = Path("android/app/src/main/AndroidManifest.xml")
text = p.read_text(encoding="utf-8")

# 1) CAMERA permission + features
if "android.permission.CAMERA" not in text:
    snippet = """
    <uses-permission android:name=\"android.permission.CAMERA\" />
    <uses-feature android:name=\"android.hardware.camera\" android:required=\"false\" />
    <uses-feature android:name=\"android.hardware.camera.autofocus\" android:required=\"false\" />
"""
    m = re.search(r"(<manifest[^>]*>)", text, re.I)
    if not m:
        m2 = re.search(r"<\?xml[^>]*\?>", text, re.I)
        if m2:
            insert_at = m2.end()
            text = text[:insert_at] + "\n" + snippet + text[insert_at:]
            print("CAMERA permission added (fallback after xml decl).")
        else:
            raise SystemExit("Could not find <manifest> in AndroidManifest.xml")
    else:
        insert_at = m.end()
        text = text[:insert_at] + "\n" + snippet + text[insert_at:]
        print("CAMERA permission added.")
else:
    print("CAMERA permission already present.")

# 2) ML Kit barcode dependency meta-data inside <application>
mlkit_meta = '<meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui"/>'
if "com.google.mlkit.vision.DEPENDENCIES" not in text:
    m = re.search(r"(<application[^>]*>)", text, re.I)
    if m:
        insert_at = m.end()
        text = text[:insert_at] + "\n        " + mlkit_meta + text[insert_at:]
        print("ML Kit barcode_ui meta-data added.")
    else:
        print("WARNING: <application> not found — skip ML Kit meta")
else:
    print("ML Kit meta-data already present.")

p.write_text(text, encoding="utf-8")
print("Manifest patch written.")
PY

MAIN=$(find android/app/src/main/java -name 'MainActivity.java' 2>/dev/null | head -1 || true)
if [ -z "${MAIN}" ]; then
  echo "WARNING: MainActivity.java not found — skip WebChromeClient patch."
  exit 0
fi

echo "Patching $MAIN for WebView camera grant..."

python3 << 'PY'
from pathlib import Path
import re

paths = list(Path("android/app/src/main/java").rglob("MainActivity.java"))
if not paths:
    raise SystemExit(0)
p = paths[0]
text = p.read_text(encoding="utf-8")

if "onPermissionRequest" in text and "PermissionRequest" in text:
    print("MainActivity already has onPermissionRequest — leave as-is.")
    raise SystemExit(0)

pm = re.search(r"package\s+([\w.]+)\s*;", text)
pkg = pm.group(1) if pm else "com.techserenia.orbitbills"

new = f"""package {pkg};

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 9001;
    private PermissionRequest pendingWebPermissionRequest;

    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        try {{
            if (bridge != null && bridge.getWebView() != null) {{
                bridge.getWebView().setWebChromeClient(new WebChromeClient() {{
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {{
                        runOnUiThread(() -> {{
                            if (request == null || request.getResources() == null) return;
                            boolean needsCamera = false;
                            for (String r : request.getResources()) {{
                                if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) needsCamera = true;
                            }}
                            boolean alreadyGranted = ContextCompat.checkSelfPermission(
                                MainActivity.this, Manifest.permission.CAMERA
                            ) == PackageManager.PERMISSION_GRANTED;
                            if (needsCamera && !alreadyGranted) {{
                                // WebView.grant() alone does NOT trigger the Android runtime
                                // permission dialog on API 23+. We must request it ourselves
                                // and only grant the WebView request once Android approves it.
                                pendingWebPermissionRequest = request;
                                ActivityCompat.requestPermissions(
                                    MainActivity.this,
                                    new String[]{{ Manifest.permission.CAMERA }},
                                    CAMERA_PERMISSION_REQUEST_CODE
                                );
                                return;
                            }}
                            try {{ request.grant(request.getResources()); }} catch (Exception ignored) {{}}
                        }});
                    }}
                }});
            }}
        }} catch (Exception ignored) {{}}
    }}

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {{
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE && pendingWebPermissionRequest != null) {{
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            try {{
                if (granted) {{
                    pendingWebPermissionRequest.grant(pendingWebPermissionRequest.getResources());
                }} else {{
                    pendingWebPermissionRequest.deny();
                }}
            }} catch (Exception ignored) {{}}
            pendingWebPermissionRequest = null;
        }}
    }}
}}
"""
p.write_text(new, encoding="utf-8")
print(f"Wrote camera-capable MainActivity to {p}")
PY

echo "Camera + ML Kit patch done."
grep -n "CAMERA\|mlkit\|camera" "$MANIFEST" || true
