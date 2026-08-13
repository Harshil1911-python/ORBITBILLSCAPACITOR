import type { CapacitorConfig } from '@capacitor/cli';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Reads app-config.json — change app name, link, offline mode there.
 * useLiveWebsite: false = start from www/ (local). preferLiveWhenOnline redirects to websiteUrl when online.
 * useLiveWebsite: true  = load websiteUrl from internet immediately.
 */
function loadAppConfig() {
  const raw = readFileSync(join(__dirname, 'app-config.json'), 'utf8');
  return JSON.parse(raw);
}

const s = loadAppConfig();

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

const siteHost = hostFromUrl(s.websiteUrl || '');
const extraHosts: string[] = Array.isArray(s.extraAllowedHosts) ? s.extraAllowedHosts : [];
const allowNavigation = [siteHost, ...extraHosts].filter(Boolean);
const brand = s.brandColor || '#0b3d91';
const useLive = s.useLiveWebsite === true && !!(s.websiteUrl && String(s.websiteUrl).trim());

const config: CapacitorConfig = {
  appId: s.appId || 'com.techserenia.orbitbills',
  appName: s.appName || 'OrbitBills',
  webDir: 'www',
  android: {
    allowMixedContent: !!s.allowHttp,
    backgroundColor: brand,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: Number(s.splashDurationMs) || 1800,
      launchAutoHide: true,
      backgroundColor: brand,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER',
      showSpinner: false,
      splashFullScreen: s.splashFullScreen !== false,
      splashImmersive: s.splashFullScreen !== false,
    },
    StatusBar: {
      style: (s.statusBarStyle === 'DARK' ? 'DARK' : 'LIGHT') as 'DARK' | 'LIGHT',
      backgroundColor: brand,
      overlaysWebView: false,
    },
    Keyboard: {
      resize: (s.keyboardResize || 'body') as 'body' | 'native' | 'ionic' | 'none',
      resizeOnFullScreen: true,
    },
  },
};

if (useLive) {
  config.server = {
    url: s.websiteUrl,
    cleartext: !!s.allowHttp,
    androidScheme: s.allowHttp ? 'http' : 'https',
    allowNavigation,
  };
} else {
  // Local bundle first. allowNavigation lets hybrid redirect to live site when online.
  config.server = {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: allowNavigation.length ? allowNavigation : undefined,
  };
}

export default config;
