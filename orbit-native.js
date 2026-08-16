(function(){
  if(window.__orbitNativeLoaded) return;
  window.__orbitNativeLoaded = true;
  function hasCap(){
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  function plugin(n){
    try{ return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[n]; }catch(e){ return null; }
  }
  var LIVE_URL = "https://orbitbillsphone.onrender.com";
  var PREFER_LIVE = false;
  var SYNC_PATH = "OrbitBills/orbit-sync-backup.json";
  var _syncBusy = false;
  function isOnLiveHost(){
    try{
      var h = (location.hostname||"").toLowerCase();
      return h.indexOf("onrender.com") >= 0 || h === "orbitbillsphone.onrender.com" || h === "orbitbillsdemo2.onrender.com";
    }catch(e){ return false; }
  }
  function isLocalCapOrigin(){
    try{
      var h = (location.hostname||"").toLowerCase();
      var proto = (location.protocol||"").toLowerCase();
      if(proto === "capacitor:" || proto === "ionic:") return true;
      return h === "localhost" || h === "127.0.0.1";
    }catch(e){ return false; }
  }
  function currentAppPath(){
    try{
      var p = location.pathname || "/";
      var parts = p.split("/").filter(Boolean);
      var file = parts.length ? parts[parts.length - 1] : "index.html";
      if(!/\.html$/i.test(file)) file = "index.html";
      var allowed = {"billing.html":1,"admin-dashboard.html":1,"accountant-dashboard.html":1,"signin.html":1,"index.html":1,"home.html":1,"offline.html":1};
      if(!allowed[file]) file = "index.html";
      return "/" + file;
    }catch(e){ return "/index.html"; }
  }
  function waitForDb(maxMs){
    maxMs = maxMs || 4000;
    return new Promise(function(resolve){
      var start = Date.now();
      (function tick(){
        if(typeof window.tsBuildBackupPayload === "function" && typeof window.tsRestoreBackupPayload === "function"){ resolve(true); return; }
        if(Date.now() - start > maxMs){ resolve(false); return; }
        setTimeout(tick, 80);
      })();
    });
  }
  async function writeSyncBackup(payload){
    var Filesystem = plugin("Filesystem");
    if(!Filesystem || !Filesystem.writeFile) return false;
    try{
      var json = JSON.stringify(payload);
      await Filesystem.writeFile({ path: SYNC_PATH, data: btoa(unescape(encodeURIComponent(json))), directory: "DATA", recursive: true });
      return true;
    }catch(e){ return false; }
  }
  async function readSyncBackup(){
    var Filesystem = plugin("Filesystem");
    if(!Filesystem || !Filesystem.readFile) return null;
    try{
      var res = await Filesystem.readFile({ path: SYNC_PATH, directory: "DATA" });
      var raw = res && res.data; if(!raw) return null;
      var text;
      try{ text = decodeURIComponent(escape(atob(raw))); }catch(e1){ try{ text = atob(raw); }catch(e2){ text = String(raw); } }
      var payload = JSON.parse(text);
      if(!payload || payload.format !== "orbitbills-local-backup") return null;
      return payload;
    }catch(e){ return null; }
  }
  async function exportDbToNative(){
    if(!hasCap() || _syncBusy) return false;
    _syncBusy = true;
    try{
      if(!(await waitForDb(3000))) return false;
      var payload = await window.tsBuildBackupPayload();
      if(!payload) return false;
      payload.syncSource = isOnLiveHost() ? "live" : "local";
      payload.syncPath = currentAppPath();
      return await writeSyncBackup(payload);
    }catch(e){ return false; }
    finally{ _syncBusy = false; }
  }
  async function importDbFromNative(opts){
    opts = opts || {};
    if(!hasCap() || _syncBusy) return false;
    _syncBusy = true;
    try{
      if(!(await waitForDb(4000))) return false;
      var payload = await readSyncBackup();
      if(!payload || !payload.stores) return false;
      try{ var applied = localStorage.getItem("orbit_sync_applied_at"); if(applied && payload.exportedAt && applied === payload.exportedAt) return false; }catch(e){}
      var mode = "merge";
      try{
        if(opts.force) mode = "replace";
        else if(typeof window.tsCount === "function"){
          var ic = await window.tsCount("invoices");
          var pc = await window.tsCount("products");
          if((ic||0)===0 && (pc||0)===0) mode = "replace";
        }
      }catch(e){}
      await window.tsRestoreBackupPayload(payload, { mode: mode });
      try{ if(typeof window.tsSetSetting === "function" && payload.exportedAt) await window.tsSetSetting("orbit_last_export_at", payload.exportedAt); }catch(e){}
      try{ localStorage.setItem("orbit_sync_applied_at", payload.exportedAt || ""); }catch(e){}
      return true;
    }catch(e){ return false; }
    finally{ _syncBusy = false; }
  }
  window.__orbitExportSync = exportDbToNative;
  window.__orbitImportSync = importDbFromNative;
  async function setChromeColors(){
    var brand = "#ffffff";
    try{ var StatusBar=plugin("StatusBar"); if(StatusBar){ if(StatusBar.setBackgroundColor) await StatusBar.setBackgroundColor({color:brand}); if(StatusBar.setStyle) await StatusBar.setStyle({style:"DARK"}); if(StatusBar.setOverlaysWebView) await StatusBar.setOverlaysWebView({overlay:false}); } }catch(e){}
  }
  function loadSetup(){
    try{
      if(window.__orbitSetupLoaded) return;
      if(document.querySelector("script[data-orbit-setup]")) return;
      var s = document.createElement("script");
      s.src = "orbit-setup.js";
      s.async = true;
      s.setAttribute("data-orbit-setup", "1");
      (document.head || document.documentElement).appendChild(s);
    }catch(e){}
  }
  async function ready(){
    try{ if(hasCap() && isLocalCapOrigin()) setTimeout(function(){ importDbFromNative({}); }, 600); }catch(e){}
    if(!hasCap()){ try{ loadSetup(); }catch(e){} return false; }
    await setChromeColors();
    try{ var Splash = plugin("SplashScreen"); if(Splash && Splash.hide) await Splash.hide({ fadeOutDuration: 250 }); }catch(e){}
    try{ var Keyboard = plugin("Keyboard"); if(Keyboard && Keyboard.setResizeMode) await Keyboard.setResizeMode({ mode: "body" }); }catch(e){}
    try{ if(hasCap() && isLocalCapOrigin()) setInterval(function(){ exportDbToNative(); }, 60000); }catch(e){}
    try{ loadSetup(); }catch(e){}
    return true;
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
  window.addEventListener("load", ready);
})();
