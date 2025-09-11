import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.Zeba',
  appName: 'Zeba',
  webDir: 'dist',
  plugins: {
    SafeArea: {
      enabled: true,
      customColorsForSystemBars: true,
      statusBarColor: '#00000000', // Transparent
      statusBarContent: 'light', // Light icons/text
      navigationBarColor: '#00000000', // Transparent (Android)
      navigationBarContent: 'light',
      offset: 0
    },
    StatusBar: {
      style: 'DARK', // Dark text/icons
      backgroundColor: '#00000000', // Transparent
      overlaysWebView: true // Content under status bar
    }
  }
};

export default config;