import React from "react";
import LoginForm from "./components/loginForm";

export default function AuthPage() {
  return (
    <div 
      style={{ 
        display:"flex", 
        flexDirection:"column", 
        alignItems:"center", 
        justifyContent:"center", 
        minHeight:"100vh", 
        background: '#f5f5f5',
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '30px 30px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 배경 장식 메모들 */}
      <div style={{
        position: 'absolute',
        top: '12%',
        left: '8%',
        width: '250px',
        height: '180px',
        background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
        transform: 'rotate(-8deg)',
        padding: '20px',
        fontFamily: '"-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '15px',
        color: '#333',
        opacity: 0.6,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "rotate(-4deg) scale(1.05)";
        e.currentTarget.style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "rotate(-8deg) scale(1)";
        e.currentTarget.style.opacity = "0.6";
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>🤖 AI Clustering</div>
        <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
          AI가 자동으로<br/>
          아이디어를 분류해요
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: '55%',
        right: '10%',
        width: '250px',
        height: '180px',
        background: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
        transform: 'rotate(-5deg)',
        padding: '20px',
        fontFamily: '"-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '15px',
        color: '#333',
        opacity: 0.6,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "rotate(-2deg) scale(1.05)";
        e.currentTarget.style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "rotate(-5deg) scale(1)";
        e.currentTarget.style.opacity = "0.6";
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>✨ Collaborate</div>
        <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
          팀원들과 실시간으로<br/>
          함께 작업해요
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '12%',
        left: '15%',
        width: '250px',
        height: '180px',
        background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
        transform: 'rotate(12deg)',
        padding: '20px',
        fontFamily: '"-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '15px',
        color: '#333',
        opacity: 0.6,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "rotate(8deg) scale(1.05)";
        e.currentTarget.style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "rotate(12deg) scale(1)";
        e.currentTarget.style.opacity = "0.6";
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>📝 Infinite-Canvas</div>
        <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
          끝없이 펼쳐지는 <br/>
          무한한 작업 공간
        </div>
      </div>

      {/* 메인 로고 */}
      <h1 style={{ 
        fontSize:48, 
        fontWeight:900, 
        color:'#111827', 
        marginBottom:8,
        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        ONit
      </h1>

      <p style={{ 
        color:"#6b7280", 
        marginBottom:32,
        fontSize: 16,
        zIndex: 10
      }}>
        무한캔버스에 아이디어를 자유롭게 펼쳐보세요
      </p>

      {/* 포스트잇 스타일 로그인 박스 */}
      <div 
        style={{ 
          width: 420,
          maxWidth: "90%",
          background: "linear-gradient(135deg, #fffde7 0%, #fff9c4 100%)",
          borderRadius: 6,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)",
          padding: 40,
          border: "1px solid rgba(251, 192, 45, 0.2)",
          transform: "rotate(-1deg)",
          position: 'relative',
          zIndex: 10,
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "rotate(0deg) scale(1.02)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "rotate(-1deg) scale(1)";
        }}
      >
        {/* 포스트잇 상단 테이프 효과 */}
        <div style={{
          position: 'absolute',
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 80,
          height: 20,
          background: 'rgba(255,255,255,0.4)',
          borderRadius: '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }} />
        
        <LoginForm />
      </div>
    </div>
  );
}