import React, { useState, useRef, useEffect } from 'react';

const ChatPanel = ({ messages = [], onLocationClick }) => {
  const [localMessages, setLocalMessages] = useState([
    { id: 1, text: "안녕하세요! 무한 캔버스에 오신 것을 환영합니다.", sender: "system", time: "10:30" },
    { id: 2, text: "텍스트 필드를 생성하고 편집해보세요.", sender: "system", time: "10:31" },
    { id: 3, text: "드래그로 캔버스를 이동할 수 있습니다.", sender: "system", time: "10:32" }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        text: newMessage,
        sender: "user",
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now() // 정확한 시간순 정렬을 위한 타임스탬프
      };
      setLocalMessages(prev => [...prev, message]);
      setNewMessage("");
    }
  };

  // 모든 메시지 합치기 (로컬 메시지 + 외부 메시지) 및 시간순 정렬
  const allMessages = [...localMessages, ...messages].sort((a, b) => {
    // 타임스탬프가 있으면 타임스탬프로, 없으면 시간 문자열로 정렬
    const timeA = a.timestamp || new Date(a.time).getTime();
    const timeB = b.timestamp || new Date(b.time).getTime();
    return timeA - timeB; // 오래된 것부터 정렬
  });

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지가 추가될 때마다 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  return (
    <>
      {/* 채팅 패널 토글 버튼 */}
      {isHidden && (
        <button
          className="chatToggle"
          onClick={() => setIsHidden(false)}
          title="채팅 열기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      )}

      {/* 채팅 패널 */}
      <div className={`chatPanel ${isHidden ? 'hidden' : ''}`}>
        {/* 헤더 */}
        <div className="chatHeader">
          <div className="chatHeaderTitle">
            <span className="chatHeaderText">채팅</span>
          </div>
          <button
            className="chatCloseButton"
            onClick={() => setIsHidden(true)}
            title="채팅 닫기"
          >
            ×
          </button>
        </div>

        {/* 메시지 목록 */}
        <div className="chatContent">
          <div className="chatMessages">
            {allMessages.map((message) => (
              <div
                key={message.id}
                className={`chatMessage ${message.sender}`}
              >
                <div className={`chatMessageBubble ${message.sender}`}>
                  {message.isLocation ? (
                    <>
                      <p>{message.text}</p>
                      <button
                        onClick={() => onLocationClick && onLocationClick(message.location)}
                        style={{ 
                          color: message.sender === 'user' ? 'rgba(255, 255, 255, 0.9)' : 'var(--chat-send-button-bg)', 
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
            ))}
            {/* 자동 스크롤을 위한 더미 요소 */}
            <div ref={messagesEndRef} />
          </div>

          {/* 메시지 입력 */}
          <div className="chatInputArea">
            <form onSubmit={handleSendMessage} className="chatInputForm">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="chatInput"
              />
              <button type="submit" className="chatSendButton">
                전송
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPanel;
