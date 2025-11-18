import React from 'react';

const FloatingToolbar = ({ mode, onModeChange, onReset, onArrange }) => {
  return (
    <div 
      className="floatingToolbar"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        willChange: 'transform'
      }}
    >
      {/* 텍스트 도구 */}
      <button
        onClick={() => onModeChange('text')}
        className={`toolbarButton ${mode === 'text' ? 'active' : ''}`}
        title="텍스트"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16v4H4V4zM4 12h12M4 20h16"/>
        </svg>
      </button>

      {/* 포인터/선택 도구 */}
      <button
        onClick={() => onModeChange('move')}
        className={`toolbarButton ${mode === 'move' ? 'active' : ''}`}
        title="선택/이동"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
        </svg>
      </button>

      {/* 삭제 도구 */}
      <button
        onClick={() => onModeChange('delete')}
        className={`toolbarButton ${mode === 'delete' ? 'active' : ''}`}
        title="삭제"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>

      {/* 구분선 */}
      <div className="toolbarDivider"></div>

      {/* 정리 도구 */}
      <button
        onClick={onArrange}
        className="toolbarButton"
        title="정리"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
        </svg>
      </button>

      {/* 초기화 */}
      <button
        onClick={onReset}
        className="toolbarButton"
        title="초기화"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M3 21v-5h5"/>
        </svg>
      </button>
    </div>
  );
};

export default FloatingToolbar;
