import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api.js';

/**
 * Socket.IO 서비스 클래스
 */
export class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Socket.IO 서버에 연결
   * @param {string} sessionId - 세션 ID (선택사항)
   */
  connect(sessionId = null) {
    if (this.socket && this.isConnected) {
      console.log('이미 연결되어 있습니다.');
      return;
    }

    try {
      this.socket = io(API_CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
      });

      // 연결 이벤트 리스너
      this.socket.on('connect', () => {
        console.log('Socket.IO 서버에 연결되었습니다.');
        this.isConnected = true;
        
        // 세션 ID가 있으면 세션에 참여
        if (sessionId) {
          this.joinSession(sessionId);
        }
      });

      this.socket.on('connected', (message) => {
        console.log('서버 연결 확인:', message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO 연결이 해제되었습니다:', reason);
        this.isConnected = false;
      });

      this.socket.on('error', (error) => {
        console.error('Socket.IO 오류:', error);
      });

      // 기존 리스너들 재등록
      this.reconnectListeners();

    } catch (error) {
      console.error('Socket.IO 연결 실패:', error);
    }
  }

  /**
   * 연결 해제
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * 세션에 참여
   * @param {string} sessionId - 세션 ID
   */
  joinSession(sessionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_session', sessionId);
    }
  }

  /**
   * 세션에서 나가기
   * @param {string} sessionId - 세션 ID
   */
  leaveSession(sessionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_session', sessionId);
    }
  }

  /**
   * 채팅 메시지 전송
   * @param {string} message - 메시지 내용
   */
  sendChatMessage(message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat_message', message);
    }
  }

  /**
   * 아이디어 업데이트 전송
   * @param {string} data - 업데이트 데이터
   */
  sendIdeaUpdate(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('idea_update', data);
    }
  }

  /**
   * 음성 채팅 참여
   * @param {string} sessionId - 세션 ID
   */
  joinVoiceChat(sessionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('voice_join', sessionId);
    }
  }

  /**
   * 음성 채팅 나가기
   * @param {string} sessionId - 세션 ID
   */
  leaveVoiceChat(sessionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('voice_leave', sessionId);
    }
  }

  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      // 리스너 저장 (재연결 시 사용)
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  /**
   * 이벤트 리스너 제거
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      // 저장된 리스너에서도 제거
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  /**
   * 재연결 시 리스너들 다시 등록
   */
  reconnectListeners() {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    });
  }

  /**
   * 연결 상태 확인
   * @returns {boolean} 연결 상태
   */
  getConnectionStatus() {
    return this.isConnected && this.socket?.connected;
  }
}

// 싱글톤 인스턴스 생성
export const socketService = new SocketService();
export default socketService;
