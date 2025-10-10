import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import InfiniteCanvasPage from './pages/infinite-canvas/InfiniteCanvasPage';
import MainPage from './pages/MainPage/MainPage';
import './index.css';
import Login from './pages/login/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
  {/* 기본 경로를 메인 페이지로 변경 */}
  <Route path="/" element={<MainPage />} />
        <Route path="/canvas" element={<InfiniteCanvasPage />} />
        <Route path="/canvas/:projectId" element={<InfiniteCanvasPage />} />
        {/* 나중에 추가될 다른 페이지들 */}
        {<Route path="/login" element={<Login />} /> }
        {/* <Route path="/projects" element={<ProjectListPage />} /> */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;