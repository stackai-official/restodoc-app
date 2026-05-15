import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.restodoc.app',
  appName: 'RestoDoc',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      backgroundColor: '#0f172a',
      showSpinner: false,
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
    },
  },
  android: {
    backgroundColor: '#0f172a',
  },
};

export default config;
