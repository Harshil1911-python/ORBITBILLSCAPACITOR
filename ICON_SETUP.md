# App icon

Your logo is prepared as:

- `resources/icon.png` (512×512)
- `resources/android/mipmap-*/ic_launcher.png`

After `npx cap add android` / `npx cap sync`, copy mipmaps into:

`android/app/src/main/res/mipmap-*`

Or run (if installed):

```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --iconBackgroundColor '#0b3d91' --splashBackgroundColor '#0b3d91'
```
