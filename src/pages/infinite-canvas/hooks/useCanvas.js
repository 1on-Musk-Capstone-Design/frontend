import { useState, useRef, useCallback, useEffect } from 'react';
import { CANVAS_CONSTANTS, COMPUTED_CONSTANTS, ANIMATION_CONSTANTS, CANVAS_AREA_CONSTANTS } from '../constants';

export const useCanvas = () => {
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 0.25 }); // 초기값은 useEffect에서 설정됨
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [canvasAreas, setCanvasAreas] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [selectionArea, setSelectionArea] = useState(null);
  const [hasStartedAreaSelection, setHasStartedAreaSelection] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);

  // 캔버스 크기 초기화
  useEffect(() => {
    const initialWidth = COMPUTED_CONSTANTS.INITIAL_CANVAS_WIDTH;
    const initialHeight = COMPUTED_CONSTANTS.INITIAL_CANVAS_HEIGHT;
    const initialScale = CANVAS_CONSTANTS.INITIAL_SCALE;
    
    setCanvasSize({
      width: initialWidth,
      height: initialHeight
    });
    
    // 초기 캔버스 영역 설정 (삭제 불가능한 메인 캔버스)
    setCanvasAreas([{
      x: 0,
      y: 0,
      width: initialWidth,
      height: initialHeight,
      isInitial: true,
      id: 'initial-canvas'
    }]);
    
    // 화면 중앙에 캔버스가 오도록 초기 위치 설정
    const centerX = window.innerWidth / 2 - (initialWidth * initialScale) / 2;
    const centerY = window.innerHeight / 2 - (initialHeight * initialScale) / 2;
    
    setCanvasTransform({
      x: centerX,
      y: centerY,
      scale: initialScale
    });
  }, []);

  // 캔버스 영역 추가 함수 (단순화: 클릭한 위치에 정확히 한 칸만 추가)
  const addCanvasArea = (x, y) => {
    const initialWidth = COMPUTED_CONSTANTS.INITIAL_CANVAS_WIDTH;
    const initialHeight = COMPUTED_CONSTANTS.INITIAL_CANVAS_HEIGHT;

    // 클릭한 위치에 정확히 한 칸만 추가 (격자에 맞춰 정렬)
    const newArea = {
      x: Math.floor(x / initialWidth) * initialWidth,
      y: Math.floor(y / initialHeight) * initialHeight,
      width: initialWidth,
      height: initialHeight,
      isInitial: false,
      id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // 이미 존재하는 영역인지 체크
    const exists = canvasAreas.some(area => 
      area.x === newArea.x && area.y === newArea.y
    );

    if (!exists) {
      setCanvasAreas(prev => [...prev, newArea]);
    }
  };

  const handleCanvasClick = (e, mode, currentCanvasAreas) => {
    // 캔버스 영역 내에서 클릭했을 때 (텍스트 필드가 아닌 경우)
    const isCanvasArea = e.target === canvasRef.current || 
                        (canvasRef.current && canvasRef.current.contains(e.target) && 
                         !e.target.closest('.draggable-text'));
    
    if (isCanvasArea && mode === 'text' && !hasDragged) {
      const rect = canvasRef.current.getBoundingClientRect();
      // 스크롤 오프셋 고려
      const scrollX = canvasRef.current.scrollLeft || 0;
      const scrollY = canvasRef.current.scrollTop || 0;
      
      // transformOrigin이 '0 0'이므로, 클릭 위치를 캔버스 좌표로 변환
      // 1. 화면 좌표를 canvas-container 내부 좌표로 변환 (스크롤 고려)
      const containerX = e.clientX - rect.left + scrollX;
      const containerY = e.clientY - rect.top + scrollY;
      // 2. transform을 역으로 적용
      // transform: translate(x, y) scale(scale)이고 transformOrigin: 0 0이므로
      // 역변환: (containerX - translateX) / scale
      const x = (containerX - canvasTransform.x) / canvasTransform.scale;
      const y = (containerY - canvasTransform.y) / canvasTransform.scale;
      
      // 기존 캔버스 영역 밖에 있는지 체크 (최신 상태 사용)
      const isOutsideCanvas = !currentCanvasAreas.some(area => 
        x >= area.x && x <= area.x + area.width &&
        y >= area.y && y <= area.y + area.height
      );
      
      if (isOutsideCanvas) {
        addCanvasArea(x, y);
      }
      
      setHasDragged(false); // 클릭 후 드래그 상태 초기화
      return { x, y };
    }
    setHasDragged(false); // 클릭 후 드래그 상태 초기화
    return null;
  };

  const handleCanvasMouseDown = (e) => {
    // Shift 키를 누른 상태에서는 캔버스 드래그 방지
    if (e.shiftKey) {
      return;
    }
    
    // 캔버스 영역 내에서 마우스 다운 (텍스트 필드가 아닌 경우)
    const isCanvasArea = e.target === canvasRef.current || 
                        (canvasRef.current && canvasRef.current.contains(e.target) && 
                         !e.target.closest('.draggable-text'));
    
    if (isCanvasArea) {
      setIsDragging(true);
      setHasDragged(false);
      setDragStart({
        x: e.clientX - canvasTransform.x,
        y: e.clientY - canvasTransform.y
      });
      setDragStartPos({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  // 캔버스 이동 범위 제한 함수 제거 - 무한 스크롤 허용
  const clampCanvasPosition = useCallback((x, y, scale) => {
    // 제한 없이 원래 값 반환 (무한 스크롤)
    return { x, y };
  }, []);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    // 스크롤바 표시
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, ANIMATION_CONSTANTS.SCROLLBAR_TIMEOUT);
    
    // 드래그 감지
    const deltaX = Math.abs(e.clientX - dragStartPos.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.y);
    if (deltaX > CANVAS_AREA_CONSTANTS.DRAG_THRESHOLD || deltaY > CANVAS_AREA_CONSTANTS.DRAG_THRESHOLD) {
      setHasDragged(true);
    }
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // 제한 없이 이동 (무한 스크롤)
    setCanvasTransform(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragStart, dragStartPos]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    // Ctrl 또는 Meta 키가 눌려있을 때만 줌, 아니면 스크롤
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomFactor = e.deltaY > 0 ? (1 - CANVAS_CONSTANTS.ZOOM_FACTOR) : (1 + CANVAS_CONSTANTS.ZOOM_FACTOR);
      const newScale = Math.max(CANVAS_CONSTANTS.MIN_SCALE, Math.min(CANVAS_CONSTANTS.MAX_SCALE, canvasTransform.scale * zoomFactor));
      
      // 마우스 위치를 중심으로 줌
      const scaleChange = newScale / canvasTransform.scale;
      const newX = mouseX - (mouseX - canvasTransform.x) * scaleChange;
      const newY = mouseY - (mouseY - canvasTransform.y) * scaleChange;
      
      // 제한 없이 줌 (무한 스크롤)
      setCanvasTransform(prev => ({
        x: newX,
        y: newY,
        scale: newScale
      }));
    } else {
      // 일반 스크롤: 좌우/상하 분리 (가속 없이 1:1)
      e.preventDefault();
      const absDeltaX = Math.abs(e.deltaX);
      const absDeltaY = Math.abs(e.deltaY);
      
      // 스크롤바 표시
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, ANIMATION_CONSTANTS.SCROLLBAR_TIMEOUT);
      
      // 더 큰 방향의 스크롤만 적용 (제한 없이)
      if (absDeltaX > absDeltaY) {
        // 좌우 스크롤만 (가속 없이)
        const deltaX = e.deltaX;
        const newX = canvasTransform.x - deltaX;
        setCanvasTransform(prev => ({
          ...prev,
          x: newX
        }));
      } else if (absDeltaY > absDeltaX) {
        // 상하 스크롤만 (가속 없이)
        const deltaY = e.deltaY;
        const newY = canvasTransform.y - deltaY;
        setCanvasTransform(prev => ({
          ...prev,
          y: newY
        }));
      }
    }
  }, [canvasTransform]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleCanvasMouseMove);
      document.addEventListener('mouseup', handleCanvasMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleCanvasMouseMove);
        document.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [isDragging, handleCanvasMouseMove, handleCanvasMouseUp]);

  const resetCanvas = () => {
    const initialWidth = COMPUTED_CONSTANTS.INITIAL_CANVAS_WIDTH;
    const initialHeight = COMPUTED_CONSTANTS.INITIAL_CANVAS_HEIGHT;
    const initialScale = CANVAS_CONSTANTS.INITIAL_SCALE;
    
    // 화면 중앙에 캔버스가 오도록 위치 설정
    const centerX = window.innerWidth / 2 - (initialWidth * initialScale) / 2;
    const centerY = window.innerHeight / 2 - (initialHeight * initialScale) / 2;
    
    setCanvasTransform({ x: centerX, y: centerY, scale: initialScale });
    setCanvasAreas([{
      x: 0,
      y: 0,
      width: initialWidth,
      height: initialHeight,
      isInitial: true,
      id: 'initial-canvas'
    }]);
  };

  const moveToLocation = (location) => {
    const targetX = -location.x * canvasTransform.scale + window.innerWidth / 2;
    const targetY = -location.y * canvasTransform.scale + window.innerHeight / 2;
    
    // 기존 애니메이션 취소
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsAnimating(true);
    const startX = canvasTransform.x;
    const startY = canvasTransform.y;
    const startTime = performance.now();
    const duration = ANIMATION_CONSTANTS.MOVE_DURATION;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutCubic 이징 함수
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const currentX = startX + (targetX - startX) * easeOutCubic;
      const currentY = startY + (targetY - startY) * easeOutCubic;
      
      setCanvasTransform(prev => ({
        ...prev,
        x: currentX,
        y: currentY
      }));
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        animationFrameRef.current = null;
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // 영역 선택 시작
  const startAreaSelection = (e) => {
    console.log('startAreaSelection called', {
      shiftKey: e.shiftKey,
      isDragging,
      isAreaSelecting
    });
    
    // Shift 키가 눌린 상태에서만 영역 선택 시작
    if (!e.shiftKey) {
      console.log('No shift key, returning');
      return;
    }
    
    if (!isDragging && !isAreaSelecting) {
      console.log('Starting area selection');
      e.preventDefault();
      e.stopPropagation();
      
      const rect = canvasRef.current.getBoundingClientRect();
      const containerX = e.clientX - rect.left;
      const containerY = e.clientY - rect.top;
      const startX = (containerX - canvasTransform.x) / canvasTransform.scale;
      const startY = (containerY - canvasTransform.y) / canvasTransform.scale;
      
      setIsAreaSelecting(true);
      setHasStartedAreaSelection(true);
      setSelectionArea({
        startX,
        startY,
        endX: startX,
        endY: startY
      });
      
      console.log('Area selection started', { startX, startY });
    }
  };

  // 영역 선택 중
  const updateAreaSelection = (e) => {
    if (isAreaSelecting) {
      const rect = canvasRef.current.getBoundingClientRect();
      const containerX = e.clientX - rect.left;
      const containerY = e.clientY - rect.top;
      const currentX = (containerX - canvasTransform.x) / canvasTransform.scale;
      const currentY = (containerY - canvasTransform.y) / canvasTransform.scale;
      
      setSelectionArea(prev => ({
        ...prev,
        endX: currentX,
        endY: currentY
      }));
    }
  };

  // 영역 선택 종료
  const endAreaSelection = () => {
    if (isAreaSelecting) {
      setIsAreaSelecting(false);
      setHasStartedAreaSelection(false);
      setSelectionArea(null);
    }
  };

  // 영역 내 텍스트 필드 확인
  const getTextsInSelectionArea = (texts) => {
    console.log('getTextsInSelectionArea called', { selectionArea, textsCount: texts.length });
    
    if (!selectionArea) {
      console.log('No selection area, returning empty array');
      return [];
    }
    
    const { startX, startY, endX, endY } = selectionArea;
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    
    console.log('Selection area bounds:', { minX, maxX, minY, maxY });
    
    const filteredTexts = texts.filter(text => {
      const isInArea = text.x >= minX && text.x <= maxX && text.y >= minY && text.y <= maxY;
      console.log(`Text ${text.id} at (${text.x}, ${text.y}) is in area:`, isInArea);
      return isInArea;
    });
    
    console.log('Filtered texts:', filteredTexts);
    return filteredTexts;
  };

  const deleteCanvasArea = (areaIndex) => {
    setCanvasAreas(prev => prev.filter((_, index) => index !== areaIndex));
  };

  const handleCanvasDelete = (e) => {
    // 캔버스 영역 내에서 클릭했을 때 (텍스트 필드가 아닌 경우)
    const isCanvasArea = e.target === canvasRef.current || 
                        (canvasRef.current && canvasRef.current.contains(e.target) && 
                         !e.target.closest('.draggable-text'));
    
    if (isCanvasArea) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasTransform.x) / canvasTransform.scale;
      const y = (e.clientY - rect.top - canvasTransform.y) / canvasTransform.scale;
      
      // 클릭한 위치의 캔버스 영역 찾기
      const clickedAreaIndex = canvasAreas.findIndex(area => 
        x >= area.x && x <= area.x + area.width &&
        y >= area.y && y <= area.y + area.height
      );
      
      if (clickedAreaIndex !== -1 && canvasAreas.length > 1) {
        deleteCanvasArea(clickedAreaIndex);
      }
    }
  };

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    canvasTransform,
    canvasSize,
    canvasAreas,
    isDragging,
    isScrolling,
    hasDragged,
    canvasRef,
    handleCanvasClick,
    handleCanvasMouseDown,
    handleWheel,
    resetCanvas,
    addCanvasArea,
    deleteCanvasArea,
    moveToLocation,
    isAreaSelecting,
    selectionArea,
    hasStartedAreaSelection,
    startAreaSelection,
    updateAreaSelection,
    endAreaSelection,
    getTextsInSelectionArea,
    isAnimating
  };
};
