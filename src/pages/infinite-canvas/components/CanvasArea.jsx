import React, { useState, useEffect } from 'react';
import DraggableText from './DraggableText';
import { CANVAS_AREA_CONSTANTS } from '../constants';

const CanvasArea = ({ canvasAreas, canvasTransform, texts, updateText, deleteText, handleSendToChat, setIsTextEditing, mode, onCanvasAreaDelete, highlightedTextIds, onHighlightTextsInArea, onCanvasMouseDown, onCanvasMouseMove, onCanvasMouseUp, selectedTextIds, isMultiSelecting, selectionArea, onStartGroupDrag, onUpdateGroupDrag, onEndGroupDrag, isAnimating = false, showGrid = false }) => {
  const [hoveredAreaIndex, setHoveredAreaIndex] = useState(null);
  const [longPressingAreaIndex, setLongPressingAreaIndex] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [pressProgress, setPressProgress] = useState(0);

  // 모드가 변경될 때 삭제 모드 관련 상태 초기화
  useEffect(() => {
    if (mode !== 'delete') {
      // 삭제 모드가 아닐 때 모든 삭제 관련 상태 초기화
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setHoveredAreaIndex(null);
      setLongPressingAreaIndex(null);
      setPressProgress(0);
      // 하이라이트 해제
      if (onHighlightTextsInArea) {
        onHighlightTextsInArea(null);
      }
    }
  }, [mode]);

  const handleAreaMouseDown = (areaIndex, e) => {
    const area = canvasAreas[areaIndex];
    // 처음 생성된 캔버스는 삭제 불가능
    if (area && area.isInitial) {
      return;
    }
    
    if (mode === 'delete' && canvasAreas.length > 1) {
      setLongPressingAreaIndex(areaIndex);
      setPressProgress(0);
      
      // 진행률 업데이트를 위한 인터벌
      const progressUpdateInterval = CANVAS_AREA_CONSTANTS.DELETE_PROGRESS_UPDATE_INTERVAL;
      const totalDuration = CANVAS_AREA_CONSTANTS.DELETE_LONG_PRESS_DURATION;
      const progressSteps = totalDuration / progressUpdateInterval;
      
      const progressInterval = setInterval(() => {
        setPressProgress(prev => {
          const newProgress = prev + 100 / progressSteps;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, progressUpdateInterval);
      
      const timer = setTimeout(() => {
        // 즉시 삭제 (하이라이트 효과 없이)
        onCanvasAreaDelete(areaIndex);
        setLongPressingAreaIndex(null);
        setPressProgress(0);
        clearInterval(progressInterval);
      }, totalDuration);
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
    const area = canvasAreas[areaIndex];
    
    // 삭제 모드일 때는 삭제 관련 스타일 우선
    if (mode === 'delete') {
      if (longPressingAreaIndex === areaIndex) {
        // 진행률에 따라 테두리 두께와 배경색 계산
        const minBorder = CANVAS_AREA_CONSTANTS.DELETE_BORDER_MIN;
        const maxBorder = CANVAS_AREA_CONSTANTS.DELETE_BORDER_MAX;
        const borderWidth = minBorder + (maxBorder - minBorder) * (pressProgress / 100);
        
        // 진행률이 임계값 이상이면 전체 빨간색 효과
        const backgroundColor = pressProgress >= CANVAS_AREA_CONSTANTS.DELETE_WARNING_THRESHOLD ? 'rgba(220, 38, 38, 0.2)' : 'white';
        const borderColor = pressProgress >= CANVAS_AREA_CONSTANTS.DELETE_WARNING_THRESHOLD ? '#dc2626' : '#dc2626';
        
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
      return {
        border: 'none'
      };
    }
    
    // 격자 보기가 켜져있을 때 테두리 표시
    if (showGrid) {
      // 처음 생성된 캔버스는 연한 테두리
      if (area && area.isInitial) {
        return {
          border: '1px solid rgba(0, 0, 0, 0.2)'
        };
      }
      // 일반 캔버스는 조금 더 진한 테두리
      return {
        border: '1px solid rgba(0, 0, 0, 0.25)'
      };
    }
    
    // 기본값: 테두리 없음
    return {
      border: 'none'
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
            backgroundColor: 'var(--canvas-bg-color)',
            backgroundImage: 'none',
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
          className="absolute pointer-events-none"
          style={{
            left: Math.min(selectionArea.startX, selectionArea.endX),
            top: Math.min(selectionArea.startY, selectionArea.endY),
            width: Math.abs(selectionArea.endX - selectionArea.startX),
            height: Math.abs(selectionArea.endY - selectionArea.startY),
            border: '2px solid var(--theme-primary)',
            backgroundColor: 'rgba(24, 160, 251, 0.1)',
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
          width={text.width}
          height={text.height}
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
