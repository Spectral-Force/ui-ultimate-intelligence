import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' so we can show an update toast instead of silent auto-update
      registerType: 'prompt',
      manifest: {
        name: 'UI — Ultimate Intelligence',
        short_name: 'UI',
        description: 'Personal science & mathematics quiz app',
        theme_color: '#1a1612',
        background_color: '#1a1612',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  base: './',
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split heavy 3rd-party deps so the app shell stays tiny on first load (I1)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('katex'))    return 'vendor-katex'
            if (id.includes('recharts')) return 'vendor-recharts'
            if (id.includes('dexie'))    return 'vendor-dexie'
            if (id.includes('react'))    return 'vendor-react'
          }
          // Split the question bank from the app code; it'll be ~half the bundle
          if (id.includes('/src/questions/')) return 'questions'
        },
      },
    },
  },
})
