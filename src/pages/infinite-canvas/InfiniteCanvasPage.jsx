import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ChatPanel from './components/ChatPanel';
import ClusteringPanel from './components/ClusteringPanel';
import DraggableText from './components/DraggableText';
import FloatingToolbar from './components/FloatingToolbar';
import TopToolbar from './components/TopToolbar';
import CanvasArea from './components/CanvasArea';
import CenterIndicator from './components/CenterIndicator';
import Minimap from './components/Minimap';
import Toast from './components/Toast';
import { useCanvas } from './hooks/useCanvas';
import { useKeyboard } from './hooks/useKeyboard';
import { useTextFields } from './hooks/useTextFields';
import { useSession } from './hooks/useSession';
import { useChatWebSocket } from './hooks/useChatWebSocket';
import { useCanvasWebSocket } from './hooks/useCanvasWebSocket';
import { CANVAS_AREA_CONSTANTS, CLUSTERING_LAYOUT_CONSTANTS } from './constants';
import { API_BASE_URL } from '../../config/api';
import axios from 'axios';
import './styles/canvas.css';

// 메인 무한 캔버스 컴포넌트
const InfiniteCanvasPage = () => {
  const { projectId } = useParams(); // URL에서 워크스페이스 ID 가져오기
  const workspaceId = projectId ? parseInt(projectId, 10) : null;
  
  const [mode, setMode] = useState('text'); // 'text' 또는 'move'
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true);
  const [isClusteringPanelOpen, setIsClusteringPanelOpen] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showCenterIndicator, setShowCenterIndicator] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [lastClusteringState, setLastClusteringState] = useState(null); // 클러스터링 이전 상태 저장
  const [clusterShapes, setClusterShapes] = useState([]); // 클러스터 도형 정보 저장
  const [draggingCluster, setDraggingCluster] = useState(null); // 드래그 중인 클러스터 정보
  const [clusterDragStart, setClusterDragStart] = useState({ x: 0, y: 0 }); // 클러스터 드래그 시작 위치
  const [savedIdeaIds, setSavedIdeaIds] = useState(new Map()); // 로컬 텍스트 ID와 서버 아이디어 ID 매핑
  const [draggingTextIds, setDraggingTextIds] = useState(new Set()); // 드래그 중인 텍스트 ID들
  const [resizingTextIds, setResizingTextIds] = useState(new Set()); // 리사이즈 중인 텍스트 ID들
  const [pendingUpdates, setPendingUpdates] = useState(new Map()); // 드래그/리사이즈 종료 후 저장할 업데이트들
  const pendingUpdateTimers = useRef(new Map()); // 디바운싱을 위한 타이머들
  const [newlyCreatedTextId, setNewlyCreatedTextId] = useState(null); // 새로 생성된 메모 ID (자동 포커스용)
  const [pendingServerIds, setPendingServerIds] = useState(new Set()); // 서버 저장 중인 서버 ID들 (중복 방지용)
  const [currentUserId, setCurrentUserId] = useState(null); // 현재 사용자 ID
  const [workspaceUsers, setWorkspaceUsers] = useState(new Map()); // userId -> userName 매핑
  const [inviteLink, setInviteLink] = useState(''); // 초대 링크
  const [inviteLinkExpiresAt, setInviteLinkExpiresAt] = useState(''); // 초대 링크 만료일
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); // 초대 모달 상태
  const [workspaceName, setWorkspaceName] = useState('프로젝트'); // 워크스페이스 이름
  const [workspaceParticipants, setWorkspaceParticipants] = useState([]); // 워크스페이스 참가자 목록
  const [toast, setToast] = useState({ message: '', type: 'info', isVisible: false }); // Toast 알림 상태
  
  // 커스텀 훅들 사용
  const canvas = useCanvas();
  const textFields = useTextFields();
  const session = useSession();

  // 윈도우 크기 추적
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 키보드 단축키 설정
  useKeyboard(setMode, textFields.isTextEditing);

  // 페이지 로드 시 기존 메모와 채팅 불러오기
  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (!workspaceId) return;

      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return;

        // 현재 사용자 ID 추출
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        const userId = String(tokenPayload.user_id || tokenPayload.sub);
        setCurrentUserId(userId);

        // 워크스페이스 정보 불러오기
        try {
          const workspaceRes = await axios.get(
            `${API_BASE_URL}/v1/workspaces/${workspaceId}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          );
          if (workspaceRes.data && workspaceRes.data.name) {
            setWorkspaceName(workspaceRes.data.name);
          }
        } catch (err) {
          console.error('워크스페이스 정보 불러오기 실패', err);
        }

        // 워크스페이스 사용자 목록 불러오기
        let userMap = new Map();
        try {
          const usersRes = await axios.get(
            `${API_BASE_URL}/v1/workspaces/${workspaceId}/users`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          );
          
          // userId -> userName 매핑 생성 및 참가자 목록 생성
          const participantsList = [];
          usersRes.data.forEach((user) => {
            const userId = String(user.id);
            const userName = user.name || user.email || '알 수 없음';
            userMap.set(userId, userName);
            
            // 참가자 목록에 추가 (isCurrentUser는 나중에 TopToolbar에서 설정)
            participantsList.push({
              id: userId,
              name: userName
            });
          });
          setWorkspaceUsers(userMap);
          setWorkspaceParticipants(participantsList);
        } catch (err) {
          console.error('워크스페이스 사용자 목록 불러오기 실패', err);
        }

        // 기존 메모(아이디어) 불러오기
        const ideasRes = await axios.get(
          `${API_BASE_URL}/v1/ideas/workspaces/${workspaceId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        console.log('불러온 메모 목록:', ideasRes.data);

        // 기존 서버 ID 매핑 확인 (중복 방지)
        const existingServerIds = new Set(Array.from(savedIdeaIds.values()));
        
        // 메모를 텍스트 필드로 변환 (중복 제외)
        const loadedTexts = [];
        let maxId = textFields.texts.length > 0 
          ? Math.max(...textFields.texts.map(t => typeof t.id === 'number' ? t.id : 0))
          : 0;
        
        const newMappings = new Map();
        
        ideasRes.data.forEach((idea) => {
          // 이미 같은 서버 ID를 가진 메모가 있는지 확인
          if (existingServerIds.has(idea.id)) {
            console.log('이미 존재하는 서버 ID, 스킵:', idea.id);
            return; // 중복 메모는 스킵
          }
          
          // 이미 로컬에 매핑된 서버 ID인지 확인
          const existingLocalId = Array.from(savedIdeaIds.entries())
            .find(([_, serverId]) => serverId === idea.id)?.[0];
          
          if (existingLocalId) {
            console.log('이미 매핑된 서버 ID, 업데이트만 수행:', idea.id, existingLocalId);
            // 기존 메모 업데이트
            const updates = {};
            if (idea.positionX !== undefined) updates.x = idea.positionX;
            if (idea.positionY !== undefined) updates.y = idea.positionY;
            if (idea.content !== undefined) updates.text = idea.content;
            if (idea.patchSizeX !== undefined) updates.width = idea.patchSizeX !== null ? idea.patchSizeX : null;
            if (idea.patchSizeY !== undefined) updates.height = idea.patchSizeY !== null ? idea.patchSizeY : null;
            
            if (Object.keys(updates).length > 0) {
              textFields.updateText(existingLocalId, updates);
              
              // 위치가 업데이트된 경우 캔버스 확장 체크
              if (updates.x !== undefined && updates.y !== undefined) {
                checkAndExpandCanvas(updates.x, updates.y);
              }
            }
            return; // 새로 추가하지 않음
          }
          
          // 새 메모 생성
          maxId += 1;
          const localId = maxId;
          
          // 서버 ID와 로컬 ID 매핑 저장 (나중에 일괄 적용)
          newMappings.set(localId, idea.id);

          loadedTexts.push({
            id: localId,
            x: idea.positionX || 0,
            y: idea.positionY || 0,
            text: idea.content || '',
            // API의 patchSizeX, patchSizeY를 width, height로 변환
            width: idea.patchSizeX !== null && idea.patchSizeX !== undefined ? idea.patchSizeX : null,
            height: idea.patchSizeY !== null && idea.patchSizeY !== undefined ? idea.patchSizeY : null
          });
        });

        // 새 매핑 일괄 적용
        if (newMappings.size > 0) {
          setSavedIdeaIds(prev => {
            const newMap = new Map(prev);
            newMappings.forEach((serverId, localId) => {
              // 중복 체크: 같은 서버 ID가 이미 매핑되어 있는지 확인
              const existingEntry = Array.from(newMap.entries()).find(([_, sid]) => sid === serverId);
              if (!existingEntry) {
                newMap.set(localId, serverId);
              } else {
                console.warn('서버 ID가 이미 매핑되어 있음, 스킵:', serverId, existingEntry[0]);
              }
            });
            return newMap;
          });
        }

        // 텍스트 필드에 추가 (중복 제외된 것만)
        if (loadedTexts.length > 0) {
          console.log('새로 추가할 메모 개수:', loadedTexts.length);
          textFields.loadTexts(loadedTexts);
          
          // 로드된 메모들의 위치에 대해 캔버스 확장 체크
          loadedTexts.forEach(text => {
            if (text.x !== undefined && text.y !== undefined) {
              checkAndExpandCanvas(text.x, text.y);
            }
          });
        } else {
          console.log('추가할 새 메모가 없음 (모두 중복)');
        }

        // 기존 채팅 메시지 불러오기
        const messagesRes = await axios.get(
          `${API_BASE_URL}/v1/chat/messages/workspace/${workspaceId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        console.log('불러온 채팅 메시지:', messagesRes.data);

        // 채팅 메시지를 ChatPanel 형식으로 변환
        const loadedMessages = messagesRes.data.map((msg) => {
          const msgUserId = msg.userId ? String(msg.userId) : null;
          const isMyMessage = msgUserId === userId;
          const userName = msgUserId ? (userMap.get(msgUserId) || '알 수 없음') : null;
          
          return {
            id: msg.id || Date.now() + Math.random(),
            text: msg.content || msg.text || '',
            sender: msgUserId ? (isMyMessage ? 'me' : 'other') : 'system',
            userName: userName,
            userId: msgUserId,
            time: msg.createdAt 
              ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now()
          };
        });

        setChatMessages(loadedMessages);
      } catch (err) {
        console.error('워크스페이스 데이터 불러오기 실패', err);
      }
    };

    loadWorkspaceData();
  }, [workspaceId]);

  // 채팅 메시지 수신 핸들러
  const handleChatMessageReceived = useCallback((message) => {
    console.log('[채팅] 메시지 수신 핸들러 호출:', message);
    console.log('[채팅] 현재 메시지 목록:', chatMessages);
    
    // 중복 메시지 방지 (같은 ID가 이미 있으면 추가하지 않음)
    setChatMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) {
        console.log('[채팅] 중복 메시지 무시:', message.id);
        return prev;
      }
      console.log('[채팅] 새 메시지 추가:', message);
      return [...prev, message];
    });
  }, [chatMessages]);

  // 채팅 웹소켓 연결
  const chatWebSocket = useChatWebSocket(
    workspaceId,
    currentUserId,
    workspaceUsers,
    handleChatMessageReceived
  );

  // 캔버스 웹소켓 연결 (실시간 협업용)
  const canvasWebSocket = useCanvasWebSocket(workspaceId, currentUserId, {
    onParticipantJoined: (data) => {
      console.log('참가자 참가:', data);
      const userId = String(data.userId || data.id || data.user_id);
      const userName = data.userName || data.name || data.user_name || workspaceUsers.get(userId) || '알 수 없음';
      
      // 현재 사용자가 아닌 경우에만 알림 표시
      if (userId !== String(currentUserId)) {
        // 참가자 목록 업데이트
        setWorkspaceParticipants(prev => {
          // 이미 존재하는 참가자인지 확인
          const exists = prev.some(p => p.id === userId);
          if (exists) {
            return prev;
          }
          
          // 새 참가자 추가
          return [...prev, {
            id: userId,
            name: userName
          }];
        });
        
        // Toast 알림 표시
        setToast({
          message: `${userName}님이 참여했습니다`,
          type: 'success',
          isVisible: true
        });
      } else {
        // 현재 사용자인 경우 목록만 업데이트 (알림 없음)
        setWorkspaceParticipants(prev => {
          const exists = prev.some(p => p.id === userId);
          if (exists) {
            return prev;
          }
          return [...prev, {
            id: userId,
            name: userName
          }];
        });
      }
      
      // workspaceUsers에도 추가 (없는 경우)
      if (data.userId || data.id || data.user_id) {
        const userId = String(data.userId || data.id || data.user_id);
        const userName = data.userName || data.name || data.user_name;
        if (userName && !workspaceUsers.has(userId)) {
          setWorkspaceUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(userId, userName);
            return newMap;
          });
        }
      }
    },
    onParticipantLeft: (data) => {
      console.log('참가자 나가기:', data);
      const userId = String(data.userId || data.id || data.user_id);
      const userName = data.userName || data.name || data.user_name || workspaceUsers.get(userId) || '알 수 없음';
      
      // 현재 사용자가 아닌 경우에만 알림 표시
      if (userId !== String(currentUserId)) {
        // 참가자 목록에서 제거
        setWorkspaceParticipants(prev => {
          return prev.filter(p => p.id !== userId);
        });
        
        // Toast 알림 표시
        setToast({
          message: `${userName}님이 나갔습니다`,
          type: 'info',
          isVisible: true
        });
      } else {
        // 현재 사용자인 경우 목록만 업데이트 (알림 없음)
        setWorkspaceParticipants(prev => {
          return prev.filter(p => p.id !== userId);
        });
      }
    },
    onIdeaUpdated: (data) => {
      console.log('아이디어 업데이트:', data);
      
      // 새로 생성된 메모가 서버에 저장되면 autoFocus 해제
      if (data.action === 'created' || data.action === 'create') {
        const ideaData = data.data || data;
        const ideaId = ideaData.id || ideaData.ideaId;
        const localId = Array.from(savedIdeaIds.entries())
          .find(([_, serverId]) => serverId === ideaId)?.[0];
        
        if (localId === newlyCreatedTextId) {
          setNewlyCreatedTextId(null);
        }
      }
      
      try {
        // 백엔드 형식: {"action": "created|updated|deleted", "data": {...}}
        // data 필드에서 실제 아이디어 정보 추출
        const ideaData = data.data || data;
        const action = data.action || (ideaData.id ? 'updated' : 'created');
        
        // 드래그 중인 메모는 원격 업데이트 무시 (로컬 업데이트 우선)
        const ideaId = ideaData.id || ideaData.ideaId;
        const localId = Array.from(savedIdeaIds.entries())
          .find(([_, serverId]) => serverId === ideaId)?.[0];
        
        // 자신이 보낸 업데이트는 무시 (이미 로컬에서 처리됨)
        // userId만 체크 (localId 체크는 제거 - 모든 로컬 메모가 자신의 것으로 간주되는 문제 방지)
        const isMyUpdate = ideaData.userId && String(ideaData.userId) === String(currentUserId);
        
        // created 액션인 경우, 서버 ID가 이미 매핑되어 있고 userId가 자신이면 자신이 생성한 것으로 간주
        const isMyCreated = (action === 'created' || action === 'create') && 
                           ideaData.userId && String(ideaData.userId) === String(currentUserId) &&
                           Array.from(savedIdeaIds.values()).includes(ideaId);
        
        // pendingServerIds에 있는 서버 ID는 무시 (서버 저장 중인 메모)
        const isPendingServerId = (action === 'created' || action === 'create') && 
                                 ideaId && pendingServerIds.has(ideaId);
        
        if (isMyUpdate || isMyCreated || isPendingServerId) {
          console.log('자신이 보낸 업데이트 무시 (userId 확인):', ideaId, localId, 'userId:', ideaData.userId, 'currentUserId:', currentUserId, 'isMyCreated:', isMyCreated, 'isPendingServerId:', isPendingServerId);
          return;
        }
        
        // 드래그 또는 리사이즈 중인 메모는 원격 업데이트 무시 (로컬 업데이트 우선)
        if (localId && (draggingTextIds.has(localId) || resizingTextIds.has(localId))) {
          console.log('드래그/리사이즈 중인 메모는 원격 업데이트 무시:', localId, 'dragging:', draggingTextIds.has(localId), 'resizing:', resizingTextIds.has(localId));
          return;
        }
        
        if (action === 'deleted' || action === 'delete') {
          // 삭제: 서버 ID로 로컬 ID 찾아서 삭제
          const deleteLocalId = Array.from(savedIdeaIds.entries())
            .find(([_, serverId]) => serverId === ideaId)?.[0];
          
          if (deleteLocalId) {
            console.log('아이디어 삭제:', deleteLocalId, ideaId);
            textFields.deleteText(deleteLocalId);
            setSavedIdeaIds(prev => {
              const newMap = new Map(prev);
              newMap.delete(deleteLocalId);
              return newMap;
            });
          }
        } else if (action === 'created' || action === 'create') {
          // 생성: 새 텍스트 필드 추가
          // 먼저 이미 같은 서버 ID를 가진 메모가 있는지 확인
          const existingLocalId = Array.from(savedIdeaIds.entries())
            .find(([_, serverId]) => serverId === ideaId)?.[0];
          
          if (existingLocalId) {
            // 이미 존재하는 메모면 무시 (자신이 생성한 메모이거나 이미 로드된 메모)
            console.log('이미 존재하는 메모 (created 액션 무시):', existingLocalId, ideaId);
            return; // 중복 생성 방지
          }
          
          // 서버 ID가 이미 매핑되어 있는지 확인 (다른 로컬 ID에 매핑되어 있을 수 있음)
          const existingServerIdMapping = Array.from(savedIdeaIds.entries())
            .find(([_, serverId]) => serverId === ideaId);
          
          if (existingServerIdMapping) {
            console.log('서버 ID가 이미 다른 로컬 ID에 매핑되어 있음 (created 액션 무시):', existingServerIdMapping[0], ideaId);
            return; // 중복 생성 방지
          }
          
          // 추가 체크: 로컬 텍스트 목록에서 서버 ID가 없는 빈 메모가 있는지 확인
          // (빈 메모 생성 후 이동한 경우, created 액션이 늦게 도착할 수 있음)
          // 모든 빈 메모를 확인 (위치와 관계없이)
          const existingEmptyTexts = textFields.texts.filter(t => {
            const tServerId = Array.from(savedIdeaIds.entries())
              .find(([localId]) => localId === t.id)?.[1];
            // 서버 ID가 없고, 빈 텍스트인 경우
            return !tServerId && (!t.text || t.text.trim() === '');
          });
          
          // 빈 메모가 있고, created 액션도 빈 메모인 경우
          if (existingEmptyTexts.length > 0 && (!ideaData.content || ideaData.content.trim() === '')) {
            // 가장 최근에 생성된 빈 메모에 서버 ID 매핑 (ID가 가장 큰 것)
            const latestEmptyText = existingEmptyTexts.reduce((latest, current) => 
              current.id > latest.id ? current : latest
            );
            
            console.log('빈 메모 발견, 서버 ID 매핑만 추가:', latestEmptyText.id, ideaId, '기존 빈 메모 개수:', existingEmptyTexts.length);
            if (ideaId) {
              setSavedIdeaIds(prev => {
                const newMap = new Map(prev);
                // 중복 체크
                const existingEntry = Array.from(newMap.entries()).find(([_, sid]) => sid === ideaId);
                if (!existingEntry) {
                  newMap.set(latestEmptyText.id, ideaId);
                }
                return newMap;
              });
            }
            return; // 중복 생성 방지
          }
          
          // 위치 기반 중복 체크: 같은 위치에 이미 메모가 있는지 확인 (추가 안전장치)
          const ideaX = ideaData.positionX || ideaData.x || 0;
          const ideaY = ideaData.positionY || ideaData.y || 0;
          const positionTolerance = 10; // 10px 오차 허용
          
          const existingTextAtPosition = textFields.texts.find(t => {
            const tServerId = Array.from(savedIdeaIds.entries())
              .find(([localId]) => localId === t.id)?.[1];
            // 서버 ID가 없거나 다른 서버 ID를 가진 메모 중에서
            // 같은 위치에 있는 메모 찾기
            if (tServerId === ideaId) return false; // 같은 서버 ID면 제외
            
            const distance = Math.sqrt(
              Math.pow(t.x - ideaX, 2) + Math.pow(t.y - ideaY, 2)
            );
            return distance < positionTolerance;
          });
          
          if (existingTextAtPosition) {
            console.log('같은 위치에 이미 메모가 있음, 중복 생성 방지:', existingTextAtPosition.id, ideaId, '위치:', ideaX, ideaY);
            // 기존 메모에 서버 ID 매핑만 추가 (중복 생성 방지)
            if (ideaId) {
              const existingLocalId = existingTextAtPosition.id;
              setSavedIdeaIds(prev => {
                const newMap = new Map(prev);
                // 중복 체크
                const existingEntry = Array.from(newMap.entries()).find(([_, sid]) => sid === ideaId);
                if (!existingEntry) {
                  newMap.set(existingLocalId, ideaId);
                }
                return newMap;
              });
            }
            return; // 중복 생성 방지
          }
          
          const maxId = textFields.texts.length > 0 
            ? Math.max(...textFields.texts.map(t => typeof t.id === 'number' ? t.id : 0))
            : 0;
          const newId = maxId + 1;
          
          const newText = {
            id: newId,
            x: ideaData.positionX || ideaData.x || 0,
            y: ideaData.positionY || ideaData.y || 0,
            text: ideaData.content || ideaData.text || '',
            width: ideaData.patchSizeX !== null && ideaData.patchSizeX !== undefined ? ideaData.patchSizeX : null,
            height: ideaData.patchSizeY !== null && ideaData.patchSizeY !== undefined ? ideaData.patchSizeY : null
          };
          
          console.log('아이디어 생성:', newText, ideaId);
          
          // 서버에서 받은 아이디어 ID 저장
          if (ideaId) {
            setSavedIdeaIds(prev => {
              // 중복 체크: 같은 서버 ID가 이미 매핑되어 있는지 확인
              const existingEntry = Array.from(prev.entries()).find(([_, sid]) => sid === ideaId);
              if (existingEntry) {
                console.warn('서버 ID가 이미 매핑되어 있음:', ideaId, existingEntry[0]);
                return prev; // 기존 매핑 유지
              }
              return new Map(prev).set(newId, ideaId);
            });
          }
          
          textFields.loadTexts([newText]);
          
          // 웹소켓으로 받은 메모의 위치에 대해 캔버스 확장 체크
          checkAndExpandCanvas(newText.x, newText.y);
        } else if (action === 'updated' || action === 'update') {
          // 수정: 기존 텍스트 필드 업데이트
          const updateLocalId = Array.from(savedIdeaIds.entries())
            .find(([_, serverId]) => serverId === ideaId)?.[0];
          
          if (updateLocalId) {
            // 현재 텍스트 데이터 가져오기
            const currentTextData = textFields.texts.find(t => t.id === updateLocalId);
            
            const updates = {};
            if (ideaData.positionX !== undefined) updates.x = ideaData.positionX;
            if (ideaData.positionY !== undefined) updates.y = ideaData.positionY;
            if (ideaData.content !== undefined) updates.text = ideaData.content;
            if (ideaData.patchSizeX !== undefined) updates.width = ideaData.patchSizeX !== null ? ideaData.patchSizeX : null;
            if (ideaData.patchSizeY !== undefined) updates.height = ideaData.patchSizeY !== null ? ideaData.patchSizeY : null;
            
            console.log('아이디어 수정:', updateLocalId, ideaId, updates);
            console.log('현재 텍스트 데이터:', currentTextData);
            console.log('업데이트 전 텍스트:', currentTextData?.text);
            console.log('업데이트 후 텍스트:', updates.text);
            
            if (Object.keys(updates).length > 0) {
              // 직접 updateText 호출 (handleTextUpdate를 거치지 않음 - 무한 루프 방지)
              textFields.updateText(updateLocalId, updates);
              
              // 위치가 업데이트된 경우 캔버스 확장 체크
              if (updates.x !== undefined && updates.y !== undefined) {
                checkAndExpandCanvas(updates.x, updates.y);
              }
              
              console.log('텍스트 업데이트 완료:', updateLocalId);
            } else {
              console.warn('업데이트할 내용이 없음:', updateLocalId, ideaId);
            }
          } else {
            // 로컬에 없는 아이디어면 새로 추가
            // 먼저 이미 같은 서버 ID를 가진 메모가 있는지 확인
            const existingLocalId = Array.from(savedIdeaIds.entries())
              .find(([_, serverId]) => serverId === ideaId)?.[0];
            
            if (existingLocalId) {
              // 이미 존재하는 메모면 업데이트로 처리
              console.log('로컬에 없는 것으로 판단했지만 서버 ID 매핑 발견, 업데이트로 처리:', existingLocalId, ideaId);
              const currentTextData = textFields.texts.find(t => t.id === existingLocalId);
              
              const updates = {};
              if (ideaData.positionX !== undefined) updates.x = ideaData.positionX;
              if (ideaData.positionY !== undefined) updates.y = ideaData.positionY;
              if (ideaData.content !== undefined) updates.text = ideaData.content;
              if (ideaData.patchSizeX !== undefined) updates.width = ideaData.patchSizeX !== null ? ideaData.patchSizeX : null;
              if (ideaData.patchSizeY !== undefined) updates.height = ideaData.patchSizeY !== null ? ideaData.patchSizeY : null;
              
              if (Object.keys(updates).length > 0 && currentTextData) {
                textFields.updateText(existingLocalId, updates);
                
                // 위치가 업데이트된 경우 캔버스 확장 체크
                if (updates.x !== undefined && updates.y !== undefined) {
                  checkAndExpandCanvas(updates.x, updates.y);
                }
              }
              return; // 중복 생성 방지
            }
            
            // updated 액션인데 localId를 찾지 못한 경우는 이상한 상황
            // 보통은 자신이 생성한 메모를 수정하는 경우이므로, 자신이 보낸 업데이트는 이미 무시됨
            // 하지만 다른 사용자가 생성한 메모를 수정하는 경우일 수 있으므로 로그만 남기고 스킵
            console.warn('updated 액션인데 로컬 ID를 찾을 수 없음. 서버 ID:', ideaId, '데이터:', ideaData);
            console.warn('현재 savedIdeaIds:', Array.from(savedIdeaIds.entries()));
            console.warn('현재 texts:', textFields.texts.map(t => ({ id: t.id, text: t.text })));
            
            // updated 액션인데 localId를 찾지 못하면 새로 추가하지 않음 (중복 방지)
            // 대신 로그만 남기고 무시
            return;
          }
        }
      } catch (error) {
        console.error('아이디어 업데이트 처리 오류:', error);
      }
    }
  });

  // 브라우저 줌 완전 차단 - 피그마 스타일
  useEffect(() => {
    // 터치 제스처 줌 차단
    const preventGestureZoom = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 키보드 줌 차단 (Ctrl/Cmd + +/-)
    const preventKeyboardZoom = (e) => {
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0' || 
           e.keyCode === 187 || e.keyCode === 189 || e.keyCode === 48 || 
           e.keyCode === 61 || e.keyCode === 107 || e.keyCode === 109)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 휠 이벤트에서 Ctrl/Cmd + 휠일 때만 캔버스 줌 허용, 나머지는 브라우저 줌 차단
    const preventWheelZoom = (e) => {
      // Ctrl/Cmd + 휠은 useCanvas에서 처리하므로 기본 동작만 차단
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 터치 줌 차단 (핀치 줌)
    const preventTouchZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 모든 줌 관련 이벤트 차단
    document.addEventListener('keydown', preventKeyboardZoom, { passive: false });
    document.addEventListener('gesturestart', preventGestureZoom, { passive: false });
    document.addEventListener('gesturechange', preventGestureZoom, { passive: false });
    document.addEventListener('gestureend', preventGestureZoom, { passive: false });
    document.addEventListener('wheel', preventWheelZoom, { passive: false });
    document.addEventListener('touchstart', preventTouchZoom, { passive: false });
    document.addEventListener('touchmove', preventTouchZoom, { passive: false });
    document.addEventListener('touchend', preventTouchZoom, { passive: false });

    // 추가: CSS zoom 속성 강제 고정
    const enforceZoom = () => {
      if (document.documentElement.style.zoom !== '1') {
        document.documentElement.style.zoom = '1';
      }
      if (document.body.style.zoom !== '1') {
        document.body.style.zoom = '1';
      }
    };

    // 주기적으로 zoom 속성 확인 및 강제
    const zoomCheckInterval = setInterval(enforceZoom, 100);

    return () => {
      document.removeEventListener('keydown', preventKeyboardZoom);
      document.removeEventListener('gesturestart', preventGestureZoom);
      document.removeEventListener('gesturechange', preventGestureZoom);
      document.removeEventListener('gestureend', preventGestureZoom);
      document.removeEventListener('wheel', preventWheelZoom);
      document.removeEventListener('touchstart', preventTouchZoom);
      document.removeEventListener('touchmove', preventTouchZoom);
      document.removeEventListener('touchend', preventTouchZoom);
      clearInterval(zoomCheckInterval);
    };
  }, []);

  const handleCanvasClick = (e) => {
    if (mode === 'text') {
      // 텍스트 모드: 텍스트 필드 생성
      const clickResult = canvas.handleCanvasClick(e, mode, canvas.canvasAreas);
      if (clickResult) {
        const newTextId = textFields.addText(clickResult.x, clickResult.y);
        // 새로 생성된 메모 ID 저장 (자동 포커스용)
        setNewlyCreatedTextId(newTextId);
        // 워크스페이스가 있으면 메모 저장 (빈 메모는 저장하지 않음 - saveIdea에서 처리)
        // 빈 메모는 사용자가 내용을 입력한 후에만 저장됨
        // if (workspaceId && newTextId) {
        //   setTimeout(() => {
        //     const textData = textFields.texts.find(t => t.id === newTextId);
        //     if (textData) {
        //       saveIdea(newTextId, textData);
        //     }
        //   }, 100);
        // }
      }
    } else if (mode === 'move' && !e.shiftKey && !canvas.hasStartedAreaSelection) {
      // 이동 모드 (Shift 없음, 영역 선택 시작 안됨): 빈 공간 클릭 시에만 선택 해제
      // 텍스트 필드가 아닌 빈 공간을 클릭했을 때만 선택 해제
      if (e.target === canvas.canvasRef.current || 
          (canvas.canvasRef.current && canvas.canvasRef.current.contains(e.target) && 
           !e.target.closest('.draggable-text'))) {
        textFields.clearSelection();
      }
    }
    // 삭제 모드에서는 CanvasArea에서 길게 클릭으로만 삭제
  };

  const handleCanvasMouseDown = (e) => {
    if (mode === 'move' && e.shiftKey) {
      // 이동 모드 + Shift: 영역 선택 시작
      canvas.startAreaSelection(e);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (mode === 'move' && canvas.isAreaSelecting) {
      // 영역 선택이 시작된 후에는 Shift 키 상태와 관계없이 계속 업데이트
      canvas.updateAreaSelection(e);
    }
    // 클러스터 드래그는 CanvasArea에서 처리
  };

  const handleCanvasMouseUp = (e) => {
    console.log('handleCanvasMouseUp called', {
      mode,
      hasStartedAreaSelection: canvas.hasStartedAreaSelection,
      isAreaSelecting: canvas.isAreaSelecting
    });
    
    // 클러스터 드래그는 CanvasArea에서 처리
    
    if (mode === 'move' && canvas.isAreaSelecting) {
      // 영역 선택 완료 시 텍스트 필드들 선택
      const selectedTexts = canvas.getTextsInSelectionArea(textFields.texts);
      console.log('Selected texts:', selectedTexts);
      
      if (selectedTexts.length > 0) {
        const textIds = selectedTexts.map(text => text.id);
        console.log('Starting multi-select with textIds:', textIds);
        textFields.startMultiSelect(textIds);
      }
      canvas.endAreaSelection();
    }
  };

  // 메모(아이디어) 저장 함수
  const saveIdea = async (textId, textData) => {
    if (!workspaceId) return;
    
    // 빈 텍스트면 저장하지 않음
    if (!textData.text || textData.text.trim() === '') {
      console.log('빈 메모는 저장하지 않음:', textId);
      // 이미 서버에 저장된 메모면 삭제
      const ideaId = savedIdeaIds.get(textId);
      if (ideaId) {
        try {
          const accessToken = localStorage.getItem('accessToken');
          if (accessToken) {
            // REST API로 삭제
            await axios.delete(
              `${API_BASE_URL}/v1/ideas/${ideaId}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              }
            );
            
            // 웹소켓으로 삭제 이벤트 브로드캐스트
            if (canvasWebSocket.emitIdeaUpdate) {
              canvasWebSocket.emitIdeaUpdate({
                id: ideaId,
                action: 'deleted',
                workspaceId: workspaceId,
                userId: currentUserId
              });
            }
            
            setSavedIdeaIds(prev => {
              const newMap = new Map(prev);
              newMap.delete(textId);
              return newMap;
            });
          }
        } catch (err) {
          console.error('빈 메모 삭제 실패', err);
        }
      }
      return;
    }
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const ideaId = savedIdeaIds.get(textId);
      
      // 텍스트 크기 가져오기 (CSS 변수에서 기본값 사용)
      const getTextSize = (text) => {
        const defaultWidth = 200; // 기본 너비
        const defaultHeight = 100; // 기본 높이
        
        // CSS 변수에서 가져오기 시도
        try {
          const cssWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--memo-width')) || defaultWidth;
          const cssHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--memo-height')) || defaultHeight;
          
          return {
            width: text.width !== null && text.width !== undefined ? text.width : cssWidth,
            height: text.height !== null && text.height !== undefined ? text.height : cssHeight
          };
        } catch (e) {
          return {
            width: text.width !== null && text.width !== undefined ? text.width : defaultWidth,
            height: text.height !== null && text.height !== undefined ? text.height : defaultHeight
          };
        }
      };
      
      const size = getTextSize(textData);
      
      const ideaData = {
        workspaceId,
        content: textData.text || '',
        positionX: textData.x || 0,
        positionY: textData.y || 0,
        patchSizeX: size.width || 0,
        patchSizeY: size.height || 0,
      };

      if (ideaId) {
        // 기존 아이디어 업데이트
        const res = await axios.put(
          `${API_BASE_URL}/v1/ideas/${ideaId}`,
          ideaData,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // WebSocket으로 브로드캐스트 (백엔드가 자동으로 브로드캐스트하지만, 확실하게 하기 위해)
        // 백엔드에서 REST API 호출 시 자동으로 브로드캐스트하므로 여기서는 생략 가능
        // 하지만 명시적으로 보내고 싶다면:
        // canvasWebSocket.emitIdeaUpdate({
        //   action: 'update',
        //   id: ideaId,
        //   ...ideaData
        // });
      } else {
        // 새 아이디어 생성
        const res = await axios.post(
          `${API_BASE_URL}/v1/ideas`,
          ideaData,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const serverId = res.data.id;
        
        // 서버 ID를 pendingServerIds에 추가 (웹소켓 중복 방지)
        setPendingServerIds(prev => new Set(prev).add(serverId));
        
        // 매핑 저장
        setSavedIdeaIds(prev => new Map(prev).set(textId, serverId));
        
        // 짧은 시간 후 pendingServerIds에서 제거 (웹소켓 메시지가 도착할 시간을 고려)
        setTimeout(() => {
          setPendingServerIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(serverId);
            return newSet;
          });
        }, 2000); // 2초 후 제거
        
        // WebSocket으로 브로드캐스트 (백엔드가 자동으로 브로드캐스트하지만, 확실하게 하기 위해)
        // 백엔드에서 REST API 호출 시 자동으로 브로드캐스트하므로 여기서는 생략 가능
      }
    } catch (err) {
      console.error('메모 저장 실패', err);
    }
  };

  // 메모 삭제 함수
  const deleteIdea = async (textId) => {
    if (!workspaceId) return;
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const ideaId = savedIdeaIds.get(textId);
      if (ideaId) {
        // REST API로 삭제
        await axios.delete(
          `${API_BASE_URL}/v1/ideas/${ideaId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        
        // 웹소켓으로 삭제 이벤트 브로드캐스트
        const textData = textFields.texts.find(t => t.id === textId);
        if (textData && canvasWebSocket.emitIdeaUpdate) {
          canvasWebSocket.emitIdeaUpdate({
            id: ideaId,
            action: 'deleted',
            workspaceId: workspaceId,
            userId: currentUserId
          });
        }
        
        setSavedIdeaIds(prev => {
          const newMap = new Map(prev);
          newMap.delete(textId);
          return newMap;
        });
      }
    } catch (err) {
      console.error('메모 삭제 실패', err);
    }
  };

  // 채팅 메시지 전송 함수
  const sendChatMessage = async (content) => {
    console.log('[채팅] 메시지 전송 시도:', content);
    console.log('[채팅] WebSocket 연결 상태:', chatWebSocket.isConnected);
    if (!workspaceId) return;
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      // JWT 토큰에서 user_id 추출
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const userId = tokenPayload.user_id || tokenPayload.sub;

      // 웹소켓이 연결되어 있으면 웹소켓으로 전송, 아니면 REST API로 전송
      if (chatWebSocket.isConnected && chatWebSocket.sendMessage(content)) {
        // 웹소켓으로 전송 성공
        return;
      } else {
        // 웹소켓이 없으면 REST API로 전송
        await axios.post(
          `${API_BASE_URL}/v1/chat/messages`,
          {
            workspaceId,
            userId: String(userId),
            content
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // 메시지 전송 후 목록 새로고침
        const messagesRes = await axios.get(
          `${API_BASE_URL}/v1/chat/messages/workspace/${workspaceId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        const loadedMessages = messagesRes.data.map((msg) => {
          const msgUserId = msg.userId ? String(msg.userId) : null;
          const isMyMessage = msgUserId === String(userId);
          const userName = msgUserId ? (workspaceUsers.get(msgUserId) || '알 수 없음') : null;
          
          return {
            id: msg.id || Date.now() + Math.random(),
            text: msg.content || msg.text || '',
            sender: msgUserId ? (isMyMessage ? 'me' : 'other') : 'system',
            userName: userName,
            userId: msgUserId,
            time: msg.createdAt 
              ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now()
          };
        });

        setChatMessages(loadedMessages);
      }
    } catch (err) {
      console.error('채팅 메시지 전송 실패', err);
    }
  };

  // 초대 링크 생성 함수
  const handleGenerateInviteLink = async () => {
    if (!workspaceId) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const res = await axios.post(
        `${API_BASE_URL}/v1/workspaces/${workspaceId}/invite-link`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      // 초대 링크 URL 처리 (전체 URL이면 그대로, 상대 경로면 현재 도메인과 결합)
      let inviteUrl = res.data.inviteUrl || res.data.token;
      if (inviteUrl) {
        if (inviteUrl.startsWith('http://') || inviteUrl.startsWith('https://')) {
          // 전체 URL이면 그대로 사용
        } else if (inviteUrl.startsWith('/')) {
          // 절대 경로인 경우
          inviteUrl = `${window.location.origin}${inviteUrl}`;
        } else if (inviteUrl.startsWith('invite/')) {
          // invite/로 시작하는 경우
          inviteUrl = `${window.location.origin}/${inviteUrl}`;
        } else {
          // 토큰만 있는 경우
          inviteUrl = `${window.location.origin}/invite/${inviteUrl}`;
        }
      }
      setInviteLink(inviteUrl);
      setInviteLinkExpiresAt(res.data.expiresAt);
    } catch (err) {
      console.error('초대 링크 생성 실패', err);
      alert('초대 링크 생성에 실패했습니다.');
    }
  };

  // 초대 링크 복사 함수
  const handleCopyInviteLink = () => {
    if (!inviteLink) return;

    navigator.clipboard.writeText(inviteLink).then(() => {
      alert('초대 링크가 클립보드에 복사되었습니다!');
    }).catch(() => {
      // 폴백
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('초대 링크가 클립보드에 복사되었습니다!');
    });
  };

  const handleTextUpdate = (id, updates) => {
    // 현재 텍스트 데이터 가져오기 (상태 업데이트 전)
    const currentTextData = textFields.texts.find(t => t.id === id);
    
    // 빈 텍스트로 업데이트되는 경우 삭제
    if (updates.text !== undefined && (!updates.text || updates.text.trim() === '')) {
      console.log('빈 텍스트로 업데이트, 메모 삭제:', id);
      deleteIdea(id);
      textFields.deleteText(id);
      // 새로 생성된 메모 ID 초기화
      if (id === newlyCreatedTextId) {
        setNewlyCreatedTextId(null);
      }
      return;
    }
    
    // 텍스트가 입력되면 새로 생성된 메모 ID 초기화
    if (updates.text !== undefined && updates.text.trim() !== '' && id === newlyCreatedTextId) {
      setNewlyCreatedTextId(null);
    }
    
    // 텍스트 필드 업데이트 (즉시 로컬 반영)
    textFields.updateText(id, updates);
    
    // 텍스트 수정인지 확인 (text 필드가 있고, x, y가 변경되지 않았으면 텍스트만 수정된 것으로 간주)
    // x, y가 undefined이거나 기존 값과 동일하면 텍스트만 수정된 것으로 간주
    const isTextEdit = updates.text !== undefined && 
      (updates.x === undefined || updates.x === currentTextData?.x) &&
      (updates.y === undefined || updates.y === currentTextData?.y);
    
    // 드래그 또는 리사이즈 중인 경우 서버 저장은 하지 않고, 종료 후에 저장
    const isDragging = draggingTextIds.has(id);
    const isResizing = resizingTextIds.has(id);
    
    if ((isDragging || isResizing) && !isTextEdit) {
      // 드래그/리사이즈 중이고 텍스트 수정이 아닌 경우: 업데이트를 pendingUpdates에 저장 (종료 후 일괄 저장)
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(id) || {};
        newMap.set(id, { ...existing, ...updates });
        return newMap;
      });
    } else {
      // 드래그 중이 아니거나 텍스트 수정인 경우: 서버에 저장
      if (workspaceId && currentTextData) {
        // 기존 타이머가 있으면 취소
        clearTimeout(pendingUpdateTimers.current.get(id));
        
        if (isTextEdit) {
          // 텍스트 수정은 즉시 저장 (디바운싱 없이)
          // 업데이트된 텍스트를 포함하여 저장
          saveIdea(id, { ...currentTextData, text: updates.text });
        } else {
          // 위치 변경은 디바운싱 적용
          const timer = setTimeout(() => {
            // 상태가 업데이트된 후의 최신 데이터 사용
            const latestTextData = textFields.texts.find(t => t.id === id);
            if (latestTextData) {
              saveIdea(id, { ...latestTextData, ...updates });
            }
            pendingUpdateTimers.current.delete(id);
          }, 300); // 300ms 디바운스
          pendingUpdateTimers.current.set(id, timer);
        }
      }
    }
    
    // 캔버스 밖으로 이동하는지 체크하고 확장
    if (updates.x !== undefined && updates.y !== undefined) {
      checkAndExpandCanvas(updates.x, updates.y);
    }
  };
  
  // 드래그 시작 핸들러
  const handleTextDragStart = useCallback((id) => {
    setDraggingTextIds(prev => new Set(prev).add(id));
  }, []);
  
  // 드래그 종료 핸들러
  const handleTextDragEnd = useCallback((id) => {
    setDraggingTextIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    
    // 드래그 종료 후 pendingUpdates 저장
    setPendingUpdates(prev => {
      const pendingUpdate = prev.get(id);
      if (pendingUpdate && workspaceId) {
        const textData = textFields.texts.find(t => t.id === id);
        if (textData) {
          saveIdea(id, { ...textData, ...pendingUpdate });
        }
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      }
      return prev;
    });
  }, [workspaceId, textFields.texts]);
  
  // 리사이즈 시작 핸들러
  const handleTextResizeStart = useCallback((id) => {
    setResizingTextIds(prev => new Set(prev).add(id));
  }, []);
  
  // 리사이즈 종료 핸들러
  const handleTextResizeEnd = useCallback((id) => {
    setResizingTextIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    
    // 리사이즈 종료 후 pendingUpdates 저장
    setPendingUpdates(prev => {
      const pendingUpdate = prev.get(id);
      if (pendingUpdate && workspaceId) {
        const textData = textFields.texts.find(t => t.id === id);
        if (textData) {
          saveIdea(id, { ...textData, ...pendingUpdate });
        }
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      }
      return prev;
    });
  }, [workspaceId, textFields.texts]);

  // 캔버스 확장 체크 함수 (공통 로직)
  const checkAndExpandCanvas = useCallback((x, y) => {
    if (x === undefined || y === undefined) return;
    
    const currentAreas = canvas.canvasAreas;
    const isOutsideCanvas = !currentAreas.some(area => 
      x >= area.x && x <= area.x + area.width &&
      y >= area.y && y <= area.y + area.height
    );
    
    if (isOutsideCanvas) {
      canvas.addCanvasArea(x, y);
    }
  }, [canvas]);

  // 그룹 드래그 시 캔버스 확장
  const handleGroupDragCanvasExpansion = (x, y) => {
    checkAndExpandCanvas(x, y);
  };

  const handleCanvasAreaDelete = (areaIndex) => {
    // 삭제할 캔버스 영역 정보 가져오기
    const areaToDelete = canvas.canvasAreas[areaIndex];
    
    // 영역 내의 텍스트들 찾기
    const textsInArea = textFields.texts.filter(text => 
      text.x >= areaToDelete.x && text.x <= areaToDelete.x + areaToDelete.width &&
      text.y >= areaToDelete.y && text.y <= areaToDelete.y + areaToDelete.height
    );
    
    // 각 텍스트에 대해 삭제 처리 (서버에 저장된 경우 브로드캐스트)
    textsInArea.forEach(text => {
      const ideaId = savedIdeaIds.get(text.id);
      if (ideaId) {
        // 서버에 저장된 메모는 deleteIdea로 삭제 (브로드캐스트 포함)
        deleteIdea(text.id);
      }
    });
    
    // 즉시 삭제 (하이라이트 효과 없이)
    textFields.deleteTextsInArea(areaToDelete);
    canvas.deleteCanvasArea(areaIndex);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const arrangeTexts = () => {
    if (textFields.texts.length === 0) return;
    
    // 처음 생성된 캔버스 찾기
    const initialCanvas = canvas.canvasAreas.find(area => area.isInitial);
    if (!initialCanvas) return;
    
    // 처음 생성된 캔버스의 중심점 계산
    const centerX = initialCanvas.x + initialCanvas.width / 2;
    const centerY = initialCanvas.y + initialCanvas.height / 2;
    
    // 텍스트 필드들을 그리드 형태로 정렬 (처음 생성된 캔버스 중심 기준)
    const cols = Math.ceil(Math.sqrt(textFields.texts.length));
    const rows = Math.ceil(textFields.texts.length / cols);
    const spacing = CANVAS_AREA_CONSTANTS.TEXT_ARRANGE_SPACING;
    const startX = centerX - ((cols - 1) * spacing) / 2;
    const startY = centerY - ((rows - 1) * spacing) / 2;
    
    const arrangedTexts = textFields.texts.map((text, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...text,
        x: startX + col * spacing,
        y: startY + row * spacing
      };
    });
    
    // 텍스트 필드 위치 업데이트
    arrangedTexts.forEach((text, index) => {
      textFields.updateText(text.id, { x: text.x, y: text.y });
    });
  };

  const resetCanvas = () => {
    canvas.resetCanvas();
    textFields.resetTexts();
  };

  const handleLocationClick = (location) => {
    // 해당 위치로 캔버스 이동
    canvas.moveToLocation(location);
  };

  const handleClusteringParamsChange = (params) => {
    console.log('Clustering params changed:', params);
    
    // 클러스터링 결과가 없으면 리턴
    if (!params.result || !params.result.labels) {
      return;
    }
    
    const clusteringResult = params.result;
    const labels = clusteringResult.labels;
    const textIds = clusteringResult.textIds; // ClusteringPanel에서 전달된 텍스트 ID 순서
    
    if (!textIds || textIds.length !== labels.length) {
      console.warn('텍스트 ID 매핑이 올바르지 않습니다.', {
        textIdsCount: textIds ? textIds.length : 0,
        labelsCount: labels.length
      });
      return;
    }
    
    // 텍스트 ID로 매핑 생성
    const textMap = new Map();
    textFields.texts.forEach(text => {
      textMap.set(text.id, text);
    });
    
    // 클러스터링 결과 순서대로 텍스트 매칭
    const matchedTexts = [];
    textIds.forEach(id => {
      const text = textMap.get(id);
      if (text) {
        matchedTexts.push(text);
      } else {
        console.warn(`텍스트 ID ${id}를 찾을 수 없습니다.`);
      }
    });
    
    if (matchedTexts.length !== labels.length) {
      console.warn('텍스트 매칭 실패', {
        matchedCount: matchedTexts.length,
        labelsCount: labels.length
      });
      return;
    }
    
    // 클러스터별로 텍스트 그룹화
    const clusterGroups = {};
    matchedTexts.forEach((text, index) => {
      const clusterId = labels[index];
      if (!clusterGroups[clusterId]) {
        clusterGroups[clusterId] = [];
      }
      clusterGroups[clusterId].push({ text, index });
    });
    
    // 클러스터링 결과에서 대표 텍스트 정보 가져오기
    const clusterRepresentatives = {};
    if (clusteringResult.clusters) {
      clusteringResult.clusters.forEach((cluster, idx) => {
        clusterRepresentatives[cluster.cluster_idx] = cluster.representative_text;
      });
    }
    
    // 시각화 데이터 확인 (PCA 좌표)
    const visualization = clusteringResult.visualization;
    const useVisualization = visualization && visualization.points && visualization.points.length > 0;
    
    // 초기 캔버스 중심점 찾기
    const initialCanvas = canvas.canvasAreas.find(area => area.isInitial);
    if (!initialCanvas) return;
    
    const centerX = initialCanvas.x + initialCanvas.width / 2;
    const centerY = initialCanvas.y + initialCanvas.height / 2;
    
    // PCA 좌표를 캔버스 좌표로 변환하는 함수
    const convertPCAToCanvas = (pcaPoints, centroids) => {
      if (!pcaPoints || pcaPoints.length === 0) return null;
      
      // PCA 좌표 범위 계산
      const allPoints = [...pcaPoints, ...(centroids || [])];
      const xCoords = allPoints.map(p => p[0]);
      const yCoords = allPoints.map(p => p[1]);
      
      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const minY = Math.min(...yCoords);
      const maxY = Math.max(...yCoords);
      
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      
      // 캔버스 배치 영역 크기 (중심 기준으로 충분한 공간 확보)
      const canvasWidth = 2000; // PCA 좌표를 배치할 영역 너비
      const canvasHeight = 2000; // PCA 좌표를 배치할 영역 높이
      
      const scaleX = canvasWidth / rangeX;
      const scaleY = canvasHeight / rangeY;
      const scale = Math.min(scaleX, scaleY) * 0.8; // 80% 스케일로 여백 확보
      
      // 변환 함수
      const convert = (pcaPoint) => {
        const normalizedX = (pcaPoint[0] - minX) / rangeX;
        const normalizedY = (pcaPoint[1] - minY) / rangeY;
        
        return {
          x: centerX + (normalizedX - 0.5) * canvasWidth * 0.8,
          y: centerY + (normalizedY - 0.5) * canvasHeight * 0.8
        };
      };
      
      return {
        convert,
        scale,
        minX, maxX, minY, maxY,
        canvasWidth, canvasHeight
      };
    };
    
    const coordConverter = useVisualization 
      ? convertPCAToCanvas(visualization.points, visualization.centroids)
      : null;
    
    // 텍스트 박스 크기 가져오기 함수
    const getTextSize = (text) => {
      const defaultWidth = CLUSTERING_LAYOUT_CONSTANTS.DEFAULT_TEXT_WIDTH;
      const defaultHeight = CLUSTERING_LAYOUT_CONSTANTS.DEFAULT_TEXT_HEIGHT;
      
      // CSS 변수에서 가져오기 시도
      const cssWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--memo-width')) || defaultWidth;
      const cssHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--memo-height')) || defaultHeight;
      
      return {
        width: text.width !== null && text.width !== undefined ? text.width : cssWidth,
        height: text.height !== null && text.height !== undefined ? text.height : cssHeight
      };
    };
    
    // 두 도형이 겹치는지 확인
    const isShapesOverlapping = (bounds1, bounds2) => {
      return !(
        bounds1.maxX <= bounds2.minX ||
        bounds2.maxX <= bounds1.minX ||
        bounds1.maxY <= bounds2.minY ||
        bounds2.maxY <= bounds1.minY
      );
    };
    
    // 클러스터 배치 설정
    const textMargin = CLUSTERING_LAYOUT_CONSTANTS.TEXT_MARGIN;
    const shapePadding = CLUSTERING_LAYOUT_CONSTANTS.CLUSTER_SHAPE_PADDING;
    const horizontalSpacing = CLUSTERING_LAYOUT_CONSTANTS.CLUSTER_INITIAL_HORIZONTAL_SPACING;
    const verticalSpacing = CLUSTERING_LAYOUT_CONSTANTS.CLUSTER_INITIAL_VERTICAL_SPACING;
    const clustersPerRow = CLUSTERING_LAYOUT_CONSTANTS.CLUSTERS_PER_ROW;
    const borderColors = CLUSTERING_LAYOUT_CONSTANTS.CLUSTER_BORDER_COLORS;
    
    // 클러스터 개수
    const clusterCount = Object.keys(clusterGroups).length;
    
    // 각 클러스터의 텍스트 배치 및 도형 정보 저장
    const textUpdates = [];
    const clusterShapes = []; // 클러스터 도형 정보 저장
    let clusterIndex = 0;
    
    // PCA 좌표를 사용한 배치인지 확인
    const usePCALayout = coordConverter !== null;
    
    // 1단계: 클러스터들을 먼저 배치
    Object.keys(clusterGroups).forEach(clusterId => {
      const group = clusterGroups[clusterId];
      const clusterIdNum = parseInt(clusterId);
      
      // 클러스터 테두리 색상 선택
      const borderColor = borderColors[clusterIndex % borderColors.length];
      
      // 배경색 (테두리 색상 기반, 반투명)
      const backgroundColor = borderColor.replace('rgb', 'rgba').replace(')', ', 0.08)');
      
      // PCA 좌표를 사용한 배치
      let groupTexts = [];
      let clusterCenterX, clusterCenterY;
      let centroidCanvasPos = null;
      
      if (usePCALayout) {
        // PCA 좌표를 사용하여 텍스트 배치
        group.forEach((item, itemIndex) => {
          const originalIndex = item.index; // 원본 텍스트 인덱스
          const pcaPoint = visualization.points[originalIndex];
          
          if (pcaPoint) {
            const canvasPos = coordConverter.convert(pcaPoint);
            const size = getTextSize(item.text);
            
            // 텍스트를 PCA 좌표 위치에 배치 (중앙 정렬)
            const newX = canvasPos.x - size.width / 2;
            const newY = canvasPos.y - size.height / 2;
            
            groupTexts.push({
              id: item.text.id,
              x: newX,
              y: newY,
              width: size.width,
              height: size.height,
              pcaX: pcaPoint[0],
              pcaY: pcaPoint[1]
            });
            
            textUpdates.push({
              id: item.text.id,
              x: newX,
              y: newY
            });
          }
        });
        
        // 클러스터 중심점 계산 (PCA centroid 사용)
        if (visualization.centroids && visualization.centroids[clusterIdNum]) {
          const centroidPCA = visualization.centroids[clusterIdNum];
          centroidCanvasPos = coordConverter.convert(centroidPCA);
          clusterCenterX = centroidCanvasPos.x;
          clusterCenterY = centroidCanvasPos.y;
        } else {
          // centroid가 없으면 텍스트들의 평균 위치 사용
          const avgX = groupTexts.reduce((sum, t) => sum + t.x + t.width / 2, 0) / groupTexts.length;
          const avgY = groupTexts.reduce((sum, t) => sum + t.y + t.height / 2, 0) / groupTexts.length;
          clusterCenterX = avgX;
          clusterCenterY = avgY;
        }
      } else {
        // 기존 그리드 방식 배치 (PCA 좌표가 없는 경우)
        const col = clusterIndex % clustersPerRow;
        const row = Math.floor(clusterIndex / clustersPerRow);
        
        clusterCenterX = centerX - (clustersPerRow * horizontalSpacing) / 2 + col * horizontalSpacing;
        clusterCenterY = centerY + row * verticalSpacing;
        
        // 텍스트 박스 크기 계산
        let maxWidth = 0;
        let maxHeight = 0;
        group.forEach(item => {
          const size = getTextSize(item.text);
          maxWidth = Math.max(maxWidth, size.width);
          maxHeight = Math.max(maxHeight, size.height);
        });
        
        // 텍스트들을 세로로 배치 (1열, 중심 기준)
        let currentY = clusterCenterY - (group.length * (maxHeight + textMargin)) / 2;
        
        group.forEach((item, itemIndex) => {
          const size = getTextSize(item.text);
          const newX = clusterCenterX - maxWidth / 2;
          const newY = currentY;
          
          groupTexts.push({
            id: item.text.id,
            x: newX,
            y: newY,
            width: size.width,
            height: size.height
          });
          
          textUpdates.push({
            id: item.text.id,
            x: newX,
            y: newY
          });
          
          currentY += size.height + textMargin;
        });
      }
      
      // 효율적인 도형 경계 계산 (텍스트들의 실제 배치를 고려하여 여백 최소화)
      // 각 텍스트의 실제 경계를 계산
      const textBounds = groupTexts.map(t => ({
        left: t.x,
        right: t.x + t.width,
        top: t.y,
        bottom: t.y + t.height
      }));
      
      // 텍스트들의 실제 배치를 분석하여 최적의 경계 계산
      // 세로로 긴 메모나 가로로 긴 메모를 고려하여 여백 최소화
      const allLefts = textBounds.map(b => b.left);
      const allRights = textBounds.map(b => b.right);
      const allTops = textBounds.map(b => b.top);
      const allBottoms = textBounds.map(b => b.bottom);
      
      // 실제 텍스트들이 차지하는 영역의 정확한 경계
      const minX = Math.min(...allLefts) - shapePadding;
      const maxX = Math.max(...allRights) + shapePadding;
      const minY = Math.min(...allTops) - shapePadding;
      const maxY = Math.max(...allBottoms) + shapePadding;
      
      // 도형 경계점들
      const shapeBounds = {
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
        textBounds: textBounds // 텍스트 경계 정보 저장 (나중에 최적화된 도형 생성용)
      };
      
      // 클러스터의 대표 텍스트 가져오기
      const representativeText = clusterRepresentatives[parseInt(clusterId)] || 
                                 (group.length > 0 ? group[0].text.text : '');
      
      clusterShapes.push({
        clusterId: `cluster-${clusterId}`,
        clusterIndex: clusterIndex,
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        bounds: shapeBounds,
        textIds: groupTexts.map(t => t.id),
        representativeText: representativeText, // 대표 텍스트 저장
        centroid: centroidCanvasPos ? {
          x: centroidCanvasPos.x,
          y: centroidCanvasPos.y
        } : null // 클러스터 중심점
      });
      
      clusterIndex++;
    });
    
    // 2단계: 도형들끼리 겹치는지 확인하고 조정
    const adjustedShapes = [];
    clusterShapes.forEach((shape, index) => {
      let adjustedBounds = { ...shape.bounds };
      let hasCollision = true;
      let attempts = 0;
      const maxAttempts = 50;
      
      while (hasCollision && attempts < maxAttempts) {
        hasCollision = false;
        
        // 이미 조정된 도형들과 겹치는지 확인
        for (let i = 0; i < adjustedShapes.length; i++) {
          const otherShape = adjustedShapes[i];
          if (isShapesOverlapping(adjustedBounds, otherShape.bounds)) {
            hasCollision = true;
            // 겹치면 방향에 따라 이동
            const dx = adjustedBounds.centerX - otherShape.bounds.centerX;
            const dy = adjustedBounds.centerY - otherShape.bounds.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (adjustedBounds.width + otherShape.bounds.width) / 2 + shapePadding * 2;
            
            if (distance < minDistance && distance > 0) {
              const moveX = (dx / distance) * (minDistance - distance + shapePadding);
              const moveY = (dy / distance) * (minDistance - distance + shapePadding);
              adjustedBounds.minX += moveX;
              adjustedBounds.maxX += moveX;
              adjustedBounds.minY += moveY;
              adjustedBounds.maxY += moveY;
              adjustedBounds.centerX += moveX;
              adjustedBounds.centerY += moveY;
            } else {
              // 거리가 0이거나 계산 불가능한 경우 랜덤 방향으로 이동
              const angle = (attempts * 0.5) % (2 * Math.PI);
              const offset = shapePadding * (attempts + 1);
              adjustedBounds.minX += Math.cos(angle) * offset;
              adjustedBounds.maxX += Math.cos(angle) * offset;
              adjustedBounds.minY += Math.sin(angle) * offset;
              adjustedBounds.maxY += Math.sin(angle) * offset;
              adjustedBounds.centerX += Math.cos(angle) * offset;
              adjustedBounds.centerY += Math.sin(angle) * offset;
            }
            break;
          }
        }
        
        if (!hasCollision) {
          break;
        }
        attempts++;
      }
      
      adjustedShapes.push({
        ...shape,
        bounds: adjustedBounds
      });
      
      // 텍스트 위치도 도형 이동에 맞춰 조정
      const dx = adjustedBounds.centerX - shape.bounds.centerX;
      const dy = adjustedBounds.centerY - shape.bounds.centerY;
      
      shape.textIds.forEach(textId => {
        const updateIndex = textUpdates.findIndex(u => u.id === textId);
        if (updateIndex !== -1) {
          textUpdates[updateIndex].x += dx;
          textUpdates[updateIndex].y += dy;
        }
      });
    });
    
    // 도형 정보를 상태에 저장 (CanvasArea에서 렌더링용)
    setClusterShapes(adjustedShapes);
    
    // 생성된 도형 정보 저장 (되돌리기용) - 클러스터링 전 텍스트 위치 저장
    const originalTextStates = textUpdates.map(update => {
      const originalText = textFields.texts.find(t => t.id === update.id);
      return {
        id: update.id,
        originalX: originalText ? originalText.x : update.x,
        originalY: originalText ? originalText.y : update.y
      };
    });
    
    setLastClusteringState({
      shapes: adjustedShapes,
      textStates: originalTextStates
    });
    
    // 텍스트 위치 업데이트
    textUpdates.forEach(update => {
      textFields.updateText(update.id, { x: update.x, y: update.y });
      // 클러스터링으로 이동한 메모의 위치에 대해 캔버스 확장 체크
      checkAndExpandCanvas(update.x, update.y);
    });
    
    console.log('클러스터링 결과로 텍스트 위치 조정 완료', {
      clusterCount,
      textUpdatesCount: textUpdates.length,
      clusterShapes: adjustedShapes
    });
  };

  // 클러스터링 되돌리기 함수
  const handleUndoClustering = () => {
    if (!lastClusteringState) {
      console.warn('되돌릴 클러스터링 상태가 없습니다.');
      return;
    }

    // 클러스터 도형 정보 제거
    setClusterShapes([]);
    setDraggingCluster(null);

    // 텍스트 위치를 이전 상태로 복원
    lastClusteringState.textStates.forEach(({ id, originalX, originalY }) => {
      textFields.updateText(id, {
        x: originalX,
        y: originalY
      });
    });

    // 되돌리기 상태 초기화
    setLastClusteringState(null);
    
    console.log('클러스터링 되돌리기 완료');
  };

  // 클러스터 드래그 시작
  const handleClusterDragStart = (shape, e) => {
    if (mode !== 'move') return;
    
    console.log('클러스터 드래그 시작', shape);
    
    const rect = canvas.canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scrollX = canvas.canvasRef.current.scrollLeft || 0;
    const scrollY = canvas.canvasRef.current.scrollTop || 0;
    const containerX = e.clientX - rect.left + scrollX;
    const containerY = e.clientY - rect.top + scrollY;
    
    // 클릭 위치를 캔버스 좌표로 변환
    const clickX = (containerX - canvas.canvasTransform.x) / canvas.canvasTransform.scale;
    const clickY = (containerY - canvas.canvasTransform.y) / canvas.canvasTransform.scale;
    
    // 클러스터 내 모든 텍스트의 초기 위치 저장
    const initialTextPositions = {};
    shape.textIds.forEach(textId => {
      const text = textFields.texts.find(t => t.id === textId);
      if (text) {
        initialTextPositions[textId] = { x: text.x, y: text.y };
      }
    });
    
    setDraggingCluster({
      ...shape,
      initialBounds: { ...shape.bounds },
      initialCentroid: shape.centroid ? { ...shape.centroid } : null, // centroid 초기 위치 저장
      initialTextPositions: initialTextPositions,
      dragOffsetX: clickX - shape.bounds.minX,
      dragOffsetY: clickY - shape.bounds.minY
    });
    
    setClusterDragStart({ x: clickX, y: clickY });
    
    // 전역 마우스 이벤트 리스너 추가 (캔버스 영역을 벗어나도 드래그 계속)
    const handleGlobalMouseMove = (e) => {
      handleClusterDrag(e);
    };
    
    const handleGlobalMouseUp = () => {
      handleClusterDragEnd();
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  // 클러스터 드래그 중
  const handleClusterDrag = (e) => {
    if (!draggingCluster || mode !== 'move') return;
    
    const rect = canvas.canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scrollX = canvas.canvasRef.current.scrollLeft || 0;
    const scrollY = canvas.canvasRef.current.scrollTop || 0;
    const containerX = e.clientX - rect.left + scrollX;
    const containerY = e.clientY - rect.top + scrollY;
    
    // 현재 위치를 캔버스 좌표로 변환
    const currentX = (containerX - canvas.canvasTransform.x) / canvas.canvasTransform.scale;
    const currentY = (containerY - canvas.canvasTransform.y) / canvas.canvasTransform.scale;
    
    // 이동 거리 계산
    const deltaX = currentX - clusterDragStart.x;
    const deltaY = currentY - clusterDragStart.y;
    
    // 도형 위치 업데이트
    const newBounds = {
      ...draggingCluster.initialBounds,
      minX: draggingCluster.initialBounds.minX + deltaX,
      maxX: draggingCluster.initialBounds.maxX + deltaX,
      minY: draggingCluster.initialBounds.minY + deltaY,
      maxY: draggingCluster.initialBounds.maxY + deltaY,
      centerX: draggingCluster.initialBounds.centerX + deltaX,
      centerY: draggingCluster.initialBounds.centerY + deltaY,
      width: draggingCluster.initialBounds.width,
      height: draggingCluster.initialBounds.height
    };
    
    // centroid도 함께 이동
    const newCentroid = draggingCluster.initialCentroid ? {
      x: draggingCluster.initialCentroid.x + deltaX,
      y: draggingCluster.initialCentroid.y + deltaY
    } : null;
    
    setDraggingCluster({
      ...draggingCluster,
      bounds: newBounds,
      centroid: newCentroid
    });
    
    // 모든 텍스트 위치 업데이트
    draggingCluster.textIds.forEach(textId => {
      const initialPos = draggingCluster.initialTextPositions[textId];
      if (initialPos) {
        const newX = initialPos.x + deltaX;
        const newY = initialPos.y + deltaY;
        textFields.updateText(textId, {
          x: newX,
          y: newY
        });
        // 클러스터 드래그로 이동한 메모의 위치에 대해 캔버스 확장 체크
        checkAndExpandCanvas(newX, newY);
      }
    });
  };

  // 클러스터 드래그 종료
  const handleClusterDragEnd = () => {
    if (!draggingCluster) return;
    
    // 클러스터 도형 정보 업데이트 (centroid 포함)
    setClusterShapes(prev => prev.map(shape => 
      shape.clusterId === draggingCluster.clusterId
        ? { 
            ...shape, 
            bounds: draggingCluster.bounds,
            centroid: draggingCluster.centroid || shape.centroid
          }
        : shape
    ));
    
    setDraggingCluster(null);
    setClusterDragStart({ x: 0, y: 0 });
  };

  return (
    <div className="infinite-canvas-page">
      {/* Toast 알림 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        duration={3000}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
      
      {/* 상단 툴바 */}
      <TopToolbar
        projectName={workspaceName}
        participants={workspaceParticipants.map(p => ({
          ...p,
          isCurrentUser: currentUserId ? p.id === currentUserId : false
        }))}
        inviteLink={inviteLink}
        onCopyInviteLink={handleCopyInviteLink}
        onGenerateInviteLink={handleGenerateInviteLink}
      />
      
      {/* 채팅창 */}
      <ChatPanel 
        messages={chatMessages}
        onLocationClick={handleLocationClick}
        onVisibilityChange={setIsChatPanelOpen}
        participants={session.participants}
        onSendMessage={sendChatMessage}
      />
      
      {/* 클러스터링 패널 */}
      <ClusteringPanel 
        onClusteringParamsChange={handleClusteringParamsChange}
        onVisibilityChange={setIsClusteringPanelOpen}
        onGridVisibilityChange={setShowGrid}
        showGrid={showGrid}
        showMinimap={showMinimap}
        onMinimapVisibilityChange={setShowMinimap}
        showCenterIndicator={showCenterIndicator}
        onCenterIndicatorVisibilityChange={setShowCenterIndicator}
        texts={textFields.texts}
        onUndoClustering={handleUndoClustering}
        canUndoClustering={lastClusteringState !== null}
      />
      
      {/* 플로팅 툴바 */}
      <FloatingToolbar 
        mode={mode} 
        onModeChange={handleModeChange} 
        onReset={resetCanvas}
        onArrange={arrangeTexts}
      />

      {/* 중앙 표시 점 */}
      {showCenterIndicator && (
        <CenterIndicator 
          canvasTransform={canvas.canvasTransform}
          isChatPanelOpen={isChatPanelOpen}
          isClusteringPanelOpen={isClusteringPanelOpen}
          onCenterClick={handleLocationClick}
          canvasRef={canvas.canvasRef}
        />
      )}

      {/* 미니맵 */}
      {showMinimap && (
        <Minimap
          canvasAreas={canvas.canvasAreas}
          canvasTransform={canvas.canvasTransform}
          windowSize={windowSize}
          onLocationClick={handleLocationClick}
          isClusteringPanelOpen={isClusteringPanelOpen}
        />
      )}

      {/* 캔버스 */}
      <div
        ref={canvas.canvasRef}
        className={`canvas-container canvas-grid ${canvas.isScrolling ? 'scrolling' : ''}`}
        onClick={handleCanvasClick}
        onMouseDown={canvas.handleCanvasMouseDown}
        onWheel={canvas.handleWheel}
        style={{
          backgroundSize: `${20 * canvas.canvasTransform.scale}px ${20 * canvas.canvasTransform.scale}px`,
          backgroundPosition: `${canvas.canvasTransform.x}px ${canvas.canvasTransform.y}px`
        }}
      >
        <CanvasArea
          canvasAreas={canvas.canvasAreas}
          canvasTransform={canvas.canvasTransform}
          texts={textFields.texts}
          updateText={handleTextUpdate}
          deleteText={(id) => {
            deleteIdea(id);
            textFields.deleteText(id);
          }}
          handleSendToChat={(id, x, y, text) => textFields.handleSendToChat(id, x, y, text, setChatMessages)}
          setIsTextEditing={textFields.setIsTextEditing}
          mode={mode}
          onCanvasAreaDelete={handleCanvasAreaDelete}
          highlightedTextIds={textFields.highlightedTextIds}
          onHighlightTextsInArea={textFields.highlightTextsInArea}
          onCanvasMouseDown={handleCanvasMouseDown}
          onCanvasMouseMove={handleCanvasMouseMove}
          onCanvasMouseUp={handleCanvasMouseUp}
          selectedTextIds={textFields.selectedTextIds}
          isMultiSelecting={textFields.isMultiSelecting}
          selectionArea={canvas.selectionArea}
          onStartGroupDrag={textFields.startGroupDrag}
          onUpdateGroupDrag={(baseTextId, newX, newY) => textFields.updateGroupDrag(baseTextId, newX, newY, handleGroupDragCanvasExpansion)}
          onEndGroupDrag={textFields.endGroupDrag}
          onTextDragStart={handleTextDragStart}
          onTextDragEnd={handleTextDragEnd}
          onTextResizeStart={handleTextResizeStart}
          onTextResizeEnd={handleTextResizeEnd}
          newlyCreatedTextId={newlyCreatedTextId}
          isAnimating={canvas.isAnimating}
          showGrid={showGrid}
          clusterShapes={clusterShapes}
          onClusterDragStart={handleClusterDragStart}
          onClusterDrag={handleClusterDrag}
          onClusterDragEnd={handleClusterDragEnd}
          draggingCluster={draggingCluster}
        />
      </div>
    </div>
  );
};

export default InfiniteCanvasPage;
