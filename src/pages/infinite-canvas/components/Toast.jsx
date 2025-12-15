import React, { useEffect, useState } from 'react';

/**
 * Toast 알림 컴포넌트
 * @param {Object} props
 * @param {string} props.message - 표시할 메시지
 * @param {string} props.type - 알림 타입 ('success', 'info', 'warning', 'error')
 * @param {boolean} props.isVisible - 표시 여부
 * @param {number} props.duration - 표시 시간 (ms, 기본값: 3000)
 * @param {Function} props.onClose - 닫기 콜백
 */
const Toast = ({ 
  message, 
  type = 'info', 
  isVisible = false, 
  duration = 3000,
  onClose 
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // 애니메이션을 위한 약간의 지연
      setTimeout(() => setIsAnimating(true), 10);
      
      // 자동으로 사라지기
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setShouldRender(false);
          if (onClose) onClose();
        }, 300); // 페이드아웃 애니메이션 시간
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isVisible, duration, onClose]);

  if (!shouldRender) return null;

  const typeStyles = {
    success: {
      backgroundColor: '#10b981',
      borderColor: '#059669',
      icon: '✓'
    },
    info: {
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      icon: 'ℹ'
    },
    warning: {
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      icon: '⚠'
    },
    error: {
      backgroundColor: '#ef4444',
      borderColor: '#dc2626',
      icon: '✕'
    }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        minWidth: '300px',
        maxWidth: '400px',
        padding: '12px 16px',
        backgroundColor: style.backgroundColor,
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: 500,
        opacity: isAnimating ? 1 : 0,
        transform: isAnimating ? 'translateX(0)' : 'translateX(100%)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: 'auto'
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          flexShrink: 0
        }}
      >
        {style.icon}
      </div>
      <div style={{ flex: 1, lineHeight: '1.4' }}>
        {message}
      </div>
      <button
        onClick={() => {
          setIsAnimating(false);
          setTimeout(() => {
            setShouldRender(false);
            if (onClose) onClose();
          }, 300);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          padding: '0',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: 0.8
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;







