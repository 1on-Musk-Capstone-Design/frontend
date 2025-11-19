import { useState, useRef, useEffect } from 'react';

export const useTextFields = () => {
  const [texts, setTexts] = useState([]);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [highlightedTextIds, setHighlightedTextIds] = useState([]);
  const [selectedTextIds, setSelectedTextIds] = useState([]);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [groupDragData, setGroupDragData] = useState(null);
  const nextId = useRef(1);

  // 디버깅: selectedTextIds 변경 감지
  useEffect(() => {
    console.log('selectedTextIds changed:', selectedTextIds);
  }, [selectedTextIds]);

  const updateText = (id, updates) => {
    setTexts(prev => prev.map(text => 
      text.id === id ? { ...text, ...updates } : text
    ));
  };

  const deleteText = (id) => {
    setTexts(prev => prev.filter(text => text.id !== id));
  };

  const addText = (x, y) => {
    const newText = {
      id: nextId.current++,
      x,
      y,
      text: '',
      width: null, // null이면 CSS 변수 사용
      height: null // null이면 CSS 변수 사용
    };
    
    setTexts(prev => [...prev, newText]);
    return newText.id; // 생성된 텍스트 ID 반환
  };

  const resetTexts = () => {
    setTexts([]);
  };

  const handleSendToChat = (id, x, y, text, setChatMessages) => {
    const message = {
      id: Date.now(),
      text: `📍 위치 공유: "${text}"`,
      sender: "system",
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      location: { x, y, id },
      isLocation: true
    };
    setChatMessages(prev => [...prev, message]);
  };

  const deleteTextsInArea = (area) => {
    setTexts(prev => prev.filter(text => 
      !(text.x >= area.x && text.x <= area.x + area.width &&
        text.y >= area.y && text.y <= area.y + area.height)
    ));
  };

  const highlightTextsInArea = (area) => {
    if (area === null) {
      // null이 전달되면 하이라이트 해제
      setHighlightedTextIds([]);
      return;
    }
    
    const textIdsInArea = texts
      .filter(text => 
        text.x >= area.x && text.x <= area.x + area.width &&
        text.y >= area.y && text.y <= area.y + area.height
      )
      .map(text => text.id);
    setHighlightedTextIds(textIdsInArea);
  };

  const clearHighlight = () => {
    setHighlightedTextIds([]);
  };

  // 다중 선택 시작
  const startMultiSelect = (textIds) => {
    console.log('startMultiSelect called with textIds:', textIds);
    setSelectedTextIds(textIds);
    setIsMultiSelecting(true);
    console.log('Selected text IDs set to:', textIds);
  };

  // 다중 선택 종료
  const endMultiSelect = () => {
    setIsMultiSelecting(false);
  };

  // 선택된 텍스트 필드들 이동
  const moveSelectedTexts = (deltaX, deltaY) => {
    setTexts(prev => prev.map(text => 
      selectedTextIds.includes(text.id) 
        ? { ...text, x: text.x + deltaX, y: text.y + deltaY }
        : text
    ));
  };

  // 선택 해제
  const clearSelection = () => {
    setSelectedTextIds([]);
    setIsMultiSelecting(false);
  };

  // 그룹 드래그 시작 (첫 번째 선택된 텍스트 필드 기준)
  const startGroupDrag = (textId, startX, startY) => {
    if (selectedTextIds.includes(textId)) {
      // 선택된 텍스트 필드들의 상대적 위치 저장
      const selectedTexts = texts.filter(text => selectedTextIds.includes(text.id));
      const baseText = selectedTexts.find(text => text.id === textId);
      if (baseText) {
        const relativePositions = selectedTexts.map(text => ({
          id: text.id,
          relativeX: text.x - baseText.x,
          relativeY: text.y - baseText.y
        }));
        const dragData = { baseText, relativePositions };
        setGroupDragData(dragData);
        return dragData;
      }
    }
    return null;
  };

  // 그룹 드래그 업데이트
  const updateGroupDrag = (baseTextId, newX, newY, onCanvasExpansion) => {
    if (groupDragData && groupDragData.relativePositions) {
      setTexts(prev => prev.map(text => {
        if (selectedTextIds.includes(text.id)) {
          const relative = groupDragData.relativePositions.find(rel => rel.id === text.id);
          if (relative) {
            const newTextX = newX + relative.relativeX;
            const newTextY = newY + relative.relativeY;
            
            // 캔버스 확장 체크 (기준 텍스트 필드만 체크)
            if (text.id === baseTextId && onCanvasExpansion) {
              onCanvasExpansion(newTextX, newTextY);
            }
            
            return {
              ...text,
              x: newTextX,
              y: newTextY
            };
          }
        }
        return text;
      }));
    }
  };

  // 그룹 드래그 종료
  const endGroupDrag = () => {
    setGroupDragData(null);
  };

  return {
    texts,
    isTextEditing,
    setIsTextEditing,
    highlightedTextIds,
    selectedTextIds,
    isMultiSelecting,
    updateText,
    deleteText,
    addText,
    resetTexts,
    handleSendToChat,
    deleteTextsInArea,
    highlightTextsInArea,
    clearHighlight,
    startMultiSelect,
    endMultiSelect,
    moveSelectedTexts,
    clearSelection,
    startGroupDrag,
    updateGroupDrag,
    endGroupDrag
  };
};
