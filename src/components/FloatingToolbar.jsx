import React from 'react';

const FloatingToolbar = ({ mode, onModeChange, onReset, onArrange }) => {
  return (
    <div 
      className="fixed bottom-6 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-2 flex gap-1"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        willChange: 'transform'
      }}
    >
      <button
        onClick={() => onModeChange('text')}
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-200 ${
          mode === 'text'
            ? 'bg-blue-500 text-white shadow-lg scale-105'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
        }`}
        title="텍스트 모드"
      >
        T
      </button>
      <button
        onClick={() => onModeChange('move')}
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all duration-200 ${
          mode === 'move'
            ? 'bg-green-500 text-white shadow-lg scale-105'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
        }`}
        title="이동 모드"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 6.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5v11c0 .28.22.5.5.5s.5-.22.5-.5v-11zM9.5 8.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5v7c0 .28.22.5.5.5s.5-.22.5-.5v-7zM16.5 8.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5v7c0 .28.22.5.5.5s.5-.22.5-.5v-7z"/>
          <path d="M3 3h18v2H3V3zm0 16h18v2H3v-2z"/>
        </svg>
      </button>
      <div className="w-px bg-gray-300 mx-1"></div>
      <button
        onClick={onArrange}
        className="w-12 h-12 rounded-xl bg-purple-500 text-white hover:bg-purple-600 flex items-center justify-center text-lg transition-all duration-200 hover:scale-105"
        title="정리"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zm-8 8h6v6H3v-6zm8 0h6v6h-6v-6z"/>
        </svg>
      </button>
      <button
        onClick={onReset}
        className="w-12 h-12 rounded-xl bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-lg transition-all duration-200 hover:scale-105"
        title="초기화"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  );
};

export default FloatingToolbar;
