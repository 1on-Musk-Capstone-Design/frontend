# CI/CD 자동 배포 설정 가이드

## 개요

GitHub Actions를 사용하여 `main` 브랜치에 코드를 푸시할 때마다 자동으로 빌드하고 서버에 배포합니다.

## 1. GitHub Secrets 설정

### 1.1 저장소 설정 페이지로 이동

1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables** → **Actions** 클릭

### 1.2 Secret 추가

**New repository secret** 버튼을 클릭하여 다음 3개의 Secret을 추가합니다:

#### SSH_HOST
- Name: `SSH_HOST`
- Secret: `51.20.106.74`

#### SSH_USER
- Name: `SSH_USER`
- Secret: `ec2-user`

#### SSH_PRIVATE_KEY
- Name: `SSH_PRIVATE_KEY`
- Secret: SSH 키 파일(`capstone.pem`)의 전체 내용

**SSH 키 내용 확인 방법:**
```bash
# 로컬 터미널에서 실행
cat ~/capstone.pem

# 또는 프로젝트 루트에서
cat capstone.pem
```

**중요:** 
- `-----BEGIN RSA PRIVATE KEY-----` 부터 `-----END RSA PRIVATE KEY-----` 까지 **전체 내용**을 복사
- 줄바꿈도 포함하여 정확히 복사
- **앞뒤 공백 없이** 붙여넣기
- Windows에서 복사한 경우 줄바꿈 문자(`\r`)가 포함될 수 있으므로, 워크플로우에서 자동으로 제거됩니다
- SSH 키가 암호화되어 있지 않은지 확인 (passphrase가 없어야 함)

**⚠️ SSH 키 오류 발생 시:**
1. GitHub Secrets에서 `SSH_PRIVATE_KEY` 삭제
2. 로컬에서 `cat ~/capstone.pem` 실행
3. 출력 전체를 복사 (줄바꿈 포함, 앞뒤 공백 없이)
4. GitHub Secrets에 다시 추가
5. 워크플로우 재실행

## 2. 워크플로우 확인

`.github/workflows/deploy.yml` 파일이 다음 작업을 수행합니다:

1. ✅ 소스 코드 체크아웃
2. ✅ Node.js 18 설정
3. ✅ 의존성 설치 (`npm ci`)
4. ✅ 프로젝트 빌드 (`npm run build`)
5. ✅ 빌드 아티팩트 업로드 (백업용)
6. ✅ 서버에 rsync로 배포
7. ✅ 배포 검증 (파일 목록 및 Nginx 상태 확인)

## 3. 자동 배포 동작

### 트리거 조건
- `main` 브랜치에 푸시할 때 자동 실행
- GitHub Actions 탭에서 수동 실행 가능

### 배포 프로세스
1. 코드 푸시 → GitHub Actions 자동 시작
2. 빌드 완료 → `dist/` 폴더 생성
3. rsync로 서버에 파일 동기화
4. 배포 검증 완료

### 배포 상태 확인
- GitHub 저장소 → **Actions** 탭
- 각 워크플로우 실행 상태 확인
- 실패 시 로그 확인 가능

## 4. 수동 배포 실행

필요한 경우 수동으로 배포를 실행할 수 있습니다:

1. GitHub 저장소 → **Actions** 탭
2. 왼쪽에서 **Build and Deploy** 워크플로우 선택
3. **Run workflow** 버튼 클릭
4. 브랜치 선택 (보통 `main`)
5. **Run workflow** 클릭

## 5. 문제 해결

### 배포 실패 시

#### SSH 연결 실패
- GitHub Secrets의 `SSH_PRIVATE_KEY`가 올바른지 확인
- SSH 키 파일의 전체 내용이 복사되었는지 확인
- 서버 IP와 사용자명이 올바른지 확인

#### 권한 오류
- 서버에서 `/var/www/onit` 디렉토리 권한 확인:
  ```bash
  ssh -i capstone.pem ec2-user@51.20.106.74
  sudo chown -R ec2-user:ec2-user /var/www/onit
  ```

#### rsync 실패
- 서버에 rsync가 설치되어 있는지 확인:
  ```bash
  ssh -i capstone.pem ec2-user@51.20.106.74 "which rsync"
  ```
- 설치되어 있지 않으면:
  ```bash
  ssh -i capstone.pem ec2-user@51.20.106.74 "sudo dnf install -y rsync"
  ```

### 로그 확인
- GitHub Actions → 실패한 워크플로우 → 각 단계 클릭하여 상세 로그 확인

## 6. 보안 주의사항

- ✅ SSH 키는 절대 코드에 커밋하지 않기
- ✅ GitHub Secrets에만 저장
- ✅ SSH 키 파일은 로컬에서 안전하게 보관
- ✅ 필요시 SSH 키 로테이션

## 7. 다음 단계

CI/CD 설정이 완료되면:
1. 테스트 브랜치에서 변경사항 테스트
2. `main` 브랜치에 머지/푸시
3. GitHub Actions에서 자동 배포 확인
4. 서버에서 배포된 파일 확인:
   ```bash
   ssh -i capstone.pem ec2-user@51.20.106.74 "ls -la /var/www/onit/"
   ```

