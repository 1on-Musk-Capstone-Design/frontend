import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const DraggableText = ({ id, x, y, text, width, height, onUpdate, onDelete, canvasTransform, onSendToChat, onEditingChange, mode, isHighlighted, isSelected, isMultiSelecting, onStartGroupDrag, onUpdateGroupDrag, onEndGroupDrag, isClusterDragging = false, onDragStart, onDragEnd, autoFocus = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [pressProgress, setPressProgress] = useState(0);
  const textareaRef = useRef(null);
  const memoRef = useRef(null);
  
  // text prop이 변경되면 currentText도 업데이트 (편집 중이 아닐 때만)
  useEffect(() => {
    if (!isEditing && text !== currentText) {
      setCurrentText(text);
    }
  }, [text, isEditing]);
  
  // autoFocus가 true이고 빈 메모면 자동으로 편집 모드 진입
  useEffect(() => {
    if (autoFocus && (!text || text.trim() === '') && !isEditing) {
      setIsEditing(true);
      onEditingChange(true);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 0);
    }
  }, [autoFocus, text, isEditing, onEditingChange]);
  
  // CSS 변수에서 기본 크기 가져오기
  const getDefaultWidth = () => {
    if (width !== null && width !== undefined) return width;
    return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--memo-width')) || 500;
  };
  
  const getDefaultHeight = () => {
    if (height !== null && height !== undefined) return height;
    return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--memo-height')) || 400;
  };
  
  const currentWidth = getDefaultWidth();
  const currentHeight = getDefaultHeight();

  const handleResizeStart = (e, handle) => {
    if (isEditing || mode === 'delete') return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    setInitialSize({
      width: currentWidth,
      height: currentHeight
    });
  };

  const handleMouseDown = (e) => {
    // 리사이즈 핸들을 클릭한 경우는 제외
    if (e.target.classList.contains('resize-handle')) return;
    
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    
    if (mode === 'delete') {
      // 삭제 모드: 길게 클릭 시작
      setIsLongPressing(true);
      setPressProgress(0);
      
      // 진행률 업데이트를 위한 인터벌
      const progressInterval = setInterval(() => {
        setPressProgress(prev => {
          const newProgress = prev + 100 / 15; // 1.5초 동안 100%까지
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 100);
      
      const timer = setTimeout(() => {
        // 즉시 삭제 (하이라이트 효과 없이)
        onDelete(id);
        setIsLongPressing(false);
        setPressProgress(0);
        clearInterval(progressInterval);
      }, 1500);
      setLongPressTimer(timer);
      return;
    }
    
    // 그룹 드래그 시작 (다중 선택된 상태에서)
    if (isMultiSelecting && isSelected && onStartGroupDrag) {
      const groupDragData = onStartGroupDrag(id, x, y);
      if (groupDragData) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - (x * canvasTransform.scale + canvasTransform.x),
          y: e.clientY - (y * canvasTransform.scale + canvasTransform.y)
        });
        return;
      }
    }
    
    // 일반 드래그 시작
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (x * canvasTransform.scale + canvasTransform.x),
      y: e.clientY - (y * canvasTransform.scale + canvasTransform.y)
    });
    
    // 드래그 시작 핸들러 호출
    if (onDragStart) {
      onDragStart(id);
    }
  };

  const handleMouseUp = useCallback(() => {
    const wasDragging = isDragging;
    
    if (mode === 'delete' && longPressTimer) {
      // 길게 클릭 취소 - 즉시 효과 해제
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setIsLongPressing(false);
      setPressProgress(0);
    }
    
    // 그룹 드래그 종료
    if (isMultiSelecting && isSelected && onEndGroupDrag) {
      onEndGroupDrag();
    }
    
    setIsDragging(false);
    
    // 드래그 종료 핸들러 호출
    if (wasDragging && onDragEnd) {
      onDragEnd(id);
    }
    
    // 리사이즈 종료
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
    }
  }, [mode, longPressTimer, isMultiSelecting, isSelected, onEndGroupDrag, isResizing, isDragging, onDragEnd, id]);

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (mode === 'delete' && longPressTimer) {
      // 마우스가 벗어나면 길게 클릭 취소
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setIsLongPressing(false);
    }
  };

  const handleMouseEnter = () => {
    if (mode === 'delete' || isHighlighted) {
      setIsHovered(true);
    }
    // 리사이즈 핸들 표시를 위한 hover 상태 (편집 모드가 아닐 때)
    if (!isEditing && mode !== 'delete') {
      setIsHovered(true);
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isResizing) {
      // 리사이즈 중
      const deltaX = (e.clientX - dragStart.x) / canvasTransform.scale;
      const deltaY = (e.clientY - dragStart.y) / canvasTransform.scale;
      
      let newWidth = initialSize.width;
      let newHeight = initialSize.height;
      let newX = x;
      let newY = y;
      
      // 리사이즈 핸들에 따라 크기 조정 (오른쪽과 아래만)
      if (resizeHandle === 'e' || resizeHandle === 'se') {
        // 오른쪽 핸들: 너비만 증가
        newWidth = Math.max(100, initialSize.width + deltaX);
      }
      if (resizeHandle === 's' || resizeHandle === 'se') {
        // 아래 핸들: 높이만 증가
        newHeight = Math.max(100, initialSize.height + deltaY);
      }
      
      onUpdate(id, { 
        x: newX, 
        y: newY, 
        width: newWidth, 
        height: newHeight, 
        text: currentText 
      });
      return;
    }
    
    if (!isDragging) return;
    
    // 줌 레벨을 고려한 정확한 좌표 계산
    const newX = (e.clientX - dragStart.x - canvasTransform.x) / canvasTransform.scale;
    const newY = (e.clientY - dragStart.y - canvasTransform.y) / canvasTransform.scale;
    
    // 그룹 드래그인 경우
    if (isMultiSelecting && isSelected && onUpdateGroupDrag) {
      onUpdateGroupDrag(id, newX, newY);
    } else {
      // 일반 드래그
      onUpdate(id, { x: newX, y: newY, text: currentText });
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, initialSize, id, x, y, currentText, onUpdate, canvasTransform, isMultiSelecting, isSelected, onUpdateGroupDrag]);


  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    onEditingChange(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 0);
  };

  const handleTextChange = (e) => {
    setCurrentText(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onEditingChange(false);
    
    // 빈 텍스트면 삭제 (단, 새로 생성된 메모가 아니거나 내용이 입력된 경우에만)
    if (!currentText || currentText.trim() === '') {
      // autoFocus가 true이고 아직 내용이 없으면 삭제하지 않음 (사용자가 입력할 수 있도록)
      // 하지만 blur가 발생했다는 것은 다른 곳을 클릭했다는 의미이므로 삭제
      onDelete(id);
      return;
    }
    
    onUpdate(id, { x, y, text: currentText });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      onEditingChange(false);
      
      // 빈 텍스트면 삭제
      if (!currentText || currentText.trim() === '') {
        onDelete(id);
        return;
      }
      
      onUpdate(id, { x, y, text: currentText });
    }
    if (e.key === 'Escape') {
      // 빈 텍스트면 삭제, 아니면 원래 텍스트로 복원
      if (!currentText || currentText.trim() === '') {
        onDelete(id);
      } else {
        setCurrentText(text);
      }
      setIsEditing(false);
      onEditingChange(false);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(id);
  };

  // 삭제 모드에서의 테두리 스타일 계산 (테두리 없이 그림자만) - useMemo로 메모이제이션
  const borderStyle = useMemo(() => {
    // 기본적으로 테두리 없음, 그림자만 사용
    const baseStyle = {
      border: 'none',
      boxShadow: 'var(--memo-shadow)'
    };
    
    if (isHighlighted) {
      if (isHovered) {
        return {
          ...baseStyle,
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
        };
      }
      return {
        ...baseStyle,
        boxShadow: '0 6px 20px rgba(220, 38, 38, 0.4)'
      };
    }
    
    // 다중 선택 상태
    if (isSelected) {
      return {
        ...baseStyle,
        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
      };
    }
    
    if (mode === 'delete') {
      if (isLongPressing) {
        // 진행률에 따라 그림자 강도 조절
        const shadowIntensity = pressProgress / 100;
        return {
          ...baseStyle,
          boxShadow: `0 ${4 + shadowIntensity * 12}px ${12 + shadowIntensity * 24}px rgba(220, 38, 38, ${0.2 + shadowIntensity * 0.4})`,
          transition: 'all 0.1s ease'
        };
      } else if (isHovered) {
        return {
          ...baseStyle,
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
        };
      }
    }
    
    return isDragging ? {
      ...baseStyle,
      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
    } : isEditing ? {
      ...baseStyle,
      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
    } : baseStyle;
  }, [isSelected, isHighlighted, mode, isHovered, isLongPressing, pressProgress, isDragging, isEditing]);

  // 리사이즈 핸들 렌더링 (오른쪽과 아래만)
  const renderResizeHandles = () => {
    if (isEditing || mode === 'delete') return null;
    
    // 선택되었거나 hover 상태일 때만 표시
    if (!isSelected && !isHovered) return null;
    
    // 오른쪽(e)과 아래(s) 핸들만 표시
    const handles = [
      { position: 's', cursor: 'ns-resize', style: { bottom: 0, left: 0, width: '100%', height: '20px' } },
      { position: 'e', cursor: 'ew-resize', style: { right: 0, top: 0, width: '20px', height: '100%' } },
      { position: 'se', cursor: 'nwse-resize', style: { bottom: 0, right: 0, width: '24px', height: '24px' } }
    ];
    
    return handles.map(handle => (
      <div
        key={handle.position}
        className="resize-handle"
        style={{
          position: 'absolute',
          cursor: handle.cursor,
          backgroundColor: isResizing && resizeHandle === handle.position ? 'var(--theme-primary)' : 'rgba(24, 160, 251, 0.3)',
          borderRadius: handle.position === 'se' ? '0 0 var(--memo-border-radius) 0' : '2px',
          zIndex: 10,
          transition: 'background-color 0.2s ease',
          ...handle.style
        }}
        onMouseDown={(e) => handleResizeStart(e, handle.position)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--theme-primary)';
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          if (!(isResizing && resizeHandle === handle.position)) {
            e.currentTarget.style.backgroundColor = 'rgba(24, 160, 251, 0.3)';
            e.currentTarget.style.opacity = '1';
          }
        }}
      />
    ));
  };

  return (
    <div
      ref={memoRef}
      className={`draggable-text absolute select-none ${
        isDragging ? 'shadow-xl' : ''
      }`}
      style={{
        left: x,
        top: y,
        width: `${currentWidth}px`,
        height: `${currentHeight}px`,
        backgroundColor: 'var(--memo-bg-color)',
        borderRadius: 'var(--memo-border-radius)',
        boxShadow: 'var(--memo-shadow)',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        // 드래그나 리사이즈, 클러스터 드래그 중이 아닐 때만 위치 애니메이션 적용
        transition: (isDragging || isResizing || isClusterDragging) 
          ? 'none' 
          : 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.1s ease',
        cursor: mode === 'delete' ? 'pointer' : (isResizing ? 'move' : 'move'),
        ...borderStyle
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
    >
      {renderResizeHandles()}
      <div style={{ 
        padding: '24px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden' // 부모에서 오버플로우 제어
      }}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={currentText}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              height: '100%',
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 'var(--memo-font-size)',
              fontWeight: 'var(--memo-font-weight)',
              color: '#000000',
              overflow: 'auto' // 내부 스크롤
            }}
            placeholder="텍스트를 입력하세요..."
            autoFocus
          />
        ) : (
          <div style={{
            fontSize: 'var(--memo-font-size)',
            fontWeight: 'var(--memo-font-weight)',
            color: '#000000',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            height: '100%',
            overflow: 'auto', // 내부 스크롤
            display: 'flex',
            alignItems: 'flex-start' // 위 정렬
          }}>
            {currentText || '더블클릭하여 편집'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableText;
