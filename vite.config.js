import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-icon-large.png'],
      manifest: {
        name: 'Bumi Adipura Warga',
        short_name: 'BumiAdipura',
        description: 'Aplikasi Smart Residence untuk Warga Bumi Adipura',
        theme_color: '#059669',
        background_color: '#F5F7FA',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-icon-large.png',
            sizes: '192x192', // Browser will resize
            type: 'image/png'
          },
          {
            src: 'pwa-icon-large.png',
            sizes: '512x512', // Browser will resize
            type: 'image/png'
          },
          {
            src: 'pwa-icon-large.png',
            sizes: '512x512', // Maskable
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})