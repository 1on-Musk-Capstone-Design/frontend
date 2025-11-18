import React, { useState } from "react";
import axios from "axios";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const onGoogleLogin = async () => {
    if (isLoading) return; // 중복 클릭 방지

    setIsLoading(true);
    
    try {
      // 로컬 개발 환경: 프론트엔드는 localhost:3000, 백엔드는 서버(51.20.106.74:8080)
      const API_BASE_URL = "http://51.20.106.74:8080/api";
      
      const res = await axios.get(
        `${API_BASE_URL}/v1/auth-google/login-uri`,
        { timeout: 10000 } // 10초 타임아웃
      );
      
      const loginUrl = res.data;
      
      if (!loginUrl) {
        throw new Error("로그인 URL을 받아오지 못했습니다.");
      }
      
      // Google 로그인 페이지로 리다이렉트
      window.location.href = loginUrl;
      
    } catch (err) {
      console.error("구글 로그인 URL 오류:", err);
      
      let errorMessage = "로그인 중 오류가 발생했습니다.";
      
      if (err.response) {
        // 서버 응답이 있는 경우
        errorMessage = `서버 오류: ${err.response.status}`;
      } else if (err.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        errorMessage = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
      } else {
        // 요청 설정 중 오류가 발생한 경우
        errorMessage = err.message || errorMessage;
      }
      
      alert(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, minHeight: 200 }}>
      <h2 style={{ textAlign: "center", marginBottom: 0, fontSize: 22, fontWeight: 800 }}>
        로그인
      </h2>
      <p style={{ textAlign: "center", color: "#6b7280", marginTop: -10 }}>
        구글 계정으로 계속하세요
      </p>
      <button
        onClick={onGoogleLogin}
        disabled={isLoading}
        style={{
          padding: 16,
          borderRadius: 12,
          background: isLoading ? "#f3f4f6" : "#fff",
          border: "1px solid #e5e7eb",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.6 : 1,
          transition: "all 0.2s ease",
        }}
      >
        {isLoading ? (
          <>
            <div
              style={{
                width: 20,
                height: 20,
                border: "2px solid #e5e7eb",
                borderTop: "2px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span>처리 중...</span>
          </>
        ) : (
          <>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="google"
              style={{ width: 24, height: 24 }}
            />
            구글로 로그인하기
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

