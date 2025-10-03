import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import InfiniteCanvasPage from './pages/infinite-canvas/InfiniteCanvasPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 기본 경로를 무한 캔버스로 설정 */}
        <Route path="/" element={<InfiniteCanvasPage />} />
        <Route path="/canvas" element={<InfiniteCanvasPage />} />
        <Route path="/canvas/:projectId" element={<InfiniteCanvasPage />} />
        {/* 나중에 추가될 다른 페이지들 */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/projects" element={<ProjectListPage />} /> */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;