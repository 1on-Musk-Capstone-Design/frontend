import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../../../config/api';

/**
 * 채팅 웹소켓 연결 훅
 * @param {number} workspaceId - 워크스페이스 ID
 * @param {string} currentUserId - 현재 사용자 ID
 * @param {Map} workspaceUsers - 사용자 ID -> 이름 매핑
 * @param {Function} onMessageReceived - 메시지 수신 콜백 함수
 */
export const useChatWebSocket = (workspaceId, currentUserId, workspaceUsers, onMessageReceived) => {
  const socketRef = useRef(null);
  const onMessageReceivedRef = useRef(onMessageReceived);
  
  // 콜백 함수를 ref에 저장하여 최신 버전 유지
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!workspaceId || !currentUserId) return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    // 웹소켓 연결
    const socket = io(SOCKET_SERVER_URL, {
      auth: {
        token: accessToken
      },
      query: {
        workspaceId: workspaceId,
        userId: currentUserId
      },
      transports: ['websocket'], // websocket만 사용
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: false,
      forceNew: false
    });

    socketRef.current = socket;

    // 연결 성공
    socket.on('connect', () => {
      console.log('[채팅 웹소켓] 연결 성공:', socket.id);
      
      // 세션 참여 (workspaceId를 sessionId로 사용)
      const sessionId = String(workspaceId);
      socket.emit('join_session', sessionId);
    });

    // 연결 확인 메시지 수신
    socket.on('connected', (message) => {
      console.log('[채팅 웹소켓] 서버 연결 확인:', message);
    });

    // 세션 참여 성공
    socket.on('joined_session', (message) => {
      console.log('[채팅 웹소켓] 세션 참여 성공:', message);
    });

    // 다른 사용자 참여 알림
    socket.on('user_joined', (message) => {
      console.log('[채팅 웹소켓] 다른 사용자 참여:', message);
    });

    // 다른 사용자 나가기 알림
    socket.on('user_left', (message) => {
      console.log('[채팅 웹소켓] 다른 사용자 나가기:', message);
    });

    // 연결 오류
    socket.on('connect_error', (error) => {
      console.error('[채팅 웹소켓] 연결 오류:', error);
      console.error('[채팅 웹소켓] 오류 상세:', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context
      });
    });

    // 연결 해제
    socket.on('disconnect', (reason) => {
      console.log('[채팅 웹소켓] 연결 해제:', reason);
    });

    // 채팅 메시지 수신 (백엔드: new_message 이벤트)
    socket.on('new_message', (data) => {
      console.log('[채팅 웹소켓] 메시지 수신:', data);
      
      if (onMessageReceivedRef.current) {
        // 백엔드에서 String으로 보내므로 JSON 파싱 시도
        let messageData;
        try {
          messageData = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
          // JSON이 아니면 문자열로 처리
          messageData = { content: data };
        }
        
        const msgUserId = messageData.userId ? String(messageData.userId) : null;
        const isMyMessage = msgUserId === String(currentUserId);
        const userName = msgUserId ? (workspaceUsers.get(msgUserId) || messageData.userName || '알 수 없음') : null;
        
        const message = {
          id: messageData.id || Date.now() + Math.random(),
          text: messageData.content || messageData.text || (typeof data === 'string' ? data : ''),
          sender: msgUserId ? (isMyMessage ? 'me' : 'other') : 'system',
          userName: userName,
          userId: msgUserId,
          time: messageData.createdAt 
            ? new Date(messageData.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          timestamp: messageData.createdAt ? new Date(messageData.createdAt).getTime() : Date.now()
        };

        onMessageReceivedRef.current(message);
      }
    });

    // 연결 해제 시 정리
    return () => {
      if (socket) {
        console.log('[채팅 웹소켓] 연결 종료');
        
        // 연결된 상태에서만 세션 나가기 및 연결 해제
        if (socket.connected) {
          const sessionId = String(workspaceId);
          socket.emit('leave_session', sessionId);
          socket.disconnect();
        } else {
          // 연결 중이거나 연결되지 않은 경우 바로 정리
          socket.removeAllListeners();
          socket.close();
        }
      }
    };
  }, [workspaceId, currentUserId, workspaceUsers]); // onMessageReceived 제거

  // 메시지 전송 함수 반환
  const sendMessage = (content) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('[채팅 웹소켓] 연결되지 않음, 메시지 전송 불가');
      return false;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return false;

    try {
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const userId = tokenPayload.user_id || tokenPayload.sub;

      // 백엔드는 String 타입으로 받으므로 JSON 문자열로 전송
      const messageData = JSON.stringify({
        workspaceId: workspaceId,
        userId: String(userId),
        content: content
      });

      socketRef.current.emit('chat_message', messageData);

      return true;
    } catch (error) {
      console.error('[채팅 웹소켓] 메시지 전송 실패:', error);
      return false;
    }
  };

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    sendMessage
  };
};

