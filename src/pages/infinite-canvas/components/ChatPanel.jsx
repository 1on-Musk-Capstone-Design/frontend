import React, { useState, useRef, useEffect } from 'react';

const ChatPanel = ({ 
  messages = [], 
  onLocationClick, 
  onVisibilityChange,
  onSendMessage
}) => {
  const [localMessages, setLocalMessages] = useState([
    { id: 1, text: "안녕하세요! 무한 캔버스에 오신 것을 환영합니다.", sender: "system", time: "10:30" },
    { id: 2, text: "텍스트 필드를 생성하고 편집해보세요.", sender: "system", time: "10:31" },
    { id: 3, text: "드래그로 캔버스를 이동할 수 있습니다.", sender: "system", time: "10:32" }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  // 가시성 변경 시 부모에게 알림
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(!isHidden);
    }
  }, [isHidden, onVisibilityChange]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // API로 채팅 메시지 전송 (서버에서 메시지 목록을 새로고침하므로 로컬에 추가하지 않음)
      if (onSendMessage) {
        try {
          await onSendMessage(newMessage);
        } catch (err) {
          console.error('채팅 메시지 전송 실패', err);
        }
      }
      
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

  // 이전 메시지와 같은 사용자인지 확인 (이름 표시 여부 결정)
  const shouldShowName = (message, index) => {
    if (message.sender === 'system' || message.sender === 'me') return false;
    if (index === 0) return true;
    const prevMessage = allMessages[index - 1];
    return prevMessage.userId !== message.userId || prevMessage.sender !== 'other';
  };

  // 사용자가 스크롤하는지 감지
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      // 사용자가 스크롤 중임을 표시
      setIsUserScrolling(true);
      
      // 스크롤이 맨 아래에 있는지 확인
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px 여유
      
      // 맨 아래에 있으면 사용자 스크롤 상태 해제
      if (isAtBottom) {
        setIsUserScrolling(false);
      }
      
      // 스크롤이 멈춘 후 일정 시간이 지나면 자동 스크롤 재개
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        if (isAtBottom) {
          setIsUserScrolling(false);
        }
      }, 1000);
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    if (messagesContainerRef.current && !isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 메시지가 추가될 때마다 자동 스크롤 (사용자가 스크롤 중이 아닐 때만)
  useEffect(() => {
    scrollToBottom();
  }, [allMessages, isUserScrolling]);

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
          <div className="chatHeaderTitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            {/* 채팅 제목 */}
            <span 
              className="chatHeaderText" 
              style={{ 
                fontSize: '13px', 
                fontWeight: 500, 
                color: '#1a1a1a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: '1 1 auto',
                minWidth: 0
              }}
            >
              채팅
            </span>
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
          <div className="chatMessages" ref={messagesContainerRef}>
            {allMessages.map((message, index) => {
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
