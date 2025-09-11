// src/utils/StatusBarManager.ts
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export class StatusBarManager {
  static async configure() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not a native platform, skipping status bar configuration');
      return;
    }

    try {
      console.log('Starting status bar configuration...');
      
      // Step 1: Show the status bar first
      await StatusBar.show();
      console.log('Status bar shown');
      
      // Step 2: Set overlay to false to give status bar its own space
      await StatusBar.setOverlaysWebView({ overlay: false });
      console.log('Status bar overlay disabled');
      
      // Step 3: Set background color to white
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
      console.log('Status bar background color set to white');
      
      // Step 4: Set style to dark (black text/icons)
      await StatusBar.setStyle({ style: Style.Dark });
      console.log('Status bar style set to dark');
      
      // Step 5: Get status bar info for debugging
      const info = await StatusBar.getInfo();
      console.log('Status bar info:', info);
      
    } catch (error) {
      console.error('Status bar configuration failed:', error);
      
      // Fallback configuration
      try {
        console.log('Attempting fallback configuration...');
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#000000' });
        console.log('Fallback configuration applied');
      } catch (fallbackError) {
        console.error('Fallback configuration also failed:', fallbackError);
      }
    }
  }

  static async setDarkContent() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    } catch (error) {
      console.error('Failed to set dark content:', error);
    }
  }

  static async setLightContent() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#000000' });
    } catch (error) {
      console.error('Failed to set light content:', error);
    }
  }
}