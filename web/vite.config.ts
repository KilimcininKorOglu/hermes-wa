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
      '/uploads': apiTarget,
      '/ws': {
        target: wsTarget,
        ws: true,
      },
      // /login, /register, /refresh are both SPA routes and API endpoints.
      // Only proxy non-GET requests (POST) to the API backend.
      '/login': {
        target: apiTarget,
        bypass: (req) => {
          if (req.method === 'GET') return req.url
        },
      },
      '/register': {
        target: apiTarget,
        bypass: (req) => {
          if (req.method === 'GET') return req.url
        },
      },
      '/refresh': {
        target: apiTarget,
        bypass: (req) => {
          if (req.method === 'GET') return req.url
        },
      },
    },
  },
})
