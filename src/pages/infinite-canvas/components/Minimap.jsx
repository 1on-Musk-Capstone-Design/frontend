import React, { useState, useEffect, useRef, useCallback } from 'react';

const Minimap = ({ 
  canvasAreas, 
  canvasTransform, 
  windowSize,
  onLocationClick,
  isClusteringPanelOpen = false 
}) => {
  const minimapRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 미니맵 크기
  const minimapWidth = 200;
  const minimapHeight = 150;
  const minimapMargin = 20;
  const minZoom = 0.05; // 최소 줌 레벨

  // 최소 줌에서 화면에 보이는 캔버스 영역 계산
  const getMinZoomViewport = () => {
    // 최소 줌에서 화면 크기를 캔버스 좌표로 변환
    const viewportWidth = windowSize.width / minZoom;
    const viewportHeight = windowSize.height / minZoom;

    // 현재 캔버스 중앙(0, 0)의 화면 위치를 기준으로
    // 최소 줌에서 화면 중앙이 가리키는 캔버스 좌표 계산
    // 현재 화면 중앙이 가리키는 캔버스 좌표
    const currentViewportX = -canvasTransform.x / canvasTransform.scale;
    const currentViewportY = -canvasTransform.y / canvasTransform.scale;

    // 최소 줌에서의 뷰포트 영역 (현재 보는 영역 중심)
    const minZoomViewportX = currentViewportX - viewportWidth / 2;
    const minZoomViewportY = currentViewportY - viewportHeight / 2;

    return {
      x: minZoomViewportX,
      y: minZoomViewportY,
      width: viewportWidth,
      height: viewportHeight
    };
  };

  const minZoomViewport = getMinZoomViewport();

  // 스케일 계산 (최소 줌 뷰포트를 미니맵에 맞추기)
  const scaleX = minimapWidth / minZoomViewport.width;
  const scaleY = minimapHeight / minZoomViewport.height;
  const scale = Math.min(scaleX, scaleY);

  // 현재 화면에 보이는 영역 계산
  const getViewportRect = () => {
    // 화면 크기를 캔버스 좌표로 변환
    const viewportWidth = windowSize.width / canvasTransform.scale;
    const viewportHeight = windowSize.height / canvasTransform.scale;

    // 화면 왼쪽 위 모서리가 가리키는 캔버스 좌표
    // canvasTransform.x, y는 캔버스 좌표 (0, 0)의 화면 위치
    // 따라서 화면 좌표 (0, 0)이 가리키는 캔버스 좌표는:
    const viewportX = -canvasTransform.x / canvasTransform.scale;
    const viewportY = -canvasTransform.y / canvasTransform.scale;

    return {
      x: viewportX,
      y: viewportY,
      width: viewportWidth,
      height: viewportHeight
    };
  };

  const viewport = getViewportRect();

  // 미니맵 내에서의 좌표 변환 (최소 줌 뷰포트 기준)
  const canvasToMinimap = useCallback((canvasX, canvasY) => {
    const relativeX = canvasX - minZoomViewport.x;
    const relativeY = canvasY - minZoomViewport.y;
    return {
      x: relativeX * scale,
      y: relativeY * scale
    };
  }, [minZoomViewport, scale]);

  // 뷰포트 사각형을 미니맵 좌표로 변환
  const viewportMinimapPos = canvasToMinimap(viewport.x, viewport.y);
  const viewportMinimapWidth = viewport.width * scale;
  const viewportMinimapHeight = viewport.height * scale;

  // 뷰포트를 미니맵 중앙에 고정하기 위한 오프셋 계산
  const viewportCenterX = minimapWidth / 2;
  const viewportCenterY = minimapHeight / 2;
  const viewportOffsetX = viewportCenterX - (viewportMinimapPos.x + viewportMinimapWidth / 2);
  const viewportOffsetY = viewportCenterY - (viewportMinimapPos.y + viewportMinimapHeight / 2);

  // 미니맵 클릭/드래그 처리
  const handleMinimapMouseDown = (e) => {
    if (!minimapRef.current) return;
    
    const rect = minimapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 뷰포트 오프셋을 고려하여 미니맵 좌표를 캔버스 좌표로 변환
    const relativeX = x - viewportOffsetX;
    const relativeY = y - viewportOffsetY;
    const canvasX = minZoomViewport.x + (relativeX / scale);
    const canvasY = minZoomViewport.y + (relativeY / scale);

    setIsDragging(true);
    setDragStart({ x, y });
    
    // 클릭한 위치로 이동
    if (onLocationClick) {
      onLocationClick({ x: canvasX, y: canvasY });
    }
  };

  useEffect(() => {
    const handleMinimapMouseMove = (e) => {
      if (!isDragging || !minimapRef.current) return;
      
      const rect = minimapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 뷰포트 오프셋 계산 (현재 뷰포트 위치 기준)
      const currentViewportPos = canvasToMinimap(viewport.x, viewport.y);
      const currentViewportWidth = viewport.width * scale;
      const currentViewportHeight = viewport.height * scale;
      const currentOffsetX = viewportCenterX - (currentViewportPos.x + currentViewportWidth / 2);
      const currentOffsetY = viewportCenterY - (currentViewportPos.y + currentViewportHeight / 2);

      // 뷰포트 오프셋을 고려하여 미니맵 좌표를 캔버스 좌표로 변환
      const relativeX = x - currentOffsetX;
      const relativeY = y - currentOffsetY;
      const canvasX = minZoomViewport.x + (relativeX / scale);
      const canvasY = minZoomViewport.y + (relativeY / scale);

      // 드래그 중 위치로 이동
      if (onLocationClick) {
        onLocationClick({ x: canvasX, y: canvasY });
      }
    };

    const handleMinimapMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMinimapMouseMove);
      document.addEventListener('mouseup', handleMinimapMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMinimapMouseMove);
        document.removeEventListener('mouseup', handleMinimapMouseUp);
      };
    }
  }, [isDragging, minZoomViewport, scale, onLocationClick, viewport, viewportCenterX, viewportCenterY, canvasToMinimap]);

  // 패널이 열려있으면 오른쪽 여백 조정
  const rightMargin = isClusteringPanelOpen ? 280 + minimapMargin : minimapMargin;

  return (
    <div
      ref={minimapRef}
      style={{
        position: 'fixed',
        bottom: minimapMargin,
        right: rightMargin,
        width: minimapWidth,
        height: minimapHeight,
        backgroundColor: 'rgba(183, 183, 183, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 10001,
        cursor: isDragging ? 'grabbing' : 'grab',
        overflow: 'hidden'
      }}
      onMouseDown={handleMinimapMouseDown}
    >
      {/* 최소 줌 뷰포트 내의 캔버스 영역들 표시 */}
      <svg
        width={minimapWidth}
        height={minimapHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {canvasAreas.map((area, index) => {
            const pos = canvasToMinimap(area.x, area.y);
            // 뷰포트가 중앙에 오도록 오프셋 적용
            const offsetX = pos.x + viewportOffsetX;
            const offsetY = pos.y + viewportOffsetY;
            const areaWidth = area.width * scale;
            const areaHeight = area.height * scale;
            
            // 미니맵 범위와 겹치는지 확인
            const rightEdge = offsetX + areaWidth;
            const bottomEdge = offsetY + areaHeight;
            
            if (rightEdge <= 0 || offsetX >= minimapWidth || 
                bottomEdge <= 0 || offsetY >= minimapHeight) {
              return null; // 미니맵 범위 밖
            }
            
            // 미니맵 범위 내에 있는 부분만 클리핑
            const clippedX = Math.max(0, offsetX);
            const clippedY = Math.max(0, offsetY);
            const clippedRight = Math.min(minimapWidth, rightEdge);
            const clippedBottom = Math.min(minimapHeight, bottomEdge);
            const clippedWidth = clippedRight - clippedX;
            const clippedHeight = clippedBottom - clippedY;
            
            if (clippedWidth > 0 && clippedHeight > 0) {
              return (
                <rect
                  key={index}
                  x={clippedX}
                  y={clippedY}
                  width={clippedWidth}
                  height={clippedHeight}
                  fill={area.isInitial ? '#ffffff' : '#f5f5f5'}
                  stroke="#e0e0e0"
                  strokeWidth={0.5}
                />
              );
            }
            return null;
          })}

        {/* 현재 뷰포트 영역 표시 (미니맵 중앙에 고정) */}
        <rect
          x={viewportCenterX - viewportMinimapWidth / 2}
          y={viewportCenterY - viewportMinimapHeight / 2}
          width={viewportMinimapWidth}
          height={viewportMinimapHeight}
          fill="rgba(1, 205, 21, 0.2)"
          stroke="#01cd15"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
      </svg>
    </div>
  );
};

export default Minimap;

