import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.merabharatdukaan.app',
  appName: 'Mera Bharat Dukaan',
  webDir: 'dist',
  server: {
    url: 'https://shop.mbdbusinesshub.in',
    cleartext: false,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#FF8C00',
  },
};

export default config;
