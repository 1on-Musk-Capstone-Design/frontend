# CI/CD 버전 관리 가이드

## 버전 표시 위치

### 프론트엔드 버전
- **파일**: `frontend/package.json`
- **위치**: `"version": "1.0.0"`
- **표시**: 웹 콘솔에 `[VERSION] frontend: 1.0.0` 출력

### 백엔드 버전
- **파일**: 
  - `frontend/clustering-api/main.py` (프론트엔드 저장소)
  - `ai-clusturing/main.py` (별도 저장소)
- **위치**: `APP_VERSION = "1.0.0"` (28번째 줄)
- **표시**: 웹 콘솔에 `[VERSION] backend: 1.0.0` 출력

## 버전 변경 방법

### 1. 프론트엔드 버전 변경

```bash
# frontend/package.json 파일 수정
{
  "version": "1.0.1"  # 원하는 버전으로 변경
}
```

### 2. 백엔드 버전 변경

#### frontend/clustering-api/main.py (프론트엔드 저장소)
```python
# 28번째 줄 수정
APP_VERSION = "1.0.1"  # 원하는 버전으로 변경
```

#### ai-clusturing/main.py (별도 저장소)
```python
# 27번째 줄 수정
APP_VERSION = "1.0.1"  # 원하는 버전으로 변경
```

## CI/CD 시연 절차

### 1. 버전 변경
1. `frontend/package.json`에서 버전 변경 (예: `1.0.0` → `1.0.1`)
2. `frontend/clustering-api/main.py`에서 `APP_VERSION` 변경 (예: `"1.0.0"` → `"1.0.1"`)
3. 변경사항 커밋 및 푸시

```bash
# 변경사항 확인
git status

# 변경사항 추가
git add frontend/package.json frontend/clustering-api/main.py

# 커밋
git commit -m "chore: 버전 업데이트 1.0.0 → 1.0.1"

# 푸시
git push origin main
```

### 2. CI/CD 자동 배포
- GitHub Actions가 자동으로 감지하여 배포 시작
- GitHub 저장소 → Actions 탭에서 배포 상태 확인

### 3. 배포 확인
1. 배포 완료 후 웹사이트 접속
2. 브라우저 개발자 도구 콘솔 열기 (F12)
3. 다음 메시지 확인:
   ```
   [VERSION] frontend: 1.0.1
   [BUILD] build time: 2024-12-12T10:30:00.000Z
   [VERSION] backend: 1.0.1
   ```

## 버전 표시 확인 방법

### 웹 콘솔에서 확인
1. 브라우저에서 웹사이트 접속
2. F12 또는 우클릭 → 검사 → Console 탭
3. 다음 메시지 확인:
   - `[VERSION] frontend: 1.0.0` - 프론트엔드 버전
   - `[VERSION] backend: 1.0.0` - 백엔드 버전
   - `[BUILD] build time: ...` - 빌드 시간

### API 직접 확인
```bash
# 백엔드 버전 확인
curl http://39.112.89.182:8002/health

# 응답 예시
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0.0"
}
```

## 클러스터링 API 연결 정보

- **프로덕션 서버**: `39.112.89.182:8002`
- **로컬 개발**: `localhost:8002`
- **HTTPS 환경**: `/clustering` (Nginx 프록시)

## 주의사항

1. **버전 동기화**: 프론트엔드와 백엔드 버전을 함께 변경하는 것을 권장
2. **커밋 메시지**: 버전 변경 시 명확한 커밋 메시지 작성
3. **배포 확인**: 푸시 후 GitHub Actions에서 배포 완료 확인
4. **콘솔 확인**: 배포 후 반드시 웹 콘솔에서 버전 확인

## 빠른 버전 업데이트 스크립트

```bash
#!/bin/bash
# 버전 업데이트 스크립트

NEW_VERSION=$1
if [ -z "$NEW_VERSION" ]; then
  echo "사용법: ./update-version.sh 1.0.1"
  exit 1
fi

# 프론트엔드 버전 업데이트
sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json

# 백엔드 버전 업데이트
sed -i '' "s/APP_VERSION = \".*\"/APP_VERSION = \"$NEW_VERSION\"/" frontend/clustering-api/main.py

echo "버전이 $NEW_VERSION으로 업데이트되었습니다."
echo "변경사항을 확인하고 커밋하세요:"
echo "  git diff"
echo "  git add frontend/package.json frontend/clustering-api/main.py"
echo "  git commit -m \"chore: 버전 업데이트 → $NEW_VERSION\""
echo "  git push origin main"
```

