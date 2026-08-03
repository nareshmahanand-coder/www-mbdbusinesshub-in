import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.merabharatdukaan.app2',
  appName: 'Mera Bharat Dukaan',
  webDir: 'dist',
  server: {
    url: 'https://shop.mbdbusinesshub.in',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      'shop.mbdbusinesshub.in',
      '*.mbdbusinesshub.in',
      'merabharatdukaan.lovable.app',
      '*.lovable.app',
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
      '@capacitor/browser',
      '@capacitor/preferences',
      '@capacitor/push-notifications',
      '@codetrix-studio/capacitor-google-auth',
      '@capacitor-community/text-to-speech',
    ],
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
      overlaysWebView: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert', 'banner', 'list'],
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Use the OAuth Web Client ID for native Android ID-token auth.
      // The Android OAuth client is only for package/SHA registration in
      // Google/Firebase; passing it here causes release-only ApiException 10.
      clientId: '36966220674-2ddjv8kfhn91b2k93qqsb54muc5ilvf2.apps.googleusercontent.com',
      androidClientId: '36966220674-2ddjv8kfhn91b2k93qqsb54muc5ilvf2.apps.googleusercontent.com',
      serverClientId: '36966220674-2ddjv8kfhn91b2k93qqsb54muc5ilvf2.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
