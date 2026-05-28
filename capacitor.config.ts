import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.merabharatdukaan.app',
  appName: 'Mera Bharat Dukaan',
  webDir: 'dist',
  server: {
    url: 'https://shop.mbdbusinesshub.in',
    cleartext: false,
    androidScheme: 'https',
    // Keep all in-app navigation inside the native WebView (no Chrome handoff).
    allowNavigation: [
      'shop.mbdbusinesshub.in',
      '*.mbdbusinesshub.in',
      'merabharatdukaan.lovable.app',
      '*.lovable.app',
      '*.supabase.co',
      '*.googleapis.com',
      '*.gstatic.com',
      'accounts.google.com',
    ],
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1a237e',
    webContentsDebuggingEnabled: false,
    overrideUserAgent:
      'Mozilla/5.0 (Linux; Android 13; MeraBharatDukaan) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 MBDApp/1.0',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#1a237e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a237e',
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
