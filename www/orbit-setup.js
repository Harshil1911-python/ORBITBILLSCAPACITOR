(function(){
  if(window.__orbitSetupLoaded) return;
  window.__orbitSetupLoaded = true;
  function hasCap(){
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  function plugin(n){
    try{ return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[n]; }catch(e){ return null; }
  }
  function waitForDb(maxMs){
    maxMs = maxMs || 4000;
    return new Promise(function(resolve){
      var start = Date.now();
      (function tick(){
        if(typeof window.tsSetSetting === "function" || typeof window.tsAdd === "function"){ resolve(true); return; }
        if(Date.now() - start > maxMs){ resolve(false); return; }
        setTimeout(tick, 80);
      })();
    });
  }

  window.__orbitNativeScanBarcode = async function(){
    if(!hasCap()) return null;
    try{
      var BS = null;
      try{ BS = plugin("BarcodeScanner"); }catch(e){}
      if(!BS && window.Capacitor && window.Capacitor.Plugins){
        BS = window.Capacitor.Plugins.BarcodeScanner || null;
      }
      if(!BS){
        try{
          if(window.Capacitor && window.Capacitor.registerPlugin){
            BS = window.Capacitor.registerPlugin("BarcodeScanner");
          }
        }catch(e){}
      }
      if(!BS || typeof BS.scan !== "function"){
        console.warn("[orbit] BarcodeScanner plugin not available");
        return null;
      }
      try{
        if(BS.requestPermissions){
          var perm = await BS.requestPermissions();
          var cam = (perm && (perm.camera || perm.Camera)) || "granted";
          if(String(cam).toLowerCase() === "denied") return null;
        }
      }catch(e){}
      var formats = ["EAN_13","EAN_8","CODE_128","CODE_39","UPC_A","UPC_E","QR_CODE","CODE_93","ITF","CODABAR"];
      var result = await BS.scan({ formats: formats });
      if(result && result.barcodes && result.barcodes.length){
        var b = result.barcodes[0];
        var val = b.rawValue || b.displayValue || b.value || "";
        if(val) return String(val).trim();
      }
      if(result && result.barcode){
        var v = result.barcode.rawValue || result.barcode.displayValue || result.barcode;
        if(v) return String(v).trim();
      }
      return null;
    }catch(err){
      console.warn("[orbit] native scan failed", err);
      return null;
    }
  };

  var ONBOARD_KEY = "orbit_onboarding_v1_done";
  function hasDoneOnboarding(){
    try{ return localStorage.getItem(ONBOARD_KEY) === "1"; }catch(e){ return false; }
  }
  function markOnboardingDone(){
    try{ localStorage.setItem(ONBOARD_KEY, "1"); }catch(e){}
  }
  function fileToDataUrl(file){
    return new Promise(function(resolve, reject){
      if(!file){ resolve(""); return; }
      var r = new FileReader();
      r.onload = function(){ resolve(String(r.result || "")); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  async function applySetupToAdmin(data){
    data = data || {};
    var ok = false;
    try{ ok = await waitForDb(5000); }catch(e){}
    if(!ok){ await new Promise(function(r){ setTimeout(r, 800); }); }
    try{
      if(typeof window.tsSetSetting === "function"){
        if(data.brandName) await window.tsSetSetting("brand_name", data.brandName);
        if(data.brandPhone) await window.tsSetSetting("brand_phone", data.brandPhone);
        if(data.brandTagline) await window.tsSetSetting("brand_tagline", data.brandTagline);
        if(data.logoDataUrl) await window.tsSetSetting("custom_brand_logo", data.logoDataUrl);
        try{ await window.tsSetSetting("show_techserenia_logo", data.logoDataUrl ? "no" : "yes"); }catch(e){}
      }
    }catch(e){ console.warn("branding save", e); }
    if(data.productName){
      try{
        var body = {
          name: data.productName,
          brand: data.productBrand || "",
          store_type: "retail",
          category: data.productCategory || "",
          unit: "pcs",
          price: Number(data.productPrice) || 0,
          stock: Number(data.productStock) || 0,
          barcode: data.productBarcode || "",
          sku: data.productSku || ""
        };
        if(typeof window.tsLocalApi === "function"){
          await window.tsLocalApi("/products", { method: "POST", body: body });
        } else if(typeof window.tsAdd === "function"){
          await window.tsAdd("products", {
            name: body.name, brand: body.brand, store_type: body.store_type,
            category: body.category, unit: body.unit, price: body.price,
            cost_price: 0, stock: body.stock, sku: body.sku, barcode: body.barcode,
            notes: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString()
          });
        }
      }catch(e){ console.warn("product seed", e); }
    }
    try{ window.dispatchEvent(new CustomEvent("orbitbills-sync", { detail: { type: "setup-onboarding" } })); }catch(e){}
    return true;
  }
  function showOnboarding(){
    if(hasDoneOnboarding()) return;
    if(document.getElementById("orbitOnboard")) return;
    var path = (location.pathname || "").toLowerCase();
    if(/signin|offline|splash|404/.test(path)) return;
    var step = 0;
    var state = { brandName: "", brandPhone: "", brandTagline: "OrbitBills", logoDataUrl: "", productName: "", productPrice: "", productStock: "10", productBarcode: "" };
    var wrap = document.createElement("div");
    wrap.id = "orbitOnboard";
    wrap.setAttribute("role", "dialog");
    wrap.style.cssText = "position:fixed;inset:0;z-index:300000;background:#0b3d91;color:#fff;display:flex;flex-direction:column;align-items:stretch;justify-content:center;padding:20px 18px;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;overflow:auto;";
    wrap.innerHTML = '<div style="position:absolute;top:12px;right:12px;z-index:2;"><button type="button" id="orbitOnboardSkip" style="background:transparent;border:0;color:rgba(255,255,255,.9);font-size:14px;font-weight:600;padding:10px 12px;cursor:pointer;">Skip</button></div><div id="orbitOnboardInner" style="width:100%;max-width:400px;margin:0 auto;"></div>';
    (document.body || document.documentElement).appendChild(wrap);
    var inner = document.getElementById("orbitOnboardInner");
    function finish(skip){
      markOnboardingDone();
      try{ wrap.remove(); }catch(e){ wrap.style.display = "none"; }
      if(!skip){ applySetupToAdmin(state).catch(function(){}); }
    }
    function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }
    function render(){
      if(step === 0){
        inner.innerHTML = '<div style="text-align:center;padding:12px 0 8px;"><div style="font-size:56px;margin-bottom:12px;">🧾</div><h2 style="margin:0 0 10px;font-size:22px;font-weight:800;">Welcome to OrbitBills</h2><p style="margin:0 0 22px;font-size:15px;line-height:1.45;opacity:.92;">Set up your shop in under a minute. You can skip and fill this later in Admin → Branding.</p><button type="button" id="obNext" style="width:100%;min-height:50px;border:0;border-radius:14px;background:#fff;color:#0b3d91;font-weight:800;font-size:16px;cursor:pointer;">Get started</button></div>';
      } else if(step === 1){
        inner.innerHTML = '<h2 style="margin:8px 0 6px;font-size:20px;font-weight:800;">Your business</h2><p style="margin:0 0 16px;font-size:14px;opacity:.9;">Shown on invoices and in admin branding.</p><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Business name *</label><input id="obName" type="text" placeholder="e.g. Sharma Kirana" value="'+esc(state.brandName)+'" style="width:100%;box-sizing:border-box;min-height:48px;border-radius:12px;border:0;padding:12px 14px;font-size:16px;margin-bottom:12px;"><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Phone number</label><input id="obPhone" type="tel" inputmode="tel" placeholder="e.g. 9876543210" value="'+esc(state.brandPhone)+'" style="width:100%;box-sizing:border-box;min-height:48px;border-radius:12px;border:0;padding:12px 14px;font-size:16px;margin-bottom:12px;"><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Tagline (optional)</label><input id="obTag" type="text" placeholder="OrbitBills" value="'+esc(state.brandTagline)+'" style="width:100%;box-sizing:border-box;min-height:48px;border-radius:12px;border:0;padding:12px 14px;font-size:16px;margin-bottom:18px;"><button type="button" id="obNext" style="width:100%;min-height:50px;border:0;border-radius:14px;background:#fff;color:#0b3d91;font-weight:800;font-size:16px;cursor:pointer;">Next</button><p id="obErr" style="display:none;color:#fecaca;font-size:13px;margin-top:10px;"></p>';
      } else if(step === 2){
        inner.innerHTML = '<h2 style="margin:8px 0 6px;font-size:20px;font-weight:800;">Shop logo</h2><p style="margin:0 0 16px;font-size:14px;opacity:.9;">Optional. Used on invoices. Change anytime in Admin.</p><div style="background:rgba(255,255,255,.12);border-radius:16px;padding:16px;text-align:center;margin-bottom:14px;"><img id="obLogoPrev" src="'+(state.logoDataUrl||"logo.png")+'" alt="Logo" style="max-width:120px;max-height:120px;border-radius:12px;background:#fff;object-fit:contain;"></div><label style="display:block;width:100%;box-sizing:border-box;min-height:48px;border-radius:12px;background:rgba(255,255,255,.15);text-align:center;line-height:48px;font-weight:700;cursor:pointer;margin-bottom:18px;">Choose image<input id="obLogo" type="file" accept="image/*" style="display:none;"></label><button type="button" id="obNext" style="width:100%;min-height:50px;border:0;border-radius:14px;background:#fff;color:#0b3d91;font-weight:800;font-size:16px;cursor:pointer;">Next</button><button type="button" id="obSkipLogo" style="width:100%;min-height:44px;border:0;border-radius:12px;background:transparent;color:#fff;font-weight:600;font-size:14px;cursor:pointer;margin-top:8px;">Skip logo</button>';
        var inp = document.getElementById("obLogo");
        if(inp){ inp.addEventListener("change", function(){ var f = inp.files && inp.files[0]; if(!f) return; fileToDataUrl(f).then(function(url){ state.logoDataUrl = url; var img = document.getElementById("obLogoPrev"); if(img) img.src = url; }).catch(function(){}); }); }
      } else if(step === 3){
        inner.innerHTML = '<h2 style="margin:8px 0 6px;font-size:20px;font-weight:800;">Add your first product</h2><p style="margin:0 0 16px;font-size:14px;opacity:.9;">Optional. Appears in Admin → Products and Billing.</p><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Product name</label><input id="obPName" type="text" placeholder="e.g. Amul Milk 1L" value="'+esc(state.productName)+'" style="width:100%;box-sizing:border-box;min-height:48px;border-radius:12px;border:0;padding:12px 14px;font-size:16px;margin-bottom:12px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;"><div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Price (₹)</label><input id="obPPrice" type="number" min="0" step="0.01" placeholder="0" value="'+esc(state.productPrice)+'" style="width:100%;box-sizing:border-box;min-height:48px;border-radius:12px;border:0;padding:12px 14px;font-size:16px;"></div><div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Stock</label><input id="obPStock" type="number" min="0" placeholder="10" value="'+esc(state.productStock)+'" style="width:100%;box-sizing:border-box;min-height:48px;border-radius:12px;border:0;padding:12px 14px;font-size:16px;"></div></div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Barcode (optional)</label><input id="obPBar" type="text" placeholder="EAN / code" value="'+esc(state.productBarcode)+'" style="width:100%;box-sizing:border-box;min-height:48px;border-radius:12px;border:0;padding:12px 14px;font-size:16px;margin-bottom:18px;"><button type="button" id="obNext" style="width:100%;min-height:50px;border:0;border-radius:14px;background:#fff;color:#0b3d91;font-weight:800;font-size:16px;cursor:pointer;">Finish setup</button><button type="button" id="obSkipProd" style="width:100%;min-height:44px;border:0;border-radius:12px;background:transparent;color:#fff;font-weight:600;font-size:14px;cursor:pointer;margin-top:8px;">Skip product</button>';
      }
      var next = document.getElementById("obNext");
      if(next) next.addEventListener("click", onNext);
      var skL = document.getElementById("obSkipLogo");
      if(skL) skL.addEventListener("click", function(){ state.logoDataUrl = ""; step = 3; render(); });
      var skP = document.getElementById("obSkipProd");
      if(skP) skP.addEventListener("click", function(){ state.productName = ""; finish(false); });
    }
    function onNext(){
      if(step === 0){ step = 1; render(); return; }
      if(step === 1){
        var name = String((document.getElementById("obName") || {}).value || "").trim();
        var phone = String((document.getElementById("obPhone") || {}).value || "").trim();
        var tag = String((document.getElementById("obTag") || {}).value || "").trim();
        if(!name){ var err = document.getElementById("obErr"); if(err){ err.style.display = "block"; err.textContent = "Please enter your business name."; } return; }
        state.brandName = name; state.brandPhone = phone; state.brandTagline = tag || "OrbitBills"; step = 2; render(); return;
      }
      if(step === 2){ step = 3; render(); return; }
      if(step === 3){
        state.productName = String((document.getElementById("obPName") || {}).value || "").trim();
        state.productPrice = String((document.getElementById("obPPrice") || {}).value || "").trim();
        state.productStock = String((document.getElementById("obPStock") || {}).value || "0").trim();
        state.productBarcode = String((document.getElementById("obPBar") || {}).value || "").trim();
        finish(false);
      }
    }
    document.getElementById("orbitOnboardSkip").addEventListener("click", function(){ finish(true); });
    render();
  }
  window.__orbitShowOnboarding = showOnboarding;
  window.__orbitResetOnboarding = function(){ try{ localStorage.removeItem(ONBOARD_KEY); }catch(e){} };
  function maybeOnboard(){
    try{
      if(hasDoneOnboarding()) return;
      var path = (location.pathname || "").toLowerCase();
      if(/signin|offline|splash|404/.test(path)) return;
      setTimeout(function(){ try{ showOnboarding(); }catch(e){} }, 1100);
    }catch(e){}
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", maybeOnboard);
  else maybeOnboard();
  window.addEventListener("load", maybeOnboard);
})();
