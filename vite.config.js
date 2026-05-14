import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['tupi.png', 'tupi-logo.png'],
      manifest: {
        name: 'Tupi',
        short_name: 'Tupi',
        description: 'A quiet space to come back to yourself.',
        theme_color: '#F5F0E8',
        background_color: '#F5F0E8',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png',      sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png',      sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
      },
    }),
  ],
})
