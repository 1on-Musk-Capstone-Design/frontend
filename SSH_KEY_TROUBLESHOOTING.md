# SSH 키 문제 해결 가이드

## 문제: "error in libcrypto" 또는 "Permission denied (publickey)"

GitHub Actions에서 SSH 키 로딩 오류가 발생하는 경우 해결 방법입니다.

## 원인

1. **SSH 키 형식 문제**: PEM 형식이 올바르지 않음
2. **줄바꿈 문자 문제**: Windows/Mac/Linux 간 줄바꿈 차이
3. **공백 문제**: SSH 키 앞뒤에 불필요한 공백
4. **암호화된 키**: Passphrase가 있는 키는 사용 불가

## 해결 방법

### 1. SSH 키 형식 확인

로컬에서 SSH 키가 올바른 형식인지 확인:

```bash
# SSH 키 형식 확인
ssh-keygen -l -f ~/capstone.pem

# 올바른 출력 예시:
# 2048 SHA256:xxxxx... (RSA)
```

### 2. GitHub Secrets에 올바르게 저장

#### 방법 A: 직접 복사 (권장)

```bash
# 로컬에서 SSH 키 내용 확인
cat ~/capstone.pem

# 출력 예시:
# -----BEGIN RSA PRIVATE KEY-----
# MIIEpAIBAAKCAQEA...
# ...
# -----END RSA PRIVATE KEY-----
```

**중요:**
- `-----BEGIN RSA PRIVATE KEY-----` 부터 `-----END RSA PRIVATE KEY-----` 까지 **전체** 복사
- 줄바꿈 포함하여 정확히 복사
- 앞뒤 공백 없이 붙여넣기

#### 방법 B: Base64 인코딩 (대안)

SSH 키를 base64로 인코딩하여 저장:

```bash
# SSH 키를 base64로 인코딩
cat ~/capstone.pem | base64 | tr -d '\n'
```

GitHub Secrets에 인코딩된 값을 저장하고, 워크플로우에서 디코딩:

```yaml
- name: Setup SSH key
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.SSH_PRIVATE_KEY_BASE64 }}" | base64 -d > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
```

### 3. SSH 키 검증

로컬에서 SSH 키로 서버 접속 테스트:

```bash
# SSH 키 권한 설정
chmod 400 ~/capstone.pem

# 서버 접속 테스트
ssh -i ~/capstone.pem ec2-user@51.20.106.74 "echo 'SSH 연결 성공'"
```

### 4. GitHub Secrets 재설정

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. `SSH_PRIVATE_KEY` Secret 삭제
3. 새로 추가:
   - 로컬에서 `cat ~/capstone.pem` 실행
   - 출력 전체를 복사 (줄바꿈 포함)
   - GitHub Secrets에 붙여넣기
   - 앞뒤 공백 확인

### 5. 워크플로우 디버깅

워크플로우에 디버그 단계 추가:

```yaml
- name: Debug SSH key
  run: |
    echo "SSH 키 길이: $(echo '${{ secrets.SSH_PRIVATE_KEY }}' | wc -c)"
    echo "SSH 키 시작: $(echo '${{ secrets.SSH_PRIVATE_KEY }}' | head -c 50)"
    echo "SSH 키 끝: $(echo '${{ secrets.SSH_PRIVATE_KEY }}' | tail -c 50)"
    mkdir -p ~/.ssh
    echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    ssh-keygen -l -f ~/.ssh/deploy_key || echo "SSH 키 형식 오류"
```

## 일반적인 오류

### "error in libcrypto"
- **원인**: SSH 키 형식이 올바르지 않음
- **해결**: SSH 키를 다시 확인하고 올바른 형식으로 저장

### "Permission denied (publickey)"
- **원인**: SSH 키가 서버의 authorized_keys에 등록되지 않음
- **해결**: 서버의 `~/.ssh/authorized_keys`에 공개 키 추가 필요

### "Load key ... error in libcrypto"
- **원인**: SSH 키 파일에 불필요한 문자나 형식 오류
- **해결**: SSH 키를 다시 복사하여 GitHub Secrets에 저장

## 참고

- SSH 키는 절대 코드에 커밋하지 마세요
- GitHub Secrets에만 저장하세요
- SSH 키 파일은 로컬에서 안전하게 보관하세요

