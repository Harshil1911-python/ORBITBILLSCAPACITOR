# Fix: Android share sheet opens twice + text invoice

## What was wrong
After creating a bill, `prepareAndOpenInvoiceShare()` saved the PNG via `saveBlobToDevice()`, which **automatically opened the system share sheet**.  
Then the custom "Share invoice" modal opened. When the user tapped Share / WhatsApp, the system sheet opened **again** → open → close → open.

Also the shared text was the generic **"File from TechSerenia"**.

## What we fixed
1. **`saveBlobToDevice` supports `meta.silent = true`**  
   When silent, the file is registered/saved but the system share sheet is **not** opened.

2. **`prepareAndOpenInvoiceShare` now saves with `silent: true`**  
   Only the custom Share invoice modal opens. System share opens **once**, when the user taps Share or WhatsApp.

3. **Share busy lock** (`window.__orbitShareBusy`)  
   Prevents overlapping `Share.share` / `navigator.share` calls for 4 seconds.

4. **Proper text invoice** via `buildInvoiceShareText()`  
   Shared text now includes:
   - Invoice number
   - Client name
   - Item lines (name × qty @ price = amount)
   - Subtotal / Tax / Discount / Total
   - Thank you line

   Example:
   ```
   *INV-04530126*
   Client: Walk-in customer
   Status: paid

   *Items*
   • Basmati Rice 5kg × 1 @ ₹650.00 = ₹650.00
   • Paneer Tikka × 1 @ ₹220.00 = ₹220.00
   ...

   Subtotal: ₹1330.00
   Tax: ₹296.40
   *Total: ₹1626.40*

   Thank you · OrbitBills · TechSerenia
   ```

## How to apply
Copy these files into your project root (overwrite):

- `billing.html`
- `orbit-native.js`

Then rebuild the Android APK:

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

Or if you host the web files on Render / static host, just redeploy `billing.html` and `orbit-native.js`.
