import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("처리 중...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Google OAuth 에러 처리
    if (error) {
      console.error("Google OAuth 에러:", error, errorDescription);
      
      let errorMessage = "로그인에 실패했습니다.";
      
      // 구체적인 에러 메시지 처리
      if (error === "invalid_client") {
        errorMessage = "❌ OAuth 클라이언트를 찾을 수 없습니다 (401: invalid_client)\n\n이 오류는 백엔드 설정 문제입니다.\n\n✅ 확인해야 할 사항:\n\n1. Google Cloud Console\n   - https://console.cloud.google.com 접속\n   - API 및 서비스 > 사용자 인증 정보\n   - OAuth 2.0 클라이언트 ID가 존재하는지 확인\n\n2. 백엔드 환경 변수\n   - GOOGLE_CLIENT_ID가 Google Console의 클라이언트 ID와 정확히 일치하는지\n   - GOOGLE_CLIENT_SECRET이 클라이언트 보안 비밀번호와 일치하는지\n   - 대소문자, 공백, 따옴표 등이 정확한지 확인\n\n3. 리다이렉트 URI\n   - Google Console: http://localhost:3000/auth/callback\n   - 백엔드 코드에서 사용하는 URI와 정확히 일치해야 함\n\n4. 프로젝트 선택\n   - Google Cloud Console에서 올바른 프로젝트 선택\n   - 백엔드가 사용하는 클라이언트 ID가 해당 프로젝트에 속해 있는지";
      } else if (error === "access_denied") {
        errorMessage = "로그인이 취소되었습니다.";
      } else if (error === "invalid_grant") {
        errorMessage = "인증 코드가 만료되었거나 잘못되었습니다. 다시 시도해주세요.";
      } else if (errorDescription) {
        errorMessage = `로그인 오류: ${errorDescription}`;
      }
      
      setStatus(errorMessage);
      setIsError(true);
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
      return;
    }

    // code가 없으면 에러
    if (!code) {
      setStatus("인증 코드를 받지 못했습니다.");
      setIsError(true);
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
      return;
    }

    // 백엔드로 code 전송하여 토큰 받기
    const handleCallback = async () => {
      try {
        setStatus("로그인 처리 중...");
        
        // 로컬 개발 환경: 프론트엔드는 localhost:3000, 백엔드는 서버(51.20.106.74:8080)
        const API_BASE_URL = "http://51.20.106.74:8080/api";
        
        const res = await axios.post(
          `${API_BASE_URL}/v1/auth-google`,
          null,
          {
            params: { code },
            timeout: 10000,
          }
        );

        const { accessToken, refreshToken, name, email } = res.data;

        if (!accessToken || !refreshToken) {
          throw new Error("토큰을 받지 못했습니다.");
        }

        // 토큰 저장
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // 사용자 정보 추출 및 저장
        let userName = name;
        let userEmail = email;

        // 백엔드 응답에 사용자 정보가 없으면 JWT 토큰에서 추출 시도
        if (!userName || !userEmail) {
          try {
            const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
            userName = userName || tokenPayload.name || tokenPayload.sub || tokenPayload.email?.split('@')[0] || '사용자';
            userEmail = userEmail || tokenPayload.email || '';
          } catch (e) {
            console.warn('JWT 토큰에서 사용자 정보를 추출할 수 없습니다:', e);
            userName = userName || '사용자';
          }
        }

        // 사용자 정보 저장
        localStorage.setItem("userName", userName);
        if (userEmail) {
          localStorage.setItem("userEmail", userEmail);
        }

        setStatus("로그인 성공!");
        
        // 메인 페이지로 이동 (Sidebar가 사용자 정보를 다시 읽어오도록)
        setTimeout(() => {
          navigate("/");
          // Sidebar 컴포넌트가 localStorage 변경을 감지하도록 페이지 새로고침
          window.location.reload();
        }, 1000);
      } catch (err) {
        console.error("로그인 처리 실패:", err);
        
        let errorMessage = "로그인 처리 중 오류가 발생했습니다.";
        
        if (err.response) {
          const status = err.response.status;
          const data = err.response.data;
          
          if (status === 401) {
            errorMessage = "인증에 실패했습니다. OAuth 클라이언트 설정을 확인해주세요.";
            if (data?.message) {
              errorMessage = `인증 오류: ${data.message}`;
            } else if (data?.error) {
              errorMessage = `인증 오류: ${data.error}`;
            }
          } else if (status === 400) {
            errorMessage = "잘못된 요청입니다. 인증 코드가 유효하지 않을 수 있습니다.";
            if (data?.message) {
              errorMessage = data.message;
            }
          } else {
            errorMessage = `서버 오류 (${status})`;
            if (data?.message) {
              errorMessage = `${errorMessage}: ${data.message}`;
            }
          }
        } else if (err.request) {
          // 요청은 보냈지만 응답을 받지 못함 (네트워크 오류, CORS 등)
          errorMessage = "서버에 연결할 수 없습니다.\n\n가능한 원인:\n- 서버가 실행 중이 아닙니다\n- 네트워크 연결 문제\n- CORS 설정 문제\n\n서버 주소: http://51.20.106.74:8080";
        } else {
          errorMessage = err.message || errorMessage;
        }
        
        setStatus(errorMessage);
        setIsError(true);
        
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 20,
        padding: "20px",
      }}
    >
      {!isError ? (
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #e5e7eb",
            borderTop: "3px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          ⚠️
        </div>
      )}
      <div style={{ 
        fontSize: 15, 
        color: isError ? "#dc2626" : "#6b7280",
        textAlign: "left",
        maxWidth: "600px",
        whiteSpace: "pre-line",
        lineHeight: "1.8",
        background: isError ? "#fef2f2" : "transparent",
        padding: isError ? "20px" : "0",
        borderRadius: isError ? "8px" : "0",
        border: isError ? "1px solid #fecaca" : "none",
      }}>
        {status}
      </div>
      {isError && (
        <button
          onClick={() => navigate("/auth")}
          style={{
            padding: "10px 20px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          로그인 페이지로 돌아가기
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