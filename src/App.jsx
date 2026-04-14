import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InfiniteCanvasPage from './pages/infinite-canvas/InfiniteCanvasPage'
import MainPage from './pages/MainPage/MainPage'
import AuthPage from './pages/auth/authpage'
import CallbackPage from './pages/auth/components/CallbackPage'
import InviteAcceptPage from './pages/invite/InviteAcceptPage'
import SettingsPage from './pages/SettingsPage/SettingsPage'
import StarredPage from './pages/StarredPage/StarredPage'
import NotificationPage from './pages/NotificationPage/NotificationPage'
import LandingPage from './pages/LandingPage/LandingPage'
import LandingPage2 from './pages/LandingPage2/LandingPage2'
import CapstoneV2Redirect from './pages/CapstoneV2Redirect'
import TrashPage from './pages/TrashPage/TrashPage'
import PRDPage from './pages/PRDPage/PRDPage'
import PRDResultPage from './pages/PRDResultPage/PRDResultPage'
import './index.css'
import Login from './pages/login/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 랜딩 페이지 */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/landing2" element={<LandingPage2 />} />
        <Route path="/capstone_v2" element={<CapstoneV2Redirect />} />
        {/* 초대 수락 페이지 - 경로 파라미터와 쿼리 파라미터 모두 지원 */}
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        <Route path="/invite" element={<InviteAcceptPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/canvas/:projectId" element={<InfiniteCanvasPage />} />
        <Route path="/canvas" element={<InfiniteCanvasPage />} />
        <Route path="/prd" element={<PRDPage />} />
        <Route path="/prd/result/:id" element={<PRDResultPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/starred" element={<StarredPage />} />
        <Route path="/" element={<MainPage />} />
        {/* catch-all은 맨 마지막에 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App