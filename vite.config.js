import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

// Read app version from package.json — single source of truth
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Get the git short SHA so each build is uniquely identifiable. Falls back to
// an empty string if git isn't available (e.g., the .git folder is missing or
// git CLI is not on PATH). The fallback is intentional — we want the build to
// succeed even outside a git checkout.
let gitShortSha = ''
try {
  gitShortSha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
} catch {
  console.warn('[vite.config] git rev-parse failed — version label will show "no hash"')
}

// https://vite.dev/config/
export default defineConfig({
  base: '/app/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(gitShortSha),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon-light-16x16.png', 'favicon-light-32x32.png', 'favicon-dark-16x16.png', 'favicon-dark-32x32.png', 'apple-touch-icon.png', 'mask-icon.svg', 'icon.svg'],
      manifest: {
        name: 'm-session',
        short_name: 'm-session',
        description: 'Guided meditation, breathwork, and journaling for intentional experiences',
        theme_color: '#F5F5F0',
        background_color: '#1A1A1A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/app/',
        start_url: '/app/',
        id: '/app/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache audio files for offline meditation playback
            urlPattern: /\/audio\/.*\.(mp3|wav|ogg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist/app',
  },
  server: {
    allowedHosts: ['.ngrok-free.app'],
  },
})
