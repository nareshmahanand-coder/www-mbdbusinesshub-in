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
    minWebViewVersion: 80,
    initialFocus: true,
    includePlugins: [
      '@capacitor/app',
      '@capacitor/preferences',
      '@capacitor/browser',
      '@capacitor/push-notifications',
    ],
    // Append a tag to the default Chrome UA so we stay recognized as Chrome
    // for analytics, while Google OAuth is handled in Chrome Custom Tabs
    // (via @capacitor/browser) — never inside the WebView.
    appendUserAgent: 'MeraBharatDukaanApp',
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
