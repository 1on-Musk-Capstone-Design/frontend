import React, { useState } from "react";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";

export default function AuthPage() {
  const [tab, setTab] = useState("login");

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background: 'linear-gradient(180deg,#fffaf0 0%,#f6f8ff 100%)' }}>
      <h1 style={{ fontSize:36, fontWeight:800, color:'#111827', marginBottom:4 }}>ONit</h1>
      <p style={{ color:"#6b7280", marginBottom:20 }}>무한캔버스에 아이디어를 자유롭게 펼쳐보세요</p>

      <div style={{ position:'relative', width:520, maxWidth:'92%', background:"#fff", borderRadius:20, boxShadow:"0 12px 40px rgba(15,23,42,0.06)", padding:12, border:'1px solid rgba(15,23,42,0.04)', marginBottom:20 }}>
        <div style={{ display:"flex", background:"rgba(255,255,255,0.9)", borderRadius:12, overflow:"hidden", boxShadow: '0 6px 18px rgba(99,102,241,0.04)' }}>
          <button onClick={()=>setTab("login")} style={{ padding:'12px 20px', flex:1, border:"none", background: 'transparent', fontWeight: tab==="login" ? 800:600, whiteSpace:'nowrap', minWidth:140, cursor:'pointer' }}>{"로그인"}</button>
          <button onClick={()=>setTab("signup")} style={{ padding:'12px 20px', flex:1, border:"none", background: 'transparent', fontWeight: tab==="signup" ? 800:600, whiteSpace:'nowrap', minWidth:140, cursor:'pointer' }}>{"회원가입"}</button>
        </div>

        {/* sliding indicator */}
        <div style={{ position:'absolute', left: tab=== 'login' ? 12 : 'calc(50% + 12px)', top: '56px', width:'calc(50% - 24px)', height:6, background:'linear-gradient(90deg,#ff7ab6,#7c6cff)', borderRadius:6, transition:'left 220ms cubic-bezier(.2,.9,.2,1)' }} />

        <div style={{ padding:28, width:'100%', boxSizing:'border-box', minHeight:360 }}>
          {tab === "login" ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    </div>
  );
}
