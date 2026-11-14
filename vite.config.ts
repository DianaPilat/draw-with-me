import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Draw with Me',
        short_name: 'Draw with Me',
        description: 'Step-by-step drawing lessons for kids',
        theme_color: '#ffb703',
        background_color: '#fff8e7',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Lesson assets (svg/json/m4a) join the precache in later milestones.
        globPatterns: ['**/*.{js,css,html,svg,png,json,m4a,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
