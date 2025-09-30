import React, { useState } from 'react';
import DraggableText from './DraggableText';

const CanvasArea = ({ canvasAreas, canvasTransform, texts, updateText, deleteText, handleSendToChat, setIsTextEditing, mode, onCanvasAreaDelete, highlightedTextIds, onHighlightTextsInArea, onCanvasMouseDown, onCanvasMouseMove, onCanvasMouseUp, selectedTextIds, isMultiSelecting, selectionArea, onStartGroupDrag, onUpdateGroupDrag, onEndGroupDrag }) => {
  const [hoveredAreaIndex, setHoveredAreaIndex] = useState(null);
  const [longPressingAreaIndex, setLongPressingAreaIndex] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [pressProgress, setPressProgress] = useState(0);

  const handleAreaMouseDown = (areaIndex, e) => {
    if (mode === 'delete' && canvasAreas.length > 1) {
      setLongPressingAreaIndex(areaIndex);
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
        onCanvasAreaDelete(areaIndex);
        setLongPressingAreaIndex(null);
        setPressProgress(0);
        clearInterval(progressInterval);
      }, 1500);
      setLongPressTimer(timer);
    }
  };

  const handleAreaMouseUp = () => {
    if (longPressTimer) {
      // 길게 클릭 취소 - 즉시 효과 해제
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setLongPressingAreaIndex(null);
      setPressProgress(0);
    }
  };

  const handleAreaMouseEnter = (areaIndex) => {
    if (mode === 'delete') {
      setHoveredAreaIndex(areaIndex);
      // 해당 영역의 텍스트 필드들을 하이라이트
      const area = canvasAreas[areaIndex];
      onHighlightTextsInArea(area);
    }
  };

  const handleAreaMouseLeave = () => {
    setHoveredAreaIndex(null);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setLongPressingAreaIndex(null);
    }
    // 마우스가 벗어날 때 하이라이트 해제
    if (mode === 'delete') {
      onHighlightTextsInArea(null); // null을 전달하여 하이라이트 해제
    }
  };

  const getAreaBorderStyle = (areaIndex) => {
    if (mode === 'delete') {
      if (longPressingAreaIndex === areaIndex) {
        // 진행률에 따라 테두리 두께와 배경색 계산 (6px ~ 24px)
        const minBorder = 6;
        const maxBorder = 24;
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
      } else if (hoveredAreaIndex === areaIndex) {
        return {
          border: '8px solid #ef4444', // border-red-500
          borderColor: '#ef4444'
        };
      }
    }
    return {
      border: '6px solid #d1d5db', // border-gray-300
      borderColor: '#d1d5db'
    };
  };

  return (
    <div
      style={{
        transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
        transformOrigin: '0 0',
        position: 'relative'
      }}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onCanvasMouseMove}
      onMouseUp={onCanvasMouseUp}
    >
      {/* 캔버스 영역들 렌더링 */}
      {canvasAreas.map((area, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: area.x,
            top: area.y,
            width: area.width,
            height: area.height,
            backgroundColor: 'white',
            boxShadow: '0 0 0 1px #9ca3af',
            backgroundImage: `
              radial-gradient(circle, rgba(156, 163, 175, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0',
            cursor: mode === 'delete' ? 'pointer' : 'default',
            transition: 'border-color 0.2s ease',
            ...getAreaBorderStyle(index)
          }}
          onMouseDown={(e) => handleAreaMouseDown(index, e)}
          onMouseUp={handleAreaMouseUp}
          onMouseEnter={() => handleAreaMouseEnter(index)}
          onMouseLeave={handleAreaMouseLeave}
        />
      ))}
      
      {/* 영역 선택 표시 */}
      {selectionArea && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-200/20 pointer-events-none"
          style={{
            left: Math.min(selectionArea.startX, selectionArea.endX),
            top: Math.min(selectionArea.startY, selectionArea.endY),
            width: Math.abs(selectionArea.endX - selectionArea.startX),
            height: Math.abs(selectionArea.endY - selectionArea.startY),
            zIndex: 1000
          }}
        />
      )}
      
      {texts.map(text => (
        <DraggableText
          key={text.id}
          id={text.id}
          x={text.x}
          y={text.y}
          text={text.text}
          onUpdate={updateText}
          onDelete={deleteText}
          canvasTransform={canvasTransform}
          onSendToChat={handleSendToChat}
          onEditingChange={setIsTextEditing}
          mode={mode}
          isHighlighted={highlightedTextIds.includes(text.id)}
          isSelected={selectedTextIds.includes(text.id)}
          isMultiSelecting={isMultiSelecting}
          onStartGroupDrag={onStartGroupDrag}
          onUpdateGroupDrag={onUpdateGroupDrag}
          onEndGroupDrag={onEndGroupDrag}
        />
      ))}
    </div>
  );
};

export default CanvasArea;
