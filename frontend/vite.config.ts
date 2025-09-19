// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from 'tailwindcss'
// import autoprefixer from 'autoprefixer'

// export default defineConfig({
//   plugins: [react()],
//    build: {
//     outDir: 'build' 
//   },
//   server: {
//     port: 5173,
//     host: true
//   },
//   define: {
//     global: 'globalThis',
//   },
//   optimizeDeps: {
//     include: [
//       '@tensorflow/tfjs', 
//       '@tensorflow-models/coco-ssd',
//       'socket.io-client'
//     ]
//   },
//   css: {
//     postcss: {
//       plugins: [
//         tailwindcss(),
//         autoprefixer(),
//       ],
//     },
//   },
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build' 
  },
  server: {
    port: 5173,
    host: true
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      '@tensorflow/tfjs', 
      '@tensorflow-models/coco-ssd',
      'socket.io-client'
    ]
  }
})