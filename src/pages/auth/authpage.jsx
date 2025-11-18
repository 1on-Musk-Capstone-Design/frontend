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
          background: 'linear-gradient(180deg,#fffaf0 0%,#f6f8ff 100%)' 
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
            position:'relative', 
            width:520, 
            maxWidth:'92%', 
            background:"#fff", 
            borderRadius:20, 
            boxShadow:"0 12px 40px rgba(15,23,42,0.06)", 
            padding:28, 
            border:'1px solid rgba(15,23,42,0.04)' 
          }}
        >
          <LoginForm />
        </div>
      </div>
    );
  }