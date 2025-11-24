# 로컬 개발 및 서버 배포 동시 운영 가이드

## 개요

로컬에서 개발하면서 동시에 서버에 프로덕션 빌드를 배포하여 운영할 수 있습니다.

## 방법 1: 로컬 개발 + 서버 프로덕션 배포 (권장)

### 로컬 개발 환경

```bash
# 로컬에서 개발 서버 실행
npm run dev
```

- **접속**: `http://localhost:3000`
- **특징**: 
  - Hot Module Replacement (HMR) 지원
  - 빠른 리로드
  - 개발 도구 사용 가능
- **API 연결**: `http://51.20.106.74:8080/api` (서버 API 사용)
- **WebSocket**: `http://localhost:3000` (로컬 WebSocket 서버 필요 시)

### 서버 프로덕션 배포

```bash
# 빌드
npm run build

# 서버에 배포
rsync -avz --delete -e "ssh -i ~/capstone.pem" dist/ ec2-user@51.20.106.74:/var/www/onit/
```

또는 **GitHub Actions 자동 배포**:
- `main` 브랜치에 푸시하면 자동으로 빌드 및 배포

- **접속**: `https://on-it.kro.kr`
- **특징**:
  - 프로덕션 최적화된 빌드
  - 실제 사용자들이 접속
  - HTTPS 지원

### 동시 사용 시나리오

1. **로컬에서 개발**:
   ```bash
   # 터미널 1: 개발 서버 실행
   npm run dev
   ```
   - 브라우저에서 `http://localhost:3000` 접속
   - 코드 수정 시 자동 리로드

2. **서버에 배포**:
   ```bash
   # 터미널 2: 빌드 및 배포
   npm run build
   rsync -avz --delete -e "ssh -i ~/capstone.pem" dist/ ec2-user@51.20.106.74:/var/www/onit/
   ```
   - 또는 GitHub에 푸시하여 자동 배포

3. **테스트**:
   - 로컬: `http://localhost:3000` - 개발 중인 기능 테스트
   - 서버: `https://on-it.kro.kr` - 프로덕션 환경 테스트

## 방법 2: 로컬 개발 서버를 외부에서 접근 가능하게 설정

로컬 개발 서버를 외부에서 접근할 수 있게 하여 실제 서버처럼 테스트할 수 있습니다.

### Vite 설정 수정

`vite.config.js` 수정:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // 외부 접근 허용
    open: true
  },
  // ... 나머지 설정
})
```

### 방화벽 설정

로컬 컴퓨터의 방화벽에서 포트 3000을 열어야 합니다:

**macOS:**
```bash
# 방화벽 설정 확인
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

**Windows:**
- Windows Defender 방화벽 → 고급 설정 → 인바운드 규칙 → 새 규칙
- 포트 3000 TCP 허용

### 외부 접근

로컬 네트워크에서 접근:
- `http://[로컬IP]:3000` (예: `http://192.168.0.100:3000`)

**로컬 IP 확인:**
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

### 인터넷을 통한 접근 (ngrok 사용)

로컬 개발 서버를 인터넷에서 접근 가능하게 하려면 ngrok을 사용:

```bash
# ngrok 설치
brew install ngrok  # macOS
# 또는 https://ngrok.com/download 에서 다운로드

# ngrok 실행
ngrok http 3000
```

출력 예시:
```
Forwarding  https://xxxxx.ngrok.io -> http://localhost:3000
```

- 외부 URL: `https://xxxxx.ngrok.io`
- 실제 사용자들이 접근 가능
- HTTPS 지원

**주의사항:**
- ngrok 무료 버전은 세션이 종료되면 URL이 변경됨
- 프로덕션 환경으로는 사용하지 않는 것이 좋음

## 방법 3: 개발/프로덕션 환경 분리

### 환경 변수 사용

`.env.development` (로컬 개발용):
```
VITE_API_BASE_URL=http://51.20.106.74:8080/api
VITE_SOCKET_URL=http://localhost:3000
```

`.env.production` (서버 배포용):
```
VITE_API_BASE_URL=/api
VITE_SOCKET_URL=/api
```

`src/config/api.ts` 수정:
```typescript
export const getApiBaseUrl = (): string => {
  // 환경 변수 우선 사용
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 기본 동작
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://51.20.106.74:8080/api';
  }
  return '/api';
};
```

## 권장 워크플로우

### 일상적인 개발

1. **로컬 개발**:
   ```bash
   npm run dev
   ```
   - `http://localhost:3000`에서 개발
   - 빠른 피드백 루프

2. **기능 완성 후 배포**:
   ```bash
   # 커밋 및 푸시
   git add .
   git commit -m "feat: 새 기능 추가"
   git push origin main
   ```
   - GitHub Actions가 자동으로 빌드 및 배포

3. **프로덕션 확인**:
   - `https://on-it.kro.kr`에서 확인

### 빠른 테스트 배포

로컬에서 빌드 후 수동 배포:

```bash
# 빌드
npm run build

# 서버에 배포
rsync -avz --delete -e "ssh -i ~/capstone.pem" dist/ ec2-user@51.20.106.74:/var/www/onit/
```

## 주의사항

### API URL 충돌

- **로컬**: `http://51.20.106.74:8080/api` 사용
- **서버**: `/api` 사용 (Nginx 프록시)

현재 설정은 자동으로 환경을 감지하므로 문제없습니다.

### WebSocket 충돌

- **로컬**: `http://localhost:3000` (로컬 WebSocket 서버 필요)
- **서버**: `/api` (서버 WebSocket 사용)

로컬에서 WebSocket을 사용하려면 백엔드 WebSocket 서버가 필요합니다.

### 동시 접속

- 로컬 개발 서버와 서버 프로덕션은 **독립적으로** 동작합니다
- 같은 백엔드 API를 사용하므로 데이터는 공유됩니다
- WebSocket 연결은 각각 독립적입니다

## 문제 해결

### 포트 충돌

```bash
# 포트 3000이 사용 중인 경우
lsof -ti:3000 | xargs kill

# 또는 다른 포트 사용
# vite.config.js에서 port 변경
```

### CORS 오류

로컬에서 서버 API를 사용할 때 CORS 오류가 발생하면:
- 백엔드에서 CORS 설정 확인
- `http://localhost:3000`을 허용된 Origin에 추가

### 빌드 오류

```bash
# 캐시 클리어 후 재빌드
rm -rf node_modules dist
npm install
npm run build
```

## 요약

✅ **권장 방법**: 로컬에서 `npm run dev`로 개발 + 서버에 프로덕션 빌드 배포

✅ **자동 배포**: GitHub Actions로 `main` 브랜치 푸시 시 자동 배포

✅ **동시 사용**: 로컬 개발과 서버 배포는 독립적으로 동작하며 충돌 없음

