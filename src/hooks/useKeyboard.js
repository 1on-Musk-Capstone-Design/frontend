import { useEffect } from 'react';

export const useKeyboard = (onModeChange, isTextEditing) => {
  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 텍스트 편집 중일 때는 단축키 비활성화
      if (isTextEditing) return;
      
      if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        onModeChange('text');
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        onModeChange('move');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onModeChange, isTextEditing]);
};
