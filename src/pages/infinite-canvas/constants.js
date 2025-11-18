/**
 * 무한 캔버스 관련 상수 정의
 * 테스트 및 유지보수를 위해 모든 조정 가능한 값들을 여기에 모아둡니다.
 */

// ============================================
// 캔버스 기본 설정
// ============================================
export const CANVAS_CONSTANTS = {
  // 초기 캔버스 크기 (해상도 기반)
  BASE_WIDTH: 1920,
  BASE_HEIGHT: 1080,
  SCALE_MULTIPLIER: 2, // 1920x1080의 2배 = 3840x2160
  
  // 초기 줌 레벨
  INITIAL_SCALE: 0.25, // 25%
  
  // 줌 범위
  MIN_SCALE: 0.05, // 최소 5%
  MAX_SCALE: 3, // 최대 300%
  
  // 줌 속도
  ZOOM_FACTOR: 0.1, // 10%씩 증가/감소
};

// ============================================
// 중앙 표시 점 (CenterIndicator) 설정
// ============================================
export const CENTER_INDICATOR_CONSTANTS = {
  // 초록 공 크기
  DOT_SIZE: 15, // 실제 초록 공의 크기 (px)
  HOVER_AREA_SIZE: 50, // 호버/클릭 감지 영역 크기 (px)
  HOVER_SCALE: 1.5, // 호버 시 크기 증가 배율
  
  // 초록 공 색상
  DOT_COLOR: '#01cd15', // 초록색
  DOT_SHADOW: '0 2px 8px rgba(1, 205, 21, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.8)',
  
  // 기본 위치 오프셋 (캔버스 좌표계 기준)
  DEFAULT_OFFSET_X: 100, // 캔버스 중앙(0,0)에서 오른쪽으로 100px
  DEFAULT_OFFSET_Y: 100, // 캔버스 중앙(0,0)에서 아래로 100px
  
  // 여백 및 마진
  VISIBILITY_MARGIN: 20, // 화면 안에 있는지 확인할 때의 여유 공간 (px)
  EDGE_MARGIN: 30, // 화면 가장자리에서의 여백 (px)
  
  // 애니메이션
  TRANSITION_DURATION: '0.05s', // 위치 변경 애니메이션 시간
  HOVER_TRANSITION_DURATION: '0.2s', // 호버 애니메이션 시간
  TRANSITION_TIMING: 'linear', // 위치 변경 애니메이션 타이밍
  HOVER_TRANSITION_TIMING: 'ease-out', // 호버 애니메이션 타이밍
  
  // Z-index
  Z_INDEX: 10002,
};

// ============================================
// 패널 설정
// ============================================
export const PANEL_CONSTANTS = {
  // 패널 너비
  CHAT_PANEL_WIDTH: 280, // 채팅 패널 너비 (px)
  CLUSTERING_PANEL_WIDTH: 280, // 클러스터링 패널 너비 (px)
  
  // 패널 애니메이션
  PANEL_TRANSITION_DURATION: '0.35s', // 패널 열고 닫기 애니메이션 시간
  PANEL_TRANSITION_TIMING: 'cubic-bezier(0.4, 0, 0.2, 1)', // 패널 애니메이션 타이밍
};

// ============================================
// 플로팅 툴바 설정
// ============================================
export const TOOLBAR_CONSTANTS = {
  // 위치
  BOTTOM_OFFSET: 16, // 하단에서 떨어진 거리 (px)
  
  // 크기
  BUTTON_SIZE: 32, // 버튼 크기 (px)
  BUTTON_PADDING: 8, // 버튼 패딩 (px)
  TOTAL_HEIGHT: 40, // 전체 높이 (버튼 32px + 패딩 8px)
  
  // 아이콘 크기
  ICON_SIZE: 16, // SVG 아이콘 크기 (px)
  
  // Z-index
  Z_INDEX: 9999,
};

// ============================================
// 캔버스 영역 설정
// ============================================
export const CANVAS_AREA_CONSTANTS = {
  // 텍스트 필드 정렬 간격
  TEXT_ARRANGE_SPACING: 250, // 텍스트 필드 간 간격 (px)
  
  // 드래그 감지 임계값
  DRAG_THRESHOLD: 5, // 드래그로 인식하는 최소 이동 거리 (px)
  
  // 삭제 모드
  DELETE_LONG_PRESS_DURATION: 1500, // 길게 누르기 시간 (ms)
  DELETE_PROGRESS_UPDATE_INTERVAL: 100, // 진행률 업데이트 간격 (ms)
  DELETE_BORDER_MIN: 6, // 삭제 진행 중 최소 테두리 두께 (px)
  DELETE_BORDER_MAX: 24, // 삭제 진행 중 최대 테두리 두께 (px)
  DELETE_WARNING_THRESHOLD: 80, // 경고 표시 임계값 (%)
};

// ============================================
// 애니메이션 설정
// ============================================
export const ANIMATION_CONSTANTS = {
  // 위치 이동 애니메이션
  MOVE_DURATION: 500, // 위치 이동 애니메이션 시간 (ms)
  MOVE_EASING: 'easeOutCubic', // 위치 이동 이징 함수
  
  // 스크롤바 표시 시간
  SCROLLBAR_TIMEOUT: 500, // 스크롤 후 스크롤바가 사라지는 시간 (ms)
};

// ============================================
// 툴바 영역 계산용 상수
// ============================================
export const TOOLBAR_AREA_CONSTANTS = {
  // 툴바 영역 계산 (중앙 하단)
  TOOLBAR_WIDTH_ESTIMATE: 100, // 툴바 너비 추정값 (px) - 중앙 기준 좌우 각각
  TOOLBAR_BOTTOM_OFFSET: 16, // 하단에서 떨어진 거리 (px)
  TOOLBAR_HEIGHT: 40, // 툴바 높이 (px)
};

// ============================================
// 계산된 값들 (자동 계산)
// ============================================
export const COMPUTED_CONSTANTS = {
  // 캔버스 초기 크기
  get INITIAL_CANVAS_WIDTH() {
    return CANVAS_CONSTANTS.BASE_WIDTH * CANVAS_CONSTANTS.SCALE_MULTIPLIER;
  },
  get INITIAL_CANVAS_HEIGHT() {
    return CANVAS_CONSTANTS.BASE_HEIGHT * CANVAS_CONSTANTS.SCALE_MULTIPLIER;
  },
  
  // 툴바 총 높이
  get TOOLBAR_TOTAL_HEIGHT() {
    return TOOLBAR_AREA_CONSTANTS.TOOLBAR_BOTTOM_OFFSET + TOOLBAR_AREA_CONSTANTS.TOOLBAR_HEIGHT;
  },
};

