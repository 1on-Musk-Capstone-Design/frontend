import React, { useState } from "react";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: API 연동 (axios.post('/auth/signup', {...}))
    console.log("회원가입 시도", { name, email, pw });
  };

  return (
    <form onSubmit={onSubmit} style={{ display:"flex", flexDirection:"column", gap:12, minHeight:260 }}>
      <h2 style={{ textAlign:"center", marginBottom:4, fontSize:20, fontWeight:700, color:'#111827' }}>회원가입</h2>
      <p style={{ textAlign:"center", color:"#6b7280", marginBottom:8 }}>무한캔버스와 함께 시작해요</p>
      <label style={{ marginBottom:4, fontWeight:600 }}>이름</label>
      <input value={name} onChange={e=>setName(e.target.value)} type="text" required style={{ padding:14, borderRadius:12, border:"1px solid #f1f5f9", marginBottom:0, background:'#fffbf0' }} />
      <label style={{ marginBottom:4, marginTop:6, fontWeight:600 }}>이메일</label>
      <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required style={{ padding:14, borderRadius:12, border:"1px solid #f1f5f9", marginBottom:0, background:'#fffaf6' }} />
      <label style={{ marginBottom:4, marginTop:6, fontWeight:600 }}>비밀번호</label>
      <input value={pw} onChange={e=>setPw(e.target.value)} type="password" required style={{ padding:14, borderRadius:12, border:"1px solid #f1f5f9", marginBottom:0, background:'#fffaf6' }} />
      <button type="submit" style={{ padding:14, borderRadius:12, background:"linear-gradient(90deg,#ff7ab6,#7c6cff)", color:"#fff", border:"none", fontWeight:700, marginTop:8 }}>회원가입</button>
    </form>
  );
}
