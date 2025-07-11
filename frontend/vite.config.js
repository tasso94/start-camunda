import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/download': 'http://localhost:9090',
      '/show': 'http://localhost:9090',
      '/versions.json': 'http://localhost:9090'
    }
  },
  build: {
    outDir: 'build',
    assetsDir: 'static'
  }
})
