import React, { useState } from "react";
import axios from "axios";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const onGoogleLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const API_BASE_URL = "http://51.20.106.74:8080/api";

      const res = await axios.get(
        `${API_BASE_URL}/v1/auth-google/login-uri`,
        { timeout: 10000 }
      );

      const loginUrl = res.data;

      if (!loginUrl) throw new Error("로그인 URL을 받아오지 못했습니다.");

      window.location.href = loginUrl;
    } catch (err) {
      console.error("구글 로그인 URL 오류:", err);
      alert("서버와 연결할 수 없습니다.");
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
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
    textAlign: "center",
    margin: 0,
  };

  const subtitleStyle = {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    margin: 0,
  };

  const buttonStyle = {
    width: "100%",
    height: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 12,
    border: "none",
    cursor: isLoading ? "not-allowed" : "pointer",
    background: isLoading ? "#1e7b0b" : "#01cd15",
    color: "white",
    transition: "background 0.2s ease",
    opacity: isLoading ? 0.8 : 1,
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

      <button
        onClick={onGoogleLogin}
        disabled={isLoading}
        style={buttonStyle}
        onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = "#1e7b0b")}
        onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = "#01cd15")}
      >
        {isLoading ? (
          <>
            <div style={spinnerStyle} />
            <span>처리 중...</span>
          </>
        ) : (
          <>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google 로그인"
              style={googleIconStyle}
            />
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