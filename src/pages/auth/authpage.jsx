import React from "react";
import LoginForm from "./components/loginForm";

export default function AuthPage() {
  return (
    <div className="auth-entry-page">
      <div className="auth-entry-noise" />
      <div className="auth-entry-shell">
        <p className="auth-entry-badge">Infinite Canvas Collaboration</p>
        <h1 className="auth-entry-logo">
          ON<span>it</span>
        </h1>
        <p className="auth-entry-description">
          무한 캔버스에서 아이디어를 정리하고,
          <br />
          팀원과 함께 실시간으로 협업하세요.
        </p>

        <div className="auth-entry-metrics">
          <div className="auth-entry-metric-card">
            <span>Canvas</span>
            <strong>Infinite</strong>
          </div>
          <div className="auth-entry-metric-card">
            <span>AI</span>
            <strong>Clustering</strong>
          </div>
          <div className="auth-entry-metric-card">
            <span>Collab</span>
            <strong>Realtime</strong>
          </div>
          <div className="auth-entry-metric-card">
            <span>Voice</span>
            <strong>Brainstorm</strong>
          </div>
        </div>

        <section className="auth-entry-login-area">
          <LoginForm />
        </section>
      </div>

      <style>{`
        .auth-entry-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          overflow: auto;
          background:
            radial-gradient(circle at 12% 18%, rgba(1, 205, 21, 0.2) 0%, transparent 44%),
            radial-gradient(circle at 86% 80%, rgba(25, 146, 0, 0.14) 0%, transparent 40%),
            linear-gradient(140deg, #edf7ef 0%, #f8fbff 46%, #ffffff 100%);
          font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
        }

        .auth-entry-noise {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.14;
          background-image: radial-gradient(rgba(17, 24, 39, 0.12) 0.45px, transparent 0.45px);
          background-size: 5px 5px;
        }

        .auth-entry-shell {
          width: min(760px, 100%);
          max-height: calc(100vh - 48px);
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-radius: 26px;
          border: 1px solid rgba(15, 23, 42, 0.09);
          background:
            radial-gradient(circle at 90% 14%, rgba(255, 255, 255, 0.2) 0%, transparent 32%),
            linear-gradient(150deg, #0f2f15 0%, #14551f 52%, #16632a 100%);
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.15);
          animation: authEntryFadeIn 420ms ease-out;
          position: relative;
          z-index: 1;
          padding: 30px;
          overflow-y: auto;
        }

        .auth-entry-badge {
          margin: 0;
          width: fit-content;
          padding: 0;
          border: 0;
          background: transparent;
          color: #c5f2cb;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.1;
        }

        .auth-entry-logo {
          margin: 0;
          font-size: clamp(36px, 3vw, 46px);
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #ffffff;
          line-height: 1;
        }

        .auth-entry-logo span {
          color: #9dffae;
        }

        .auth-entry-description {
          margin: 0;
          max-width: 36ch;
          color: rgba(229, 247, 230, 0.92);
          line-height: 1.6;
        }

        .auth-entry-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          width: 100%;
          max-width: 100%;
        }

        .auth-entry-metric-card {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(229, 247, 230, 0.2);
          background: rgba(255, 255, 255, 0.12);
          display: grid;
          gap: 4px;
          min-height: 74px;
        }

        .auth-entry-metric-card span {
          font-size: 13px;
          color: rgba(229, 247, 230, 0.75);
        }

        .auth-entry-metric-card strong {
          font-size: 20px;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .auth-entry-login-area {
          background: transparent;
          padding: 0;
          margin-top: 12px;
          border-radius: 0;
          display: flex;
          flex-direction: column;
          border: 0;
        }

        @keyframes authEntryFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 920px) {
          .auth-entry-shell {
            width: min(680px, 100%);
            padding: 24px;
            max-height: calc(100vh - 40px);
          }
        }

        @media (max-width: 640px) {
          .auth-entry-page {
            padding: 16px;
          }

          .auth-entry-shell {
            border-radius: 20px;
            padding: 20px;
            max-height: calc(100vh - 32px);
          }

          .auth-entry-metrics {
            grid-template-columns: 1fr;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
