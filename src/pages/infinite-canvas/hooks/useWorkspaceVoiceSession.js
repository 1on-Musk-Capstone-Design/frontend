import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';
import { useVoiceSFU } from './useVoiceSFU';

export function useWorkspaceVoiceSession({
  workspaceId,
  workspaceUserId,
  preferredSessionId = null,
  connectRequestKey = null,
  disconnectRequestKey = null
}) {
  const joinedSessionRef = useRef(null);
  const pendingAutoConnectKeyRef = useRef(null);
  const lastDisconnectRequestRef = useRef(null);
  const remoteSpeakingAudioContextRef = useRef(null);
  const remoteSpeakingRefs = useRef({});
  const remoteSpeakingRafRef = useRef(null);

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [speakingUserIds, setSpeakingUserIds] = useState([]);

  const sendLeaveRequest = (sessionId, userId, useKeepalive = false) => {
    if (!workspaceId || !sessionId || !Number.isFinite(userId) || userId <= 0) {
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    const endpoint = `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${sessionId}/users/${userId}`;

    if (useKeepalive && typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch(endpoint, {
        method: 'DELETE',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        keepalive: true
      }).catch(() => {});
      return;
    }

    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    axios.delete(endpoint, { headers }).catch(() => {});
  };

  const sfuHook = useVoiceSFU({
    workspaceId,
    sessionId: activeSessionId,
    workspaceUserId
  });

  const {
    isInCall = false,
    isMuted = false,
    callState = '',
    callStateLabel = '',
    callStates = {},
    remoteStreams = {},
    remoteProducerMeta = {},
    sfuStats = {},
    sfuMediaStats = {},
    sfuTransportStates = {},
    callPhase = '',
    error = '',
    connectedPeerIds = [],
    startCall = async () => {},
    leaveCall = async () => {},
    toggleMute = async () => {}
  } = sfuHook;

  useEffect(() => {
    const setupVoiceSession = async () => {
      if (!workspaceId || !workspaceUserId || !preferredSessionId) {
        setActiveSessionId(null);
        setIsSessionReady(false);
        setSessionError('');
        return;
      }

      setSessionError('');
      setIsSessionReady(false);

      try {
        const accessToken = localStorage.getItem('accessToken');
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const numericUserId = Number(workspaceUserId);

        if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
          throw new Error('현재 워크스페이스 사용자 ID가 유효하지 않습니다.');
        }

        const sessionsRes = await axios.get(
          `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice`,
          { headers }
        );
        const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
        const matchedSession = sessions.find(
          (session) => Number(session.id) === Number(preferredSessionId) && !session.endedAt
        );

        if (!matchedSession) {
          throw new Error('선택한 음성채널 세션을 찾지 못했거나 이미 종료되었습니다.');
        }

        const numericSessionId = Number(matchedSession.id);

        try {
          await axios.post(
            `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${numericSessionId}/users`,
            { workspaceUserId: numericUserId },
            { headers }
          );
        } catch (joinErr) {
          const status = joinErr?.response?.status;
          if (status === 400 || status === 403) {
            const activeUsersRes = await axios.get(
              `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${numericSessionId}/users`,
              { headers }
            );
            const activeUsers = Array.isArray(activeUsersRes.data) ? activeUsersRes.data : [];
            const alreadyJoined = activeUsers.some(
              (participant) => Number(participant.workspaceUserId) === numericUserId
            );

            if (!alreadyJoined) {
              throw joinErr;
            }
          } else {
            throw joinErr;
          }
        }

        joinedSessionRef.current = numericSessionId;
        setActiveSessionId(numericSessionId);
        setIsSessionReady(true);
      } catch (err) {
        console.error('[useWorkspaceVoiceSession] setupVoiceSession failed:', err);
        const status = err?.response?.status;
        const detail = err?.response?.data?.message || err?.response?.data || '';
        const statusSuffix = status ? ` (status: ${status})` : '';
        const detailSuffix = detail ? ` - ${String(detail)}` : '';
        setSessionError(`음성 세션 준비에 실패했습니다.${statusSuffix}${detailSuffix}`);
      }
    };

    setupVoiceSession();

    return () => {
      const joinedSessionId = joinedSessionRef.current;
      const numericUserId = Number(workspaceUserId);

      if (!workspaceId || !joinedSessionId || !Number.isFinite(numericUserId) || numericUserId <= 0) {
        return;
      }

      sendLeaveRequest(joinedSessionId, numericUserId);
      joinedSessionRef.current = null;
    };
  }, [workspaceId, workspaceUserId, preferredSessionId]);

  useEffect(() => {
    const flushLeaveOnPageExit = () => {
      const joinedSessionId = joinedSessionRef.current;
      const numericUserId = Number(workspaceUserId);

      if (!workspaceId || !joinedSessionId || !Number.isFinite(numericUserId) || numericUserId <= 0) {
        return;
      }

      sendLeaveRequest(joinedSessionId, numericUserId, true);
    };

    window.addEventListener('pagehide', flushLeaveOnPageExit);
    window.addEventListener('beforeunload', flushLeaveOnPageExit);

    return () => {
      window.removeEventListener('pagehide', flushLeaveOnPageExit);
      window.removeEventListener('beforeunload', flushLeaveOnPageExit);
    };
  }, [workspaceId, workspaceUserId]);

  useEffect(() => {
    if (!connectRequestKey) return;
    pendingAutoConnectKeyRef.current = connectRequestKey;
  }, [connectRequestKey]);

  useEffect(() => {
    if (!pendingAutoConnectKeyRef.current || !isSessionReady || isInCall) return;

    const startAutoConnect = async () => {
      try {
        await startCall();
        pendingAutoConnectKeyRef.current = null;
      } catch (err) {
        console.error('[useWorkspaceVoiceSession] auto connect failed:', err);
      }
    };

    startAutoConnect();
  }, [isSessionReady, isInCall, startCall]);

  useEffect(() => {
    if (!disconnectRequestKey) return;
    if (lastDisconnectRequestRef.current === disconnectRequestKey) return;
    lastDisconnectRequestRef.current = disconnectRequestKey;

    try {
      leaveCall();
    } catch (err) {
      console.error('[useWorkspaceVoiceSession] leaveCall failed:', err);
    }
  }, [disconnectRequestKey, leaveCall]);

  useEffect(() => {
    const cleanupRemoteSpeaking = async () => {
      if (remoteSpeakingRafRef.current) {
        cancelAnimationFrame(remoteSpeakingRafRef.current);
        remoteSpeakingRafRef.current = null;
      }

      Object.values(remoteSpeakingRefs.current).forEach((entry) => {
        try {
          entry.source?.disconnect();
        } catch (err) {
          console.warn('[useWorkspaceVoiceSession] remote speaking source cleanup failed:', err);
        }
      });
      remoteSpeakingRefs.current = {};

      if (remoteSpeakingAudioContextRef.current) {
        try {
          await remoteSpeakingAudioContextRef.current.close();
        } catch (err) {
          console.warn('[useWorkspaceVoiceSession] remote speaking context close failed:', err);
        }
        remoteSpeakingAudioContextRef.current = null;
      }

      setSpeakingUserIds([]);
    };

    const trackEntries = Object.entries(remoteStreams || {});
    if (trackEntries.length === 0) {
      cleanupRemoteSpeaking();
      return undefined;
    }

    let disposed = false;

    const setupRemoteSpeaking = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const nextRefs = {};
        trackEntries.forEach(([producerId, stream]) => {
          const producerMeta = remoteProducerMeta[producerId];
          const peerId = String(producerMeta?.producerPeerId || '');
          if (!stream || !peerId) return;

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 1024;
          analyser.smoothingTimeConstant = 0.84;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          nextRefs[producerId] = {
            peerId,
            analyser,
            source,
            data: new Uint8Array(analyser.fftSize),
            lastSpeakingAt: 0
          };
        });

        remoteSpeakingAudioContextRef.current = audioContext;
        remoteSpeakingRefs.current = nextRefs;

        const updateSpeaking = () => {
          if (disposed) return;

          const now = performance.now();
          const nextSpeakingIds = [];

          Object.values(remoteSpeakingRefs.current).forEach((entry) => {
            if (!entry?.analyser || !entry?.data) return;

            entry.analyser.getByteTimeDomainData(entry.data);
            let sum = 0;
            for (let index = 0; index < entry.data.length; index += 1) {
              const normalized = (entry.data[index] - 128) / 128;
              sum += normalized * normalized;
            }

            const rms = Math.sqrt(sum / entry.data.length);
            const speakingNow = rms > 0.025;
            if (speakingNow) {
              entry.lastSpeakingAt = now;
            }

            if (speakingNow || now - entry.lastSpeakingAt < 260) {
              nextSpeakingIds.push(String(entry.peerId));
            }
          });

          setSpeakingUserIds((prev) => {
            const prevKey = prev.join(',');
            const nextKey = nextSpeakingIds.join(',');
            return prevKey === nextKey ? prev : nextSpeakingIds;
          });

          remoteSpeakingRafRef.current = requestAnimationFrame(updateSpeaking);
        };

        remoteSpeakingRafRef.current = requestAnimationFrame(updateSpeaking);
      } catch (err) {
        console.warn('[useWorkspaceVoiceSession] remote speaking detection setup failed:', err);
      }
    };

    cleanupRemoteSpeaking().then(() => {
      if (!disposed) {
        setupRemoteSpeaking();
      }
    });

    return () => {
      disposed = true;
      cleanupRemoteSpeaking();
    };
  }, [remoteStreams, remoteProducerMeta]);

  useEffect(() => () => {
    if (remoteSpeakingRafRef.current) {
      cancelAnimationFrame(remoteSpeakingRafRef.current);
      remoteSpeakingRafRef.current = null;
    }
    if (remoteSpeakingAudioContextRef.current) {
      remoteSpeakingAudioContextRef.current.close().catch(() => {});
      remoteSpeakingAudioContextRef.current = null;
    }
  }, []);

  return {
    activeSessionId,
    isSessionReady,
    sessionError,
    isInCall,
    isMuted,
    callState,
    callStateLabel,
    callStates,
    callPhase,
    error,
    connectedPeerIds,
    remoteStreams,
    remoteProducerMeta,
    sfuStats,
    sfuMediaStats,
    sfuTransportStates,
    speakingUserIds,
    startCall,
    leaveCall,
    toggleMute
  };
}
