import { useEffect } from 'react';

export const useKeyboard = (onModeChange, isTextEditing) => {
  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 텍스트 편집 중일 때는 단축키 비활성화
      if (isTextEditing) return;
      
      // 입력 필드(input, textarea, select 등)에 포커스가 있을 때는 단축키 비활성화
      const target = e.target;
      if (target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )) {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      // 영어 키보드
      if (key === 'a') {
        e.preventDefault();
        onModeChange('text');
      } else if (key === 's') {
        e.preventDefault();
        onModeChange('move');
      } else if (key === 'd') {
        e.preventDefault();
        onModeChange('delete');
      }
      
      // 한글 키보드 매핑 (ㅁㄴㅇ)
      if (key === 'ㅁ' || e.key === 'ㅁ') {
        e.preventDefault();
        onModeChange('text');
      } else if (key === 'ㄴ' || e.key === 'ㄴ') {
        e.preventDefault();
        onModeChange('move');
      } else if (key === 'ㅇ' || e.key === 'ㅇ') {
        e.preventDefault();
        onModeChange('delete');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onModeChange, isTextEditing]);
};
