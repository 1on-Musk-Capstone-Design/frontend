// vite.config.js
import { defineConfig } from "file:///Users/mjmac/Documents/development/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///Users/mjmac/Documents/development/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 3e3,
    open: true,
    // WebSocket 프록시 설정 (로컬 개발 시 백엔드 WebSocket 사용)
    // SockJS가 /ws/info, /ws/websocket 등의 경로를 사용하므로 모두 프록시
    proxy: {
      "/ws": {
        target: "http://51.20.106.74:8080",
        ws: true,
        // WebSocket 업그레이드 지원
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        // 경로 그대로 전달 (/ws/info → /ws/info)
        // HTTP 요청도 프록시 (SockJS의 /ws/info는 HTTP GET 요청)
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("WebSocket proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Proxying request:", req.method, req.url, "\u2192", proxyReq.path);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Proxy response:", req.url, proxyRes.statusCode);
          });
        }
      }
    }
  },
  // SPA 라우팅을 위한 설정
  appType: "spa",
  // 브라우저 환경에서 global 폴리필 추가 (sockjs-client 호환성)
  define: {
    global: "globalThis"
  },
  resolve: {
    alias: {
      // Node.js polyfills for browser
      buffer: "buffer"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbWptYWMvRG9jdW1lbnRzL2RldmVsb3BtZW50L2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbWptYWMvRG9jdW1lbnRzL2RldmVsb3BtZW50L2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9tam1hYy9Eb2N1bWVudHMvZGV2ZWxvcG1lbnQvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwLFxuICAgIG9wZW46IHRydWUsXG4gICAgLy8gV2ViU29ja2V0IFx1RDUwNFx1Qjg1RFx1QzJEQyBcdUMxMjRcdUM4MTUgKFx1Qjg1Q1x1Q0VFQyBcdUFDMUNcdUJDMUMgXHVDMkRDIFx1QkMzMVx1QzVENFx1QjREQyBXZWJTb2NrZXQgXHVDMEFDXHVDNkE5KVxuICAgIC8vIFNvY2tKU1x1QUMwMCAvd3MvaW5mbywgL3dzL3dlYnNvY2tldCBcdUI0RjFcdUM3NTggXHVBQ0JEXHVCODVDXHVCOTdDIFx1QzBBQ1x1QzZBOVx1RDU1OFx1QkJDMFx1Qjg1QyBcdUJBQThcdUI0NTAgXHVENTA0XHVCODVEXHVDMkRDXG4gICAgcHJveHk6IHtcbiAgICAgICcvd3MnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly81MS4yMC4xMDYuNzQ6ODA4MCcsXG4gICAgICAgIHdzOiB0cnVlLCAvLyBXZWJTb2NrZXQgXHVDNUM1XHVBREY4XHVCODA4XHVDNzc0XHVCNERDIFx1QzlDMFx1QzZEMFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLCAvLyBcdUFDQkRcdUI4NUMgXHVBREY4XHVCMzAwXHVCODVDIFx1QzgwNFx1QjJFQyAoL3dzL2luZm8gXHUyMTkyIC93cy9pbmZvKVxuICAgICAgICAvLyBIVFRQIFx1QzY5NFx1Q0NBRFx1QjNDNCBcdUQ1MDRcdUI4NURcdUMyREMgKFNvY2tKU1x1Qzc1OCAvd3MvaW5mb1x1QjI5NCBIVFRQIEdFVCBcdUM2OTRcdUNDQUQpXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBfb3B0aW9ucykgPT4ge1xuICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIF9yZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdXZWJTb2NrZXQgcHJveHkgZXJyb3InLCBlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxLCBfcmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUHJveHlpbmcgcmVxdWVzdDonLCByZXEubWV0aG9kLCByZXEudXJsLCAnXHUyMTkyJywgcHJveHlSZXEucGF0aCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVzJywgKHByb3h5UmVzLCByZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdQcm94eSByZXNwb25zZTonLCByZXEudXJsLCBwcm94eVJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy8gU1BBIFx1Qjc3Q1x1QzZCMFx1RDMwNVx1Qzc0NCBcdUM3MDRcdUQ1NUMgXHVDMTI0XHVDODE1XG4gIGFwcFR5cGU6ICdzcGEnLFxuICAvLyBcdUJFMENcdUI3N0NcdUM2QjBcdUM4MDAgXHVENjU4XHVBQ0JEXHVDNUQwXHVDMTFDIGdsb2JhbCBcdUQzRjRcdUI5QUNcdUQ1NDQgXHVDRDk0XHVBQzAwIChzb2NranMtY2xpZW50IFx1RDYzOFx1RDY1OFx1QzEzMSlcbiAgZGVmaW5lOiB7XG4gICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgLy8gTm9kZS5qcyBwb2x5ZmlsbHMgZm9yIGJyb3dzZXJcbiAgICAgIGJ1ZmZlcjogJ2J1ZmZlcicsXG4gICAgfVxuICB9XG59KVxuXG5cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVQsU0FBUyxvQkFBb0I7QUFDaFYsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQTtBQUFBLElBR04sT0FBTztBQUFBLE1BQ0wsT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFFBQ1IsSUFBSTtBQUFBO0FBQUEsUUFDSixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixTQUFTLENBQUMsU0FBUztBQUFBO0FBQUE7QUFBQSxRQUVuQixXQUFXLENBQUMsT0FBTyxhQUFhO0FBQzlCLGdCQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssTUFBTSxTQUFTO0FBQ3JDLG9CQUFRLElBQUkseUJBQXlCLEdBQUc7QUFBQSxVQUMxQyxDQUFDO0FBQ0QsZ0JBQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLFNBQVM7QUFDNUMsb0JBQVEsSUFBSSxxQkFBcUIsSUFBSSxRQUFRLElBQUksS0FBSyxVQUFLLFNBQVMsSUFBSTtBQUFBLFVBQzFFLENBQUM7QUFDRCxnQkFBTSxHQUFHLFlBQVksQ0FBQyxVQUFVLEtBQUssU0FBUztBQUM1QyxvQkFBUSxJQUFJLG1CQUFtQixJQUFJLEtBQUssU0FBUyxVQUFVO0FBQUEsVUFDN0QsQ0FBQztBQUFBLFFBQ0g7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsU0FBUztBQUFBO0FBQUEsRUFFVCxRQUFRO0FBQUEsSUFDTixRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBO0FBQUEsTUFFTCxRQUFRO0FBQUEsSUFDVjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
