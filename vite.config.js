import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_DEV_PROXY_TARGET || 'http://43.201.49.18:8080'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      // 로컬 개발 서버는 CORS를 피하기 위해 API/WebSocket을 백엔드로 프록시합니다.
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: backendTarget,
          ws: true, // WebSocket 업그레이드 지원
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // 경로 그대로 전달 (/ws/info → /ws/info)
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
  }
})
