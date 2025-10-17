import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Crime Analysis Dashboard',
        short_name: 'CrimeDash',
        description: 'Advanced crime data analysis and visualization platform',
        theme_color: '#1f2937',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/apicrimeanalyze\.bastosdev\.xyz\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 1000, // 1 hour
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          ui: ['@heroicons/react', '@tailwindcss/typography'],
          charts: ['chart.js', 'react-chartjs-2', 'd3'],
          maps: ['leaflet', 'react-leaflet', 'mapbox-gl'],
          utils: ['axios', 'i18next', 'react-i18next'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      "/api": {
        target:
          process.env.VITE_API_BASE_URL ||
          "https://apicrimeanalyze.bastosdev.xyz",
        changeOrigin: true,
      },
      "/auth": {
        target:
          process.env.VITE_API_BASE_URL ||
          "https://apicrimeanalyze.bastosdev.xyz/",
        changeOrigin: true,
      },
    },
  },
});
