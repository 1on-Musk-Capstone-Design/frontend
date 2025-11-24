# SSH 키 GitHub Secrets 재설정 가이드

## 문제

GitHub Actions에서 "error in libcrypto" 오류가 발생하는 경우, GitHub Secrets에 저장된 SSH 키 형식이 올바르지 않을 수 있습니다.

## 해결 방법

### 방법 1: SSH 키 직접 복사 (권장)

1. **로컬에서 SSH 키 확인:**
   ```bash
   cat ~/capstone.pem
   ```

2. **출력 예시:**
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEA...
   (여러 줄)
   ...
   -----END RSA PRIVATE KEY-----
   ```

3. **GitHub Secrets 재설정:**
   - GitHub 저장소 → Settings → Secrets and variables → Actions
   - `SSH_PRIVATE_KEY` Secret 찾기
   - **Update** 클릭
   - 위에서 확인한 SSH 키 **전체 내용**을 복사하여 붙여넣기
   - **중요**: 
     - `-----BEGIN RSA PRIVATE KEY-----` 부터 `-----END RSA PRIVATE KEY-----` 까지 **전체** 복사
     - 앞뒤 공백 없이 붙여넣기
     - 줄바꿈은 포함되어야 함

4. **Save secret** 클릭

### 방법 2: Base64 인코딩 사용 (대안)

SSH 키를 base64로 인코딩하여 저장하면 형식 문제를 피할 수 있습니다.

1. **로컬에서 SSH 키 인코딩:**
   ```bash
   cat ~/capstone.pem | base64 | tr -d '\n'
   ```

2. **출력된 base64 문자열을 복사**

3. **GitHub Secrets 설정:**
   - `SSH_PRIVATE_KEY` Secret 업데이트
   - Base64로 인코딩된 문자열 붙여넣기
   - Save

4. **워크플로우 자동 처리:**
   - 워크플로우가 자동으로 base64를 감지하고 디코딩합니다

### 방법 3: SSH 키 형식 검증

로컬에서 SSH 키가 올바른 형식인지 확인:

```bash
# SSH 키 형식 확인
ssh-keygen -l -f ~/capstone.pem

# 올바른 출력 예시:
# 2048 SHA256:xxxxx... (RSA)
```

오류가 발생하면 SSH 키가 손상되었을 수 있습니다.

### 방법 4: 새 SSH 키 생성 (최후의 수단)

기존 키가 작동하지 않으면 새 키를 생성:

```bash
# 새 SSH 키 생성
ssh-keygen -t rsa -b 2048 -f ~/capstone_new.pem -N ""

# 공개 키를 서버에 추가
ssh-copy-id -i ~/capstone_new.pem.pub ec2-user@51.20.106.74

# 또는 수동으로 추가
cat ~/capstone_new.pem.pub | ssh -i ~/capstone.pem ec2-user@51.20.106.74 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

## 확인 사항

### 1. SSH 키 접속 테스트

로컬에서 SSH 키로 서버 접속이 되는지 확인:

```bash
# SSH 키 권한 설정
chmod 400 ~/capstone.pem

# 서버 접속 테스트
ssh -i ~/capstone.pem ec2-user@51.20.106.74 "echo 'SSH 연결 성공'"
```

접속이 안 되면 SSH 키가 서버에 등록되지 않았을 수 있습니다.

### 2. GitHub Secrets 확인

GitHub Secrets에 저장된 값이 올바른지 확인:

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. `SSH_PRIVATE_KEY` 클릭
3. **Update** 클릭하여 값 확인 (보안상 일부만 표시됨)
4. 올바른 형식인지 확인:
   - `-----BEGIN` 로 시작해야 함
   - `-----END` 로 끝나야 함

### 3. 워크플로우 재실행

SSH 키를 재설정한 후:

1. GitHub Actions 탭으로 이동
2. 실패한 워크플로우 클릭
3. **Re-run all jobs** 클릭

## 문제가 계속되면

1. **SSH_KEY_TROUBLESHOOTING.md** 파일 참고
2. GitHub Actions 로그에서 상세 오류 확인
3. SSH 키를 base64로 인코딩하여 저장 시도

