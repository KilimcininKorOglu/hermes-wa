import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiTarget = process.env.VITE_API_URL || 'http://localhost:2121'
const wsTarget = process.env.VITE_WS_URL || 'ws://localhost:2121'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': apiTarget,
      '/login': apiTarget,
      '/register': apiTarget,
      '/refresh': apiTarget,
      '/uploads': apiTarget,
      '/ws': {
        target: wsTarget,
        ws: true,
      },
    },
  },
})
