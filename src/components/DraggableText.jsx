import React, { useState, useRef, useCallback, useEffect } from 'react';

const DraggableText = ({ id, x, y, text, onUpdate, onDelete, canvasTransform, onSendToChat, onEditingChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const textareaRef = useRef(null);

  const handleMouseDown = (e) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (x * canvasTransform.scale + canvasTransform.x),
      y: e.clientY - (y * canvasTransform.scale + canvasTransform.y)
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    // 줌 레벨을 고려한 정확한 좌표 계산
    const newX = (e.clientX - dragStart.x - canvasTransform.x) / canvasTransform.scale;
    const newY = (e.clientY - dragStart.y - canvasTransform.y) / canvasTransform.scale;
    onUpdate(id, { x: newX, y: newY, text: currentText });
  }, [isDragging, dragStart, id, currentText, onUpdate, canvasTransform]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  return (
    <div
      className={`draggable-text absolute bg-white border-2 border-blue-300 rounded-lg shadow-lg cursor-move select-none ${
        isDragging ? 'shadow-xl border-blue-500' : ''
      } ${isEditing ? 'border-blue-500' : ''}`}
      style={{
        left: x,
        top: y,
        width: '300px',
        height: '150px',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.1s ease'
      }}
      onMouseDown={handleMouseDown}
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
