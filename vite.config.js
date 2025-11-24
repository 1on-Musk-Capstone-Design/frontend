import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/onit/", // GitHub Pages 배포 경로에 맞춘 base 경로
  plugins: [react()],
  server: {
    port: 3000,
    open: true
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
