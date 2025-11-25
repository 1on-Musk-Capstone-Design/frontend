import React, { useState, useEffect } from 'react';
import DraggableText from './DraggableText';
import { CANVAS_AREA_CONSTANTS } from '../constants';

const CanvasArea = ({ canvasAreas, canvasTransform, texts, updateText, deleteText, handleSendToChat, setIsTextEditing, mode, onCanvasAreaDelete, highlightedTextIds, onHighlightTextsInArea, onCanvasMouseDown, onCanvasMouseMove, onCanvasMouseUp, selectedTextIds, isMultiSelecting, selectionArea, onStartGroupDrag, onUpdateGroupDrag, onEndGroupDrag, isAnimating = false, showGrid = false, clusterShapes = [], onClusterDragStart, onClusterDrag, onClusterDragEnd, draggingCluster, onTextDragStart, onTextDragEnd, onTextResizeStart, onTextResizeEnd, newlyCreatedTextId }) => {
  // 클러스터 드래그 중인 텍스트 ID 집합
  const draggingClusterTextIds = draggingCluster ? new Set(draggingCluster.textIds || []) : new Set();
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
    
    // 클러스터 영역인 경우 테두리 색상 표시
    if (area && area.isClusterArea && area.borderColor) {
      return {
        border: `3px solid ${area.borderColor}`,
        borderColor: area.borderColor
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
      onMouseDown={(e) => {
        // 클러스터 드래그가 아닐 때만 캔버스 이벤트 처리
        const isClusterShape = e.target.closest('[data-cluster-shape]');
        if (!isClusterShape) {
          onCanvasMouseDown(e);
        }
      }}
      onMouseMove={(e) => {
        // 클러스터 드래그 중이면 클러스터 드래그 처리
        if (draggingCluster && onClusterDrag) {
          onClusterDrag(e);
        } else {
          onCanvasMouseMove(e);
        }
      }}
      onMouseUp={(e) => {
        // 클러스터 드래그 종료
        if (draggingCluster && onClusterDragEnd) {
          onClusterDragEnd();
        } else {
          onCanvasMouseUp(e);
        }
      }}
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
      
      {/* 클러스터 도형들 렌더링 (div로 테두리 그리기) */}
      {clusterShapes && clusterShapes.length > 0 && clusterShapes.map((shape, index) => {
        const { bounds, borderColor, backgroundColor, representativeText, centroid } = shape;
        const cornerRadius = 10; // 둥근 모서리 반경
        const isDragging = draggingCluster && draggingCluster.clusterId === shape.clusterId;
        
        // 드래그 중이면 이동된 위치 사용
        const displayX = isDragging ? draggingCluster.bounds.minX : bounds.minX;
        const displayY = isDragging ? draggingCluster.bounds.minY : bounds.minY;
        
        // centroid 위치 계산 (드래그 중이면 draggingCluster의 centroid 사용)
        const centroidX = isDragging && draggingCluster.centroid 
          ? draggingCluster.centroid.x 
          : (centroid ? centroid.x : null);
        const centroidY = isDragging && draggingCluster.centroid 
          ? draggingCluster.centroid.y 
          : (centroid ? centroid.y : null);
        
        return (
          <React.Fragment key={`cluster-${shape.clusterId}-${index}`}>
            {/* 클러스터 배경 (반투명 배경색) */}
            {backgroundColor && (
              <div
                data-cluster-shape={shape.clusterId}
                style={{
                  position: 'absolute',
                  left: displayX,
                  top: displayY,
                  width: bounds.width,
                  height: bounds.height,
                  backgroundColor: backgroundColor,
                  borderRadius: `${cornerRadius}px`,
                  pointerEvents: 'none',
                  zIndex: 99,
                  boxSizing: 'border-box',
                  transition: isDragging 
                    ? 'none' 
                    : 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            )}
            
            {/* 클러스터 중심점 표시 */}
            {centroidX !== null && centroidY !== null && (
              <div
                style={{
                  position: 'absolute',
                  left: centroidX - 8,
                  top: centroidY - 8,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: borderColor,
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  pointerEvents: 'none',
                  zIndex: 101,
                  transition: isDragging 
                    ? 'none' 
                    : 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            )}
            
            {/* 대표 텍스트 표시 (도형 위에) */}
            {representativeText && (
              <div
                data-cluster-shape={shape.clusterId}
                style={{
                  position: 'absolute',
                  left: displayX + 8,
                  top: displayY - 40,
                  maxWidth: bounds.width - 16,
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: `3px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  pointerEvents: mode === 'move' ? 'auto' : 'none',
                  zIndex: 102,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                  minWidth: '120px',
                  cursor: mode === 'move' ? 'move' : 'default',
                  // 대표 텍스트도 애니메이션 적용
                  transition: isDragging 
                    ? 'none' 
                    : 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                title={representativeText}
                onMouseDown={(e) => {
                  if (mode === 'move' && onClusterDragStart) {
                    e.preventDefault();
                    e.stopPropagation();
                    onClusterDragStart(shape, e);
                  }
                }}
              >
                {representativeText}
              </div>
            )}
            
            {/* 클러스터 도형 테두리 (시각적 표시만, 클릭 불가) */}
            <div
              data-cluster-shape={shape.clusterId}
              style={{
                position: 'absolute',
                left: displayX,
                top: displayY,
                width: bounds.width,
                height: bounds.height,
                border: `3px solid ${borderColor}`,
                borderRadius: `${cornerRadius}px`,
                pointerEvents: 'none', // 도형은 클릭 불가, 대표 텍스트만 드래그 가능
                zIndex: 100,
                boxSizing: 'border-box',
                backgroundColor: 'transparent',
                // 클러스터 도형도 애니메이션 적용
                transition: isDragging 
                  ? 'none' 
                  : 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </React.Fragment>
        );
      })}
      
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
          isClusterDragging={draggingClusterTextIds.has(text.id)}
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
          onDragStart={onTextDragStart}
          onDragEnd={onTextDragEnd}
          onResizeStart={onTextResizeStart}
          onResizeEnd={onTextResizeEnd}
          autoFocus={newlyCreatedTextId === text.id}
        />
      ))}
    </div>
  );
};

export default CanvasArea;
