import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { SOCKET_SERVER_URL } from '../../../config/api';

/**
 * 캔버스 웹소켓 연결 훅 (실시간 협업용)
 * @param {number} workspaceId - 워크스페이스 ID
 * @param {string} currentUserId - 현재 사용자 ID
 * @param {Object} callbacks - 이벤트 콜백 함수들
 */
export const useCanvasWebSocket = (workspaceId, currentUserId, callbacks = {}) => {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef(callbacks);
  
  // 콜백 함수들을 ref에 저장하여 최신 버전 유지
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!workspaceId || !currentUserId) return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    
    // 이미 연결되어 있으면 재연결하지 않음
    if (clientRef.current && clientRef.current.active && clientRef.current.connected) {
      console.log('[캔버스 웹소켓] 이미 연결되어 있음, 재연결 스킵');
      return;
    }

    // STOMP 클라이언트 생성
    const socket = new SockJS(`${SOCKET_SERVER_URL}/ws`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
        workspaceId: String(workspaceId),
        userId: String(currentUserId)
      },
      onConnect: (frame) => {
        console.log('[캔버스 웹소켓] STOMP 연결 성공:', frame);
        setIsConnected(true);
        
        // 워크스페이스 참여
        stompClient.publish({
          destination: `/app/workspace/join`,
          body: JSON.stringify({ workspaceId: String(workspaceId) }),
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        // 아이디어 업데이트 구독 (백엔드: /topic/workspace/{workspaceId}/ideas)
        // 백엔드 형식: {"action": "created|updated|deleted", "data": {...}}
        const ideasSubscriptionPath = `/topic/workspace/${workspaceId}/ideas`;
        console.log('[캔버스 웹소켓] 아이디어 구독 경로:', ideasSubscriptionPath);
        stompClient.subscribe(ideasSubscriptionPath, (message) => {
          console.log('[캔버스 웹소켓] ===== 아이디어 업데이트 수신 =====');
          console.log('[캔버스 웹소켓] 메시지 body:', message.body);
          
          try {
            const updateData = JSON.parse(message.body);
            console.log('[캔버스 웹소켓] 파싱된 데이터:', updateData);
            
            // 백엔드 형식: {"action": "created|updated|deleted", "data": {...}}
            // data 필드에서 실제 아이디어 정보 추출
            const ideaData = updateData.data || updateData;
            const action = updateData.action || 'update';
            
            console.log('[캔버스 웹소켓] 아이디어 액션:', action);
            console.log('[캔버스 웹소켓] 아이디어 데이터:', ideaData);
            
            if (callbacksRef.current.onIdeaUpdated) {
              // 백엔드 형식에 맞게 데이터 변환
              callbacksRef.current.onIdeaUpdated({
                action: action,
                ...ideaData
              });
            }
          } catch (e) {
            console.error('[캔버스 웹소켓] 메시지 파싱 오류:', e);
            console.error('[캔버스 웹소켓] 원본 body:', message.body);
          }
        });

        // 캔버스 변경 구독 (백엔드: /topic/workspace/{workspaceId}/canvas)
        // 백엔드 형식: {"action": "created|updated|deleted", "data": {...}}
        const canvasSubscriptionPath = `/topic/workspace/${workspaceId}/canvas`;
        console.log('[캔버스 웹소켓] 캔버스 구독 경로:', canvasSubscriptionPath);
        stompClient.subscribe(canvasSubscriptionPath, (message) => {
          console.log('[캔버스 웹소켓] ===== 캔버스 변경 수신 =====');
          console.log('[캔버스 웹소켓] 메시지 body:', message.body);
          
          try {
            const updateData = JSON.parse(message.body);
            console.log('[캔버스 웹소켓] 파싱된 데이터:', updateData);
            
            // 백엔드 형식: {"action": "created|updated|deleted", "data": {...}}
            const canvasData = updateData.data || updateData;
            const action = updateData.action || 'update';
            
            console.log('[캔버스 웹소켓] 캔버스 액션:', action);
            console.log('[캔버스 웹소켓] 캔버스 데이터:', canvasData);
            
            // 캔버스 변경은 아이디어 업데이트와 동일하게 처리
            if (callbacksRef.current.onIdeaUpdated) {
              callbacksRef.current.onIdeaUpdated({
                action: action,
                ...canvasData
              });
            }
          } catch (e) {
            console.error('[캔버스 웹소켓] 캔버스 변경 파싱 오류:', e);
            console.error('[캔버스 웹소켓] 원본 body:', message.body);
          }
        });

        // 참가자 참여/나가기 구독 (백엔드: /topic/workspace/{workspaceId}/users)
        const usersSubscriptionPath = `/topic/workspace/${workspaceId}/users`;
        console.log('[캔버스 웹소켓] 사용자 구독 경로:', usersSubscriptionPath);
        stompClient.subscribe(usersSubscriptionPath, (message) => {
          console.log('[캔버스 웹소켓] 참가자 이벤트:', message.body);
          
          try {
            const data = JSON.parse(message.body);
            if (data.type === 'joined' || data.action === 'join') {
              if (callbacksRef.current.onParticipantJoined) {
                callbacksRef.current.onParticipantJoined(data);
              }
            } else if (data.type === 'left' || data.action === 'leave') {
              if (callbacksRef.current.onParticipantLeft) {
                callbacksRef.current.onParticipantLeft(data);
              }
            }
          } catch (e) {
            console.error('[캔버스 웹소켓] 참가자 이벤트 파싱 오류:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[캔버스 웹소켓] STOMP 오류:', frame);
        console.error('[캔버스 웹소켓] STOMP 오류 상세:', {
          command: frame.command,
          headers: frame.headers,
          body: frame.body
        });
        setIsConnected(false);
      },
      onWebSocketClose: (event) => {
        console.log('[캔버스 웹소켓] 연결 해제:', event);
        console.log('[캔버스 웹소켓] 연결 해제 상세:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        setIsConnected(false);
      },
      onDisconnect: () => {
        console.log('[캔버스 웹소켓] 연결 종료');
        setIsConnected(false);
      },
      onWebSocketError: (event) => {
        console.error('[캔버스 웹소켓] WebSocket 오류:', event);
      }
    });

    clientRef.current = stompClient;
    
    // 연결 시도
    console.log('[캔버스 웹소켓] 연결 시도:', `${SOCKET_SERVER_URL}/ws`);
    stompClient.activate();

    // 연결 해제 시 정리
    return () => {
      if (stompClient) {
        console.log('[캔버스 웹소켓] 연결 종료');
        
        // 연결이 활성화되어 있고 연결된 상태에서만 나가기 메시지 전송
        if (stompClient.active && stompClient.connected) {
          const sessionId = String(workspaceId);
          const accessToken = localStorage.getItem('accessToken');
          if (accessToken) {
            try {
              stompClient.publish({
                destination: `/app/workspace/leave`,
                body: JSON.stringify({ workspaceId: sessionId }),
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              });
            } catch (error) {
              console.warn('[캔버스 웹소켓] 나가기 메시지 전송 실패:', error);
            }
          }
        }
        
        // 연결 해제
        if (stompClient.active) {
          stompClient.deactivate();
        }
      }
    };
  }, [workspaceId, currentUserId]);

  // 아이디어 업데이트 이벤트 전송
  const emitIdeaUpdate = (ideaData) => {
    console.log('[캔버스 웹소켓] emitIdeaUpdate 호출:', {
      ideaData,
      hasClient: !!clientRef.current,
      isActive: clientRef.current?.active,
      isConnected: isConnected,
      clientConnected: clientRef.current?.connected
    });
    
    if (!clientRef.current) {
      console.warn('[캔버스 웹소켓] 클라이언트가 없음');
      return false;
    }
    
    // active와 connected 모두 확인
    if (!clientRef.current.active || !clientRef.current.connected) {
      console.warn('[캔버스 웹소켓] STOMP 연결되지 않음:', {
        active: clientRef.current.active,
        connected: clientRef.current.connected
      });
      return false;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.warn('[캔버스 웹소켓] accessToken 없음');
      return false;
    }

    try {
      const updateData = {
        workspaceId: workspaceId,
        ...ideaData
      };

      console.log('[캔버스 웹소켓] 아이디어 업데이트 전송:', {
        destination: '/app/idea/update',
        updateData
      });

      // STOMP를 통해 메시지 전송 (백엔드: /app/idea/update)
      clientRef.current.publish({
        destination: `/app/idea/update`,
        body: JSON.stringify(updateData),
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      console.log('[캔버스 웹소켓] 아이디어 업데이트 전송 완료');
      return true;
    } catch (error) {
      console.error('[캔버스 웹소켓] 아이디어 업데이트 이벤트 전송 실패:', error);
      return false;
    }
  };

  return {
    client: clientRef.current,
    isConnected: isConnected,
    emitIdeaUpdate
  };
};

