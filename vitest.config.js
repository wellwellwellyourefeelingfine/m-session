import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'virtual:pwa-register/react': path.resolve('./src/test/mocks/pwa-register.js'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify('test'),
    __BUILD_SHA__: JSON.stringify('test'),
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
})
