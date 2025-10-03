import React, { useState, useRef, useCallback, useEffect } from 'react';

const DraggableText = ({ id, x, y, text, onUpdate, onDelete, canvasTransform, onSendToChat, onEditingChange, mode, isHighlighted, isSelected, isMultiSelecting, onStartGroupDrag, onUpdateGroupDrag, onEndGroupDrag }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [pressProgress, setPressProgress] = useState(0);
  const textareaRef = useRef(null);

  const handleMouseDown = (e) => {
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
  };

  const handleMouseUp = useCallback(() => {
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
  }, [mode, longPressTimer, isMultiSelecting, isSelected, onEndGroupDrag]);

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
  };

  const handleMouseMove = useCallback((e) => {
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
  }, [isDragging, dragStart, id, currentText, onUpdate, canvasTransform, isMultiSelecting, isSelected, onUpdateGroupDrag]);


  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
    onUpdate(id, { x, y, text: currentText });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      onEditingChange(false);
      onUpdate(id, { x, y, text: currentText });
    }
    if (e.key === 'Escape') {
      setCurrentText(text);
      setIsEditing(false);
      onEditingChange(false);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(id);
  };

  // 삭제 모드에서의 테두리 스타일 계산
  const getBorderStyle = () => {
    console.log('DraggableText getBorderStyle', { id, isSelected, isHighlighted, mode });
    
    if (isHighlighted) {
      if (isHovered) {
        return {
          border: '12px solid #ef4444', // border-red-500
          borderColor: '#ef4444'
        };
      }
      return {
        border: '12px solid #dc2626', // border-red-600
        borderColor: '#dc2626'
      };
    }
    
    // 다중 선택 상태
    if (isSelected) {
      console.log('Text is selected, applying emerald border');
      return {
        border: '4px solid #10b981', // border-emerald-500
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
      };
    }
    
    if (mode === 'delete') {
      if (isLongPressing) {
        // 진행률에 따라 테두리 두께와 배경색 계산
        const minBorder = 4;
        const maxBorder = 20;
        const borderWidth = minBorder + (maxBorder - minBorder) * (pressProgress / 100);
        
        // 진행률이 80% 이상이면 전체 빨간색 효과
        const backgroundColor = pressProgress >= 80 ? 'rgba(220, 38, 38, 0.2)' : 'white';
        const borderColor = pressProgress >= 80 ? '#dc2626' : '#dc2626';
        
        return {
          border: `${borderWidth}px solid ${borderColor}`,
          borderColor: borderColor,
          backgroundColor: backgroundColor,
          transition: 'all 0.1s ease'
        };
      } else if (isHovered) {
        return {
          border: '8px solid #ef4444', // border-red-500
          borderColor: '#ef4444'
        };
      }
    }
    return isDragging ? {
      border: '4px solid #3b82f6', // border-blue-500
      borderColor: '#3b82f6'
    } : isEditing ? {
      border: '4px solid #3b82f6', // border-blue-500
      borderColor: '#3b82f6'
    } : {
      border: '4px solid #93c5fd', // border-blue-300
      borderColor: '#93c5fd'
    };
  };

  return (
    <div
      className={`draggable-text absolute bg-white rounded-lg shadow-lg select-none ${
        isDragging ? 'shadow-xl' : ''
      }`}
      style={{
        left: x,
        top: y,
        width: '300px',
        height: '150px',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.1s ease',
        cursor: mode === 'delete' ? 'pointer' : 'move',
        ...getBorderStyle()
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex justify-between items-center p-2 bg-blue-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">텍스트</span>
          <span className="text-xs text-gray-500 font-mono">
            ({Math.round(x)}, {Math.round(y)})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSendToChat(id, x, y, currentText)}
            className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-100 transition-colors"
            title="채팅으로 전송"
          >
            📤
          </button>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-xs"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="p-2">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={currentText}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none outline-none bg-transparent"
            placeholder="텍스트를 입력하세요..."
            autoFocus
          />
        ) : (
          <div className="min-h-[30px] whitespace-pre-wrap">
            {currentText || '더블클릭하여 편집'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableText;
