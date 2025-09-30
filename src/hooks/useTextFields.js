import { useState, useRef } from 'react';

export const useTextFields = () => {
  const [texts, setTexts] = useState([]);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [highlightedTextIds, setHighlightedTextIds] = useState([]);
  const nextId = useRef(1);

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
      text: ''
    };
    
    setTexts(prev => [...prev, newText]);
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

  return {
    texts,
    isTextEditing,
    setIsTextEditing,
    highlightedTextIds,
    updateText,
    deleteText,
    addText,
    resetTexts,
    handleSendToChat,
    deleteTextsInArea,
    highlightTextsInArea,
    clearHighlight
  };
};
