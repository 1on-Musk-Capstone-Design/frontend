import React from 'react';
import ChatPanel from './components/ChatPanel';
import './styles/canvas.css';

const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
  position: 'relative',
  overflow: 'hidden'
};

const canvasStyle = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)',
  backgroundSize: '24px 24px',
  opacity: 0.35
};

const hintStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  zIndex: 2,
  padding: '10px 14px',
  borderRadius: 10,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  color: '#374151',
  fontSize: 13,
  lineHeight: 1.5,
  maxWidth: 320
};

export default function VoicePreviewPage() {
  return (
    <div style={pageStyle}>
      <div style={canvasStyle} />
      <div style={hintStyle}>
        음성 UI 미리보기 페이지입니다.
        <br />
        로그인 없이 왼쪽 패널만 보고 수정할 수 있습니다.
      </div>
      <ChatPanel
        messages={[]}
        participants={[
          { id: 'preview-1', name: '개발용 사용자', profileImage: '' },
          { id: 'preview-2', name: '테스트 멤버', profileImage: '' }
        ]}
        currentUserId="preview-1"
        currentUserName="개발용 사용자"
        currentUserImage=""
        workspaceId={null}
        projectName="Voice Preview"
      />
    </div>
  );
}