# WebSocket 연결 문제 해결 가이드

## 문제: 로컬에서 WebSocket 연결 실패

### 증상
- `GET http://localhost:3000/ws/info 404 (Not Found)`
- `Cannot connect to server` 오류

### 원인
Vite 프록시가 SockJS의 `/ws/info` 요청을 백엔드로 전달하지 못함

## 해결 방법

### 1. 개발 서버 재시작

Vite 프록시 설정 변경 후 개발 서버를 재시작해야 합니다:

```bash
# 개발 서버 중지 (Ctrl+C)
# 개발 서버 재시작
npm run dev
```

### 2. Vite 프록시 확인

`vite.config.js`의 프록시 설정이 올바른지 확인:

```javascript
proxy: {
  '/ws': {
    target: 'http://51.20.106.74:8080',
    ws: true,
    changeOrigin: true,
    secure: false
  }
}
```

### 3. 백엔드 서버 확인

백엔드 서버가 `/ws/info` 엔드포인트를 제공하는지 확인:

```bash
# 백엔드 서버 응답 확인
curl -I http://51.20.106.74:8080/ws/info
```

정상 응답 예시:
```
HTTP/1.1 200 OK
Content-Type: application/json
```

### 4. 브라우저 콘솔 확인

개발 서버 재시작 후 브라우저 콘솔에서 프록시 로그 확인:
- `Proxying request: GET /ws/info → /ws/info`
- `Proxy response: /ws/info 200`

### 5. 대안: 백엔드 CORS 설정

Vite 프록시가 작동하지 않으면 백엔드에서 CORS를 허용하도록 설정:

**Spring Boot 예시:**
```java
@Configuration
public class WebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new MyWebSocketHandler(), "/ws")
            .setAllowedOrigins("http://localhost:3000");
    }
}
```

그리고 `src/config/api.ts`에서 직접 백엔드 서버 사용:
```typescript
if (hostname === 'localhost' || hostname === '127.0.0.1') {
  return 'http://51.20.106.74:8080'; // 직접 연결
}
```

## 디버깅

### Vite 프록시 로그 확인

개발 서버 콘솔에서 다음 로그 확인:
- `Proxying request: GET /ws/info`
- `Proxy response: /ws/info 200`

### 네트워크 탭 확인

브라우저 개발자 도구 → Network 탭:
1. `/ws/info` 요청 확인
2. Status Code 확인 (200이어야 함)
3. Response 확인

### 백엔드 로그 확인

백엔드 서버 로그에서 `/ws/info` 요청이 도착하는지 확인

## 참고

- Vite 프록시는 개발 서버 재시작 후에만 적용됩니다
- WebSocket 연결은 HTTP 요청으로 시작되므로 프록시가 HTTP와 WebSocket 모두 지원해야 합니다
- SockJS는 여러 전송 방식을 시도하므로 모든 경로가 프록시되어야 합니다

