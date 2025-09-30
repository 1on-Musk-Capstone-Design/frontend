import { useState, useRef, useCallback, useEffect } from 'react';

export const useCanvas = () => {
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [canvasAreas, setCanvasAreas] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [selectionArea, setSelectionArea] = useState(null);
  const [hasStartedAreaSelection, setHasStartedAreaSelection] = useState(false);
  const canvasRef = useRef(null);

  // 캔버스 크기 초기화 (고정된 해상도의 2배: 1920x1080의 2배)
  useEffect(() => {
    const initialWidth = 1920 * 2; // 3840px
    const initialHeight = 1080 * 2; // 2160px
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
  }, []);

  // 캔버스 영역 추가 함수 (단순화: 클릭한 위치에 정확히 한 칸만 추가)
  const addCanvasArea = (x, y) => {
    const initialWidth = 1920 * 2; // 3840px
    const initialHeight = 1080 * 2; // 2160px

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
      const x = (e.clientX - rect.left - canvasTransform.x) / canvasTransform.scale;
      const y = (e.clientY - rect.top - canvasTransform.y) / canvasTransform.scale;
      
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

  const handleCanvasMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    // 드래그 감지 (5픽셀 이상 이동했을 때)
    const deltaX = Math.abs(e.clientX - dragStartPos.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.y);
    if (deltaX > 5 || deltaY > 5) {
      setHasDragged(true);
    }
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setCanvasTransform(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragStart, dragStartPos]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, canvasTransform.scale * zoomFactor));
    
    // 마우스 위치를 중심으로 줌
    const scaleChange = newScale / canvasTransform.scale;
    const newX = mouseX - (mouseX - canvasTransform.x) * scaleChange;
    const newY = mouseY - (mouseY - canvasTransform.y) * scaleChange;
    
    setCanvasTransform(prev => ({
      x: newX,
      y: newY,
      scale: newScale
    }));
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
    setCanvasTransform({ x: 0, y: 0, scale: 1 });
    setCanvasAreas([{
      x: 0,
      y: 0,
      width: 1920 * 2,
      height: 1080 * 2
    }]);
  };

  const moveToLocation = (location) => {
    const targetX = -location.x * canvasTransform.scale + window.innerWidth / 2;
    const targetY = -location.y * canvasTransform.scale + window.innerHeight / 2;
    
    setCanvasTransform(prev => ({
      ...prev,
      x: targetX,
      y: targetY
    }));
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
      const startX = (e.clientX - rect.left - canvasTransform.x) / canvasTransform.scale;
      const startY = (e.clientY - rect.top - canvasTransform.y) / canvasTransform.scale;
      
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
      const currentX = (e.clientX - rect.left - canvasTransform.x) / canvasTransform.scale;
      const currentY = (e.clientY - rect.top - canvasTransform.y) / canvasTransform.scale;
      
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

  return {
    canvasTransform,
    canvasSize,
    canvasAreas,
    isDragging,
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
    getTextsInSelectionArea
  };
};
