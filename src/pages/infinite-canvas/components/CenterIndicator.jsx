import React, { useState, useEffect, useMemo } from 'react';
import {
  CENTER_INDICATOR_CONSTANTS,
  PANEL_CONSTANTS,
  TOOLBAR_AREA_CONSTANTS,
  COMPUTED_CONSTANTS
} from '../constants';

const CenterIndicator = ({ canvasTransform, isChatPanelOpen = false, isClusteringPanelOpen = false, onCenterClick, canvasRef }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isHovered, setIsHovered] = useState(false);
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    const handleScroll = () => {
      if (canvasRef && canvasRef.current) {
        setScrollOffset({
          x: canvasRef.current.scrollLeft || 0,
          y: canvasRef.current.scrollTop || 0
        });
      }
    };

    window.addEventListener('resize', handleResize);
    if (canvasRef && canvasRef.current) {
      canvasRef.current.addEventListener('scroll', handleScroll);
      // 초기 스크롤 오프셋 설정
      handleScroll();
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvasRef && canvasRef.current) {
        canvasRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [canvasRef]);

  // 패널 너비
  const chatPanelWidth = PANEL_CONSTANTS.CHAT_PANEL_WIDTH;
  const clusteringPanelWidth = PANEL_CONSTANTS.CLUSTERING_PANEL_WIDTH;
  
  // 하단 툴바 높이
  const toolbarBottomOffset = TOOLBAR_AREA_CONSTANTS.TOOLBAR_BOTTOM_OFFSET;
  const toolbarHeight = TOOLBAR_AREA_CONSTANTS.TOOLBAR_HEIGHT;
  const toolbarTotalHeight = COMPUTED_CONSTANTS.TOOLBAR_TOTAL_HEIGHT;
  
  // 초록 공 크기
  const hoverAreaSize = CENTER_INDICATOR_CONSTANTS.HOVER_AREA_SIZE;

  // 위치 계산을 useMemo로 최적화하여 canvasTransform 변경 시 즉시 반영되도록 함
  const { dotPosition, isDefaultPositionVisible } = useMemo(() => {
    // canvas-container의 스크롤 오프셋과 위치 가져오기
    let containerOffsetX = 0;
    let containerOffsetY = 0;
    
    if (canvasRef && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      containerOffsetX = rect.left;
      containerOffsetY = rect.top;
    }

    // 사용 가능한 영역 계산
    const availableArea = {
      left: isChatPanelOpen ? chatPanelWidth : 0,
      right: isClusteringPanelOpen ? clusteringPanelWidth : 0,
      top: 0,
      bottom: 0
    };

    // 캔버스 중앙(0, 0)의 화면 좌표 계산
    // canvasTransform은 canvas-container 내부 좌표이므로, 실제 화면 좌표로 변환
    const canvasCenterScreenX = containerOffsetX + scrollOffset.x + canvasTransform.x;
    const canvasCenterScreenY = containerOffsetY + scrollOffset.y + canvasTransform.y;

    // 사용 가능한 영역 계산
    const availableWidth = windowSize.width - availableArea.left - availableArea.right;
    const availableHeight = windowSize.height;
    const screenCenterX = availableArea.left + availableWidth / 2;
    const screenCenterY = availableHeight / 2;

    // 기본 위치: 캔버스 중앙(0, 0)의 오른쪽 아래 (캔버스 좌표계에서 +100, +100)
    const defaultOffsetX = CENTER_INDICATOR_CONSTANTS.DEFAULT_OFFSET_X;
    const defaultOffsetY = CENTER_INDICATOR_CONSTANTS.DEFAULT_OFFSET_Y;
    
    // 기본 위치의 화면 좌표 계산
    // 캔버스 좌표를 화면 좌표로 변환: screenX = canvasTransform.x + canvasX * canvasTransform.scale
    // 줌 레벨이 변경되어도 캔버스 좌표계에서의 위치는 동일하므로, scale을 곱해서 화면 좌표로 변환
    const defaultScreenX = canvasCenterScreenX + defaultOffsetX * canvasTransform.scale;
    const defaultScreenY = canvasCenterScreenY + defaultOffsetY * canvasTransform.scale;

    // 하단 툴바 영역 계산 (중앙 하단)
    const toolbarLeft = windowSize.width / 2 - TOOLBAR_AREA_CONSTANTS.TOOLBAR_WIDTH_ESTIMATE;
    const toolbarRight = windowSize.width / 2 + TOOLBAR_AREA_CONSTANTS.TOOLBAR_WIDTH_ESTIMATE;
    const toolbarTop = windowSize.height - toolbarTotalHeight;
    const toolbarBottom = windowSize.height;

    // 초록 공이 하단 툴바와 겹치는지 확인하는 함수
    const isOverlappingWithToolbar = (x, y, size = hoverAreaSize / 2) => {
      return x + size >= toolbarLeft &&
             x - size <= toolbarRight &&
             y + size >= toolbarTop &&
             y - size <= toolbarBottom;
    };

    // 기본 위치가 화면 안에 있고 하단 툴바와 겹치지 않는지 확인
    const margin = CENTER_INDICATOR_CONSTANTS.VISIBILITY_MARGIN;
    const isDefaultPositionVisible = 
      defaultScreenX >= availableArea.left + margin &&
      defaultScreenX <= availableArea.left + availableWidth - margin &&
      defaultScreenY >= margin &&
      defaultScreenY <= windowSize.height - margin &&
      !isOverlappingWithToolbar(defaultScreenX, defaultScreenY);

    // 화면 중앙에서 캔버스 중앙으로의 방향 벡터 (모서리 위치 계산용)
    const dx = canvasCenterScreenX - screenCenterX;
    const dy = canvasCenterScreenY - screenCenterY;

    // 화면 가장자리에서 점 위치 계산 (기본 위치가 화면 밖일 때 사용)
    const getEdgePosition = () => {
      const edgeMargin = CENTER_INDICATOR_CONSTANTS.EDGE_MARGIN;
      const dotRadius = hoverAreaSize / 2;
      
      // 기본 화면 경계 (UI 영역 제외하지 않음)
      const baseMaxX = availableArea.left + availableWidth - edgeMargin;
      const baseMaxY = windowSize.height - edgeMargin;
      const baseMinX = availableArea.left + edgeMargin;
      const baseMinY = edgeMargin;

      // 방향 벡터 정규화
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) {
        // 중앙 위치에서 툴바와 겹치지 않는 위치 찾기
        let safeX = screenCenterX;
        let safeY = screenCenterY;
        if (isOverlappingWithToolbar(safeX, safeY)) {
          // 툴바 위로 이동
          safeY = toolbarTop - dotRadius - edgeMargin;
        }
        return { x: safeX, y: safeY };
      }
      
      const normalizedDx = dx / length;
      const normalizedDy = dy / length;

      // X 좌표에 따라 하단 제한 결정 (하단 툴바만 피함)
      const getMaxYForX = (x) => {
        // 툴바 영역이면 툴바 위로
        if (x + dotRadius >= toolbarLeft && x - dotRadius <= toolbarRight) {
          return toolbarTop - dotRadius - edgeMargin;
        }
        // 나머지 영역은 화면 하단까지 가능
        return baseMaxY;
      };

      // 사용 가능한 영역의 중앙에서 각 가장자리까지의 거리 계산
      const distances = {
        right: dx > 0 ? (baseMaxX - screenCenterX) / normalizedDx : Infinity,
        left: dx < 0 ? (baseMinX - screenCenterX) / normalizedDx : Infinity,
        bottom: dy > 0 ? (baseMaxY - screenCenterY) / normalizedDy : Infinity,
        top: dy < 0 ? (baseMinY - screenCenterY) / normalizedDy : Infinity
      };

      // 가장 가까운 가장자리 찾기
      const minDistance = Math.min(
        distances.right,
        distances.left,
        distances.bottom,
        distances.top
      );

      // 가장 가까운 가장자리에서의 위치 계산
      let edgeX = screenCenterX + normalizedDx * minDistance;
      let edgeY = screenCenterY + normalizedDy * minDistance;

      // 하단 툴바 영역을 피하도록 조정
      const maxYForX = getMaxYForX(edgeX);
      
      // 범위 내로 제한 (하단 툴바 영역 고려)
      edgeX = Math.max(baseMinX, Math.min(baseMaxX, edgeX));
      edgeY = Math.max(baseMinY, Math.min(maxYForX, edgeY));

      // 여전히 툴바와 겹치면 추가 조정
      if (isOverlappingWithToolbar(edgeX, edgeY)) {
        // 툴바 위로 이동
        edgeY = toolbarTop - dotRadius - edgeMargin;
        edgeX = Math.max(baseMinX, Math.min(baseMaxX, edgeX));
      }

      return { x: edgeX, y: edgeY };
    };

    // 위치 결정: 기본 위치가 화면 안에 있으면 기본 위치, 아니면 모서리
    const dotPosition = isDefaultPositionVisible 
      ? { x: defaultScreenX, y: defaultScreenY }
      : getEdgePosition();

    return { dotPosition, isDefaultPositionVisible };
  }, [canvasTransform.x, canvasTransform.y, canvasTransform.scale, windowSize.width, windowSize.height, isChatPanelOpen, isClusteringPanelOpen, hoverAreaSize, canvasRef, scrollOffset.x, scrollOffset.y]);

  // 작은 초록색 점
  const dotSize = CENTER_INDICATOR_CONSTANTS.DOT_SIZE;
  const hoverScale = CENTER_INDICATOR_CONSTANTS.HOVER_SCALE;

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
        zIndex: CENTER_INDICATOR_CONSTANTS.Z_INDEX,
        opacity: 1,
        willChange: 'left, top',
        cursor: 'pointer',
        width: `${hoverAreaSize}px`,
        height: `${hoverAreaSize}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: isDefaultPositionVisible 
          ? `left ${CENTER_INDICATOR_CONSTANTS.TRANSITION_DURATION} ${CENTER_INDICATOR_CONSTANTS.TRANSITION_TIMING}, top ${CENTER_INDICATOR_CONSTANTS.TRANSITION_DURATION} ${CENTER_INDICATOR_CONSTANTS.TRANSITION_TIMING}` 
          : 'none'
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
          backgroundColor: CENTER_INDICATOR_CONSTANTS.DOT_COLOR,
          boxShadow: CENTER_INDICATOR_CONSTANTS.DOT_SHADOW,
          transform: `scale(${isHovered ? hoverScale : 1})`,
          transition: `transform ${CENTER_INDICATOR_CONSTANTS.HOVER_TRANSITION_DURATION} ${CENTER_INDICATOR_CONSTANTS.HOVER_TRANSITION_TIMING}`,
          willChange: 'transform'
        }}
      />
    </div>
  );
};

export default CenterIndicator;

