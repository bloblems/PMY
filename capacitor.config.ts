import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pmy.titleix',
  appName: 'PMY',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    Camera: {
      quality: 90,
      saveToGallery: true,
      allowEditing: false,
      resultType: 'uri'
    }
  }
};

export default config;
