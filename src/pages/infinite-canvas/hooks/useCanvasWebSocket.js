import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../../../config/api';

/**
 * 캔버스 웹소켓 연결 훅 (실시간 협업용)
 * @param {number} workspaceId - 워크스페이스 ID
 * @param {string} currentUserId - 현재 사용자 ID
 * @param {Object} callbacks - 이벤트 콜백 함수들
 */
export const useCanvasWebSocket = (workspaceId, currentUserId, callbacks = {}) => {
  const socketRef = useRef(null);
  const callbacksRef = useRef(callbacks);
  
  // 콜백 함수들을 ref에 저장하여 최신 버전 유지
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

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
      console.log('[캔버스 웹소켓] 연결 성공:', socket.id);
      
      // 세션 참여 (workspaceId를 sessionId로 사용)
      const sessionId = String(workspaceId);
      socket.emit('join_session', sessionId);
    });

    // 연결 확인 메시지 수신
    socket.on('connected', (message) => {
      console.log('[캔버스 웹소켓] 서버 연결 확인:', message);
    });

    // 세션 참여 성공
    socket.on('joined_session', (message) => {
      console.log('[캔버스 웹소켓] 세션 참여 성공:', message);
    });

    // 다른 사용자 참여 알림
    socket.on('user_joined', (message) => {
      console.log('[캔버스 웹소켓] 다른 사용자 참여:', message);
      if (callbacksRef.current.onParticipantJoined) {
        callbacksRef.current.onParticipantJoined({ message });
      }
    });

    // 다른 사용자 나가기 알림
    socket.on('user_left', (message) => {
      console.log('[캔버스 웹소켓] 다른 사용자 나가기:', message);
      if (callbacksRef.current.onParticipantLeft) {
        callbacksRef.current.onParticipantLeft({ message });
      }
    });

    // 연결 오류
    socket.on('connect_error', (error) => {
      console.error('[캔버스 웹소켓] 연결 오류:', error);
      console.error('[캔버스 웹소켓] 오류 상세:', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context
      });
    });

    // 연결 해제
    socket.on('disconnect', (reason) => {
      console.log('[캔버스 웹소켓] 연결 해제:', reason);
    });

    // 아이디어 업데이트 알림 (백엔드: idea_updated 이벤트)
    socket.on('idea_updated', (data) => {
      console.log('[캔버스 웹소켓] 아이디어 업데이트:', data);
      
      // 백엔드에서 String으로 보내므로 JSON 파싱 시도
      let updateData;
      try {
        updateData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (e) {
        updateData = { data };
      }
      
      if (callbacksRef.current.onIdeaUpdated) {
        callbacksRef.current.onIdeaUpdated(updateData);
      }
    });

    // 연결 해제 시 정리
    return () => {
      if (socket) {
        console.log('[캔버스 웹소켓] 연결 종료');
        
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
  }, [workspaceId, currentUserId]); // callbacks 제거

  // 아이디어 업데이트 이벤트 전송 (백엔드: idea_update 이벤트)
  const emitIdeaUpdate = (ideaData) => {
    if (!socketRef.current || !socketRef.current.connected) return false;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return false;

    try {
      // 백엔드는 String 타입으로 받으므로 JSON 문자열로 전송
      const updateData = JSON.stringify({
        workspaceId: workspaceId,
        ...ideaData
      });

      socketRef.current.emit('idea_update', updateData);

      return true;
    } catch (error) {
      console.error('[캔버스 웹소켓] 아이디어 업데이트 이벤트 전송 실패:', error);
      return false;
    }
  };

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    emitIdeaUpdate
  };
};

