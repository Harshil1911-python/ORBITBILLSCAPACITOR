OrbitBills — post-invoice popup update
======================================

What changed
------------
After you create an invoice (Create button, not Pay & Print), a popup appears with:

  • Share     — Opens WhatsApp
                - If a client with phone is selected → opens that client's chat
                  (cashier just taps Send)
                - If no client / no phone → opens WhatsApp so cashier can pick a contact
  • Download  — Saves the invoice PNG to Gallery / device storage
  • Preview   — Opens the full invoice preview modal
  • Cancel    — Closes the popup

How to upload
-------------
1. Open: https://github.com/Harshil1911-python/ORBITBILLSCAPACITOR
2. Upload BOTH files (same content):
     • billing.html          → repo root
     • www/billing.html      → www/ folder
   (GitHub: Add file → Upload files, or drag-and-drop overwriting existing)

3. Commit message example: "Post-invoice Share/Download/Preview/Cancel popup"

4. Rebuild the APK (Actions → Build APK → Run workflow) if you use the Capacitor app,
   so the offline www/ bundle includes the new billing.html.

Notes
-----
• Pay & Print still prints as before (no popup).
• Existing Share sheet / WhatsApp button on the cart remain unchanged.
