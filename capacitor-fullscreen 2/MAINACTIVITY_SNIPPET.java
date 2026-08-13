// File: android/app/src/main/java/<your.package>/MainActivity.java
// Paste the immersive block INSIDE onCreate() after super.onCreate(...);

/*
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

// --- hide status bar (battery) + navigation bar (back/home) ---
Window window = getWindow();
window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
window.getDecorView().setSystemUiVisibility(
    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
    | View.SYSTEM_UI_FLAG_FULLSCREEN
    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
);
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    WindowManager.LayoutParams lp = window.getAttributes();
    lp.layoutInDisplayCutoutMode =
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    window.setAttributes(lp);
}
// --- end immersive ---
*/

// Also keep applying on focus (user swipe may temporarily show bars):
/*
@Override
public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
    }
}
*/
