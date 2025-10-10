import React, { useState, useRef, useEffect } from 'react';
import { socketService } from '../../../services/socketService.js';
import { HealthService } from '../../../services/healthService.js';

const ChatPanel = ({ messages = [], onLocationClick }) => {
  const [localMessages, setLocalMessages] = useState([
    { id: 1, text: "안녕하세요! 무한 캔버스에 오신 것을 환영합니다.", sender: "system", time: "10:30" },
    { id: 2, text: "텍스트 필드를 생성하고 편집해보세요.", sender: "system", time: "10:31" },
    { id: 3, text: "드래그로 캔버스를 이동할 수 있습니다.", sender: "system", time: "10:32" }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const messagesEndRef = useRef(null);

  // Socket.IO 연결 및 이벤트 리스너 설정
  useEffect(() => {
    // Socket.IO 연결
    socketService.connect();
    setIsConnected(socketService.getConnectionStatus());

    // Socket.IO 이벤트 리스너 등록
    socketService.on('connected', (message) => {
      console.log('Socket.IO 연결됨:', message);
      setIsConnected(true);
    });

    socketService.on('new_message', (data) => {
      const message = {
        id: Date.now(),
        text: data,
        sender: "other",
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      setLocalMessages(prev => [...prev, message]);
    });

    socketService.on('user_joined', (message) => {
      const systemMessage = {
        id: Date.now(),
        text: message,
        sender: "system",
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      setLocalMessages(prev => [...prev, systemMessage]);
    });

    socketService.on('user_left', (message) => {
      const systemMessage = {
        id: Date.now(),
        text: message,
        sender: "system",
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      setLocalMessages(prev => [...prev, systemMessage]);
    });

    // 서버 상태 확인
    const checkServerStatus = async () => {
      try {
        const status = await HealthService.checkHealth();
        setServerStatus(status);
      } catch (error) {
        console.error('서버 상태 확인 실패:', error);
        setServerStatus(null);
      }
    };

    checkServerStatus();

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      socketService.disconnect();
    };
  }, []);

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
      
      // 로컬 메시지에 추가
      setLocalMessages(prev => [...prev, message]);
      
      // Socket.IO를 통해 다른 클라이언트들에게 전송
      if (isConnected) {
        socketService.sendChatMessage(newMessage);
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

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지가 추가될 때마다 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  return (
    <div 
      className={`fixed z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 overflow-hidden ${
        isMinimized 
          ? 'w-16 h-16 bottom-24 left-1/2 transform -translate-x-1/2' 
          : 'w-80 h-4/5 left-4 top-1/2 transform -translate-y-1/2'
      }`}
      style={{
        position: 'fixed',
        zIndex: 9998,
        willChange: 'transform'
      }}
    >
      {isMinimized ? (
        /* 축소된 상태 - 채팅 이모티콘 */
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full h-full flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors rounded-2xl"
          title="채팅 열기"
        >
          💬
        </button>
      ) : (
        /* 확장된 상태 - 헤더 */
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="font-semibold text-gray-800">
              채팅 {isConnected ? '(연결됨)' : '(연결 안됨)'}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H5v-2h14v2z"/>
            </svg>
          </button>
        </div>
      )}

      {!isMinimized && (
        <div className="flex flex-col" style={{ height: 'calc(100% - 60px)' }}>
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '200px' }}>
            {allMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.isLocation
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.isLocation ? (
                    <div>
                      <p className="text-sm">{message.text}</p>
                      <button
                        onClick={() => onLocationClick && onLocationClick(message.location)}
                        className="text-xs text-green-600 hover:text-green-800 underline mt-1 block"
                      >
                        📍 이 위치로 이동하기
                      </button>
                      <p className="text-xs opacity-70 mt-1">{message.time}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">{message.time}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* 자동 스크롤을 위한 더미 요소 */}
            <div ref={messagesEndRef} />
          </div>

          {/* 메시지 입력 - 하단 고정 */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleSendMessage}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  전송
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
