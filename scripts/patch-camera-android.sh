#!/usr/bin/env bash
# Inject CAMERA permission into generated AndroidManifest and ensure MainActivity
# can grant WebView camera for getUserMedia barcode scan.
set -euo pipefail

MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: $MANIFEST not found. Run npx cap add android / cap sync first."
  exit 1
fi

echo "Patching $MANIFEST for CAMERA..."
echo "--- manifest head ---"
head -n 5 "$MANIFEST" || true

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
# Robust: match opening <manifest ...> tag (no fragile word-boundary escape)
m = re.search(r"(<manifest[^>]*>)", text, re.I)
if not m:
    # Fallback: insert after xml declaration or at top
    print("WARN: <manifest> tag not found with regex; dumping first 300 chars:")
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

# Find MainActivity.java (package may vary)
MAIN=$(find android/app/src/main/java -name 'MainActivity.java' 2>/dev/null | head -1 || true)
if [ -z "${MAIN}" ]; then
  echo "WARNING: MainActivity.java not found — skip WebChromeClient patch (manifest alone often enough)."
  exit 0
fi

echo "Patching $MAIN for WebView camera grant..."

python3 - <<'PY'
from pathlib import Path
import re
paths = list(Path("android/app/src/main/java").rglob("MainActivity.java"))
if not paths:
    print("No MainActivity.java found")
    raise SystemExit(0)
p = paths[0]
text = p.read_text(encoding="utf-8")

if "onPermissionRequest" in text and "PermissionRequest" in text:
    print("MainActivity already has onPermissionRequest — leave as-is.")
    raise SystemExit(0)

pm = re.search(r"package\s+([\w.]+)\s*;", text)
pkg = pm.group(1) if pm else "com.techserenia.orbitbills"

new = f'''package {pkg};

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        // Grant WebView camera for billing barcode scan (getUserMedia).
        try {{
            if (bridge != null && bridge.getWebView() != null) {{
                bridge.getWebView().setWebChromeClient(new WebChromeClient() {{
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {{
                        runOnUiThread(() -> {{
                            try {{
                                if (request != null && request.getResources() != null) {{
                                    request.grant(request.getResources());
                                }}
                            }} catch (Exception ignored) {{}}
                        }});
                    }}
                }});
            }}
        }} catch (Exception ignored) {{}}
    }}
}}
'''
p.write_text(new, encoding="utf-8")
print(f"Wrote camera-capable MainActivity to {p}")
PY

echo "Camera patch done."
grep -n "CAMERA\|camera" "$MANIFEST" || true
