import React from 'react';

const ChatView = ({
  messages,
  messagesContainerRef,
  messagesEndRef,
  shouldShowName,
  onLocationClick,
  newMessage,
  onChangeMessage,
  onSendMessage
}) => {
  return (
    <>
      <div className="chatMessages" ref={messagesContainerRef}>
        {messages.map((message, index) => {
          const showName = shouldShowName(message, index);
          return (
            <div
              key={message.id}
              className={`chatMessage ${message.sender === 'me' ? 'user' : message.sender}`}
            >
              {showName && message.userName && (
                <div className="chatMessageName">{message.userName}</div>
              )}
              <div className={`chatMessageBubble ${message.sender === 'me' ? 'user' : message.sender}`}>
                {message.isLocation ? (
                  <>
                    <p>{message.text}</p>
                    <button
                      onClick={() => onLocationClick && onLocationClick(message.location)}
                      style={{
                        color: message.sender === 'me' ? 'rgba(255, 255, 255, 0.9)' : 'var(--chat-send-button-bg)',
                        textDecoration: 'underline',
                        marginTop: '4px',
                        display: 'block',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 'var(--chat-message-font-size)',
                        textAlign: 'left'
                      }}
                    >
                      📍 이 위치로 이동하기
                    </button>
                    <p className="chatMessageTime">{message.time}</p>
                  </>
                ) : (
                  <>
                    <p>{message.text}</p>
                    <p className="chatMessageTime">{message.time}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatInputArea">
        <form onSubmit={onSendMessage} className="chatInputForm">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onChangeMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="chatInput"
          />
          <button type="submit" className="chatSendButton">
            전송
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatView;
