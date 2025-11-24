/**
 * API 설정
 * 모든 API 기본 URL을 여기서 관리합니다.
 * 환경에 따라 HTTP/HTTPS 자동 선택
 */

export const getApiBaseUrl = (): string => {
  // 현재 프로토콜 확인
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // 로컬 개발 환경
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://51.20.106.74:8080/api';
  }
  
  // 프로덕션 환경 (HTTPS인 경우)
  if (protocol === 'https:') {
    // HTTPS로 배포된 경우 API도 HTTPS 사용 (Mixed Content 방지)
    return 'https://51.20.106.74:8080/api';
  }
  
  // 기본값 (HTTP)
  return 'http://51.20.106.74:8080/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * STOMP WebSocket 서버 주소
 * 환경에 따라 ws/wss 자동 선택
 * - 로컬 개발 환경 (localhost:3000): ws://localhost:3000
 * - 프로덕션 환경 (https://mingjaam.github.io/onit/): wss:// (HTTPS 기반)
 * 
 * SockJS는 http:// 또는 https:// 프로토콜을 받아서 자동으로 ws/wss로 변환합니다.
 */
export const getSocketServerUrl = (): string => {
  // 현재 호스트 확인
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // 로컬 개발 환경
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 로컬에서는 ws://localhost:3000 사용
    // SockJS는 http://를 받아서 자동으로 ws://로 변환
    return 'http://localhost:3000';
  }
  
  // 프로덕션 환경 (https://mingjaam.github.io/onit/ 등)
  if (protocol === 'https:') {
    // 프로덕션 서버 주소 (HTTPS 기반이므로 SockJS가 자동으로 wss로 변환)
    // 실제 WebSocket 서버 주소 사용
    return 'https://51.20.106.74:8080/api';
  }
  
  // 기본값 (HTTP인 경우 ws 사용)
  return 'http://51.20.106.74:8080/api';
};

export const SOCKET_SERVER_URL = getSocketServerUrl();

/**
 * API 엔드포인트 헬퍼 함수
 */
export const getApiUrl = (endpoint: string): string => {
  // endpoint가 이미 전체 URL이면 그대로 반환
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  // endpoint가 /로 시작하면 API_BASE_URL과 결합
  return `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

