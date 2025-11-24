# 서버 배포 가이드

## 같은 서버에 API와 프론트엔드 배포 (권장)

API 서버(51.20.106.74:8080)와 같은 서버에 프론트엔드를 배포하는 방법입니다.

### 1. 서버 준비

```bash
# 서버에 접속
ssh user@51.20.106.74

# 디렉토리 생성
sudo mkdir -p /var/www/onit
sudo chown -R $USER:$USER /var/www/onit
```

### 2. 빌드 파일 업로드

```bash
# 로컬에서 빌드
npm run build

# 서버에 업로드
scp -r dist/* user@51.20.106.74:/var/www/onit/
```

### 3. Nginx 설정

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/onit
```

`nginx.conf.production` 파일의 내용을 복사하거나 다음 설정 사용:

```nginx
server {
    listen 80;
    server_name 51.20.106.74;  # 또는 실제 도메인
    root /var/www/onit;
    index index.html;

    # 프론트엔드 정적 파일 서빙 (SPA 라우팅)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시 (백엔드 API로 요청 전달)
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 프록시 (STOMP WebSocket)
    location /ws {
        proxy_pass http://localhost:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 4. Nginx 활성화 및 재시작

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/onit /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 5. 접속 확인

- 프론트엔드: `http://51.20.106.74`
- API: `http://51.20.106.74/api` (Nginx가 자동으로 프록시)

---

## 1. 빌드

### 로컬에서 빌드
```bash
npm install
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### GitHub Actions에서 빌드
- `main` 브랜치에 푸시하면 자동으로 빌드됩니다
- GitHub Actions의 Artifacts에서 `dist` 파일을 다운로드할 수 있습니다

## 2. 서버 배포 방법

### 방법 1: Nginx 사용 (권장)

#### 2.1 빌드 파일 업로드
```bash
# 서버에 접속
ssh user@your-server.com

# dist 폴더를 서버에 업로드 (로컬에서)
scp -r dist/* user@your-server.com:/var/www/onit/

# 또는 서버에서 직접 빌드
git clone https://github.com/your-repo/frontend.git
cd frontend
npm install
npm run build
sudo cp -r dist/* /var/www/onit/
```

#### 2.2 Nginx 설정
```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/onit
```

다음 내용 추가:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/onit;
    index index.html;

    # SPA 라우팅: 모든 경로를 index.html로 리다이렉트
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 2.3 Nginx 활성화 및 재시작
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/onit /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 방법 2: Node.js Express 사용

#### 2.1 서버 파일 생성
서버에 `server.js` 파일을 생성하고 다음 내용 추가:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'dist')));

// SPA 라우팅: 모든 경로를 index.html로 리다이렉트
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

#### 2.2 package.json에 스크립트 추가
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

#### 2.3 서버 실행
```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 서버 실행
npm start

# 또는 PM2로 백그라운드 실행
npm install -g pm2
pm2 start server.js --name onit-frontend
pm2 save
pm2 startup
```

### 방법 3: Docker 사용

#### 2.1 Dockerfile 생성
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2.2 nginx.conf (Docker용)
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 2.3 빌드 및 실행
```bash
# 이미지 빌드
docker build -t onit-frontend .

# 컨테이너 실행
docker run -d -p 80:80 --name onit-frontend onit-frontend
```

## 3. HTTPS 설정 (선택사항)

### Let's Encrypt 사용
```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

## 4. 환경 변수 설정

서버에서 환경에 따라 다른 설정이 필요하면:
- `.env.production` 파일 생성
- 빌드 시 환경 변수 주입

## 5. 자동 배포 스크립트 예시

```bash
#!/bin/bash
# deploy.sh

echo "빌드 시작..."
npm run build

echo "서버에 파일 업로드..."
scp -r dist/* user@your-server.com:/var/www/onit/

echo "서버에서 Nginx 재시작..."
ssh user@your-server.com "sudo systemctl reload nginx"

echo "배포 완료!"
```

## 주의사항

1. **SPA 라우팅**: 반드시 모든 경로를 `index.html`로 리다이렉트해야 합니다
2. **정적 파일 경로**: 빌드된 파일의 경로가 올바른지 확인
3. **환경 변수**: 프로덕션 환경에 맞는 API URL 설정 확인
4. **WebSocket**: HTTPS 사용 시 WSS 프로토콜 사용 확인

