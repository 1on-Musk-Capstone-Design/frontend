import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL, getOAuthRedirectUri } from "../../../config/api";
import {
  fetchAndApplyDevBootstrap,
  isGoogleOAuthUrlPlaceholder,
  isLocalDevBrowser,
} from "../../../lib/devBootstrap.js";

const normalizeGoogleOAuthUrl = (loginUrl, redirectUri) => {
  try {
    const url = new URL(loginUrl);

    if (!url.hostname.endsWith("google.com")) {
      return loginUrl;
    }

    const dedupeKeys = ["client_id", "response_type", "scope"];
    dedupeKeys.forEach((key) => {
      const values = url.searchParams.getAll(key).filter(Boolean);
      if (values.length > 0) {
        url.searchParams.delete(key);
        url.searchParams.set(key, values[values.length - 1]);
      }
    });

    url.searchParams.delete("redirect_uri");
    url.searchParams.set("redirect_uri", redirectUri);

    return url.toString();
  } catch (error) {
    console.warn("Google OAuth URL 정규화 실패:", error);
    return loginUrl;
  }
};

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const onLocalDevLogin = async () => {
    if (isLocalLoading || isLoading) return;
    setIsLocalLoading(true);
    try {
      const ok = await fetchAndApplyDevBootstrap();
      if (ok) {
        window.location.href = "/";
        return;
      }
      alert(
        "로컬 개발 로그인에 실패했습니다.\n\n" +
          "• Capstone 서버가 http://localhost:8080 에서 실행 중인지\n" +
          "• application.yml 의 app.dev-bootstrap-auth.enabled 가 true 인지\n" +
          "확인해 주세요."
      );
    } finally {
      setIsLocalLoading(false);
    }
  };

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

      // Google 클라이언트 ID 미설정: 로컬 개발이면 부트스트랩 JWT로 대체
      if (isGoogleOAuthUrlPlaceholder(loginUrl)) {
        if (isLocalDevBrowser()) {
          const ok = await fetchAndApplyDevBootstrap();
          if (ok) {
            window.location.href = "/";
            return;
          }
        }
        throw new Error(
          "Google OAuth 클라이언트 ID가 설정되지 않았습니다.\n\n" +
            "• 실제 구글 로그인: 백엔드에 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 환경 변수를 설정하세요.\n" +
            "• 로컬만 사용: Vite dev + localhost 에서는 아래 「로컬 개발 계정으로 로그인」 버튼을 사용하세요."
        );
      }

      window.location.href = normalizeGoogleOAuthUrl(loginUrl, redirectUri);
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
        errorMessage =
          "서버에 연결할 수 없습니다.\n\n가능한 원인:\n- 백엔드가 실행 중이 아닙니다\n- 네트워크·CORS 문제\n\n" +
          `현재 API: ${API_BASE_URL}`;
      } else {
        // 요청 설정 중 오류
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
    gap: 24,
  };

  const titleStyle = {
    fontSize: 28,
    fontWeight: 800,
    color: "#2c3e50",
    textAlign: "center",
    margin: 0,
    marginBottom: 4,
  };

  const subtitleStyle = {
    fontSize: 15,
    color: "#7f8c8d",
    textAlign: "center",
    margin: 0,
    fontWeight: 500,
  };

const buttonStyle = {
  width: "100%",
  height: 52,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  fontSize: 16,
  fontWeight: 600,
  borderRadius: 8,
  border: "2px solid #34495e",
  cursor: isLoading ? "not-allowed" : "pointer",
  background: "#ffffff",
  color: "#2c3e50",
  transition: "all 0.3s ease",
  boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
};

  const spinnerStyle = {
    width: 20,
    height: 20,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  const googleIconStyle = {
    width: 20,
    height: 20,
  };

  return (
    <div style={containerStyle}>
      <div>
        <h2 style={titleStyle}>로그인</h2>
        <p style={subtitleStyle}>구글 계정으로 계속하세요</p>
      </div>

      {isLocalDevBrowser() && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 }}>
            Google OAuth 미설정 시 로컬 전용 로그인을 사용할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={onLocalDevLogin}
            disabled={isLoading || isLocalLoading}
            style={{
              ...buttonStyle,
              border: "2px solid #059669",
              color: "#047857",
              marginBottom: 8,
            }}
          >
            {isLocalLoading ? "처리 중..." : "로컬 개발 계정으로 로그인"}
          </button>
        </div>
      )}

      <button
        onClick={onGoogleLogin}
        disabled={isLoading || isLocalLoading}
        style={buttonStyle}
         onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "#34495e"; 
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)"; 
          }
        }}
         onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "#ffffff"; 
            e.currentTarget.style.color = "#2c3e50";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.12)"; 
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
            <span>구글로 로그인하기</span>
          </>
        )}
      </button>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
