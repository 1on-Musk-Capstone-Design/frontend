import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("처리 중...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Google OAuth 에러 처리
    if (error) {
      console.error("Google OAuth 에러:", error);
      setStatus("로그인에 실패했습니다.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }

    // code가 없으면 에러
    if (!code) {
      setStatus("인증 코드를 받지 못했습니다.");
      setTimeout(() => {
        navigate("/login");
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

        const { accessToken, refreshToken } = res.data;

        if (!accessToken || !refreshToken) {
          throw new Error("토큰을 받지 못했습니다.");
        }

        // 토큰 저장
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        setStatus("로그인 성공!");
        
        // 메인 페이지로 이동
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } catch (err) {
        console.error("로그인 처리 실패:", err);
        
        let errorMessage = "로그인 처리 중 오류가 발생했습니다.";
        
        if (err.response) {
          errorMessage = `서버 오류: ${err.response.status}`;
          if (err.response.data?.message) {
            errorMessage = err.response.data.message;
          }
        } else if (err.request) {
          errorMessage = "서버에 연결할 수 없습니다.";
        } else {
          errorMessage = err.message || errorMessage;
        }
        
        setStatus(errorMessage);
        
        setTimeout(() => {
          navigate("/login");
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
      }}
    >
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
      <p style={{ fontSize: 16, color: "#6b7280" }}>{status}</p>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}