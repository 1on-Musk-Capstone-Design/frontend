import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../config/api";

export default function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("처리 중...");
  const [isError, setIsError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // 이미 로그인된 상태면 메인 페이지로 이동 (403 오류 방지)
    const existingToken = localStorage.getItem("accessToken");
    if (existingToken && !code && !error) {
      navigate("/", { replace: true });
      return;
    }

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

    // 인증 코드 재사용 방지
    const usedCodesKey = 'usedAuthCodes';
    const usedCodes = JSON.parse(sessionStorage.getItem(usedCodesKey) || '[]');
    if (usedCodes.includes(code)) {
      if (existingToken) {
        navigate("/", { replace: true });
      } else {
        navigate("/auth", { replace: true });
      }
      return;
    }

    // 중복 요청 방지 (React StrictMode 이중 실행 방지)
    const processingCodeKey = 'processingAuthCode';
    const currentProcessingCode = sessionStorage.getItem(processingCodeKey);
    if (isProcessingRef.current || currentProcessingCode === code) {
      return;
    }
    
    sessionStorage.setItem(processingCodeKey, code);
    isProcessingRef.current = true;

    const handleCallback = async () => {

      setIsProcessing(true);

      // AbortController로 중복 요청 취소 가능하게 설정
      abortControllerRef.current = new AbortController();

      try {
        setStatus("로그인 처리 중...");
        
        const res = await axios.post(
          `${API_BASE_URL}/v1/auth-google`,
          null,
          {
            params: { code },
            timeout: 10000,
            signal: abortControllerRef.current?.signal,
          }
        );

        const { accessToken, refreshToken, name, email } = res.data || {};

        if (!accessToken || !refreshToken) {
          throw new Error("토큰을 받지 못했습니다.");
        }

        // 토큰 저장
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // 사용자 정보 추출 및 저장
        // 백엔드 응답에 name/email이 있으면 사용, 없으면 JWT에서 추출
        let userName = name || '';
        let userEmail = email || '';

        // 사용자 정보가 없으면 JWT 토큰에서 추출
        if (!userName || userName.trim() === '' || !userEmail || userEmail.trim() === '') {
          try {
            const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
            
            if (!userEmail || userEmail.trim() === '') {
              userEmail = tokenPayload.email || '';
              if (!userEmail && tokenPayload.sub && tokenPayload.sub.includes('@')) {
                userEmail = tokenPayload.sub;
              }
            }
            
            if (!userName || userName.trim() === '') {
              userName = tokenPayload.name || tokenPayload.given_name || tokenPayload.family_name || '';
              if (!userName) {
                const emailForName = tokenPayload.email || (tokenPayload.sub && tokenPayload.sub.includes('@') ? tokenPayload.sub : '');
                if (emailForName) {
                  userName = emailForName.split('@')[0];
                }
              }
            }
          } catch (e) {
            if (userEmail && userEmail.trim() !== '') {
              userName = userName || userEmail.split('@')[0];
            }
          }
        }

        // 최종 검증 및 정리
        if (!userName || userName.trim() === '') {
          userName = userEmail ? userEmail.split('@')[0] : '사용자';
        }
        if (userName && userName.includes('@')) {
          userName = userName.split('@')[0];
        }
        
        localStorage.setItem("userName", userName.trim());
        if (userEmail && userEmail.trim() !== '') {
          localStorage.setItem("userEmail", userEmail.trim());
        }

        setStatus("로그인 성공!");
        
        // 성공한 경우에만 인증 코드를 사용된 코드 목록에 추가
        const successUsedCodes = JSON.parse(sessionStorage.getItem(usedCodesKey) || '[]');
        if (!successUsedCodes.includes(code)) {
          successUsedCodes.push(code);
          sessionStorage.setItem(usedCodesKey, JSON.stringify(successUsedCodes));
        }
        sessionStorage.removeItem(processingCodeKey);
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 대기 중인 초대 토큰이 있으면 초대 수락 페이지로 이동
        const pendingInviteToken = localStorage.getItem('pendingInviteToken');
        if (pendingInviteToken) {
          localStorage.removeItem('pendingInviteToken');
          setTimeout(() => {
            navigate(`/invite/${pendingInviteToken}`, { replace: true });
          }, 1000);
          return;
        }
        
        setTimeout(() => {
          navigate("/", { replace: true });
          window.location.reload();
        }, 1000);
      } catch (err) {
        if (axios.isCancel(err) || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          return;
        }

        let errorMessage = "로그인 처리 중 오류가 발생했습니다.";
        
        if (err.response) {
          const { status, data } = err.response;
          
          if (status === 401) {
            errorMessage = data?.message || data?.error || "인증에 실패했습니다.";
          } else if (status === 403) {
            errorMessage = data?.message || data?.error || "접근이 거부되었습니다. 다시 로그인해주세요.";
          } else if (status === 400) {
            errorMessage = data?.message || "잘못된 요청입니다.";
          } else {
            errorMessage = data?.message || `서버 오류 (${status})`;
          }
        } else if (err.request) {
          errorMessage = "서버에 연결할 수 없습니다.";
        } else {
          errorMessage = err.message || errorMessage;
        }
        
        setStatus(errorMessage);
        setIsError(true);
        
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } finally {
        sessionStorage.removeItem(processingCodeKey);
        isProcessingRef.current = false;
        setIsProcessing(false);
        abortControllerRef.current = null;
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