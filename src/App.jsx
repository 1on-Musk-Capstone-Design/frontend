import React, { useState, useRef, useCallback, useEffect } from 'react';
import './index.css';
import ChatPanel from './components/ChatPanel';

// 드래그 가능한 텍스트 필드 컴포넌트
const DraggableText = ({ id, x, y, text, onUpdate, onDelete, canvasTransform }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const textareaRef = useRef(null);

  const handleMouseDown = (e) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (x * canvasTransform.scale + canvasTransform.x),
      y: e.clientY - (y * canvasTransform.scale + canvasTransform.y)
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    // 줌 레벨을 고려한 정확한 좌표 계산
    const newX = (e.clientX - dragStart.x - canvasTransform.x) / canvasTransform.scale;
    const newY = (e.clientY - dragStart.y - canvasTransform.y) / canvasTransform.scale;
    onUpdate(id, { x: newX, y: newY, text: currentText });
  }, [isDragging, dragStart, id, currentText, onUpdate, canvasTransform]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 0);
  };

  const handleTextChange = (e) => {
    setCurrentText(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(id, { x, y, text: currentText });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      onUpdate(id, { x, y, text: currentText });
    }
    if (e.key === 'Escape') {
      setCurrentText(text);
      setIsEditing(false);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div
      className={`absolute bg-white border-2 border-blue-300 rounded-lg shadow-lg min-w-[200px] min-h-[50px] cursor-move select-none ${
        isDragging ? 'shadow-xl border-blue-500' : ''
      } ${isEditing ? 'border-blue-500' : ''}`}
      style={{
        left: x,
        top: y,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.1s ease'
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex justify-between items-center p-2 bg-blue-50 rounded-t-lg">
        <span className="text-xs text-gray-600">텍스트</span>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 text-xs"
        >
          ✕
        </button>
      </div>
      <div className="p-2">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={currentText}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none outline-none bg-transparent"
            placeholder="텍스트를 입력하세요..."
            autoFocus
          />
        ) : (
          <div className="min-h-[30px] whitespace-pre-wrap">
            {currentText || '더블클릭하여 편집'}
          </div>
        )}
      </div>
    </div>
  );
};


// 플로팅 버튼 컴포넌트
const FloatingToolbar = ({ mode, onModeChange, onReset, onArrange }) => {
  return (
    <div 
      className="fixed bottom-6 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-2 flex gap-1"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        willChange: 'transform'
      }}
    >
      <button
        onClick={() => onModeChange('text')}
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-200 ${
          mode === 'text'
            ? 'bg-blue-500 text-white shadow-lg scale-105'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
        }`}
        title="텍스트 모드"
      >
        T
      </button>
      <button
        onClick={() => onModeChange('move')}
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all duration-200 ${
          mode === 'move'
            ? 'bg-green-500 text-white shadow-lg scale-105'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
        }`}
        title="이동 모드"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 6.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5v11c0 .28.22.5.5.5s.5-.22.5-.5v-11zM9.5 8.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5v7c0 .28.22.5.5.5s.5-.22.5-.5v-7zM16.5 8.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5v7c0 .28.22.5.5.5s.5-.22.5-.5v-7z"/>
          <path d="M3 3h18v2H3V3zm0 16h18v2H3v-2z"/>
        </svg>
      </button>
      <div className="w-px bg-gray-300 mx-1"></div>
      <button
        onClick={onArrange}
        className="w-12 h-12 rounded-xl bg-purple-500 text-white hover:bg-purple-600 flex items-center justify-center text-lg transition-all duration-200 hover:scale-105"
        title="정리"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zm-8 8h6v6H3v-6zm8 0h6v6h-6v-6z"/>
        </svg>
      </button>
      <button
        onClick={onReset}
        className="w-12 h-12 rounded-xl bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-lg transition-all duration-200 hover:scale-105"
        title="초기화"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  );
};

// 메인 무한 캔버스 컴포넌트
const InfiniteCanvas = () => {
  const [texts, setTexts] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [mode, setMode] = useState('text'); // 'text' 또는 'move'
  const canvasRef = useRef(null);
  const nextId = useRef(1);

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current && mode === 'text') {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasTransform.x) / canvasTransform.scale;
      const y = (e.clientY - rect.top - canvasTransform.y) / canvasTransform.scale;
      
      const newText = {
        id: nextId.current++,
        x,
        y,
        text: ''
      };
      
      setTexts(prev => [...prev, newText]);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - canvasTransform.x,
        y: e.clientY - canvasTransform.y
      });
    }
  };

  const handleCanvasMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setCanvasTransform(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragStart]);

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

  const updateText = (id, updates) => {
    setTexts(prev => prev.map(text => 
      text.id === id ? { ...text, ...updates } : text
    ));
  };

  const deleteText = (id) => {
    setTexts(prev => prev.filter(text => text.id !== id));
  };

  const resetCanvas = () => {
    setCanvasTransform({ x: 0, y: 0, scale: 1 });
    setTexts([]);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setIsDragging(false); // 모드 변경 시 드래그 상태 초기화
  };

  const arrangeTexts = () => {
    if (texts.length === 0) return;
    
    // 텍스트 필드들을 그리드 형태로 정렬
    const cols = Math.ceil(Math.sqrt(texts.length));
    const rows = Math.ceil(texts.length / cols);
    const spacing = 250; // 텍스트 필드 간 간격
    const startX = -((cols - 1) * spacing) / 2;
    const startY = -((rows - 1) * spacing) / 2;
    
    const arrangedTexts = texts.map((text, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...text,
        x: startX + col * spacing,
        y: startY + row * spacing
      };
    });
    
    setTexts(arrangedTexts);
  };

  return (
    <div className="w-full h-screen bg-gray-100 overflow-hidden relative">
      {/* 채팅창 */}
      <ChatPanel />
      
      {/* 플로팅 툴바 */}
      <FloatingToolbar 
        mode={mode} 
        onModeChange={handleModeChange} 
        onReset={resetCanvas}
        onArrange={arrangeTexts}
      />
      
      {/* 줌 정보 */}
      <div 
        className="fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-md rounded-lg shadow-2xl p-2"
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
          willChange: 'transform'
        }}
      >
        <div className="text-sm text-gray-600 flex items-center">
          줌: {Math.round(canvasTransform.scale * 100)}%
        </div>
      </div>

      {/* 캔버스 */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        style={{
          backgroundImage: `
            radial-gradient(circle, #9ca3af 1px, transparent 1px)
          `,
          backgroundSize: `${20 * canvasTransform.scale}px ${20 * canvasTransform.scale}px`,
          backgroundPosition: `${canvasTransform.x}px ${canvasTransform.y}px`
        }}
      >
        <div
          style={{
            transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
            transformOrigin: '0 0'
          }}
        >
          {texts.map(text => (
            <DraggableText
              key={text.id}
              id={text.id}
              x={text.x}
              y={text.y}
              text={text.text}
              onUpdate={updateText}
              onDelete={deleteText}
              canvasTransform={canvasTransform}
            />
          ))}
        </div>
      </div>

      
      {/* 현재 모드 표시 */}
      <div 
        className="fixed top-4 z-50 bg-white/95 backdrop-blur-md rounded-lg shadow-2xl p-2"
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          willChange: 'transform'
        }}
      >
        <div className="text-sm text-gray-600">
          현재 모드: 
          <span className={`ml-1 font-medium ${
            mode === 'text' ? 'text-blue-600' : 'text-green-600'
          }`}>
            {mode === 'text' ? 'T (텍스트)' : '이동'}
          </span>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <InfiniteCanvas />
    </div>
  );
}

export default App;
