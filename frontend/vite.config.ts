import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@tensorflow/tfjs', '@tensorflow-models/coco-ssd']
  }
})
