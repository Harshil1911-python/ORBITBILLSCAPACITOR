# OrbitBills native update

Merge into https://github.com/Harshil1911-python/orbitbillsapk

## Overwrite these paths
- package.json
- capacitor.config.ts
- www/orbit-native.js
- www/index.html
- android/app/src/main/AndroidManifest.xml
- android/app/src/main/java/com/techserenia/orbitbills/MainActivity.java
- android/app/src/main/res/** (icons, splash, values, xml)
- .github/workflows/build-apk.yml

## Build
```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```
Or push to GitHub and run Actions → Build APK.

## Website (Render) — required
APK loads the live site. Upload `orbit-native.js` to your site root and add to billing.html before </body>:
```html
<script src="/orbit-native.js"></script>
```
Also deploy the latest mobile billing.html.

## Included
- Splash #0b3d91 + adaptive icon from TechSerenia logo
- Status/nav bar blue (no white flash)
- Back: cart → menu → modal → history → exit
- Keyboard resize, haptics helper, offline banner, native share helper, wake lock on billing
