import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/keycloak': {
        target: 'https://keycloak.prod.transcapital.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/keycloak/, ''),
      },
    },
  },
})
