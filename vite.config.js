import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const websocketProxyTarget = process.env.VITE_WS_PROXY_TARGET || 'http://localhost:8080';
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true,
    allowedHosts: ['surgical-unbraided-stack.ngrok-free.dev', '.ngrok-free.dev', 'localhost'],
    // WebSocket 프록시 설정 (로컬 개발 시 백엔드 WebSocket 사용)
    // SockJS가 /ws/info, /ws/websocket 등의 경로를 사용하므로 모두 프록시
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: websocketProxyTarget,
        ws: true, // WebSocket 업그레이드 지원
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/api${path}`, // 백엔드 context-path(/api) 보정 (/ws/info → /api/ws/info)
        // HTTP 요청도 프록시 (SockJS의 /ws/info는 HTTP GET 요청)
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('WebSocket proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', req.url, proxyRes.statusCode);
          });
        }
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


