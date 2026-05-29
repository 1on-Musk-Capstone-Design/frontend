import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import ChatPanel from './components/ChatPanel';
import VoiceCallTestPanel from './components/VoiceCallTestPanel';
import { API_BASE_URL } from '../../config/api';
import './styles/canvas.css';

const pageStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 34%), radial-gradient(circle at top right, rgba(16,185,129,0.10), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
  position: 'relative',
  overflow: 'auto'
};

const canvasStyle = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)',
  backgroundSize: '24px 24px',
  opacity: 0.35
};

const hintStyle = {
  position: 'fixed',
  top: 16,
  right: 16,
  zIndex: 50,
  padding: '12px 14px',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.88)',
  border: '1px solid rgba(148,163,184,0.24)',
  boxShadow: '0 12px 28px rgba(15,23,42,0.10)',
  color: '#334155',
  fontSize: 13,
  lineHeight: 1.5,
  maxWidth: 340,
  backdropFilter: 'blur(12px)'
};

const controlStyle = {
  width: 360,
  padding: 18,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.88)',
  border: '1px solid rgba(148,163,184,0.24)',
  boxShadow: '0 14px 30px rgba(15,23,42,0.10)',
  color: '#111827',
  backdropFilter: 'blur(12px)'
};

const titleStyle = {
  fontSize: 14,
  fontWeight: 800,
  marginBottom: 10,
  letterSpacing: '-0.01em'
};

const helperStyle = {
  marginTop: 10,
  padding: '12px 12px',
  borderRadius: 14,
  background: 'linear-gradient(180deg, rgba(248,250,252,0.96), rgba(241,245,249,0.96))',
  border: '1px solid rgba(148,163,184,0.18)',
  fontSize: 12,
  color: '#475569',
  lineHeight: 1.6
};

const centerStageStyle = {
  position: 'relative',
  zIndex: 3,
  display: 'flex',
  gap: 16,
  alignItems: 'flex-start',
  justifyContent: 'center',
  flexWrap: 'wrap',
  minWidth: 'max-content',
  padding: '20px 16px 40px',
  margin: '0 auto',
  minHeight: '100%'
};

const stageViewportStyle = {
  position: 'relative',
  zIndex: 3,
  width: '100%',
  height: '100vh',
  overflowX: 'auto',
  overflowY: 'auto'
};

const fieldStyle = {
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  fontSize: 13,
  outline: 'none',
  background: '#ffffff'
};

const PREVIEW_BROWSER_SESSION_KEY = 'voicePreviewBrowserSessionId';
const PREVIEW_BOOTSTRAP_RUN_KEY = 'voicePreviewBootstrapRunKey';
const PREVIEW_WORKSPACE_USER_ID_KEY = 'voicePreviewWorkspaceUserId';

function getOrCreatePreviewBrowserSessionId() {
  const existing = localStorage.getItem(PREVIEW_BROWSER_SESSION_KEY);
  if (existing) {
    return existing;
  }

  const generated = window.crypto?.randomUUID?.() || `preview-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(PREVIEW_BROWSER_SESSION_KEY, generated);
  return generated;
}

export default function VoicePreviewPage() {
  const [workspaceId, setWorkspaceId] = useState('1');
  const [currentWorkspaceUserId, setCurrentWorkspaceUserId] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [workspaceMembersError, setWorkspaceMembersError] = useState('');
  const [bootstrapError, setBootstrapError] = useState('');
  const bootstrapRunKeyRef = useRef('');

  const candidatePeers = useMemo(() => {
    return workspaceMembers
      .filter((member) => String(member.workspaceUserId ?? member.id) !== String(currentWorkspaceUserId || ''))
      .map((member) => ({
        id: member.workspaceUserId ?? member.id,
        name: member.name || member.email || `사용자 ${member.workspaceUserId ?? member.id}`,
        userName: member.name || member.email || `사용자 ${member.workspaceUserId ?? member.id}`
      }));
  }, [workspaceMembers, currentWorkspaceUserId]);

  const chatParticipants = useMemo(() => {
    return workspaceMembers.map((member) => {
      const participantId = member.workspaceUserId ?? member.id;
      return {
        id: String(participantId),
        name: member.name || member.email || `사용자 ${participantId}`,
        profileImage: member.profileImage || ''
      };
    });
  }, [workspaceMembers]);

  const currentChatParticipant = useMemo(() => {
    if (!chatParticipants.length) {
      return null;
    }

    const selectedId = String(currentWorkspaceUserId || chatParticipants[0].id);
    return chatParticipants.find((participant) => participant.id === selectedId) || chatParticipants[0];
  }, [chatParticipants, currentWorkspaceUserId]);

  useEffect(() => {
    let isCancelled = false;

    const bootstrapPreviewUser = async () => {
      if (!workspaceId) {
        setWorkspaceMembers([]);
        setWorkspaceMembersError('');
        setBootstrapError('');
        setCurrentWorkspaceUserId('');
        return;
      }

      setBootstrapError('');

      try {
        const browserSessionId = getOrCreatePreviewBrowserSessionId();
        const runKey = `${workspaceId}:${browserSessionId}`;
        let workspaceUserIdFromBootstrap = null;

        if (bootstrapRunKeyRef.current !== runKey && sessionStorage.getItem(PREVIEW_BOOTSTRAP_RUN_KEY) !== runKey) {
          bootstrapRunKeyRef.current = runKey;
          sessionStorage.setItem(PREVIEW_BOOTSTRAP_RUN_KEY, runKey);

          const response = await axios.post(`${API_BASE_URL}/v1/auth/dev/preview/bootstrap`, {
            workspaceId: Number(workspaceId),
            browserSessionId
          });

          const { accessToken, refreshToken, workspaceUserId, name, email } = response.data || {};
          workspaceUserIdFromBootstrap = workspaceUserId;

          if (isCancelled) {
            return;
          }

          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
          }
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          if (name) {
            localStorage.setItem('userName', name);
          }
          if (email) {
            localStorage.setItem('userEmail', email);
          }

          if (workspaceUserId != null) {
            localStorage.setItem(PREVIEW_WORKSPACE_USER_ID_KEY, String(workspaceUserId));
            setCurrentWorkspaceUserId(String(workspaceUserId));
          }
        } else {
          const savedWorkspaceUserId = localStorage.getItem(PREVIEW_WORKSPACE_USER_ID_KEY);
          if (savedWorkspaceUserId) {
            workspaceUserIdFromBootstrap = Number(savedWorkspaceUserId);
            setCurrentWorkspaceUserId(savedWorkspaceUserId);
          }
        }

        if (workspaceUserIdFromBootstrap != null) {
          setCurrentWorkspaceUserId(String(workspaceUserIdFromBootstrap));
        }
      } catch (error) {
        console.error('[VoicePreviewPage] failed to bootstrap preview user', error);
        if (!isCancelled) {
          const status = error?.response?.status;
          const detail = error?.response?.data?.message || error?.response?.data || error?.message || '';
          const statusSuffix = status ? ` (status: ${status})` : '';
          const detailSuffix = detail ? ` - ${String(detail)}` : '';
          setBootstrapError(`프리뷰용 임시 사용자를 생성하지 못했습니다.${statusSuffix}${detailSuffix}`);
        }
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/v1/workspaces/${workspaceId}/users`
        );

        if (!isCancelled) {
          setWorkspaceMembers(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('[VoicePreviewPage] failed to load workspace members', error);
        if (!isCancelled) {
          setWorkspaceMembers([]);
          setWorkspaceMembersError('워크스페이스 사용자 목록을 불러오지 못했습니다.');
        }
      }
    };

    bootstrapPreviewUser();

    return () => {
      isCancelled = true;
    };
  }, [workspaceId]);

  return (
    <div style={pageStyle}>
      <div style={canvasStyle} />
      <div style={stageViewportStyle}>
        <div style={centerStageStyle}>
          <div style={controlStyle}>
            <div style={titleStyle}>Voice Test Controls</div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>
              Workspace ID
              <input
                style={fieldStyle}
                value={workspaceId}
                onChange={(event) => setWorkspaceId(event.target.value)}
                placeholder="예: 1"
              />
            </label>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginTop: 10 }}>
              My Workspace User ID
              <input
                style={fieldStyle}
                value={currentWorkspaceUserId}
                onChange={(event) => setCurrentWorkspaceUserId(event.target.value)}
                placeholder="예: 1"
              />
            </label>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginTop: 10 }}>
              Peer Workspace Users
              <input
                style={fieldStyle}
                value={candidatePeers.map((peer) => peer.id).join(', ')}
                readOnly
                placeholder="현재 워크스페이스 멤버를 불러오는 중"
              />
            </label>
            <div style={{ marginTop: 8, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              {bootstrapError
                ? bootstrapError
                : workspaceMembersError
                ? workspaceMembersError
                : candidatePeers.length > 0
                  ? `활성 peer: ${candidatePeers.map((peer) => peer.userName).join(', ')}`
                  : '현재 워크스페이스에 다른 멤버가 없어 통화 상대가 없습니다.'}
            </div>
            <div style={helperStyle}>
              1. 워크스페이스와 사용자 ID를 입력하세요.
              <br />
              2. 오른쪽 패널에서 SFU/Mesh 상태와 오디오 테스트를 확인합니다.
            </div>
          </div>
          <VoiceCallTestPanel
            workspaceId={workspaceId ? Number(workspaceId) : null}
            currentWorkspaceUserId={currentWorkspaceUserId ? Number(currentWorkspaceUserId) : null}
            peerWorkspaceUserId={candidatePeers[0]?.id ? Number(candidatePeers[0].id) : null}
            candidatePeers={candidatePeers}
            embedded
          />
        </div>
      </div>
      <div style={hintStyle}>
        음성 UI 미리보기 페이지입니다.
        <br />
        로그인 없이 음성 통화 테스트용 패널을 바로 띄웁니다.
      </div>
      <ChatPanel
        messages={[]}
        participants={chatParticipants}
        currentUserId={currentChatParticipant?.id || ''}
        currentUserName={currentChatParticipant?.name || ''}
        currentUserImage={currentChatParticipant?.profileImage || ''}
        workspaceId={workspaceId ? Number(workspaceId) : null}
        projectName="Voice Preview"
      />
    </div>
  );
}
