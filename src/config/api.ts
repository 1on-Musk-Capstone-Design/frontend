/**
 * API 설정
 * 모든 API 기본 URL을 여기서 관리합니다.
 * 환경에 따라 HTTP/HTTPS 자동 선택
 * 
 * - 로컬 개발: http://localhost:3000 → http://51.20.106.74:8080/api
 * - 프로덕션: https://on-it.kro.kr → /api (Nginx 프록시)
 */

export const getApiBaseUrl = (): string => {
  // 현재 호스트 확인
  const hostname = window.location.hostname;
  
  // 로컬 개발 환경 (localhost:3000)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://51.20.106.74:8080/api';
  }
  
  // 프로덕션 환경 (on-it.kro.kr): 같은 서버에 배포되면 상대 경로 사용 (Nginx 프록시 사용)
  // Nginx가 /api 경로를 백엔드로 프록시하므로 상대 경로 사용
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * STOMP WebSocket 서버 주소
 * 환경에 따라 ws/wss 자동 선택
 * 
 * - 로컬 개발 (localhost:3000): Vite 프록시를 통해 백엔드 WebSocket 사용
 * - 프로덕션 (on-it.kro.kr): Nginx 프록시를 통해 백엔드 WebSocket 사용
 * 
 * SockJS는 http:// 또는 https:// 프로토콜을 받아서 자동으로 ws/wss로 변환합니다.
 */
export const getSocketServerUrl = (): string => {
  // 현재 호스트 확인
  const hostname = window.location.hostname;
  
  // 로컬 개발 환경 (localhost:3000): 백엔드 서버 직접 사용
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 로컬에서는 백엔드 WebSocket 서버 직접 사용
    // 백엔드 context-path가 /api이므로 /api 포함
    // SockJS가 /ws를 추가하므로 최종 경로는 /api/ws가 됨
    return 'http://51.20.106.74:8080/api';
  }
  
  // 프로덕션 환경 (on-it.kro.kr): Nginx 프록시 사용
  // Nginx가 /ws 경로를 백엔드 WebSocket으로 프록시하므로 상대 경로 사용
  // SockJS는 현재 프로토콜(http/https)에 맞춰 자동으로 ws/wss로 변환
  // window.location.origin을 사용하여 현재 프로토콜과 호스트 포함
  return `${window.location.origin}/api`;
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

