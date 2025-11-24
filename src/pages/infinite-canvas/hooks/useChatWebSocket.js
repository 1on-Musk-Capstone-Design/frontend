import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { SOCKET_SERVER_URL } from '../../../config/api';

/**
 * 채팅 웹소켓 연결 훅
 * @param {number} workspaceId - 워크스페이스 ID
 * @param {string} currentUserId - 현재 사용자 ID
 * @param {Map} workspaceUsers - 사용자 ID -> 이름 매핑
 * @param {Function} onMessageReceived - 메시지 수신 콜백 함수
 */
export const useChatWebSocket = (workspaceId, currentUserId, workspaceUsers, onMessageReceived) => {
  const clientRef = useRef(null);
  const subscriptionsRef = useRef([]); // 구독 객체들을 저장
  const [isConnected, setIsConnected] = useState(false);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const workspaceUsersRef = useRef(workspaceUsers);
  
  // 콜백 함수를 ref에 저장하여 최신 버전 유지
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);
  
  // workspaceUsers를 ref에 저장하여 최신 버전 유지
  useEffect(() => {
    workspaceUsersRef.current = workspaceUsers;
  }, [workspaceUsers]);

  useEffect(() => {
    if (!workspaceId || !currentUserId) return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    
    // 이미 연결되어 있으면 재연결하지 않음
    if (clientRef.current && clientRef.current.active && clientRef.current.connected) {
      console.log('[채팅 웹소켓] 이미 연결되어 있음, 재연결 스킵');
      return;
    }

    // STOMP 클라이언트 생성
    // SockJS를 사용하여 WebSocket 연결 (Spring Boot STOMP와 호환)
    const socket = new SockJS(`${SOCKET_SERVER_URL}/ws`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // 디버그 모드 활성화
      debug: (str) => {
        // MESSAGE 프레임이 오는지 확인 (중요!)
        if (str.includes('MESSAGE')) {
          console.log('[채팅 웹소켓] ⭐⭐⭐ MESSAGE 프레임 수신됨! ⭐⭐⭐', str);
          // MESSAGE 프레임의 destination 확인
          if (str.includes('destination')) {
            const destinationMatch = str.match(/destination:([^\s]+)/);
            if (destinationMatch) {
              console.log('[채팅 웹소켓] MESSAGE destination:', destinationMatch[1]);
            }
          }
        }
        // ERROR 프레임 확인
        if (str.includes('ERROR')) {
          console.error('[채팅 웹소켓] ⚠️ ERROR 프레임 수신됨!', str);
        }
        // RECEIPT 프레임 확인 (백엔드가 메시지를 받았는지 확인)
        if (str.includes('RECEIPT')) {
          console.log('[채팅 웹소켓] ✅ RECEIPT 프레임 수신됨 (백엔드가 메시지 받음):', str);
        }
        // SEND 프레임 확인 (메시지 전송 확인)
        if (str.includes('SEND')) {
          console.log('[채팅 웹소켓] 📤 SEND 프레임:', str);
        }
        // SUBSCRIBE 프레임 확인
        if (str.includes('SUBSCRIBE')) {
          console.log('[채팅 웹소켓] 📥 SUBSCRIBE 프레임:', str);
        }
        // 일반 디버그 로그는 필요시만 출력
        if (str.includes('MESSAGE') || str.includes('ERROR') || str.includes('RECEIPT') || str.includes('SEND') || str.includes('SUBSCRIBE')) {
          console.log('[채팅 웹소켓] STOMP 디버그:', str);
        }
      },
      // 연결 시 헤더에 토큰 전달
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
        workspaceId: String(workspaceId),
        userId: String(currentUserId)
      },
      onConnect: (frame) => {
        console.log('[채팅 웹소켓] STOMP 연결 성공:', frame);
        setIsConnected(true);
        
        // 워크스페이스 참여
        stompClient.publish({
          destination: `/app/workspace/join`,
          body: JSON.stringify({ workspaceId: String(workspaceId) }),
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        // 채팅 메시지 구독 (백엔드: /topic/workspace/{workspaceId}/messages)
        // 백엔드가 숫자형 workspaceId를 사용하므로 숫자로 구독
        const subscriptionPath = `/topic/workspace/${workspaceId}/messages`;
        
        console.log('[채팅 웹소켓] 구독 경로:', subscriptionPath, 'workspaceId:', workspaceId, 'workspaceId 타입:', typeof workspaceId);
        
        try {
          const subscription = stompClient.subscribe(subscriptionPath, (message) => {
            console.log('[채팅 웹소켓] ===== ⭐⭐ 메시지 수신 ⭐⭐ =====');
            console.log('[채팅 웹소켓] 구독 경로:', subscriptionPath);
            console.log('[채팅 웹소켓] 메시지 body:', message.body);
            console.log('[채팅 웹소켓] 메시지 헤더:', message.headers);
            console.log('[채팅 웹소켓] 메시지 원본:', message);
            
            if (onMessageReceivedRef.current) {
              try {
                const messageData = JSON.parse(message.body);
                console.log('[채팅 웹소켓] 파싱된 메시지 데이터:', messageData);
                
                const msgUserId = messageData.userId ? String(messageData.userId) : null;
                const isMyMessage = msgUserId === String(currentUserId);
                console.log('[채팅 웹소켓] 메시지 사용자 ID:', msgUserId, '현재 사용자 ID:', currentUserId, '내 메시지?', isMyMessage);
                
                const userName = msgUserId ? (workspaceUsersRef.current.get(msgUserId) || messageData.userName || '알 수 없음') : null;
                
                const messageObj = {
                  id: messageData.id || Date.now() + Math.random(),
                  text: messageData.content || messageData.text || '',
                  sender: msgUserId ? (isMyMessage ? 'me' : 'other') : 'system',
                  userName: userName,
                  userId: msgUserId,
                  time: messageData.createdAt 
                    ? new Date(messageData.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                    : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                  timestamp: messageData.createdAt ? new Date(messageData.createdAt).getTime() : Date.now()
                };

                console.log('[채팅 웹소켓] 생성된 메시지 객체:', messageObj);
                console.log('[채팅 웹소켓] onMessageReceivedRef.current 존재?', !!onMessageReceivedRef.current);
                
                onMessageReceivedRef.current(messageObj);
                console.log('[채팅 웹소켓] 메시지 핸들러 호출 완료');
              } catch (e) {
                console.error('[채팅 웹소켓] 메시지 파싱 오류:', e);
                console.error('[채팅 웹소켓] 메시지 원본 body:', message.body);
              }
            } else {
              console.warn('[채팅 웹소켓] onMessageReceivedRef.current가 없음');
            }
          });
          
          // 구독 객체 저장
          subscriptionsRef.current.push({ path: subscriptionPath, subscription });
          console.log('[채팅 웹소켓] 구독 완료:', subscription, '경로:', subscriptionPath, '구독 ID:', subscription.id);
        } catch (subscribeError) {
          console.error('[채팅 웹소켓] 구독 오류:', subscriptionPath, subscribeError);
        }

        // 사용자 참여/나가기 알림 구독 (백엔드: /topic/workspace/{workspaceId}/users)
        const usersSubscriptionPath = `/topic/workspace/${workspaceId}/users`;
        console.log('[채팅 웹소켓] 사용자 구독 경로:', usersSubscriptionPath);
        stompClient.subscribe(usersSubscriptionPath, (message) => {
          console.log('[채팅 웹소켓] 사용자 이벤트:', message.body);
        });
      },
      onStompError: (frame) => {
        console.error('[채팅 웹소켓] STOMP 오류:', frame);
        console.error('[채팅 웹소켓] STOMP 오류 상세:', {
          command: frame.command,
          headers: frame.headers,
          body: frame.body
        });
        setIsConnected(false);
      },
      onWebSocketClose: (event) => {
        console.log('[채팅 웹소켓] 연결 해제:', event);
        console.log('[채팅 웹소켓] 연결 해제 상세:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        setIsConnected(false);
      },
      onDisconnect: () => {
        console.log('[채팅 웹소켓] 연결 종료');
        setIsConnected(false);
      },
      onWebSocketError: (event) => {
        console.error('[채팅 웹소켓] WebSocket 오류:', event);
      }
    });

    clientRef.current = stompClient;
    
    // 연결 시도
    console.log('[채팅 웹소켓] 연결 시도:', `${SOCKET_SERVER_URL}/ws`);
    stompClient.activate();

    // 연결 해제 시 정리
    return () => {
      if (stompClient) {
        console.log('[채팅 웹소켓] 연결 종료');
        
        // 구독 해제
        subscriptionsRef.current.forEach((sub) => {
          try {
            if (sub.subscription && typeof sub.subscription.unsubscribe === 'function') {
              sub.subscription.unsubscribe();
              console.log('[채팅 웹소켓] 구독 해제:', sub.path);
            }
          } catch (e) {
            console.warn('[채팅 웹소켓] 구독 해제 오류:', sub.path, e);
          }
        });
        subscriptionsRef.current = [];
        
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
              console.warn('[채팅 웹소켓] 나가기 메시지 전송 실패:', error);
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

  // 메시지 전송 함수 반환
  const sendMessage = (content) => {
    console.log('[채팅 웹소켓] sendMessage 호출:', {
      content,
      hasClient: !!clientRef.current,
      isActive: clientRef.current?.active,
      isConnected: isConnected,
      clientConnected: clientRef.current?.connected
    });
    
    if (!clientRef.current) {
      console.warn('[채팅 웹소켓] 클라이언트가 없음');
      return false;
    }
    
    // active와 connected 모두 확인
    if (!clientRef.current.active || !clientRef.current.connected) {
      console.warn('[채팅 웹소켓] STOMP 연결되지 않음:', {
        active: clientRef.current.active,
        connected: clientRef.current.connected
      });
      return false;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.warn('[채팅 웹소켓] accessToken 없음');
      return false;
    }

    try {
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const userId = tokenPayload.user_id || tokenPayload.sub;

      // 백엔드가 기대하는 메시지 형식
      // 백엔드 가이드에 따르면 /app/chat/message로 전송
      // workspaceId와 userId는 숫자형으로 전송
      const messageData = {
        workspaceId: Number(workspaceId),
        userId: Number(userId),
        content: content
      };

      console.log('[채팅 웹소켓] 메시지 전송:', {
        destination: '/app/chat/message',
        messageData,
        bodyString: JSON.stringify(messageData),
        workspaceId: workspaceId,
        workspaceIdType: typeof workspaceId
      });

      // STOMP를 통해 메시지 전송 (백엔드: /app/chat/message)
      try {
        console.log('[채팅 웹소켓] 전송 시도: /app/chat/message');
        console.log('[채팅 웹소켓] 전송할 메시지 데이터:', messageData);
        console.log('[채팅 웹소켓] 전송할 메시지 JSON:', JSON.stringify(messageData));
        
        const publishResult = clientRef.current.publish({
          destination: '/app/chat/message',
          body: JSON.stringify(messageData),
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        console.log('[채팅 웹소켓] publish 호출 완료: /app/chat/message');
        console.log('[채팅 웹소켓] publish 결과:', publishResult);
        
        // 백엔드가 메시지를 받았는지 확인하기 위해 잠시 대기
        // RECEIPT 프레임이 오는지 확인 (디버그 로그에서 확인 가능)
        console.log('[채팅 웹소켓] 백엔드 응답 대기 중... (RECEIPT 프레임 확인)');
      } catch (publishError) {
        console.error('[채팅 웹소켓] publish 오류:', publishError);
        throw publishError;
      }
        
        // 백엔드가 메시지를 받았는지 확인하기 위해 잠시 대기 후 구독 상태 확인
        setTimeout(() => {
          console.log('[채팅 웹소켓] 메시지 전송 후 구독 상태 확인:');
          console.log('[채팅 웹소켓] 활성 구독 개수:', subscriptionsRef.current.length);
          subscriptionsRef.current.forEach((sub, idx) => {
            console.log(`[채팅 웹소켓] 구독 ${idx}:`, {
              path: sub.path,
              id: sub.subscription?.id,
              active: sub.subscription ? true : false
            });
          });
          
          // 브로드캐스트 메시지가 오지 않았는지 확인
          console.warn('[채팅 웹소켓] ⚠️ 브로드캐스트 메시지가 수신되지 않았습니다.');
          console.warn('[채팅 웹소켓] 가능한 원인:');
          console.warn('  1. 백엔드가 /app/chat/message를 처리하지 않음');
          console.warn('  2. 백엔드가 /topic/workspace/{workspaceId}/messages로 브로드캐스트하지 않음');
          console.warn('  3. 구독 경로가 잘못됨 (현재 구독 경로:', `/topic/workspace/${workspaceId}/messages`, ')');
          console.warn('[채팅 웹소켓] 백엔드 로그를 확인하고 다음을 확인하세요:');
          console.warn('  - @MessageMapping("/chat/message") 또는 @MessageMapping("/app/chat/message") 존재 여부');
          console.warn('  - SimpMessagingTemplate.convertAndSend("/topic/workspace/" + workspaceId + "/messages", ...) 호출 여부');
        }, 2000); // 2초 대기하여 브로드캐스트 메시지 확인
      
      console.log('[채팅 웹소켓] 구독 경로 확인:', `/topic/workspace/${workspaceId}/messages`);
      console.log('[채팅 웹소켓] 백엔드가 이 메시지를 받아서 브로드캐스트해야 함');
      
      // 구독 상태 확인 (디버깅용)
      setTimeout(() => {
        console.log('[채팅 웹소켓] 저장된 구독 개수:', subscriptionsRef.current.length);
        subscriptionsRef.current.forEach((sub, idx) => {
          console.log(`[채팅 웹소켓] 구독 ${idx}:`, sub.path, '구독 ID:', sub.subscription?.id);
        });
        
        if (clientRef.current) {
          console.log('[채팅 웹소켓] STOMP 클라이언트 상태:', {
            active: clientRef.current.active,
            connected: clientRef.current.connected
          });
        }
      }, 1000);

      console.log('[채팅 웹소켓] 메시지 전송 완료');
      return true;
    } catch (error) {
      console.error('[채팅 웹소켓] 메시지 전송 실패:', error);
      return false;
    }
  };

  return {
    client: clientRef.current,
    isConnected: isConnected,
    sendMessage
  };
};

