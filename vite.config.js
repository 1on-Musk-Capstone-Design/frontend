import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // WebSocket 프록시 설정 (로컬 개발 시 백엔드 WebSocket 사용)
    proxy: {
      '/ws': {
        target: 'http://51.20.106.74:8080',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  },
  // SPA 라우팅을 위한 설정
  appType: 'spa',
  // 브라우저 환경에서 global 폴리필 추가 (sockjs-client 호환성)
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Node.js polyfills for browser
      buffer: 'buffer',
    }
  }
})


