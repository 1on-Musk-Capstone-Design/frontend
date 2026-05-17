import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useVoiceWebRTC } from '../hooks/useVoiceWebRTC';
import { useVoiceSFU } from '../hooks/useVoiceSFU';
import { API_BASE_URL } from '../../../config/api';

function RemoteAudioPlayer({ peerId, producerId, consumerId, stream }) {
  const audioRef = useRef(null);
  const [playbackError, setPlaybackError] = useState('');
  const [trackState, setTrackState] = useState('');

  const playRemoteAudio = async () => {
    if (!audioRef.current || !stream) return;

    try {
      audioRef.current.muted = false;
      audioRef.current.volume = 1;
      await audioRef.current.play();
      setPlaybackError('');
    } catch (err) {
      setPlaybackError(err?.message || 'audio playback blocked');
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.srcObject = stream || null;
    const [audioTrack] = stream?.getAudioTracks?.() || [];
    const updateTrackState = () => {
      if (!audioTrack) {
        setTrackState('no audio track');
        return;
      }
      setTrackState(`${audioTrack.readyState}${audioTrack.muted ? ' / muted' : ''}`);
    };

    updateTrackState();

    if (stream) {
      playRemoteAudio();
    }

    if (!audioTrack) return undefined;

    audioTrack.onmute = updateTrackState;
    audioTrack.onunmute = updateTrackState;
    audioTrack.onended = updateTrackState;

    return () => {
      audioTrack.onmute = null;
      audioTrack.onunmute = null;
      audioTrack.onended = null;
    };
  }, [stream]);

  return (
    <div style={{ marginTop: 4, fontSize: 11, color: '#4b5563' }}>
      <div>remote peer: {peerId}</div>
      <div>producer: {producerId || '-'}</div>
      <div>consumer: {consumerId || '-'}</div>
      <div>track: {trackState || '-'}</div>
      <audio
        ref={audioRef}
        autoPlay
        controls
        playsInline
        onCanPlay={playRemoteAudio}
        style={{ width: '100%', marginTop: 4 }}
      />
      {playbackError && (
        <button
          type="button"
          onClick={playRemoteAudio}
          style={{ marginTop: 4, fontSize: 11, padding: '4px 8px' }}
        >
          Play remote audio
        </button>
      )}
      {playbackError && (
        <div style={{ marginTop: 3, color: '#b91c1c' }}>audio: {playbackError}</div>
      )}
    </div>
  );
}

const getBoxStyle = (embedded) => ({
  position: embedded ? 'relative' : 'fixed',
  right: embedded ? 'auto' : 16,
  bottom: embedded ? 'auto' : 16,
  zIndex: 9999,
  width: embedded ? 'min(100%, 392px)' : 392,
  padding: 16,
  borderRadius: 18,
  border: '1px solid rgba(148,163,184,0.24)',
  background: 'rgba(255,255,255,0.88)',
  boxShadow: '0 16px 36px rgba(15,23,42,0.12)',
  backdropFilter: 'blur(12px)'
});

const panelHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  marginBottom: 12
};

const panelTitleStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4
};

const panelEyebrowStyle = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#0f766e'
};

const panelSubtextStyle = {
  fontSize: 12,
  color: '#64748b',
  lineHeight: 1.4
};

const sectionStyle = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: '1px solid rgba(148,163,184,0.18)'
};

const sectionTitleStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 8
};

const statusGridStyle = {
  marginTop: 10,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8
};

const statCardStyle = {
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(248,250,252,0.95)'
};

const statLabelStyle = {
  fontSize: 11,
  color: '#64748b',
  marginBottom: 4
};

const statValueStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: '#0f172a',
  wordBreak: 'break-word'
};

const bannerStyle = {
  marginTop: 10,
  padding: '10px 12px',
  borderRadius: 12,
  fontSize: 12,
  lineHeight: 1.5,
  border: '1px solid transparent'
};

const actionRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
  marginTop: 10
};

const primaryButtonStyle = {
  height: 38,
  padding: '0 12px',
  borderRadius: 11,
  border: '1px solid #93c5fd',
  background: '#ffffff',
  color: '#1e3a8a',
  fontWeight: 700,
  transition: 'transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease'
};

const rowStyle = {
  display: 'flex',
  gap: 8,
  marginTop: 8
};

const selectStyle = {
  width: '100%',
  marginTop: 8,
  padding: '6px 8px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 12
};

const statusChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  marginLeft: 6
};

export default function VoiceCallTestPanel({
  workspaceId,
  currentWorkspaceUserId,
  peerWorkspaceUserId,
  candidatePeers = [],
  embedded = false
}) {
  const micStreamRef = useRef(null);
  const micAudioContextRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micDataRef = useRef(null);
  const micRafRef = useRef(null);
  const outputAudioContextRef = useRef(null);
  const joinedSessionRef = useRef(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [callMode, setCallMode] = useState('mesh'); // 'mesh' or 'sfu'
  const [sessionError, setSessionError] = useState('');
  const [isSessionReady, setIsSessionReady] = useState(false);
  const defaultPeerId = useMemo(() => {
    if (peerWorkspaceUserId) return String(peerWorkspaceUserId);
    if (candidatePeers.length > 0) return String(candidatePeers[0].id);
    return '';
  }, [peerWorkspaceUserId, candidatePeers]);
  const [selectedPeerId, setSelectedPeerId] = useState(defaultPeerId);
  const [selectedPeerIds, setSelectedPeerIds] = useState(defaultPeerId ? [defaultPeerId] : []);
  const [groupCallError, setGroupCallError] = useState('');
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [testVolume, setTestVolume] = useState(70);
  const [isSpeakerTesting, setIsSpeakerTesting] = useState(false);
  const [manualSessionInput, setManualSessionInput] = useState('');
  const [manualSessionToUse, setManualSessionToUse] = useState(null);


  // 훅은 항상 같은 순서로 호출 (조건문 X)
  const sfuHook = useVoiceSFU({ workspaceId, sessionId: activeSessionId, workspaceUserId: currentWorkspaceUserId });
  const meshHook = useVoiceWebRTC({ workspaceId, sessionId: activeSessionId, workspaceUserId: currentWorkspaceUserId });
  const voiceHook = callMode === 'sfu' ? sfuHook : meshHook;

  // 공통 인터페이스 추출 (필요시 확장)
  const {
    isSignalingConnected = true,
    isInCall = false,
    callState = '',
    callStateLabel = '',
    callStates = {},
    connectedPeerIds = [],
    isMuted = false,
    remoteStreams = {},
    sfuStats = {},
    sfuMediaStats = {},
    sfuTransportStates = {},
    remoteProducerMeta = {},
    callPhase = '',
    peerRuntimeStates = {},
    error = '',
    signalStats = {},
    startCall = () => {},
    startGroupCall = () => {},
    leaveCall = () => {},
    toggleMute = () => {}
  } = voiceHook;

  const callStateColors = useMemo(() => {
    switch (callState) {
      case callStates.CONNECTED:
        return {
          border: '#60a5fa',
          background: '#dbeafe',
          color: '#1d4ed8'
        };
      case callStates.SIGNALING_READY:
        return {
          border: '#86efac',
          background: '#dcfce7',
          color: '#166534'
        };
      case callStates.CONNECTING:
      case callStates.RECONNECTING:
        return {
          border: '#fcd34d',
          background: '#fef3c7',
          color: '#92400e'
        };
      case callStates.ERROR:
        return {
          border: '#fca5a5',
          background: '#fee2e2',
          color: '#b91c1c'
        };
      default:
        return {
          border: '#d1d5db',
          background: '#f3f4f6',
          color: '#374151'
        };
    }
  }, [callState, callStates]);

  useEffect(() => {
    const setupVoiceSession = async () => {
      if (!workspaceId || !currentWorkspaceUserId) {
        setActiveSessionId(null);
        setIsSessionReady(false);
        return;
      }

      setSessionError('');
      setIsSessionReady(false);

      try {
        const accessToken = localStorage.getItem('accessToken');
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const userId = Number(currentWorkspaceUserId);

        if (!Number.isFinite(userId)) {
          throw new Error('현재 워크스페이스 사용자 ID가 유효하지 않습니다.');
        }

        // 사용자가 입력한 세션 ID가 있으면 그것을 우선 사용합니다.
        // 입력이 없으면 이미 열려 있는 세션을 먼저 재사용하고, 없을 때만 새로 생성합니다.
        let resolvedSessionId = null;
        if (manualSessionToUse) {
          resolvedSessionId = manualSessionToUse;
        } else {
          const sessionsRes = await axios.get(
            `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice`,
            { headers }
          );
          const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
          const openSessions = sessions
            .filter((s) => !s.endedAt)
            .sort((a, b) => {
              const ta = a.startedAt ? new Date(a.startedAt).getTime() : 0;
              const tb = b.startedAt ? new Date(b.startedAt).getTime() : 0;
              return tb - ta;
            });

          resolvedSessionId = openSessions[0]?.id;

          if (!resolvedSessionId) {
            const createRes = await axios.post(
              `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice`,
              {},
              { headers }
            );
            resolvedSessionId = createRes.data?.id;
          }
        }

        const numericSessionId = Number(resolvedSessionId);
        if (!Number.isFinite(numericSessionId)) {
          throw new Error('유효한 음성 세션 ID를 확인하지 못했습니다.');
        }

        try {
          await axios.post(
            `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${numericSessionId}/users`,
            { workspaceUserId: userId },
            { headers }
          );
        } catch (joinErr) {
          const status = joinErr?.response?.status;

          // 이미 참여 중인 경우(백엔드 정책상 403/400 가능)는 정상 상태로 간주
          if (status === 400 || status === 403) {
            const activeUsersRes = await axios.get(
              `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${numericSessionId}/users`,
              { headers }
            );

            const activeUsers = Array.isArray(activeUsersRes.data) ? activeUsersRes.data : [];
            const alreadyJoined = activeUsers.some(
              (participant) => Number(participant.workspaceUserId) === userId
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
        setSessionError('');
        setIsSessionReady(true);
      } catch (err) {
        console.error('[VoiceCallTestPanel] setupVoiceSession failed:', err);
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
      const userId = Number(currentWorkspaceUserId);
      if (!workspaceId || !joinedSessionId || !Number.isFinite(userId)) return;

      const accessToken = localStorage.getItem('accessToken');
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      axios.delete(
        `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${joinedSessionId}/users/${userId}`,
        { headers }
      ).catch(() => {});

      joinedSessionRef.current = null;
    };
  }, [workspaceId, currentWorkspaceUserId, manualSessionToUse]);

  useEffect(() => {
    setSelectedPeerId(defaultPeerId);
  }, [defaultPeerId]);

  useEffect(() => {
    setSelectedPeerIds((prev) => {
      const validIds = new Set(candidatePeers.map((peer) => String(peer.id)));
      const filtered = prev.filter((id) => validIds.has(String(id)));
      if (filtered.length > 0) return filtered;
      return defaultPeerId ? [defaultPeerId] : [];
    });
  }, [candidatePeers, defaultPeerId]);

  const handleStartCall = async () => {
    if (callMode === 'mesh' && !selectedPeerId) return;
    try {
      setGroupCallError('');
      await startCall(selectedPeerId);
    } catch (err) {
      console.error('[VoiceCallTestPanel] startCall failed:', err);
    }
  };

  const handleStartGroupCall = async () => {
    if (callMode === 'sfu') {
      await handleStartCall();
      return;
    }

    if (selectedPeerIds.length === 0) return;
    try {
      setGroupCallError('');
      await startGroupCall(selectedPeerIds);
    } catch (err) {
      console.error('[VoiceCallTestPanel] startGroupCall failed:', err);
      setGroupCallError(err?.message || '그룹 통화 시작 실패');
    }
  };

  const handleToggleMute = async () => {
    try {
      await toggleMute();
    } catch (err) {
      console.error('[VoiceCallTestPanel] toggleMute failed:', err);
    }
  };

  const togglePeerSelection = (peerId) => {
    const targetId = String(peerId || '');
    if (!targetId) return;

    setSelectedPeerIds((prev) => {
      if (prev.some((id) => String(id) === targetId)) {
        return prev.filter((id) => String(id) !== targetId);
      }
      return [...prev, targetId];
    });
  };

  const stopMicTest = async () => {
    if (micRafRef.current) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (micAudioContextRef.current) {
      try {
        await micAudioContextRef.current.close();
      } catch (err) {
        console.warn('[VoiceCallTestPanel] mic context close failed:', err);
      }
      micAudioContextRef.current = null;
    }

    micAnalyserRef.current = null;
    micDataRef.current = null;
    setMicLevel(0);
    setIsMicTesting(false);
  };

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported in this browser');
      }

      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.84;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);

      micStreamRef.current = stream;
      micAudioContextRef.current = context;
      micAnalyserRef.current = analyser;
      micDataRef.current = data;
      setIsMicTesting(true);

      const updateLevel = () => {
        if (!micAnalyserRef.current || !micDataRef.current) return;

        micAnalyserRef.current.getByteTimeDomainData(micDataRef.current);
        let sum = 0;
        for (let index = 0; index < micDataRef.current.length; index += 1) {
          const normalized = (micDataRef.current[index] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / micDataRef.current.length);
        const nextLevel = Math.min(100, Math.max(0, Math.round(rms * 230)));
        setMicLevel(nextLevel);

        micRafRef.current = requestAnimationFrame(updateLevel);
      };

      micRafRef.current = requestAnimationFrame(updateLevel);
    } catch (err) {
      console.error('[VoiceCallTestPanel] startMicTest failed:', err);
    }
  };

  const toggleMicTest = async () => {
    if (isMicTesting) {
      await stopMicTest();
      return;
    }
    await startMicTest();
  };

  const playSpeakerTestTone = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported in this browser');
      }

      let context = outputAudioContextRef.current;
      if (!context || context.state === 'closed') {
        context = new AudioContextClass();
        outputAudioContextRef.current = context;
      }
      if (context.state === 'suspended') {
        await context.resume();
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const gainValue = Math.max(0, Math.min(1, testVolume / 100));

      oscillator.type = 'sine';
      oscillator.frequency.value = 560;
      gainNode.gain.value = gainValue * 0.12;

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      setIsSpeakerTesting(true);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.55);
      oscillator.onended = () => setIsSpeakerTesting(false);
    } catch (err) {
      setIsSpeakerTesting(false);
      console.error('[VoiceCallTestPanel] playSpeakerTestTone failed:', err);
    }
  };

  const isStartCallDisabled = !isSessionReady
    || (callMode === 'mesh' && (!isSignalingConnected || !selectedPeerId));

  const isStartGroupDisabled = !isSessionReady
    || (callMode === 'mesh' && (!isSignalingConnected || selectedPeerIds.length === 0));

  const connectionStatusLabel = callMode === 'sfu' ? 'SFU Transport' : 'Signaling';
  const connectionStatusValue = callMode === 'sfu'
    ? (isInCall ? 'connected' : (isSessionReady ? 'ready' : 'preparing'))
    : (isSignalingConnected ? 'connected' : 'disconnected');
  const isConnectionHealthy = callMode === 'sfu' ? isSessionReady : isSignalingConnected;

  useEffect(() => {
    return () => {
      stopMicTest();
      if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close().catch(() => {});
        outputAudioContextRef.current = null;
      }
    };
  }, []);

  return (
    <div style={getBoxStyle(embedded)}>
      <div style={panelHeaderStyle}>
        <div style={panelTitleStyle}>
          <div style={panelEyebrowStyle}>Voice Test</div>
          <strong style={{ fontSize: 18, letterSpacing: '-0.02em' }}>Call Control Panel</strong>
          <div style={panelSubtextStyle}>Mesh와 SFU 상태를 같은 화면에서 확인합니다.</div>
        </div>
        <div
          style={{
            ...statusChipStyle,
            background: callMode === 'sfu' ? '#dbeafe' : '#ecfccb',
            color: callMode === 'sfu' ? '#1d4ed8' : '#3f6212',
            marginLeft: 0,
            whiteSpace: 'nowrap'
          }}
        >
          {callMode === 'sfu' ? 'SFU' : 'MESH'}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Manual Session ID</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <input
            value={manualSessionInput}
            onChange={(e) => setManualSessionInput(e.target.value)}
            placeholder="Enter session ID or leave empty"
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}
          />
          <button
            onClick={async () => {
              try {
                const input = manualSessionInput ? manualSessionInput.trim() : '';
                if (!input) {
                  setManualSessionToUse(null);
                  setSessionError('');
                  return;
                }
                const accessToken = localStorage.getItem('accessToken');
                const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
                const sessionsRes = await axios.get(
                  `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice`,
                  { headers }
                );
                const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
                const found = sessions.find((s) => String(s.id) === String(input));
                if (!found) {
                  setSessionError('해당 세션을 찾지 못했거나 권한이 없습니다.');
                  return;
                }
                if (found.endedAt) {
                  setSessionError('해당 세션은 이미 종료되었습니다.');
                  return;
                }
                setManualSessionToUse(found.id);
                setManualSessionInput(String(found.id));
                setSessionError('');
              } catch (err) {
                console.error('[VoiceCallTestPanel] apply manual session failed', err);
                setSessionError('세션 확인 중 오류가 발생했습니다.');
              }
            }}
            style={{ ...primaryButtonStyle, height: 36, padding: '0 10px' }}
          >
            Apply
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280' }}>
          Current session: {activeSessionId ?? '-'} {isSessionReady ? 'ready' : 'preparing'}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, marginRight: 8, color: '#334155' }}>Call Mode</label>
        <select
          value={callMode}
          onChange={e => setCallMode(e.target.value)}
          style={{ ...selectStyle, width: '100%', display: 'block', marginTop: 6, background: '#ffffff' }}
        >
          <option value="mesh">Mesh (P2P)</option>
          <option value="sfu">SFU (Server)</option>
        </select>
      </div>
      <div
        style={{
          marginTop: 10,
          padding: '10px 12px',
          borderRadius: 12,
          border: `1px solid ${callStateColors.border}`,
          background: callStateColors.background,
          color: callStateColors.color,
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.5
        }}
      >
        현재 통화 상태: {callStateLabel} ({callState})
      </div>
      <div style={statusGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>{connectionStatusLabel}</div>
          <div style={statValueStyle}>
            <span
              style={{
                ...statusChipStyle,
                marginLeft: 0,
                background: isConnectionHealthy ? '#dbeafe' : '#fee2e2',
                color: isConnectionHealthy ? '#1d4ed8' : '#b91c1c'
              }}
            >
              {connectionStatusValue}
            </span>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Session</div>
          <div style={statValueStyle}>
            {activeSessionId ?? '-'} {isSessionReady ? 'ready' : 'preparing'}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Peers</div>
          <div style={statValueStyle}>{connectedPeerIds.length > 0 ? connectedPeerIds.join(', ') : '-'}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Remote Streams</div>
          <div style={statValueStyle}>{Object.keys(remoteStreams || {}).length}</div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
        peer states: {Object.entries(peerRuntimeStates || {}).map(([peerId, state]) => `${peerId}:${state.connectionState || '-'} / ${state.iceConnectionState || '-'}`).join(', ') || '-'}
      </div>
      {callMode === 'sfu' && (
        <>
          <div style={{ marginTop: 4, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
            sfu phase: {callPhase || '-'}; producers: total {sfuStats.producersSeen ?? 0}, remote {sfuStats.remoteProducersSeen ?? 0}, consumers {sfuStats.consumersCreated ?? 0}
            {sfuStats.lastError ? `, error: ${sfuStats.lastError}` : ''}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
            sfu transport states: send {sfuTransportStates.send || '-'}, recv {sfuTransportStates.recv || '-'}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
            local media: producer {sfuMediaStats.local?.producerId || '-'}, bytes sent {sfuMediaStats.local?.bytes ?? 0}, packets sent {sfuMediaStats.local?.packets ?? 0}, track {sfuMediaStats.local?.trackState || '-'} / {sfuMediaStats.local?.trackEnabled === false ? 'disabled' : 'enabled'}
          </div>
          {Object.entries(sfuMediaStats.remotes || {}).map(([producerId, stats]) => (
            <div key={`sfu-media-${producerId}`} style={{ marginTop: 2, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
              remote media {remoteProducerMeta[producerId]?.producerPeerId || producerId}: bytes recv {stats.bytes ?? 0}, packets recv {stats.packets ?? 0}, track {stats.trackState || '-'}{stats.trackMuted ? ' / muted' : ''}
            </div>
          ))}
        </>
      )}
      <div style={{ marginTop: 4, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
        signal sent (offer/answer/ice): {signalStats.offerSent}/{signalStats.answerSent}/{signalStats.iceSent}
      </div>
      <div style={{ marginTop: 2, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
        signal recv (offer/answer/ice): {signalStats.offerReceived}/{signalStats.answerReceived}/{signalStats.iceReceived}
      </div>

      <select
        style={selectStyle}
        value={selectedPeerId}
        onChange={(event) => setSelectedPeerId(event.target.value)}
      >
        <option value="">Select peer user</option>
        {candidatePeers.map((peer) => (
          <option key={peer.id} value={String(peer.id)}>
            {peer.userName || peer.name || peer.id}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: '#334155' }}>
        Group targets ({selectedPeerIds.length})
      </div>
      <div
        style={{
          marginTop: 6,
          maxHeight: 120,
          overflowY: 'auto',
          border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 12,
          padding: 10,
          background: 'linear-gradient(180deg, rgba(248,250,252,0.96), rgba(241,245,249,0.96))'
        }}
      >
        {candidatePeers.length === 0 && (
          <div style={{ fontSize: 11, color: '#6b7280' }}>No peers configured</div>
        )}
        {candidatePeers.map((peer) => {
          const peerId = String(peer.id);
          const checked = selectedPeerIds.some((id) => String(id) === peerId);
          return (
            <label
              key={`group-peer-${peerId}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, color: '#334155' }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => togglePeerSelection(peerId)}
              />
              <span>{peer.userName || peer.name || peerId}</span>
            </label>
          );
        })}
      </div>

      {(error || sessionError || groupCallError) && (
        <div
          style={{
            ...bannerStyle,
            borderColor: '#fecaca',
            background: 'linear-gradient(180deg, rgba(254,242,242,0.98), rgba(255,255,255,0.92))',
            color: '#991b1b'
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Connection issue</div>
          {error && <div>error: {error}</div>}
          {sessionError && <div>session: {sessionError}</div>}
          {groupCallError && <div>group: {groupCallError}</div>}
        </div>
      )}

      <div style={actionRowStyle}>
        <button
          onClick={handleStartCall}
          disabled={isStartCallDisabled}
          style={{
            ...primaryButtonStyle,
            background: isInCall ? 'linear-gradient(180deg, #2563eb, #1d4ed8)' : '#ffffff',
            color: isInCall ? '#ffffff' : '#1e3a8a',
            boxShadow: isInCall ? '0 8px 18px rgba(37,99,235,0.24)' : 'none',
            opacity: isStartCallDisabled ? 0.5 : 1,
            cursor: isStartCallDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          Start Call
        </button>
        <button
          onClick={handleStartGroupCall}
          disabled={isStartGroupDisabled}
          style={{
            ...primaryButtonStyle,
            border: '1px solid #86efac',
            background: 'linear-gradient(180deg, #f0fdf4, #dcfce7)',
            color: '#166534',
            opacity: isStartGroupDisabled ? 0.5 : 1,
            cursor: isStartGroupDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          Start Group
        </button>
        <button
          onClick={leaveCall}
          disabled={!isInCall}
          style={{
            ...primaryButtonStyle,
            border: '1px solid #fca5a5',
            background: '#ffffff',
            color: '#b91c1c',
            opacity: !isInCall ? 0.5 : 1,
            cursor: !isInCall ? 'not-allowed' : 'pointer'
          }}
        >
          Leave
        </button>
        <button
          onClick={handleToggleMute}
          disabled={!isSessionReady}
          style={{
            ...primaryButtonStyle,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#111827',
            opacity: !isSessionReady ? 0.5 : 1,
            cursor: !isSessionReady ? 'not-allowed' : 'pointer'
          }}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Audio Self Test</div>

        <button
          onClick={toggleMicTest}
          style={{
            width: '100%',
            marginTop: 8,
            height: 40,
            borderRadius: 12,
            border: '1px solid #86efac',
            background: isMicTesting ? '#dcfce7' : '#f0fdf4',
            color: '#166534',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {isMicTesting ? 'Stop Mic Test' : 'Start Mic Test'}
        </button>

        <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
          input level: {micLevel}
        </div>
        <div
          style={{
            marginTop: 4,
            width: '100%',
            height: 10,
            borderRadius: 999,
            background: '#e2e8f0',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${micLevel}%`,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
              transition: 'width 120ms ease'
            }}
          />
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>
          output volume: {testVolume}
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={testVolume}
          onChange={(event) => setTestVolume(Number(event.target.value))}
          style={{ width: '100%', marginTop: 4 }}
        />

        <button
          onClick={playSpeakerTestTone}
          disabled={isSpeakerTesting}
          style={{
            width: '100%',
            marginTop: 8,
            height: 40,
            borderRadius: 12,
            border: '1px solid #cbd5e1',
            background: isSpeakerTesting ? '#f8fafc' : '#ffffff',
            color: '#111827',
            fontWeight: 700,
            cursor: isSpeakerTesting ? 'not-allowed' : 'pointer',
            opacity: isSpeakerTesting ? 0.7 : 1
          }}
        >
          {isSpeakerTesting ? 'Playing Test Tone...' : 'Play Speaker Test'}
        </button>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Remote Audio Routes</div>
        {Object.entries(remoteStreams || {}).length === 0 && (
          <div style={{ marginTop: 4, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
            No remote streams yet. 연결되면 여기서 피어별 오디오가 표시됩니다.
          </div>
        )}
        {Object.entries(remoteStreams || {}).map(([producerId, stream]) => {
          const meta = remoteProducerMeta[producerId] || {};
          return (
            <RemoteAudioPlayer
              key={producerId}
              peerId={meta.producerPeerId || producerId}
              producerId={producerId}
              consumerId={meta.consumerId}
              stream={stream}
            />
          );
        })}
      </div>
    </div>
  );
}
