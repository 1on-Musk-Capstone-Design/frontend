/**
 * API 설정
 * 모든 API 기본 URL을 여기서 관리합니다.
 */

export const API_BASE_URL = "http://51.20.106.74:8080/api";

/**
 * STOMP WebSocket 서버 주소
 * Spring Boot STOMP는 같은 HTTP 서버 포트를 사용하므로 API_BASE_URL과 동일한 호스트/포트 사용
 * 백엔드 가이드에 따르면 /api/ws 엔드포인트 사용
 */
export const SOCKET_SERVER_URL = "http://51.20.106.74:8080/api";

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

