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
 * 썸네일 URL 정규화
 * - 로컬 개발 환경: localhost:8080을 원격 서버로 치환
 * - 프로덕션 환경: HTTP URL을 상대 경로로 변환하여 Mixed Content 오류 방지
 */
export const normalizeThumbnailUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const hostname = window.location.hostname;
  const isProduction = hostname === 'on-it.kro.kr' || hostname.includes('on-it.kro.kr');
  
  // 로컬 개발 환경: localhost:8080을 원격 서버로 치환
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && url.includes('localhost:8080')) {
    return url.replace('http://localhost:8080/api', 'http://51.20.106.74:8080/api');
  }
  
  // 프로덕션 환경: HTTP URL을 상대 경로로 변환 (Nginx 프록시 사용)
  if (isProduction) {
    // http://51.20.106.74:8080/api/uploads/... → /api/uploads/...
    if (url.includes('http://51.20.106.74:8080/api')) {
      return url.replace('http://51.20.106.74:8080/api', '/api');
    }
    // http://localhost:8080/api/uploads/... → /api/uploads/...
    if (url.includes('http://localhost:8080/api')) {
      return url.replace('http://localhost:8080/api', '/api');
    }
    // 다른 HTTP URL도 상대 경로로 변환
    if (url.startsWith('http://') && url.includes('/api/')) {
      const match = url.match(/\/api\/.*$/);
      if (match) {
        return match[0];
      }
    }
  }
  
  return url;
};

/**
 * OAuth 리다이렉트 URI 생성
 * 환경에 따라 로컬 또는 프로덕션 URL 반환
 * 
 * @param callbackPath - 콜백 경로 (기본값: '/auth/callback')
 * @param customOrigin - 커스텀 origin (기본값: null, 현재 origin 사용)
 * @returns OAuth 리다이렉트 URI
 */
export const getOAuthRedirectUri = (
  callbackPath: string = '/auth/callback',
  customOrigin?: string
): string => {
  // 커스텀 origin이 지정된 경우 사용
  if (customOrigin) {
    return `${customOrigin}${callbackPath}`;
  }
  
  // 현재 호스트 확인
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // 로컬 개발 환경 (localhost:3000)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const origin = `${protocol}//${hostname}:${port || '3000'}`;
    return `${origin}${callbackPath}`;
  }
  
  // 프로덕션 환경: 현재 origin 사용
  return `${window.location.origin}${callbackPath}`;
};

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

