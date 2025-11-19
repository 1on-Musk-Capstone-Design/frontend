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
          background: 'linear-gradient(180deg,#f8fff8 0%,#eef8ff 100%)' 
        }}
      >
        <h1 style={{ fontSize:36, fontWeight:800, color:'#111827', marginBottom:4 }}>
          ONit
        </h1>

        <p style={{ color:"#6b7280", marginBottom:20 }}>
          무한캔버스에 아이디어를 자유롭게 펼쳐보세요
        </p>

        <div 
          style={{ 
          width: 520,
          maxWidth: "92%",
          background: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
          padding: 32,
          border: "1px solid #e7e7e7"
        }}
        >
          <LoginForm />
        </div>
      </div>
    );
  }