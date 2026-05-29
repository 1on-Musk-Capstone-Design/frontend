import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL, getOAuthRedirectUri } from "../../../config/api";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const onGoogleLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // 현재 환경에 맞는 리다이렉트 URI 생성
      const redirectUri = getOAuthRedirectUri();
      
      // 디버깅: 콜백 URL 확인
      console.log('OAuth 리다이렉트 URI:', redirectUri);
      console.log('현재 origin:', window.location.origin);
      
      const res = await axios.get(
        `${API_BASE_URL}/v1/auth-google/login-uri`,
        {
          params: {
            redirect_uri: redirectUri
          },
          timeout: 10000
        }
      );

      const loginUrl = res.data;

      if (!loginUrl) throw new Error("로그인 URL을 받아오지 못했습니다.");

      // 백엔드가 placeholder 클라이언트 ID를 사용하는지 확인
      if (loginUrl.includes('your-google-client-id') || loginUrl.includes('YOUR_CLIENT_ID')) {
        throw new Error("백엔드 설정 오류: Google OAuth 클라이언트 ID가 설정되지 않았습니다.\n\n백엔드에서 GOOGLE_CLIENT_ID 환경 변수를 확인해주세요.");
      }

      window.location.href = loginUrl;
    } catch (err) {
      console.error("구글 로그인 URL 오류:", err);
      
      let errorMessage = "서버와 연결할 수 없습니다.";
      
      if (err.response) {
        // 서버가 응답했지만 에러 상태 코드
        const status = err.response.status;
        const data = err.response.data;
        errorMessage = `서버 오류 (${status})`;
        if (data?.message) {
          errorMessage = `${errorMessage}: ${data.message}`;
        } else if (typeof data === 'string') {
          errorMessage = `${errorMessage}: ${data}`;
        }
      } else if (err.request) {
        // 요청은 보냈지만 응답을 받지 못함 (네트워크 오류, CORS 등)
        errorMessage = `서버에 연결할 수 없습니다.\n\n가능한 원인:\n- 서버가 실행 중이 아닙니다\n- 네트워크 연결 문제\n- CORS 설정 문제\n\n서버 주소: ${API_BASE_URL}`;
      } else {
        // 요청 설정 중 오류
        errorMessage = err.message || errorMessage;
      }
      
      alert(errorMessage);
      setIsLoading(false);
    }
  };

  const onDevLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const devUserId = "1";

      localStorage.setItem("accessToken", `dev_token_${Date.now()}`);
      localStorage.setItem("refreshToken", "dev_refresh_token_local");
      localStorage.setItem("userId", devUserId);
      localStorage.setItem("userName", "개발자");
      localStorage.setItem("userEmail", "dev@localhost.local");

      window.location.href = "/canvas/1";
    } catch (err) {
      console.error("개발 로그인 오류:", err);

      let errorMessage = "개발 로그인에 실패했습니다.";
      if (!err.response && !err.request) {
        errorMessage = err.message || errorMessage;
      }

      alert(errorMessage);
      setIsLoading(false);
    }
  };

  // 스타일 정의
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
  };

const buttonStyle = {
  width: "min(300px, 100%)",
  height: 54,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  fontSize: 16,
  fontWeight: 700,
  borderRadius: 12,
  border: "1px solid #b8c4bc",
  cursor: isLoading ? "not-allowed" : "pointer",
  background: "linear-gradient(180deg, #ffffff 0%, #eef2ef 100%)",
  color: "#2b3b32",
  transition: "all 0.24s ease",
  boxShadow: "0 8px 20px rgba(35, 52, 43, 0.12)",
};

const devButtonStyle = {
  ...buttonStyle,
  marginTop: 10,
  height: 44,
  fontSize: 14,
  background: "rgba(255, 255, 255, 0.14)",
  color: "#e5f7e6",
  border: "1px solid rgba(229, 247, 230, 0.35)",
  boxShadow: "none",
};

  const spinnerStyle = {
    width: 20,
    height: 20,
    border: "2px solid rgba(23,63,36,0.2)",
    borderTop: "2px solid #0f8a1f",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  const googleIconStyle = {
    width: 20,
    height: 20,
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={onGoogleLogin}
        disabled={isLoading}
        style={buttonStyle}
         onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "linear-gradient(180deg, #f2f6f3 0%, #dfe8e2 100%)";
            e.currentTarget.style.borderColor = "#829587";
            e.currentTarget.style.color = "#23352b";
            e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
            e.currentTarget.style.boxShadow = "0 14px 28px rgba(35, 52, 43, 0.22), 0 0 0 1px rgba(255,255,255,0.65) inset";
            const icon = e.currentTarget.querySelector('svg');
            if (icon) {
              icon.style.transform = 'scale(1.08) rotate(-4deg)';
              icon.style.transition = 'transform 0.2s ease';
            }
          }
        }}
         onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "linear-gradient(180deg, #ffffff 0%, #eef2ef 100%)";
            e.currentTarget.style.borderColor = "#b8c4bc";
            e.currentTarget.style.color = "#2b3b32";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(35, 52, 43, 0.12)";
            const icon = e.currentTarget.querySelector('svg');
            if (icon) {
              icon.style.transform = 'scale(1) rotate(0deg)';
            }
          }
        }}
        onMouseDown={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = "translateY(0) scale(0.995)";
            e.currentTarget.style.boxShadow = "0 5px 12px rgba(35, 52, 43, 0.16)";
          }
        }}
        onMouseUp={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
            e.currentTarget.style.boxShadow = "0 14px 28px rgba(35, 52, 43, 0.22), 0 0 0 1px rgba(255,255,255,0.65) inset";
          }
        }}
      >
        {isLoading ? (
          <>
            <div style={spinnerStyle} />
            <span>처리 중...</span>
          </>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              style={googleIconStyle}
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google 로그인</span>
          </>
        )}
      </button>

      {isLocalhost && (
        <button
          onClick={onDevLogin}
          disabled={isLoading}
          style={devButtonStyle}
        >
          개발 로그인
        </button>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
