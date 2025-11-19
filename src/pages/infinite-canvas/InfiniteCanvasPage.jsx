import React, { useState, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import ClusteringPanel from './components/ClusteringPanel';
import DraggableText from './components/DraggableText';
import FloatingToolbar from './components/FloatingToolbar';
import CanvasArea from './components/CanvasArea';
import CenterIndicator from './components/CenterIndicator';
import Minimap from './components/Minimap';
import { useCanvas } from './hooks/useCanvas';
import { useKeyboard } from './hooks/useKeyboard';
import { useTextFields } from './hooks/useTextFields';
import { useSession } from './hooks/useSession';
import { CANVAS_AREA_CONSTANTS, CLUSTERING_LAYOUT_CONSTANTS } from './constants';
import './styles/canvas.css';

// 메인 무한 캔버스 컴포넌트
const InfiniteCanvasPage = () => {
  const [mode, setMode] = useState('text'); // 'text' 또는 'move'
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true);
  const [isClusteringPanelOpen, setIsClusteringPanelOpen] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showCenterIndicator, setShowCenterIndicator] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [lastClusteringState, setLastClusteringState] = useState(null); // 클러스터링 이전 상태 저장
  const [clusterShapes, setClusterShapes] = useState([]); // 클러스터 도형 정보 저장
  const [draggingCluster, setDraggingCluster] = useState(null); // 드래그 중인 클러스터 정보
  const [clusterDragStart, setClusterDragStart] = useState({ x: 0, y: 0 }); // 클러스터 드래그 시작 위치
  
  // 커스텀 훅들 사용
  const canvas = useCanvas();
  const textFields = useTextFields();
  const session = useSession();

  // 윈도우 크기 추적
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
  
  // 키보드 단축키 설정
  useKeyboard(setMode, textFields.isTextEditing);

  // 브라우저 줌 완전 차단 - 피그마 스타일
  useEffect(() => {
    // 터치 제스처 줌 차단
    const preventGestureZoom = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 키보드 줌 차단 (Ctrl/Cmd + +/-)
    const preventKeyboardZoom = (e) => {
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0' || 
           e.keyCode === 187 || e.keyCode === 189 || e.keyCode === 48 || 
           e.keyCode === 61 || e.keyCode === 107 || e.keyCode === 109)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 휠 이벤트에서 Ctrl/Cmd + 휠일 때만 캔버스 줌 허용, 나머지는 브라우저 줌 차단
    const preventWheelZoom = (e) => {
      // Ctrl/Cmd + 휠은 useCanvas에서 처리하므로 기본 동작만 차단
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 터치 줌 차단 (핀치 줌)
    const preventTouchZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 모든 줌 관련 이벤트 차단
    document.addEventListener('keydown', preventKeyboardZoom, { passive: false });
    document.addEventListener('gesturestart', preventGestureZoom, { passive: false });
    document.addEventListener('gesturechange', preventGestureZoom, { passive: false });
    document.addEventListener('gestureend', preventGestureZoom, { passive: false });
    document.addEventListener('wheel', preventWheelZoom, { passive: false });
    document.addEventListener('touchstart', preventTouchZoom, { passive: false });
    document.addEventListener('touchmove', preventTouchZoom, { passive: false });
    document.addEventListener('touchend', preventTouchZoom, { passive: false });

    // 추가: CSS zoom 속성 강제 고정
    const enforceZoom = () => {
      if (document.documentElement.style.zoom !== '1') {
        document.documentElement.style.zoom = '1';
      }
      if (document.body.style.zoom !== '1') {
        document.body.style.zoom = '1';
      }
    };

    // 주기적으로 zoom 속성 확인 및 강제
    const zoomCheckInterval = setInterval(enforceZoom, 100);

    return () => {
      document.removeEventListener('keydown', preventKeyboardZoom);
      document.removeEventListener('gesturestart', preventGestureZoom);
      document.removeEventListener('gesturechange', preventGestureZoom);
      document.removeEventListener('gestureend', preventGestureZoom);
      document.removeEventListener('wheel', preventWheelZoom);
      document.removeEventListener('touchstart', preventTouchZoom);
      document.removeEventListener('touchmove', preventTouchZoom);
      document.removeEventListener('touchend', preventTouchZoom);
      clearInterval(zoomCheckInterval);
    };
  }, []);

  const handleCanvasClick = (e) => {
    if (mode === 'text') {
      // 텍스트 모드: 텍스트 필드 생성
      const clickResult = canvas.handleCanvasClick(e, mode, canvas.canvasAreas);
      if (clickResult) {
        textFields.addText(clickResult.x, clickResult.y);
      }
    } else if (mode === 'move' && !e.shiftKey && !canvas.hasStartedAreaSelection) {
      // 이동 모드 (Shift 없음, 영역 선택 시작 안됨): 빈 공간 클릭 시에만 선택 해제
      // 텍스트 필드가 아닌 빈 공간을 클릭했을 때만 선택 해제
      if (e.target === canvas.canvasRef.current || 
          (canvas.canvasRef.current && canvas.canvasRef.current.contains(e.target) && 
           !e.target.closest('.draggable-text'))) {
        textFields.clearSelection();
      }
    }
    // 삭제 모드에서는 CanvasArea에서 길게 클릭으로만 삭제
  };

  const handleCanvasMouseDown = (e) => {
    if (mode === 'move' && e.shiftKey) {
      // 이동 모드 + Shift: 영역 선택 시작
      canvas.startAreaSelection(e);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (mode === 'move' && canvas.isAreaSelecting) {
      // 영역 선택이 시작된 후에는 Shift 키 상태와 관계없이 계속 업데이트
      canvas.updateAreaSelection(e);
    }
    // 클러스터 드래그는 CanvasArea에서 처리
  };

  const handleCanvasMouseUp = (e) => {
    console.log('handleCanvasMouseUp called', {
      mode,
      hasStartedAreaSelection: canvas.hasStartedAreaSelection,
      isAreaSelecting: canvas.isAreaSelecting
    });
    
    // 클러스터 드래그는 CanvasArea에서 처리
    
    if (mode === 'move' && canvas.isAreaSelecting) {
      // 영역 선택 완료 시 텍스트 필드들 선택
      const selectedTexts = canvas.getTextsInSelectionArea(textFields.texts);
      console.log('Selected texts:', selectedTexts);
      
      if (selectedTexts.length > 0) {
        const textIds = selectedTexts.map(text => text.id);
        console.log('Starting multi-select with textIds:', textIds);
        textFields.startMultiSelect(textIds);
      }
      canvas.endAreaSelection();
    }
  };

  const handleTextUpdate = (id, updates) => {
    // 텍스트 필드 업데이트
    textFields.updateText(id, updates);
    
    // 캔버스 밖으로 이동하는지 체크하고 확장
    if (updates.x !== undefined && updates.y !== undefined) {
      // 최신 캔버스 영역 상태 사용
      const currentAreas = canvas.canvasAreas;
      const isOutsideCanvas = !currentAreas.some(area => 
        updates.x >= area.x && updates.x <= area.x + area.width &&
        updates.y >= area.y && updates.y <= area.y + area.height
      );
      
      if (isOutsideCanvas) {
        canvas.addCanvasArea(updates.x, updates.y);
      }
    }
  };

  // 그룹 드래그 시 캔버스 확장
  const handleGroupDragCanvasExpansion = (x, y) => {
    const currentAreas = canvas.canvasAreas;
    const isOutsideCanvas = !currentAreas.some(area => 
      x >= area.x && x <= area.x + area.width &&
      y >= area.y && y <= area.y + area.height
    );
    
    if (isOutsideCanvas) {
      canvas.addCanvasArea(x, y);
    }
  };

  const handleCanvasAreaDelete = (areaIndex) => {
    // 삭제할 캔버스 영역 정보 가져오기
    const areaToDelete = canvas.canvasAreas[areaIndex];
    
    // 즉시 삭제 (하이라이트 효과 없이)
    textFields.deleteTextsInArea(areaToDelete);
    canvas.deleteCanvasArea(areaIndex);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const arrangeTexts = () => {
    if (textFields.texts.length === 0) return;
    
    // 처음 생성된 캔버스 찾기
    const initialCanvas = canvas.canvasAreas.find(area => area.isInitial);
    if (!initialCanvas) return;
    
    // 처음 생성된 캔버스의 중심점 계산
    const centerX = initialCanvas.x + initialCanvas.width / 2;
    const centerY = initialCanvas.y + initialCanvas.height / 2;
    
    // 텍스트 필드들을 그리드 형태로 정렬 (처음 생성된 캔버스 중심 기준)
    const cols = Math.ceil(Math.sqrt(textFields.texts.length));
    const rows = Math.ceil(textFields.texts.length / cols);
    const spacing = CANVAS_AREA_CONSTANTS.TEXT_ARRANGE_SPACING;
    const startX = centerX - ((cols - 1) * spacing) / 2;
    const startY = centerY - ((rows - 1) * spacing) / 2;
    
    const arrangedTexts = textFields.texts.map((text, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...text,
        x: startX + col * spacing,
        y: startY + row * spacing
      };
    });
    
    // 텍스트 필드 위치 업데이트
    arrangedTexts.forEach((text, index) => {
      textFields.updateText(text.id, { x: text.x, y: text.y });
    });
  };

  const resetCanvas = () => {
    canvas.resetCanvas();
    textFields.resetTexts();
  };

  const handleLocationClick = (location) => {
    // 해당 위치로 캔버스 이동
    canvas.moveToLocation(location);
  };

  const handleClusteringParamsChange = (params) => {
    console.log('Clustering params changed:', params);
    
    // 클러스터링 결과가 없으면 리턴
    if (!params.result || !params.result.labels) {
      return;
    }
    
    const clusteringResult = params.result;
    const labels = clusteringResult.labels;
    const textIds = clusteringResult.textIds; // ClusteringPanel에서 전달된 텍스트 ID 순서
    
    if (!textIds || textIds.length !== labels.length) {
      console.warn('텍스트 ID 매핑이 올바르지 않습니다.', {
        textIdsCount: textIds ? textIds.length : 0,
        labelsCount: labels.length
      });
      return;
    }
    
    // 텍스트 ID로 매핑 생성
    const textMap = new Map();
    textFields.texts.forEach(text => {
      textMap.set(text.id, text);
    });
    
    // 클러스터링 결과 순서대로 텍스트 매칭
    const matchedTexts = [];
    textIds.forEach(id => {
      const text = textMap.get(id);
      if (text) {
        matchedTexts.push(text);
      } else {
        console.warn(`텍스트 ID ${id}를 찾을 수 없습니다.`);
      }
    });
    
    if (matchedTexts.length !== labels.length) {
      console.warn('텍스트 매칭 실패', {
        matchedCount: matchedTexts.length,
        labelsCount: labels.length
      });
      return;
    }
    
    // 클러스터별로 텍스트 그룹화
    const clusterGroups = {};
    matchedTexts.forEach((text, index) => {
      const clusterId = labels[index];
      if (!clusterGroups[clusterId]) {
        clusterGroups[clusterId] = [];
      }
      clusterGroups[clusterId].push({ text, index });
    });
    
    // 클러스터링 결과에서 대표 텍스트 정보 가져오기
    const clusterRepresentatives = {};
    if (clusteringResult.clusters) {
      clusteringResult.clusters.forEach((cluster, idx) => {
        clusterRepresentatives[cluster.cluster_idx] = cluster.representative_text;
      });
    }
    
    // 초기 캔버스 중심점 찾기
    const initialCanvas = canvas.canvasAreas.find(area => area.isInitial);
    if (!initialCanvas) return;
    
    const centerX = initialCanvas.x + initialCanvas.width / 2;
    const centerY = initialCanvas.y + initialCanvas.height / 2;
    
    // 텍스트 박스 크기 가져오기 함수
    const getTextSize = (text) => {
      const defaultWidth = CLUSTERING_LAYOUT_CONSTANTS.DEFAULT_TEXT_WIDTH;
      const defaultHeight = CLUSTERING_LAYOUT_CONSTANTS.DEFAULT_TEXT_HEIGHT;
      
      // CSS 변수에서 가져오기 시도
      const cssWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--memo-width')) || defaultWidth;
      const cssHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--memo-height')) || defaultHeight;
      
      return {
        width: text.width !== null && text.width !== undefined ? text.width : cssWidth,
        height: text.height !== null && text.height !== undefined ? text.height : cssHeight
      };
    };
    
    // 두 도형이 겹치는지 확인
    const isShapesOverlapping = (bounds1, bounds2) => {
      return !(
        bounds1.maxX <= bounds2.minX ||
        bounds2.maxX <= bounds1.minX ||
        bounds1.maxY <= bounds2.minY ||
        bounds2.maxY <= bounds1.minY
      );
    };
    
    // 클러스터 배치 설정
    const textMargin = CLUSTERING_LAYOUT_CONSTANTS.TEXT_MARGIN;
    const shapePadding = CLUSTERING_LAYOUT_CONSTANTS.CLUSTER_SHAPE_PADDING;
    const horizontalSpacing = CLUSTERING_LAYOUT_CONSTANTS.CLUSTER_INITIAL_HORIZONTAL_SPACING;
    const verticalSpacing = CLUSTERING_LAYOUT_CONSTANTS.CLUSTER_INITIAL_VERTICAL_SPACING;
    const clustersPerRow = CLUSTERING_LAYOUT_CONSTANTS.CLUSTERS_PER_ROW;
    const borderColors = CLUSTERING_LAYOUT_CONSTANTS.CLUSTER_BORDER_COLORS;
    
    // 클러스터 개수
    const clusterCount = Object.keys(clusterGroups).length;
    
    // 각 클러스터의 텍스트 배치 및 도형 정보 저장
    const textUpdates = [];
    const clusterShapes = []; // 클러스터 도형 정보 저장
    let clusterIndex = 0;
    
    // 1단계: 클러스터들을 먼저 배치 (충분한 간격으로)
    Object.keys(clusterGroups).forEach(clusterId => {
      const group = clusterGroups[clusterId];
      
      // 가로/세로 위치 계산 (5개씩 배치)
      const col = clusterIndex % clustersPerRow;
      const row = Math.floor(clusterIndex / clustersPerRow);
      
      // 클러스터 중심 위치 계산
      const clusterCenterX = centerX - (clustersPerRow * horizontalSpacing) / 2 + col * horizontalSpacing;
      const clusterCenterY = centerY + row * verticalSpacing;
      
      // 클러스터 테두리 색상 선택
      const borderColor = borderColors[clusterIndex % borderColors.length];
      
      // 텍스트 박스 크기 계산
      let maxWidth = 0;
      let maxHeight = 0;
      group.forEach(item => {
        const size = getTextSize(item.text);
        maxWidth = Math.max(maxWidth, size.width);
        maxHeight = Math.max(maxHeight, size.height);
      });
      
      // 텍스트들을 세로로 배치 (1열, 중심 기준)
      const groupTexts = [];
      let currentY = clusterCenterY - (group.length * (maxHeight + textMargin)) / 2;
      
      group.forEach((item, itemIndex) => {
        const size = getTextSize(item.text);
        const newX = clusterCenterX - maxWidth / 2;
        const newY = currentY;
        
        groupTexts.push({
          id: item.text.id,
          x: newX,
          y: newY,
          width: size.width,
          height: size.height
        });
        
        textUpdates.push({
          id: item.text.id,
          x: newX,
          y: newY
        });
        
        currentY += size.height + textMargin;
      });
      
      // 효율적인 도형 경계 계산 (텍스트들의 실제 배치를 고려하여 여백 최소화)
      // 각 텍스트의 실제 경계를 계산
      const textBounds = groupTexts.map(t => ({
        left: t.x,
        right: t.x + t.width,
        top: t.y,
        bottom: t.y + t.height
      }));
      
      // 텍스트들의 실제 배치를 분석하여 최적의 경계 계산
      // 세로로 긴 메모나 가로로 긴 메모를 고려하여 여백 최소화
      const allLefts = textBounds.map(b => b.left);
      const allRights = textBounds.map(b => b.right);
      const allTops = textBounds.map(b => b.top);
      const allBottoms = textBounds.map(b => b.bottom);
      
      // 실제 텍스트들이 차지하는 영역의 정확한 경계
      const minX = Math.min(...allLefts) - shapePadding;
      const maxX = Math.max(...allRights) + shapePadding;
      const minY = Math.min(...allTops) - shapePadding;
      const maxY = Math.max(...allBottoms) + shapePadding;
      
      // 도형 경계점들
      const shapeBounds = {
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
        textBounds: textBounds // 텍스트 경계 정보 저장 (나중에 최적화된 도형 생성용)
      };
      
      // 클러스터의 대표 텍스트 가져오기
      const representativeText = clusterRepresentatives[parseInt(clusterId)] || 
                                 (group.length > 0 ? group[0].text.text : '');
      
      clusterShapes.push({
        clusterId: `cluster-${clusterId}`,
        clusterIndex: clusterIndex,
        borderColor: borderColor,
        bounds: shapeBounds,
        textIds: groupTexts.map(t => t.id),
        representativeText: representativeText // 대표 텍스트 저장
      });
      
      clusterIndex++;
    });
    
    // 2단계: 도형들끼리 겹치는지 확인하고 조정
    const adjustedShapes = [];
    clusterShapes.forEach((shape, index) => {
      let adjustedBounds = { ...shape.bounds };
      let hasCollision = true;
      let attempts = 0;
      const maxAttempts = 50;
      
      while (hasCollision && attempts < maxAttempts) {
        hasCollision = false;
        
        // 이미 조정된 도형들과 겹치는지 확인
        for (let i = 0; i < adjustedShapes.length; i++) {
          const otherShape = adjustedShapes[i];
          if (isShapesOverlapping(adjustedBounds, otherShape.bounds)) {
            hasCollision = true;
            // 겹치면 방향에 따라 이동
            const dx = adjustedBounds.centerX - otherShape.bounds.centerX;
            const dy = adjustedBounds.centerY - otherShape.bounds.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (adjustedBounds.width + otherShape.bounds.width) / 2 + shapePadding * 2;
            
            if (distance < minDistance && distance > 0) {
              const moveX = (dx / distance) * (minDistance - distance + shapePadding);
              const moveY = (dy / distance) * (minDistance - distance + shapePadding);
              adjustedBounds.minX += moveX;
              adjustedBounds.maxX += moveX;
              adjustedBounds.minY += moveY;
              adjustedBounds.maxY += moveY;
              adjustedBounds.centerX += moveX;
              adjustedBounds.centerY += moveY;
            } else {
              // 거리가 0이거나 계산 불가능한 경우 랜덤 방향으로 이동
              const angle = (attempts * 0.5) % (2 * Math.PI);
              const offset = shapePadding * (attempts + 1);
              adjustedBounds.minX += Math.cos(angle) * offset;
              adjustedBounds.maxX += Math.cos(angle) * offset;
              adjustedBounds.minY += Math.sin(angle) * offset;
              adjustedBounds.maxY += Math.sin(angle) * offset;
              adjustedBounds.centerX += Math.cos(angle) * offset;
              adjustedBounds.centerY += Math.sin(angle) * offset;
            }
            break;
          }
        }
        
        if (!hasCollision) {
          break;
        }
        attempts++;
      }
      
      adjustedShapes.push({
        ...shape,
        bounds: adjustedBounds
      });
      
      // 텍스트 위치도 도형 이동에 맞춰 조정
      const dx = adjustedBounds.centerX - shape.bounds.centerX;
      const dy = adjustedBounds.centerY - shape.bounds.centerY;
      
      shape.textIds.forEach(textId => {
        const updateIndex = textUpdates.findIndex(u => u.id === textId);
        if (updateIndex !== -1) {
          textUpdates[updateIndex].x += dx;
          textUpdates[updateIndex].y += dy;
        }
      });
    });
    
    // 도형 정보를 상태에 저장 (CanvasArea에서 렌더링용)
    setClusterShapes(adjustedShapes);
    
    // 생성된 도형 정보 저장 (되돌리기용) - 클러스터링 전 텍스트 위치 저장
    const originalTextStates = textUpdates.map(update => {
      const originalText = textFields.texts.find(t => t.id === update.id);
      return {
        id: update.id,
        originalX: originalText ? originalText.x : update.x,
        originalY: originalText ? originalText.y : update.y
      };
    });
    
    setLastClusteringState({
      shapes: adjustedShapes,
      textStates: originalTextStates
    });
    
    // 텍스트 위치 업데이트
    textUpdates.forEach(update => {
      textFields.updateText(update.id, { x: update.x, y: update.y });
    });
    
    console.log('클러스터링 결과로 텍스트 위치 조정 완료', {
      clusterCount,
      textUpdatesCount: textUpdates.length,
      clusterShapes: adjustedShapes
    });
  };

  // 클러스터링 되돌리기 함수
  const handleUndoClustering = () => {
    if (!lastClusteringState) {
      console.warn('되돌릴 클러스터링 상태가 없습니다.');
      return;
    }

    // 클러스터 도형 정보 제거
    setClusterShapes([]);
    setDraggingCluster(null);

    // 텍스트 위치를 이전 상태로 복원
    lastClusteringState.textStates.forEach(({ id, originalX, originalY }) => {
      textFields.updateText(id, {
        x: originalX,
        y: originalY
      });
    });

    // 되돌리기 상태 초기화
    setLastClusteringState(null);
    
    console.log('클러스터링 되돌리기 완료');
  };

  // 클러스터 드래그 시작
  const handleClusterDragStart = (shape, e) => {
    if (mode !== 'move') return;
    
    console.log('클러스터 드래그 시작', shape);
    
    const rect = canvas.canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scrollX = canvas.canvasRef.current.scrollLeft || 0;
    const scrollY = canvas.canvasRef.current.scrollTop || 0;
    const containerX = e.clientX - rect.left + scrollX;
    const containerY = e.clientY - rect.top + scrollY;
    
    // 클릭 위치를 캔버스 좌표로 변환
    const clickX = (containerX - canvas.canvasTransform.x) / canvas.canvasTransform.scale;
    const clickY = (containerY - canvas.canvasTransform.y) / canvas.canvasTransform.scale;
    
    // 클러스터 내 모든 텍스트의 초기 위치 저장
    const initialTextPositions = {};
    shape.textIds.forEach(textId => {
      const text = textFields.texts.find(t => t.id === textId);
      if (text) {
        initialTextPositions[textId] = { x: text.x, y: text.y };
      }
    });
    
    setDraggingCluster({
      ...shape,
      initialBounds: { ...shape.bounds },
      initialTextPositions: initialTextPositions,
      dragOffsetX: clickX - shape.bounds.minX,
      dragOffsetY: clickY - shape.bounds.minY
    });
    
    setClusterDragStart({ x: clickX, y: clickY });
    
    // 전역 마우스 이벤트 리스너 추가 (캔버스 영역을 벗어나도 드래그 계속)
    const handleGlobalMouseMove = (e) => {
      handleClusterDrag(e);
    };
    
    const handleGlobalMouseUp = () => {
      handleClusterDragEnd();
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  // 클러스터 드래그 중
  const handleClusterDrag = (e) => {
    if (!draggingCluster || mode !== 'move') return;
    
    const rect = canvas.canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scrollX = canvas.canvasRef.current.scrollLeft || 0;
    const scrollY = canvas.canvasRef.current.scrollTop || 0;
    const containerX = e.clientX - rect.left + scrollX;
    const containerY = e.clientY - rect.top + scrollY;
    
    // 현재 위치를 캔버스 좌표로 변환
    const currentX = (containerX - canvas.canvasTransform.x) / canvas.canvasTransform.scale;
    const currentY = (containerY - canvas.canvasTransform.y) / canvas.canvasTransform.scale;
    
    // 이동 거리 계산
    const deltaX = currentX - clusterDragStart.x;
    const deltaY = currentY - clusterDragStart.y;
    
    // 도형 위치 업데이트
    const newBounds = {
      ...draggingCluster.initialBounds,
      minX: draggingCluster.initialBounds.minX + deltaX,
      maxX: draggingCluster.initialBounds.maxX + deltaX,
      minY: draggingCluster.initialBounds.minY + deltaY,
      maxY: draggingCluster.initialBounds.maxY + deltaY,
      centerX: draggingCluster.initialBounds.centerX + deltaX,
      centerY: draggingCluster.initialBounds.centerY + deltaY,
      width: draggingCluster.initialBounds.width,
      height: draggingCluster.initialBounds.height
    };
    
    setDraggingCluster({
      ...draggingCluster,
      bounds: newBounds
    });
    
    // 모든 텍스트 위치 업데이트
    draggingCluster.textIds.forEach(textId => {
      const initialPos = draggingCluster.initialTextPositions[textId];
      if (initialPos) {
        textFields.updateText(textId, {
          x: initialPos.x + deltaX,
          y: initialPos.y + deltaY
        });
      }
    });
  };

  // 클러스터 드래그 종료
  const handleClusterDragEnd = () => {
    if (!draggingCluster) return;
    
    // 클러스터 도형 정보 업데이트
    setClusterShapes(prev => prev.map(shape => 
      shape.clusterId === draggingCluster.clusterId
        ? { ...shape, bounds: draggingCluster.bounds }
        : shape
    ));
    
    setDraggingCluster(null);
    setClusterDragStart({ x: 0, y: 0 });
  };

  return (
    <div className="infinite-canvas-page">
      {/* 채팅창 */}
      <ChatPanel 
        messages={chatMessages}
        onLocationClick={handleLocationClick}
        onVisibilityChange={setIsChatPanelOpen}
        participants={session.participants}
        inviteLink={session.inviteLink}
        onCopyInviteLink={session.copyInviteLink}
        isShareDropdownOpen={session.isShareDropdownOpen}
        onToggleShareDropdown={() => session.setIsShareDropdownOpen(!session.isShareDropdownOpen)}
        projectName="무한 캔버스 프로젝트"
      />
      
      {/* 클러스터링 패널 */}
      <ClusteringPanel 
        onClusteringParamsChange={handleClusteringParamsChange}
        onVisibilityChange={setIsClusteringPanelOpen}
        onGridVisibilityChange={setShowGrid}
        showGrid={showGrid}
        showMinimap={showMinimap}
        onMinimapVisibilityChange={setShowMinimap}
        showCenterIndicator={showCenterIndicator}
        onCenterIndicatorVisibilityChange={setShowCenterIndicator}
        texts={textFields.texts}
        onUndoClustering={handleUndoClustering}
        canUndoClustering={lastClusteringState !== null}
      />
      
      {/* 플로팅 툴바 */}
      <FloatingToolbar 
        mode={mode} 
        onModeChange={handleModeChange} 
        onReset={resetCanvas}
        onArrange={arrangeTexts}
      />

      {/* 중앙 표시 점 */}
      {showCenterIndicator && (
        <CenterIndicator 
          canvasTransform={canvas.canvasTransform}
          isChatPanelOpen={isChatPanelOpen}
          isClusteringPanelOpen={isClusteringPanelOpen}
          onCenterClick={handleLocationClick}
          canvasRef={canvas.canvasRef}
        />
      )}

      {/* 미니맵 */}
      {showMinimap && (
        <Minimap
          canvasAreas={canvas.canvasAreas}
          canvasTransform={canvas.canvasTransform}
          windowSize={windowSize}
          onLocationClick={handleLocationClick}
          isClusteringPanelOpen={isClusteringPanelOpen}
        />
      )}

      {/* 캔버스 */}
      <div
        ref={canvas.canvasRef}
        className={`canvas-container canvas-grid ${canvas.isScrolling ? 'scrolling' : ''}`}
        onClick={handleCanvasClick}
        onMouseDown={canvas.handleCanvasMouseDown}
        onWheel={canvas.handleWheel}
        style={{
          backgroundSize: `${20 * canvas.canvasTransform.scale}px ${20 * canvas.canvasTransform.scale}px`,
          backgroundPosition: `${canvas.canvasTransform.x}px ${canvas.canvasTransform.y}px`
        }}
      >
        <CanvasArea
          canvasAreas={canvas.canvasAreas}
          canvasTransform={canvas.canvasTransform}
          texts={textFields.texts}
          updateText={handleTextUpdate}
          deleteText={textFields.deleteText}
          handleSendToChat={(id, x, y, text) => textFields.handleSendToChat(id, x, y, text, setChatMessages)}
          setIsTextEditing={textFields.setIsTextEditing}
          mode={mode}
          onCanvasAreaDelete={handleCanvasAreaDelete}
          highlightedTextIds={textFields.highlightedTextIds}
          onHighlightTextsInArea={textFields.highlightTextsInArea}
          onCanvasMouseDown={handleCanvasMouseDown}
          onCanvasMouseMove={handleCanvasMouseMove}
          onCanvasMouseUp={handleCanvasMouseUp}
          selectedTextIds={textFields.selectedTextIds}
          isMultiSelecting={textFields.isMultiSelecting}
          selectionArea={canvas.selectionArea}
          onStartGroupDrag={textFields.startGroupDrag}
          onUpdateGroupDrag={(baseTextId, newX, newY) => textFields.updateGroupDrag(baseTextId, newX, newY, handleGroupDragCanvasExpansion)}
          onEndGroupDrag={textFields.endGroupDrag}
          isAnimating={canvas.isAnimating}
          showGrid={showGrid}
          clusterShapes={clusterShapes}
          onClusterDragStart={handleClusterDragStart}
          onClusterDrag={handleClusterDrag}
          onClusterDragEnd={handleClusterDragEnd}
          draggingCluster={draggingCluster}
        />
      </div>
    </div>
  );
};

export default InfiniteCanvasPage;
