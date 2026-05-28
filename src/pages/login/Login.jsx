import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-noise" />
      <div className="login-shell">
        <section className="login-hero">
          <p className="login-badge">Creative Workspace</p>
          <h1 className="login-logo">
            ON<span>it</span>
          </h1>
          <p className="login-description">
            무한한 캔버스 위에서 아이디어를 정리하고,
            실시간으로 대화를 이어가세요.
          </p>
          <div className="login-metrics">
            <div className="login-metric-card">
              <span>Realtime</span>
              <strong>Sync</strong>
            </div>
            <div className="login-metric-card">
              <span>Voice</span>
              <strong>Ready</strong>
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-switch-row">
            <span className="login-switch active">로그인</span>
            <Link to="/signup" className="login-switch">회원가입</Link>
          </div>

          <form className="login-form">
            <input type="email" placeholder="Email" className="login-input" />
            <input type="password" placeholder="Password" className="login-input" />
            <button type="submit" className="login-button">로그인</button>
          </form>

          <p className="login-helper">
            계정이 없나요? <Link to="/signup">회원가입</Link>
          </p>
        </section>
      </div>

      <style>{`
        .login-page {
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

        .login-noise {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.14;
          background-image: radial-gradient(rgba(17, 24, 39, 0.12) 0.45px, transparent 0.45px);
          background-size: 5px 5px;
        }

        .login-shell {
          width: min(960px, 100%);
          min-height: 600px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          border-radius: 26px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.15);
          animation: loginFadeIn 420ms ease-out;
          position: relative;
          z-index: 1;
        }

        .login-hero {
          padding: 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 14px;
          background:
            radial-gradient(circle at 90% 20%, rgba(255, 255, 255, 0.24) 0%, transparent 44%),
            linear-gradient(150deg, #0f2f15 0%, #14551f 52%, #16632a 100%);
          color: #e5f7e6;
        }

        .login-badge {
          margin: 0;
          width: fit-content;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid rgba(229, 247, 230, 0.35);
          background: rgba(255, 255, 255, 0.06);
          color: #d5f5d9;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .login-logo {
          margin: 0;
          font-size: clamp(36px, 3vw, 46px);
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #ffffff;
          line-height: 1;
        }

        .login-logo span {
          color: #9dffae;
        }

        .login-description {
          margin: 0;
          max-width: 34ch;
          color: rgba(229, 247, 230, 0.92);
          line-height: 1.6;
          white-space: pre-line;
        }

        .login-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          max-width: 360px;
        }

        .login-metric-card {
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(229, 247, 230, 0.2);
          background: rgba(255, 255, 255, 0.09);
          display: grid;
          gap: 3px;
        }

        .login-metric-card span {
          font-size: 12px;
          color: rgba(229, 247, 230, 0.75);
        }

        .login-metric-card strong {
          font-size: 17px;
          color: #ffffff;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.92);
          padding: 34px 30px;
          display: flex;
          flex-direction: column;
        }

        .login-switch-row {
          display: inline-flex;
          width: fit-content;
          border-radius: 999px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 18px;
          background: #ecf8ee;
          border: 1px solid #ceedd4;
        }

        .login-switch {
          min-width: 82px;
          height: 34px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          color: #287738;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .login-switch.active {
          color: #ffffff;
          background: linear-gradient(135deg, #01cd15 0%, #0f9f26 100%);
          box-shadow: 0 7px 16px rgba(1, 205, 21, 0.28);
        }

        .login-form {
          display: grid;
          gap: 12px;
          margin-top: 8px;
        }

        .login-input {
          width: 100%;
          height: 50px;
          border-radius: 12px;
          border: 1px solid #cfe5d4;
          background: #f9fcf9;
          padding: 0 14px;
          font-size: 15px;
          color: #111827;
          outline: none;
          transition: border-color 140ms ease, box-shadow 140ms ease, transform 120ms ease;
        }

        .login-input::placeholder {
          color: #9ca3af;
        }

        .login-input:focus {
          border-color: #01cd15;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(1, 205, 21, 0.14);
          transform: translateY(-1px);
        }

        .login-button {
          margin-top: 4px;
          height: 52px;
          border: 0;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          cursor: pointer;
          background: linear-gradient(135deg, #01cd15 0%, #0fa124 100%);
          box-shadow: 0 10px 24px rgba(1, 205, 21, 0.3);
          transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
        }

        .login-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(1, 205, 21, 0.36);
          filter: brightness(1.01);
        }

        .login-helper {
          margin: 18px 0 0;
          color: #4f5e53;
          font-size: 14px;
        }

        .login-helper a {
          color: #0f8a1f;
          font-weight: 800;
          text-decoration: none;
        }

        .login-helper a:hover {
          text-decoration: underline;
        }

        @keyframes loginFadeIn {
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
          .login-shell {
            min-height: auto;
            grid-template-columns: 1fr;
          }

          .login-hero {
            min-height: 240px;
            padding: 30px 24px;
          }

          .login-card {
            padding: 24px;
          }
        }

        @media (max-width: 640px) {
          .login-page {
            padding: 16px;
          }

          .login-shell {
            border-radius: 20px;
          }

          .login-metrics {
            grid-template-columns: 1fr;
            max-width: 100%;
          }

          .login-helper {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
