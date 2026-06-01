import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const websocketProxyTarget = env.VITE_WS_PROXY_TARGET || 'http://localhost:8080'
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      host: true,
      allowedHosts: ['surgical-unbraided-stack.ngrok-free.dev', '.ngrok-free.dev', 'localhost'],
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('API proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('API proxying request:', req.method, req.url, '→', proxyReq.path, 'target=', apiProxyTarget);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('API proxy response:', req.url, proxyRes.statusCode);
            });
          }
        },
        '/ws': {
          target: websocketProxyTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => `/api${path}`,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('WebSocket proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying request:', req.method, req.url, '→', proxyReq.path, 'target=', websocketProxyTarget);
              console.log('Proxying request:', req.method, req.url, '→', proxyReq.path, 'target=', websocketProxyTarget);
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
