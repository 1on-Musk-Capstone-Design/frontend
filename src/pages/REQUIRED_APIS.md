# 프론트엔드에서 필요한 추가 API 명세서

현재 API 명세서를 분석한 결과, 실시간 협업 캔버스를 구현하기 위해 다음 API들이 추가로 필요합니다.

## 1. 실시간 협업을 위한 WebSocket/Socket.IO 이벤트

### 1.1 연결 및 인증
```
연결: ws://localhost:8080/socket.io
인증: JWT 토큰을 쿼리 파라미터 또는 헤더로 전달
```

### 1.2 이벤트 목록

#### 클라이언트 → 서버

**워크스페이스 참가**
```javascript
socket.emit('join-workspace', {
  workspaceId: number,
  userId: string,
  userName: string
});
```

**워크스페이스 나가기**
```javascript
socket.emit('leave-workspace', {
  workspaceId: number,
  userId: string
});
```

**텍스트 필드(아이디어) 생성**
```javascript
socket.emit('idea-created', {
  workspaceId: number,
  canvasId: number,
  idea: {
    id: number,
    content: string,
    positionX: number,
    positionY: number,
    width: number | null,
    height: number | null
  },
  userId: string
});
```

**텍스트 필드(아이디어) 수정**
```javascript
socket.emit('idea-updated', {
  workspaceId: number,
  ideaId: number,
  updates: {
    content?: string,
    positionX?: number,
    positionY?: number,
    width?: number | null,
    height?: number | null
  },
  userId: string
});
```

**텍스트 필드(아이디어) 삭제**
```javascript
socket.emit('idea-deleted', {
  workspaceId: number,
  ideaId: number,
  userId: string
});
```

**배치 업데이트 (여러 텍스트 필드 한 번에 업데이트)**
```javascript
socket.emit('ideas-batch-updated', {
  workspaceId: number,
  updates: [
    {
      ideaId: number,
      content?: string,
      positionX?: number,
      positionY?: number,
      width?: number | null,
      height?: number | null
    }
  ],
  userId: string
});
```

**캔버스 뷰포트 상태 동기화 (선택사항)**
```javascript
socket.emit('viewport-changed', {
  workspaceId: number,
  canvasId: number,
  viewport: {
    x: number,
    y: number,
    scale: number
  },
  userId: string
});
```

**참가자 커서 위치 공유 (선택사항)**
```javascript
socket.emit('cursor-moved', {
  workspaceId: number,
  canvasId: number,
  cursor: {
    x: number,
    y: number
  },
  userId: string
});
```

**텍스트 편집 중 상태 공유**
```javascript
socket.emit('idea-editing', {
  workspaceId: number,
  ideaId: number,
  isEditing: boolean,
  userId: string,
  userName: string
});
```

#### 서버 → 클라이언트

**참가자 참가 알림**
```javascript
socket.on('participant-joined', (data) => {
  // data: { userId: string, userName: string, workspaceId: number }
});
```

**참가자 나가기 알림**
```javascript
socket.on('participant-left', (data) => {
  // data: { userId: string, workspaceId: number }
});
```

**텍스트 필드 생성 알림**
```javascript
socket.on('idea-created', (data) => {
  // data: {
  //   idea: IdeaResponse,
  //   userId: string
  // }
});
```

**텍스트 필드 수정 알림**
```javascript
socket.on('idea-updated', (data) => {
  // data: {
  //   ideaId: number,
  //   updates: { ... },
  //   userId: string
  // }
});
```

**텍스트 필드 삭제 알림**
```javascript
socket.on('idea-deleted', (data) => {
  // data: {
  //   ideaId: number,
  //   userId: string
  // }
});
```

**배치 업데이트 알림**
```javascript
socket.on('ideas-batch-updated', (data) => {
  // data: {
  //   updates: Array<{ ideaId, updates }>,
  //   userId: string
  // }
});
```

**다른 참가자의 뷰포트 변경 알림 (선택사항)**
```javascript
socket.on('viewport-changed', (data) => {
  // data: {
  //   viewport: { x, y, scale },
  //   userId: string
  // }
});
```

**다른 참가자의 커서 위치 알림 (선택사항)**
```javascript
socket.on('cursor-moved', (data) => {
  // data: {
  //   cursor: { x, y },
  //   userId: string,
  //   userName: string
  // }
});
```

**다른 참가자의 텍스트 편집 상태 알림**
```javascript
socket.on('idea-editing', (data) => {
  // data: {
  //   ideaId: number,
  //   isEditing: boolean,
  //   userId: string,
  //   userName: string
  // }
});
```

## 2. REST API 추가/수정 사항

### 2.1 IdeaRequest/IdeaResponse 스키마 수정

**IdeaRequest에 추가 필요:**
```json
{
  "width": {
    "type": "number",
    "format": "double",
    "nullable": true,
    "description": "텍스트 필드 너비 (null이면 기본값 사용)"
  },
  "height": {
    "type": "number",
    "format": "double",
    "nullable": true,
    "description": "텍스트 필드 높이 (null이면 기본값 사용)"
  }
}
```

**IdeaResponse에 추가 필요:**
```json
{
  "width": {
    "type": "number",
    "format": "double",
    "nullable": true
  },
  "height": {
    "type": "number",
    "format": "double",
    "nullable": true
  }
}
```

### 2.2 배치 업데이트 API

**POST /v1/ideas/batch**
```json
{
  "workspaceId": number,
  "updates": [
    {
      "ideaId": number,
      "content": string (optional),
      "positionX": number (optional),
      "positionY": number (optional),
      "width": number | null (optional),
      "height": number | null (optional)
    }
  ]
}
```

**Response:**
```json
{
  "success": boolean,
  "updatedCount": number,
  "errors": Array<{ ideaId: number, error: string }>
}
```

### 2.3 워크스페이스 초기 데이터 로드 API

**GET /v1/workspaces/{workspaceId}/canvas/{canvasId}/data**
- 워크스페이스의 특정 캔버스에 대한 모든 초기 데이터를 한 번에 가져오기
- 텍스트 필드(아이디어) 목록 포함

**Response:**
```json
{
  "canvas": {
    "id": number,
    "title": string,
    "createdAt": string,
    "updatedAt": string
  },
  "ideas": Array<IdeaResponse>,
  "participants": Array<WorkspaceUserResponse>
}
```

### 2.4 워크스페이스 참가자 실시간 조회

**GET /v1/workspaces/{workspaceId}/participants/active**
- 현재 활성화된 참가자 목록 조회 (실시간 업데이트용)

**Response:**
```json
{
  "participants": Array<{
    "userId": string,
    "userName": string,
    "joinedAt": string,
    "lastActiveAt": string
  }>
}
```

## 3. 우선순위

### 높음 (필수)
1. ✅ WebSocket 연결 및 인증
2. ✅ 워크스페이스 참가/나가기 이벤트
3. ✅ 텍스트 필드 생성/수정/삭제 이벤트
4. ✅ IdeaRequest/Response에 width, height 추가

### 중간 (권장)
5. ⚠️ 배치 업데이트 API 및 이벤트
6. ⚠️ 워크스페이스 초기 데이터 로드 API
7. ⚠️ 텍스트 편집 중 상태 공유

### 낮음 (선택사항)
8. ⚪ 캔버스 뷰포트 상태 동기화
9. ⚪ 참가자 커서 위치 공유

## 4. 참고사항

- 현재 API 명세서에는 Socket.IO 관련 명세가 없음
- 실시간 협업을 위해서는 WebSocket/Socket.IO 연결이 필수
- REST API만으로는 실시간 동기화가 어려움
- 참가자 목록은 `/v1/workspaces/{workspaceId}/users`로 조회 가능하지만, 실시간 업데이트를 위해서는 WebSocket 이벤트 필요

