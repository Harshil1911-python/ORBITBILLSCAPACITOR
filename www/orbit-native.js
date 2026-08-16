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
  var _lastOnline = null;

  function isOnLiveHost(){
    try{
      var h = (location.hostname||"").toLowerCase();
      if(!h) return false;
      return h.indexOf("onrender.com") >= 0 || h === "orbitbillsphone.onrender.com" || h === "orbitbillsdemo2.onrender.com";
    }catch(e){ return false; }
  }
  function isLocalCapOrigin(){
    try{
      var h = (location.hostname||"").toLowerCase();
      var proto = (location.protocol||"").toLowerCase();
      if(proto === "capacitor:" || proto === "ionic:") return true;
      if(h === "localhost" || h === "127.0.0.1") return true;
      return false;
    }catch(e){ return false; }
  }
  function localBaseUrl(){
    try{
      if(location.protocol === "capacitor:" || location.protocol === "ionic:") return location.protocol + "//localhost";
    }catch(e){}
    return "https://localhost";
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
  // ... (truncated for length - full file will be pushed via second method if needed)
