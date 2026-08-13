// Add inside onCreate() AFTER super.onCreate(...) and before setContentView / bridge load.
// Package path stays yours (e.g. com.techserenia.orbitbills).

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

/*
    Window window = getWindow();
    window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
    window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
    window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

    // Pure white system bars
    window.setStatusBarColor(Color.WHITE);
    window.setNavigationBarColor(Color.WHITE);

    // Dark icons on white bars
    WindowCompat.setDecorFitsSystemWindows(window, true);
    WindowInsetsControllerCompat insets =
        WindowCompat.getInsetsController(window, window.getDecorView());
    if (insets != null) {
        insets.setAppearanceLightStatusBars(true);
        insets.setAppearanceLightNavigationBars(true);
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        window.setNavigationBarContrastEnforced(false);
    }
*/
