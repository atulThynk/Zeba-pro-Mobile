/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    
    react(),
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // ✅ add this
    },
  },
  server: {
    port: 3000,   // 👈 change port here
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
