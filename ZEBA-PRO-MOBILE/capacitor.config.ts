import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.Zeba',
  appName: 'Zeba',
  webDir: 'dist',
  plugins: {
    SafeArea: {
      enabled: true,
      customColorsForSystemBars: true,
      statusBarColor: '#ffffff', // White
      statusBarContent: 'light', 
      navigationBarColor: '#f2f2f2', // White (Android)
      navigationBarContent: 'dark',
      offset: 0
    },
    StatusBar: {
      style: 'LIGHT', 
      backgroundColor: '#ffffff', 
      overlaysWebView: false 
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false
    }
  }
};

export default config;