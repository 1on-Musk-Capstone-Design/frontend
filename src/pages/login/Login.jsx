import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceManager from '../../components/WorkspaceManager';

export default function Login() {
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false);
  const navigate = useNavigate();

  const handleWorkspaceCreated = (workspace) => {
    console.log('워크스페이스 생성됨:', workspace);
    // 워크스페이스 생성 후 캔버스 페이지로 이동
    navigate('/canvas');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // 간단한 로그인 처리 (실제로는 인증 로직이 필요)
    navigate('/canvas');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>무한 캔버스</h2>
        <p style={styles.subtitle}>협업을 위한 무한 캔버스에 오신 것을 환영합니다</p>
        
        {!showWorkspaceManager ? (
          <>
            <form style={styles.form} onSubmit={handleLogin}>
              <input type="email" placeholder="이메일" style={styles.input} />
              <input type="password" placeholder="비밀번호" style={styles.input} />
              <button type="submit" style={styles.button}>로그인</button>
            </form>
            
            <div style={styles.divider}>
              <span style={styles.dividerText}>또는</span>
            </div>
            
            <button 
              onClick={() => setShowWorkspaceManager(true)}
              style={styles.workspaceButton}
            >
              워크스페이스 생성하기
            </button>
            
            <p style={styles.text}>
              계정이 없으신가요?{" "}
              <a href="/signup" style={styles.link}>회원가입</a>
            </p>
          </>
        ) : (
          <div>
            <button 
              onClick={() => setShowWorkspaceManager(false)}
              style={styles.backButton}
            >
              ← 뒤로가기
            </button>
            <WorkspaceManager onWorkspaceCreated={handleWorkspaceCreated} />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f3f4f6" },
  card: { background: "white", padding: "40px", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "400px", textAlign: "center" },
  title: { fontSize: "28px", marginBottom: "10px", color: "#333" },
  subtitle: { fontSize: "14px", marginBottom: "20px", color: "#666" },
  form: { display: "flex", flexDirection: "column" },
  input: { padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "16px" },
  button: { padding: "12px", background: "#4CAF50", color: "white", fontSize: "16px", border: "none", borderRadius: "5px", cursor: "pointer" },
  workspaceButton: { padding: "12px", background: "#2196F3", color: "white", fontSize: "16px", border: "none", borderRadius: "5px", cursor: "pointer", width: "100%", marginBottom: "15px" },
  backButton: { padding: "8px 16px", background: "#f5f5f5", color: "#333", fontSize: "14px", border: "none", borderRadius: "5px", cursor: "pointer", marginBottom: "20px" },
  divider: { margin: "20px 0", position: "relative" },
  dividerText: { background: "white", padding: "0 10px", color: "#666", fontSize: "14px" },
  text: { marginTop: "15px", fontSize: "14px" },
  link: { color: "#4CAF50", textDecoration: "none", fontWeight: "bold" }
};
