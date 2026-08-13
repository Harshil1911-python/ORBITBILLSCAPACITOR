# Capacitor Android — pure white system bars

Makes **status bar** and **navigation bar** (Back / Home / Recents) pure white across the app.

## 1. Copy theme files

From this zip into your Capacitor project:

```
android/app/src/main/res/values/styles.xml
android/app/src/main/res/values-v27/styles.xml
```

If you already have a `styles.xml`, merge the items below into **AppTheme.NoActionBar** (and launch theme):

```xml
<item name="android:statusBarColor">#FFFFFF</item>
<item name="android:navigationBarColor">#FFFFFF</item>
<item name="android:windowBackground">#FFFFFF</item>
<item name="android:windowLightStatusBar">true</item>
<item name="android:windowLightNavigationBar">true</item>  <!-- API 27+ only -->
```

## 2. Optional: MainActivity

Open `android/app/src/main/java/.../MainActivity.java` and paste the code from `MAINACTIVITY_SNIPPET.java` into `onCreate` (uncomment it).

## 3. Capacitor StatusBar (JS)

Deploy the included `orbit-native.js` to your **web** host (Render). It sets:

- StatusBar background `#FFFFFF`
- Style `DARK` (dark icons on white)

## 4. Rebuild APK

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
# or open Android Studio → Build → Build APK
```

No change to your Render HTML is required for the system bar color — that is native-only.  
Your cart bar can stay brand blue; only the Android system bars become white.
