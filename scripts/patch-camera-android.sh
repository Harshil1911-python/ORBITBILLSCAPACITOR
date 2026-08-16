#!/usr/bin/env bash
# Inject CAMERA permission + MainActivity runtime permission + WebView grant
set -euo pipefail

MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: $MANIFEST not found. Run npx cap add android / cap sync first."
  exit 1
fi

echo "Patching $MANIFEST for CAMERA..."
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
    print(repr(text[:300]))
    raise SystemExit("Could not find <manifest> in AndroidManifest.xml")
text = text[:m.end()] + "\n" + snippet + text[m.end():]
p.write_text(text, encoding="utf-8")
print("CAMERA permission added.")
PY
else
  echo "CAMERA permission already present."
fi

MAIN=$(find android/app/src/main/java -name 'MainActivity.java' 2>/dev/null | head -1 || true)
if [ -z "${MAIN}" ]; then
  echo "WARNING: MainActivity.java not found — skip Java patch."
  exit 0
fi

echo "Patching $MAIN ..."

python3 - <<'PY'
from pathlib import Path
import re
paths = list(Path("android/app/src/main/java").rglob("MainActivity.java"))
if not paths:
    raise SystemExit(0)
p = paths[0]
text = p.read_text(encoding="utf-8")
if "requestPermissions" in text and "onPermissionRequest" in text:
    print("MainActivity already patched — leave as-is.")
    raise SystemExit(0)

pm = re.search(r"package\s+([\w.]+)\s*;", text)
pkg = pm.group(1) if pm else "com.techserenia.orbitbills"

new = f'''package {pkg};

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    private static final int REQ_CAMERA = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        try {{
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                    != PackageManager.PERMISSION_GRANTED) {{
                ActivityCompat.requestPermissions(this,
                    new String[]{{Manifest.permission.CAMERA}}, REQ_CAMERA);
            }}
        }} catch (Exception ignored) {{}}

        try {{
            getWindow().getDecorView().post(new Runnable() {{
                @Override
                public void run() {{
                    try {{
                        if (bridge == null || bridge.getWebView() == null) return;
                        bridge.getWebView().setWebChromeClient(new WebChromeClient() {{
                            @Override
                            public void onPermissionRequest(final PermissionRequest request) {{
                                runOnUiThread(new Runnable() {{
                                    @Override
                                    public void run() {{
                                        try {{
                                            if (request != null && request.getResources() != null) {{
                                                request.grant(request.getResources());
                                            }}
                                        }} catch (Exception ignored) {{}}
                                    }}
                                }});
                            }}
                        }});
                    }} catch (Exception ignored) {{}}
                }}
            }});
        }} catch (Exception ignored) {{}}
    }}
}}
'''
p.write_text(new, encoding="utf-8")
print(f"Wrote MainActivity to {p}")
PY

echo "Camera patch done."
grep -n "CAMERA\|camera" "$MANIFEST" || true
