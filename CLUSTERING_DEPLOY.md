# AI 클러스터링 API 배포 가이드

## 저장소

AI 클러스터링 API는 별도 저장소에서 관리됩니다:
- **GitHub**: https://github.com/1on-Musk-Capstone-Design/ai-clusturing.git

## 개요

AI 클러스터링 API는 Python FastAPI 서버로, 텍스트 클러스터링 기능을 제공합니다.

## 배포 방법

### 방법 1: 직접 실행 (간단)

#### 1. 저장소 클론 및 서버에 업로드

```bash
# 별도 저장소 클론
git clone https://github.com/1on-Musk-Capstone-Design/ai-clusturing.git
cd ai-clusturing

# 서버에 업로드
scp -i ~/capstone.pem -r * ec2-user@51.20.106.74:/home/ec2-user/clustering-api/
```

#### 2. 서버에서 설정

```bash
# 서버 접속
ssh -i capstone.pem ec2-user@51.20.106.74

# 디렉토리 이동
cd /home/ec2-user/clustering-api

# Python 가상환경 생성 (권장)
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (백그라운드)
nohup uvicorn main:app --host 0.0.0.0 --port 8002 > clustering.log 2>&1 &
```

#### 3. 방화벽 설정

AWS 보안 그룹에서 포트 8002를 열어야 합니다:
- Type: Custom TCP
- Port: 8002
- Source: 0.0.0.0/0 (또는 특정 IP)

### 방법 2: Systemd 서비스로 실행 (권장)

#### 1. 서비스 파일 생성

```bash
# 서버 접속
ssh -i capstone.pem ec2-user@51.20.106.74

# 서비스 파일 생성
sudo nano /etc/systemd/system/clustering-api.service
```

다음 내용 추가:

```ini
[Unit]
Description=Clustering API Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/clustering-api
Environment="PATH=/home/ec2-user/clustering-api/venv/bin"
ExecStart=/home/ec2-user/clustering-api/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8002
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 2. 서비스 시작

```bash
# 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable clustering-api
sudo systemctl start clustering-api

# 상태 확인
sudo systemctl status clustering-api
```

### 방법 3: Nginx 프록시 사용 (프로덕션 권장)

#### 1. Nginx 설정 추가

```bash
# 서버 접속
ssh -i capstone.pem ec2-user@51.20.106.74

# Nginx 설정 파일 수정
sudo nano /etc/nginx/conf.d/onit.conf
```

다음 location 블록 추가:

```nginx
# Clustering API 프록시
location /clustering/ {
    proxy_pass http://localhost:8002/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### 2. Nginx 재시작

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 프론트엔드 설정

### API URL 설정

`src/pages/infinite-canvas/constants.js` 파일 수정:

```javascript
export const API_CONSTANTS = {
  // 로컬 개발
  CLUSTERING_API_URL: 'http://localhost:8002',
  
  // 프로덕션 (직접 연결)
  // CLUSTERING_API_URL: 'http://51.20.106.74:8002',
  
  // 프로덕션 (Nginx 프록시 사용)
  // CLUSTERING_API_URL: '/clustering',
};
```

### 환경별 자동 설정

`src/config/api.ts`와 유사하게 환경에 따라 자동 선택:

```javascript
export const getClusteringApiUrl = (): string => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8002'; // 로컬 개발
  }
  
  // 프로덕션: Nginx 프록시 사용
  return '/clustering';
};
```

## 확인

### 서버 상태 확인

```bash
# 서비스 상태
sudo systemctl status clustering-api

# 로그 확인
sudo journalctl -u clustering-api -f

# 또는 직접 실행한 경우
tail -f /home/ec2-user/clustering-api/clustering.log
```

### API 테스트

```bash
# 헬스 체크
curl http://51.20.106.74:8002/health

# 또는 Nginx 프록시 사용 시
curl https://on-it.kro.kr/clustering/health
```

## 주의사항

1. **메모리 사용량**: SentenceTransformer 모델이 메모리를 많이 사용합니다 (약 500MB-1GB)
2. **초기 로딩 시간**: 모델 로딩에 시간이 걸릴 수 있습니다 (1-2분)
3. **포트 충돌**: 다른 서비스와 포트가 충돌하지 않는지 확인
4. **의존성 설치 시간**: torch, transformers 등 대용량 패키지 설치에 시간이 걸립니다 (10-20분)

## 문제 해결

### 모델 로딩 실패
- 인터넷 연결 확인 (Hugging Face에서 모델 다운로드)
- 디스크 공간 확인

### 메모리 부족
- 서버 메모리 확인: `free -h`
- 필요시 서버 업그레이드

### 포트 충돌
- 다른 포트 사용: `--port 8003`
- Nginx 설정도 함께 수정

