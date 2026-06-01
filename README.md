# 무한 캔버스 프로젝트

피그마와 같은 무한 캔버스 기능을 구현한 React 애플리케이션입니다.

## 기능

- 🎨 **무한 캔버스**: 전체 화면을 차지하는 무제한 캔버스
- 🔍 **줌 인/아웃**: 마우스 휠로 확대/축소 가능
- 🖱️ **드래그 이동**: 캔버스를 자유롭게 드래그하여 이동
- 📝 **텍스트 필드 생성**: 캔버스 아무 곳이나 클릭하여 텍스트 필드 생성
- ✏️ **텍스트 편집**: 더블클릭으로 텍스트 편집 가능
- 🎯 **드래그 가능한 텍스트**: 생성된 텍스트 필드를 드래그하여 위치 이동
- 🗑️ **삭제 기능**: 텍스트 필드 삭제 가능

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 음성 통화 TURN 설정

다른 네트워크 환경에서 음성 연결이 불안정하면 TURN 서버를 붙이는 것을 권장합니다.

`frontend/.env` 또는 실행 환경에 아래 값을 설정하세요.

```bash
VITE_WEBRTC_TURN_URLS=turn:YOUR_TURN_HOST:3478,turns:YOUR_TURN_HOST:5349
VITE_WEBRTC_TURN_USERNAME=YOUR_TURN_USERNAME
VITE_WEBRTC_TURN_CREDENTIAL=YOUR_TURN_PASSWORD
VITE_WEBRTC_ICE_TRANSPORT_POLICY=relay
```

- `VITE_WEBRTC_TURN_URLS`: 쉼표로 구분한 TURN URL 목록
- `VITE_WEBRTC_TURN_USERNAME`: TURN 인증 사용자명
- `VITE_WEBRTC_TURN_CREDENTIAL`: TURN 인증 비밀번호
- `VITE_WEBRTC_ICE_TRANSPORT_POLICY`: `relay`를 권장, 필요 시 `all`

TURN 값을 넣지 않으면 기존처럼 STUN 기반으로 동작합니다.

## 사용법

1. **텍스트 필드 생성**: 캔버스 아무 곳이나 클릭
2. **캔버스 이동**: 빈 공간을 드래그
3. **줌**: 마우스 휠 사용
4. **텍스트 편집**: 텍스트 필드 더블클릭
5. **텍스트 이동**: 텍스트 필드 드래그
6. **텍스트 삭제**: 텍스트 필드의 ✕ 버튼 클릭
7. **초기화**: 좌측 상단 초기화 버튼 클릭

## 기술 스택

- React 18
- Vite
- Tailwind CSS
- HTML5 Canvas API (시뮬레이션)

## 프로젝트 구조

```
src/
├── App.jsx          # 메인 애플리케이션 컴포넌트
├── main.jsx         # React 앱 진입점
└── index.css        # 전역 스타일 및 Tailwind 설정
```
