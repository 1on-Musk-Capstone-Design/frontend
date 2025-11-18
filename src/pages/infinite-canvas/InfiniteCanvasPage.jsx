import React, { useState, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import ClusteringPanel from './components/ClusteringPanel';
import DraggableText from './components/DraggableText';
import FloatingToolbar from './components/FloatingToolbar';
import CanvasArea from './components/CanvasArea';
import { useCanvas } from './hooks/useCanvas';
import { useKeyboard } from './hooks/useKeyboard';
import { useTextFields } from './hooks/useTextFields';
import './styles/canvas.css';

// 메인 무한 캔버스 컴포넌트
const InfiniteCanvasPage = () => {
  const [mode, setMode] = useState('text'); // 'text' 또는 'move'
  const [chatMessages, setChatMessages] = useState([]);
  
  // 커스텀 훅들 사용
  const canvas = useCanvas();
  const textFields = useTextFields();
  
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
  };

  const handleCanvasMouseUp = (e) => {
    console.log('handleCanvasMouseUp called', {
      mode,
      hasStartedAreaSelection: canvas.hasStartedAreaSelection,
      isAreaSelecting: canvas.isAreaSelecting
    });
    
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
    const spacing = 250; // 텍스트 필드 간 간격
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
    // TODO: 클러스터링 API 호출
  };

  return (
    <div className="infinite-canvas-page">
      {/* 채팅창 */}
      <ChatPanel 
        messages={chatMessages}
        onLocationClick={handleLocationClick}
      />
      
      {/* 클러스터링 패널 */}
      <ClusteringPanel 
        onClusteringParamsChange={handleClusteringParamsChange}
      />
      
      {/* 플로팅 툴바 */}
      <FloatingToolbar 
        mode={mode} 
        onModeChange={handleModeChange} 
        onReset={resetCanvas}
        onArrange={arrangeTexts}
      />

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
        />
      </div>
    </div>
  );
};

export default InfiniteCanvasPage;
