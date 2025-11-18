import React, { useState, useEffect } from 'react';

const CenterIndicator = ({ canvasTransform, isChatPanelOpen = false, isClusteringPanelOpen = false, onCenterClick }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 패널 너비 (CSS 변수와 동일하게)
  const chatPanelWidth = 280;
  const clusteringPanelWidth = 280;

  // 사용 가능한 영역 계산
  const availableArea = {
    left: isChatPanelOpen ? chatPanelWidth : 0,
    right: isClusteringPanelOpen ? clusteringPanelWidth : 0,
    top: 0,
    bottom: 0
  };

  // 캔버스 중앙(0, 0)의 화면 좌표 계산
  const canvasCenterScreenX = canvasTransform.x;
  const canvasCenterScreenY = canvasTransform.y;

  // 사용 가능한 영역 계산
  const availableWidth = windowSize.width - availableArea.left - availableArea.right;
  const availableHeight = windowSize.height;
  const screenCenterX = availableArea.left + availableWidth / 2;
  const screenCenterY = availableHeight / 2;

  // 기본 위치: 캔버스 중앙(0, 0)의 오른쪽 아래 (캔버스 좌표계에서 +100, +100)
  const defaultOffsetX = 100; // 캔버스 좌표계에서 오른쪽으로 100px
  const defaultOffsetY = 100; // 캔버스 좌표계에서 아래로 100px
  
  // 기본 위치의 화면 좌표 계산
  // 캔버스 좌표를 화면 좌표로 변환: screenX = canvasTransform.x + canvasX * canvasTransform.scale
  const defaultScreenX = canvasCenterScreenX + defaultOffsetX * canvasTransform.scale;
  const defaultScreenY = canvasCenterScreenY + defaultOffsetY * canvasTransform.scale;

  // 기본 위치가 화면 안에 있는지 확인
  const margin = 20; // 여유 공간
  const isDefaultPositionVisible = 
    defaultScreenX >= availableArea.left + margin &&
    defaultScreenX <= availableArea.left + availableWidth - margin &&
    defaultScreenY >= margin &&
    defaultScreenY <= availableHeight - margin;

  // 화면 중앙에서 캔버스 중앙으로의 방향 벡터 (모서리 위치 계산용)
  const dx = canvasCenterScreenX - screenCenterX;
  const dy = canvasCenterScreenY - screenCenterY;

  // 화면 가장자리에서 점 위치 계산 (기본 위치가 화면 밖일 때 사용)
  const getEdgePosition = () => {
    const edgeMargin = 30; // 가장자리에서의 여백
    const maxX = availableArea.left + availableWidth - edgeMargin;
    const maxY = availableHeight - edgeMargin;
    const minX = availableArea.left + edgeMargin;
    const minY = edgeMargin;

    // 방향 벡터 정규화
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return { x: screenCenterX, y: screenCenterY };
    
    const normalizedDx = dx / length;
    const normalizedDy = dy / length;

    // 사용 가능한 영역의 중앙에서 각 가장자리까지의 거리 계산
    const distances = {
      right: dx > 0 ? (maxX - screenCenterX) / normalizedDx : Infinity,
      left: dx < 0 ? (minX - screenCenterX) / normalizedDx : Infinity,
      bottom: dy > 0 ? (maxY - screenCenterY) / normalizedDy : Infinity,
      top: dy < 0 ? (minY - screenCenterY) / normalizedDy : Infinity
    };

    // 가장 가까운 가장자리 찾기
    const minDistance = Math.min(
      distances.right,
      distances.left,
      distances.bottom,
      distances.top
    );

    // 가장 가까운 가장자리에서의 위치 계산
    const edgeX = screenCenterX + normalizedDx * minDistance;
    const edgeY = screenCenterY + normalizedDy * minDistance;

    // 범위 내로 제한
    const clampedX = Math.max(minX, Math.min(maxX, edgeX));
    const clampedY = Math.max(minY, Math.min(maxY, edgeY));

    return { x: clampedX, y: clampedY };
  };

  // 위치 결정: 기본 위치가 화면 안에 있으면 기본 위치, 아니면 모서리
  const dotPosition = isDefaultPositionVisible 
    ? { x: defaultScreenX, y: defaultScreenY }
    : getEdgePosition();

  // 작은 초록색 점
  const dotSize = 8;
  const hoverScale = 1.5; // 호버 시 크기 증가 배율
  const hoverAreaSize = 40; // 호버 감지 영역 크기

  const handleClick = (e) => {
    e.stopPropagation();
    if (onCenterClick) {
      onCenterClick({ x: 0, y: 0 }); // 캔버스 중앙(0, 0)으로 이동
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${dotPosition.x}px`,
        top: `${dotPosition.y}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto',
        zIndex: 10000,
        opacity: 1,
        willChange: 'left, top, transform',
        cursor: 'pointer',
        width: `${hoverAreaSize}px`,
        height: `${hoverAreaSize}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          borderRadius: '50%',
          backgroundColor: '#01cd15',
          boxShadow: '0 2px 8px rgba(1, 205, 21, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.8)',
          transform: `scale(${isHovered ? hoverScale : 1})`,
          transition: 'transform 0.2s ease-out',
          willChange: 'transform'
        }}
      />
    </div>
  );
};

export default CenterIndicator;

