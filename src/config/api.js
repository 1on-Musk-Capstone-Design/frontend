// API 설정
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:9092',
  TIMEOUT: 10000,
};

// API 엔드포인트
export const API_ENDPOINTS = {
  HEALTH: '/health',
  WORKSPACES: '/api/v1/workspaces',
  OPENAI: {
    CLUSTER: '/api/openai/cluster',
    FEEDBACK: '/api/openai/feedback',
    SUMMARY: '/api/openai/summary',
    EMBEDDING: '/api/openai/embedding',
    EMBEDDINGS: '/api/openai/embeddings',
    TEST: '/api/openai/test',
  },
};
