# 도메인 및 HTTPS 설정 가이드

## 개요

구글 OAuth 리다이렉트 URI는 IP 주소가 아닌 도메인이 필요합니다. 도메인을 설정하고 HTTPS를 구성하는 방법입니다.

## 1. 도메인 구매 및 설정

### 1.1 도메인 구매 (선택사항)

**무료 도메인 옵션:**
- [Freenom](https://www.freenom.com/) - 무료 .tk, .ml, .ga, .cf 도메인
- [No-IP](https://www.noip.com/) - 무료 동적 DNS
- [DuckDNS](https://www.duckdns.org/) - 무료 동적 DNS

**유료 도메인 (권장):**
- [Namecheap](https://www.namecheap.com/) - 저렴한 가격
- [Google Domains](https://domains.google/) - 간단한 관리
- [AWS Route 53](https://aws.amazon.com/route53/) - AWS 통합

### 1.2 DNS A 레코드 설정

도메인을 구매한 후 DNS 설정에서 A 레코드를 추가합니다:

```
Type: A
Name: @ (또는 www)
Value: 51.20.106.74
TTL: 3600 (또는 기본값)
```

**예시:**
- 도메인: `example.com`
- A 레코드: `@` → `51.20.106.74`
- 서브도메인: `www` → `51.20.106.74` (선택사항)

### 1.3 DNS 전파 확인

DNS 설정 후 전파되는데 몇 분에서 24시간까지 걸릴 수 있습니다.

```bash
# DNS 전파 확인
nslookup example.com
# 또는
dig example.com
```

## 2. Let's Encrypt SSL 인증서 발급

### 2.1 Certbot 설치 (Amazon Linux 2023)

```bash
# 서버에 SSH 접속
ssh -i capstone.pem ec2-user@51.20.106.74

# Certbot 설치
sudo dnf install -y certbot python3-certbot-nginx
```

### 2.2 SSL 인증서 발급

```bash
# 도메인을 실제 도메인으로 변경
sudo certbot --nginx -d example.com -d www.example.com

# 또는 대화형 모드
sudo certbot --nginx
```

**Certbot 실행 시:**
1. 이메일 주소 입력 (인증서 만료 알림용)
2. 이용 약관 동의
3. 이메일 수신 동의 (선택)
4. 도메인 선택 (여러 개인 경우)

### 2.3 자동 갱신 설정

Let's Encrypt 인증서는 90일마다 갱신이 필요합니다. 자동 갱신이 설정됩니다:

```bash
# 자동 갱신 테스트
sudo certbot renew --dry-run

# 자동 갱신 확인
sudo systemctl status certbot.timer
```

## 3. Nginx HTTPS 설정

Certbot이 자동으로 Nginx 설정을 업데이트하지만, 수동 설정도 가능합니다:

### 3.1 현재 설정 확인

```bash
# Nginx 설정 파일 확인
sudo cat /etc/nginx/conf.d/onit.conf
```

### 3.2 HTTPS 설정 (Certbot이 자동으로 생성)

Certbot 실행 후 `/etc/nginx/conf.d/onit.conf` 파일이 다음과 같이 업데이트됩니다:

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;  # HTTP → HTTPS 리다이렉트
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /var/www/onit;
    index index.html;

    # 프론트엔드 정적 파일 서빙
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시
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

    # WebSocket 프록시
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

### 3.3 Nginx 재시작

```bash
# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

## 4. AWS 보안 그룹 설정

HTTPS를 사용하려면 포트 443을 열어야 합니다:

1. AWS 콘솔 → EC2 → Security Groups
2. 해당 인스턴스의 보안 그룹 선택
3. Inbound rules → Edit inbound rules
4. 다음 규칙 추가:
   - **Type**: HTTPS
   - **Port**: 443
   - **Source**: 0.0.0.0/0

## 5. 구글 OAuth 리다이렉트 URI 설정

### 5.1 Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **API 및 서비스** → **사용자 인증 정보** 클릭
4. OAuth 2.0 클라이언트 ID 선택

### 5.2 승인된 리다이렉트 URI 추가

**승인된 리다이렉트 URI**에 다음을 추가:

```
https://example.com/auth/callback
```

**로컬 개발용 (이미 있다면 유지):**
```
http://localhost:3000/auth/callback
```

### 5.3 승인된 JavaScript 원본 추가

**승인된 JavaScript 원본**에 다음을 추가:

```
https://example.com
```

## 6. 백엔드 설정 확인

백엔드에서도 리다이렉트 URI를 업데이트해야 합니다:

```bash
# 백엔드 환경 변수 확인
# GOOGLE_REDIRECT_URI 또는 유사한 설정
```

백엔드 코드에서 리다이렉트 URI가 하드코딩되어 있다면:
- `http://localhost:3000/auth/callback` → `https://example.com/auth/callback`
- 또는 환경 변수로 관리

## 7. 테스트

### 7.1 HTTPS 접속 확인

```bash
# 브라우저에서 접속
https://example.com

# SSL 인증서 확인
curl -I https://example.com
```

### 7.2 구글 로그인 테스트

1. 브라우저에서 `https://example.com/auth` 접속
2. 구글 로그인 버튼 클릭
3. 구글 인증 완료
4. `https://example.com/auth/callback`으로 리다이렉트되는지 확인

## 8. 문제 해결

### DNS 전파 안 됨
- DNS 설정 후 최대 24시간 대기
- `nslookup` 또는 `dig` 명령어로 확인
- DNS 캐시 클리어: `sudo systemd-resolve --flush-caches` (Linux)

### SSL 인증서 발급 실패
- 도메인이 서버 IP로 올바르게 전파되었는지 확인
- 방화벽에서 포트 80이 열려있는지 확인 (Certbot이 HTTP-01 챌린지 사용)
- 도메인당 주간 발급 제한 확인 (Let's Encrypt는 주당 5개 제한)

### 구글 OAuth 오류
- 리다이렉트 URI가 정확히 일치하는지 확인 (대소문자, 슬래시 포함)
- HTTPS를 사용하는지 확인 (프로덕션에서는 HTTP 불가)
- 구글 콘솔에서 도메인 검증 완료 확인

## 9. 참고 자료

- [Let's Encrypt 공식 문서](https://letsencrypt.org/)
- [Certbot 문서](https://certbot.eff.org/)
- [Google OAuth 설정 가이드](https://developers.google.com/identity/protocols/oauth2)

