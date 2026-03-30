import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:2121',
      '/login': 'http://localhost:2121',
      '/register': 'http://localhost:2121',
      '/refresh': 'http://localhost:2121',
      '/uploads': 'http://localhost:2121',
      '/ws': {
        target: 'ws://localhost:2121',
        ws: true,
      },
    },
  },
})
