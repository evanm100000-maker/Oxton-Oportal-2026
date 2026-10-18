import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'

const BUILD_TIME = Date.now();
const APP_VERSION = '1.2.5';

// Plugin to write public/version.json on build
function versionEmitterPlugin() {
  return {
    name: 'version-emitter',
    buildStart() {
      const data = JSON.stringify({ version: APP_VERSION, buildTime: BUILD_TIME });
      try {
        fs.writeFileSync('public/version.json', data);
      } catch (e) {
        console.error('Failed to write version.json', e);
      }
    }
  };
}

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_TIME__: BUILD_TIME
  },
  plugins: [
    react(),
    versionEmitterPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png'],
      manifest: {
        name: 'Oxton Oportal',
        short_name: 'Oxton',
        description: 'Staff and Passenger Portal for Oxton',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 2
            }
          },
          {
            urlPattern: /version\.json/,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
        }
      }
    }
  }
})
