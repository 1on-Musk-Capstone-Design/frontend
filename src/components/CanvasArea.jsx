import React from 'react';
import DraggableText from './DraggableText';

const CanvasArea = ({ canvasAreas, canvasTransform, texts, updateText, deleteText, handleSendToChat, setIsTextEditing }) => {
  return (
    <div
      style={{
        transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
        transformOrigin: '0 0',
        position: 'relative'
      }}
    >
      {/* 캔버스 영역들 렌더링 */}
      {canvasAreas.map((area, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: area.x,
            top: area.y,
            width: area.width,
            height: area.height,
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            boxShadow: '0 0 0 1px #9ca3af',
            backgroundImage: `
              radial-gradient(circle, rgba(156, 163, 175, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0'
          }}
        />
      ))}
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
          onSendToChat={handleSendToChat}
          onEditingChange={setIsTextEditing}
        />
      ))}
    </div>
  );
};

export default CanvasArea;
