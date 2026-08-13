(function(){
  if(window.__orbitNativeLoaded) return;
  window.__orbitNativeLoaded = true;
  function hasCap(){ return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  function plugin(n){ try{ return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[n]; }catch(e){ return null; } }

  function applyImmersiveDom(){
    try{
      var d = window.document;
      var el = d.documentElement;
      // Immersive sticky via Fullscreen API when available (WebView)
      var req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      // Don't force browser fullscreen on non-native; only try on native
      if(hasCap() && req){
        // optional — some WebViews ignore this; native flags do the real work
      }
      // CSS helper class for pages that want edge-to-edge
      if(d.body) d.body.classList.add("orbit-immersive");
    }catch(e){}
  }

  async function setFullscreenChrome(){
    // Hide status bar (battery/time) and try to hide nav bar on Capacitor only
    try{
      var StatusBar = plugin("StatusBar");
      if(StatusBar){
        if(StatusBar.setOverlaysWebView) await StatusBar.setOverlaysWebView({ overlay: true });
        if(StatusBar.hide) await StatusBar.hide();
        // Keep style ready if bar briefly shows on swipe
        if(StatusBar.setStyle) await StatusBar.setStyle({ style: "DARK" });
        if(StatusBar.setBackgroundColor) await StatusBar.setBackgroundColor({ color: "#ffffff" });
      }
    }catch(e){}
    try{
      var Nav = plugin("NavigationBar") || plugin("EdgeToEdge") || plugin("AndroidNavigationBar");
      if(Nav){
        if(Nav.hide) await Nav.hide();
        else if(Nav.setTransparency) await Nav.setTransparency({ transparent: true });
        else if(Nav.setColor) await Nav.setColor({ color: "#00000000", darkButtons: true });
      }
    }catch(e){}
    try{
      var E = plugin("EdgeToEdge");
      if(E){
        if(E.enable) await E.enable();
        if(E.setBackgroundColor) await E.setBackgroundColor({ color: "#ffffff" });
      }
    }catch(e){}
    try{
      var meta = document.querySelector('meta[name="theme-color"]');
      if(meta) meta.setAttribute("content", "#ffffff");
      else {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = "#ffffff";
        document.head.appendChild(meta);
      }
    }catch(e){}
    applyImmersiveDom();
  }

  async function ready(){
    if(!hasCap()){
      setupNetwork(); setupBackButton();
      return false;
    }
    await setFullscreenChrome();
    try{ var Splash=plugin("SplashScreen"); if(Splash&&Splash.hide) await Splash.hide({fadeOutDuration:250}); }catch(e){}
    try{ var Keyboard=plugin("Keyboard"); if(Keyboard&&Keyboard.setResizeMode) await Keyboard.setResizeMode({mode:"body"}); }catch(e){}
    setupNetwork(); setupBackButton();
    // Re-hide if user swipes bars back into view
    try{
      document.addEventListener("visibilitychange", function(){
        if(document.visibilityState === "visible") setFullscreenChrome();
      });
      setInterval(function(){ if(hasCap()) setFullscreenChrome(); }, 4000);
    }catch(e){}
    try{ if(/billing\.html/i.test(location.pathname||"") && navigator.wakeLock && navigator.wakeLock.request){ try{ window.__orbitWake=await navigator.wakeLock.request("screen"); }catch(e){} } }catch(e){}
    return true;
  }

  function setupNetwork(){
    var Network=plugin("Network");
    var bar=document.getElementById("orbitOfflineBanner");
    if(!bar){ bar=document.createElement("div"); bar.id="orbitOfflineBanner"; bar.style.cssText="display:none;position:fixed;left:0;right:0;top:0;z-index:99999;background:#b91c1c;color:#fff;text-align:center;font:600 13px/1.3 system-ui,sans-serif;padding:8px 10px;padding-top:max(8px,env(safe-area-inset-top));"; bar.textContent="You are offline — sales stay on this device until sync returns"; (document.body||document.documentElement).appendChild(bar); }
    function setOnline(ok){ bar.style.display=ok?"none":"block"; }
    if(Network&&Network.getStatus){ Network.getStatus().then(function(s){ setOnline(!!s.connected); }).catch(function(){}); if(Network.addListener) Network.addListener("networkStatusChange", function(s){ setOnline(!!s.connected); }); }
    else { setOnline(navigator.onLine); window.addEventListener("online", function(){ setOnline(true); }); window.addEventListener("offline", function(){ setOnline(false); }); }
  }

  function setupBackButton(){
    var App=plugin("App");
    window.__orbitAndroidBack=function(){
      if(document.body&&document.body.classList.contains("m-cart-open")){ if(window.__orbitCloseMobileCart) window.__orbitCloseMobileCart(); else document.body.classList.remove("m-cart-open"); return true; }
      var menu=document.getElementById("mobileMenu");
      if(menu&&menu.classList.contains("open")){ if(window.__orbitCloseMobileMenu) window.__orbitCloseMobileMenu(); else menu.classList.remove("open"); return true; }
      var openModal=document.querySelector(".modal-bg.open");
      if(openModal){ openModal.classList.remove("open"); return true; }
      if(window.history.length>1){ history.back(); return true; }
      return false;
    };
    if(App&&App.addListener){ App.addListener("backButton", function(){ var handled=false; try{ handled=!!window.__orbitAndroidBack(); }catch(e){} if(!handled&&App.exitApp) App.exitApp(); }); }
  }

  window.__orbitHaptic=async function(style){
    try{
      if(!hasCap()){ if(navigator.vibrate) navigator.vibrate(style==="error"?30:12); return; }
      var H=plugin("Haptics"); if(!H) return;
      if(style==="success"&&H.notification) await H.notification({type:"SUCCESS"});
      else if(style==="error"&&H.notification) await H.notification({type:"ERROR"});
      else if(H.impact) await H.impact({style:"LIGHT"});
    }catch(e){}
  };

  window.__orbitNativeShare=async function(opts){
    opts=opts||{};
    var Share=plugin("Share"); var Filesystem=plugin("Filesystem");
    if(Share&&Share.share&&Filesystem&&opts.blob&&opts.filename){
      var b64=await new Promise(function(resolve,reject){ var r=new FileReader(); r.onload=function(){ var s=String(r.result||""); var i=s.indexOf(","); resolve(i>=0?s.slice(i+1):s); }; r.onerror=reject; r.readAsDataURL(opts.blob); });
      var path="OrbitBills/"+opts.filename;
      await Filesystem.writeFile({path:path,data:b64,directory:"CACHE",recursive:true});
      var uriRes=await Filesystem.getUri({path:path,directory:"CACHE"});
      var uri=uriRes&&(uriRes.uri||uriRes);
      await Share.share({title:opts.title||"OrbitBills",text:opts.text||"",url:uri,dialogTitle:"Share"});
      return true;
    }
    if(navigator.share){ await navigator.share({title:opts.title,text:opts.text,url:opts.url}); return true; }
    return false;
  };

  // Expose re-apply for after keyboard / resume
  window.__orbitFullscreen = setFullscreenChrome;

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", ready); else ready();
  window.addEventListener("load", ready);
})();
