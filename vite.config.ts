import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      // Cloudflare Pages serves 404.html for unmatched paths — this enables SPA routing
      name: 'cloudflare-spa-404',
      closeBundle() {
        fs.copyFileSync(
          path.resolve(__dirname, 'dist/index.html'),
          path.resolve(__dirname, 'dist/404.html')
        );
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
