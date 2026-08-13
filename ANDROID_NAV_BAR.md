# Android system navigation bar (Back / Home / Recents)

The white strip under the cart bar is the **Android system navigation bar**.  
Web CSS cannot recolor it when `StatusBar.overlaysWebView = false` (the WebView sits *above* it).

## Fix in Capacitor Android project

### 1) `android/app/src/main/res/values/styles.xml` (or `themes.xml`)

Inside your app theme (often `AppTheme` / `AppTheme.NoActionBar`):

```xml
<item name="android:navigationBarColor">#0B3D91</item>
<item name="android:windowLightNavigationBar">false</item>
<item name="android:statusBarColor">#0B3D91</item>
```

### 2) Optional — `MainActivity.java`

```java
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
  getWindow().setNavigationBarColor(android.graphics.Color.parseColor("#0B3D91"));
  getWindow().setStatusBarColor(android.graphics.Color.parseColor("#0B3D91"));
}
```

### 3) Rebuild APK

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

`orbit-native.js` already tries NavigationBar / EdgeToEdge plugins if installed and paints a web safe-area fill as a fallback.
