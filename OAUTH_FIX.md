# 구글 OAuth redirect_uri_mismatch 오류 해결

## 문제

백엔드에서 생성하는 구글 OAuth 로그인 URI의 `redirect_uri`가 여전히 `http://localhost:3000/auth/callback`로 하드코딩되어 있습니다.

현재 백엔드가 생성하는 URI:
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&...
```

## 해결 방법

### 방법 1: 백엔드 환경 변수 설정 (권장)

백엔드에서 리다이렉트 URI를 환경 변수로 관리하는 경우:

```bash
# 백엔드 서버에서 환경 변수 설정
export GOOGLE_REDIRECT_URI=https://on-it.kro.kr/auth/callback

# 또는 .env 파일에 추가
GOOGLE_REDIRECT_URI=https://on-it.kro.kr/auth/callback
```

### 방법 2: 백엔드 코드 수정

백엔드 코드에서 리다이렉트 URI를 동적으로 생성하도록 수정:

**Java/Spring Boot 예시:**
```java
@Value("${google.redirect.uri:http://localhost:3000/auth/callback}")
private String redirectUri;

// 또는 요청 헤더에서 Origin을 읽어서 동적으로 생성
String origin = request.getHeader("Origin");
String redirectUri = origin + "/auth/callback";
```

**Node.js 예시:**
```javascript
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://on-it.kro.kr/auth/callback' 
    : 'http://localhost:3000/auth/callback');
```

### 방법 3: 프론트엔드에서 리다이렉트 URI 전달

프론트엔드에서 현재 도메인을 백엔드에 전달:

```javascript
// loginForm.jsx 수정
const res = await axios.get(
  `${API_BASE_URL}/v1/auth-google/login-uri`,
  {
    params: {
      redirect_uri: `${window.location.origin}/auth/callback`
    },
    timeout: 10000
  }
);
```

백엔드에서 이 파라미터를 받아서 사용하도록 수정 필요.

## Google Cloud Console 설정

Google Cloud Console에서 다음 리다이렉트 URI를 추가해야 합니다:

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **API 및 서비스** → **사용자 인증 정보**
4. OAuth 2.0 클라이언트 ID 선택
5. **승인된 리다이렉트 URI**에 추가:
   ```
   https://on-it.kro.kr/auth/callback
   ```
6. **승인된 JavaScript 원본**에 추가:
   ```
   https://on-it.kro.kr
   ```

## 확인 사항

1. ✅ Google Cloud Console에 `https://on-it.kro.kr/auth/callback` 추가됨
2. ❌ 백엔드에서 `https://on-it.kro.kr/auth/callback` 사용하도록 수정 필요
3. ✅ HTTPS 설정 완료 (`https://on-it.kro.kr` 접속 가능)

## 테스트

백엔드 수정 후:

1. 브라우저에서 `https://on-it.kro.kr/auth` 접속
2. 구글 로그인 버튼 클릭
3. 구글 인증 완료
4. `https://on-it.kro.kr/auth/callback`으로 리다이렉트되는지 확인

