import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // vite-plugin-pwa injects the manifest link and its own
      // registerSW.js for us. Declaring `injectRegister: 'auto'` (the
      // default) alongside a manual navigator.serviceWorker.register()
      // in the app produced two registrations and two <link rel=manifest>.
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Twitter Clone',
        short_name: 'Twitter',
        description: 'A Twitter clone built with React, TypeScript, Redux, and PWA',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    // Firebase Auth sits in the main chunk and Firestore in a lazy chunk.
    // The default 500 kB warning is noise here - splitting further would mean
    // deferring auth, which is exactly what we do not want on a login-first app.
    chunkSizeWarningLimit: 700
  }
})