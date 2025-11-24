import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import InfiniteCanvasPage from './pages/infinite-canvas/InfiniteCanvasPage';
import MainPage from './pages/MainPage/MainPage';
import AuthPage from './pages/auth/authpage';
import CallbackPage from './pages/auth/components/CallbackPage';
import InviteAcceptPage from './pages/invite/InviteAcceptPage';
import './index.css';
import Login from './pages/login/Login';

function App() {
  console.log('App 컴포넌트 렌더링')
  console.log('현재 경로:', window.location.pathname)
  console.log('전체 URL:', window.location.href)
  
  // GitHub Pages 배포 경로에 맞춘 basename 설정
  // 로컬 개발 환경에서는 빈 문자열, 프로덕션에서는 /onit
  const basename = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''
    : '/onit';
  
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* 초대 수락 페이지 - 경로 파라미터와 쿼리 파라미터 모두 지원 */}
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        <Route path="/invite" element={<InviteAcceptPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/canvas/:projectId" element={<InfiniteCanvasPage />} />
        <Route path="/canvas" element={<InfiniteCanvasPage />} />
        <Route path="/" element={<MainPage />} />
        {/* catch-all은 맨 마지막에 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;