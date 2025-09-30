import React, { useState } from 'react';
import './index.css';
import ChatPanel from './components/ChatPanel';
import DraggableText from './components/DraggableText';
import FloatingToolbar from './components/FloatingToolbar';
import CanvasArea from './components/CanvasArea';
import { useCanvas } from './hooks/useCanvas';
import { useKeyboard } from './hooks/useKeyboard';
import { useTextFields } from './hooks/useTextFields';

// 메인 무한 캔버스 컴포넌트
const InfiniteCanvas = () => {
  const [mode, setMode] = useState('text'); // 'text' 또는 'move'
  const [chatMessages, setChatMessages] = useState([]);
  
  // 커스텀 훅들 사용
  const canvas = useCanvas();
  const textFields = useTextFields();
  
  // 키보드 단축키 설정
  useKeyboard(setMode, textFields.isTextEditing);

  const handleCanvasClick = (e) => {
    const clickResult = canvas.handleCanvasClick(e, mode);
    if (clickResult) {
      textFields.addText(clickResult.x, clickResult.y);
    }
  };

  const handleTextUpdate = (id, updates) => {
    // 텍스트 필드 업데이트
    textFields.updateText(id, updates);
    
    // 캔버스 밖으로 이동하는지 체크하고 확장
    if (updates.x !== undefined && updates.y !== undefined) {
      const isOutsideCanvas = !canvas.canvasAreas.some(area => 
        updates.x >= area.x && updates.x <= area.x + area.width &&
        updates.y >= area.y && updates.y <= area.y + area.height
      );
      
      if (isOutsideCanvas) {
        canvas.addCanvasArea(updates.x, updates.y);
      }
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const arrangeTexts = () => {
    if (textFields.texts.length === 0) return;
    
    // 텍스트 필드들을 그리드 형태로 정렬
    const cols = Math.ceil(Math.sqrt(textFields.texts.length));
    const rows = Math.ceil(textFields.texts.length / cols);
    const spacing = 250; // 텍스트 필드 간 간격
    const startX = -((cols - 1) * spacing) / 2;
    const startY = -((rows - 1) * spacing) / 2;
    
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
    const targetX = -location.x * canvas.canvasTransform.scale + window.innerWidth / 2;
    const targetY = -location.y * canvas.canvasTransform.scale + window.innerHeight / 2;
    
    // 캔버스 변환 업데이트 (useCanvas 훅에서 처리해야 함)
    // 이 부분은 useCanvas 훅에 메서드를 추가해야 함
  };

  return (
    <div 
      className="w-full h-screen overflow-hidden relative"
      style={{
        backgroundImage: `
          linear-gradient(45deg, #d1d5db 25%, transparent 25%),
          linear-gradient(-45deg, #d1d5db 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #d1d5db 75%),
          linear-gradient(-45deg, transparent 75%, #d1d5db 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        backgroundColor: '#e5e7eb'
      }}
    >
      {/* 채팅창 */}
      <ChatPanel 
        messages={chatMessages}
        onLocationClick={handleLocationClick}
      />
      
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
          줌: {Math.round(canvas.canvasTransform.scale * 100)}%
        </div>
      </div>

      {/* 캔버스 */}
      <div
        ref={canvas.canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={handleCanvasClick}
        onMouseDown={canvas.handleCanvasMouseDown}
        onWheel={canvas.handleWheel}
        style={{
          backgroundImage: `
            radial-gradient(circle, #9ca3af 1px, transparent 1px)
          `,
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
        />
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