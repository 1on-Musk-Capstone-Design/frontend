import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useVoiceWebRTC } from '../hooks/useVoiceWebRTC';
import { API_BASE_URL } from '../../../config/api';

const boxStyle = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  zIndex: 9999,
  width: 340,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #ddd',
  background: '#fff',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
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

export default function VoiceCallTestPanel({
  workspaceId,
  currentWorkspaceUserId,
  peerWorkspaceUserId,
  candidatePeers = []
}) {
  const audioRef = useRef(null);
  const micStreamRef = useRef(null);
  const micAudioContextRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micDataRef = useRef(null);
  const micRafRef = useRef(null);
  const outputAudioContextRef = useRef(null);
  const joinedSessionRef = useRef(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [isSessionReady, setIsSessionReady] = useState(false);
  const defaultPeerId = useMemo(() => {
    if (peerWorkspaceUserId) return String(peerWorkspaceUserId);
    if (candidatePeers.length > 0) return String(candidatePeers[0].id);
    return '';
  }, [peerWorkspaceUserId, candidatePeers]);
  const [selectedPeerId, setSelectedPeerId] = useState(defaultPeerId);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [testVolume, setTestVolume] = useState(70);
  const [isSpeakerTesting, setIsSpeakerTesting] = useState(false);

  const {
    isSignalingConnected,
    isInCall,
    isMuted,
    remoteStream,
    error,
    startCall,
    leaveCall,
    toggleMute
  } = useVoiceWebRTC({
    workspaceId,
    sessionId: activeSessionId,
    workspaceUserId: currentWorkspaceUserId
  });

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

        const sessionsRes = await axios.get(
          `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice`,
          { headers }
        );

        const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
        const openSession = sessions.find((session) => !session.endedAt);

        let resolvedSessionId = openSession?.id;
        if (!resolvedSessionId) {
          const createRes = await axios.post(
            `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice`,
            {},
            { headers }
          );
          resolvedSessionId = createRes.data?.id;
        }

        const numericSessionId = Number(resolvedSessionId);
        if (!Number.isFinite(numericSessionId)) {
          throw new Error('유효한 음성 세션 ID를 확인하지 못했습니다.');
        }

        await axios.post(
          `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${numericSessionId}/users`,
          { workspaceUserId: userId },
          { headers }
        );

        joinedSessionRef.current = numericSessionId;
        setActiveSessionId(numericSessionId);
        setIsSessionReady(true);
      } catch (err) {
        console.error('[VoiceCallTestPanel] setupVoiceSession failed:', err);
        setSessionError('음성 세션 준비에 실패했습니다.');
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
  }, [workspaceId, currentWorkspaceUserId]);

  useEffect(() => {
    setSelectedPeerId(defaultPeerId);
  }, [defaultPeerId]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.srcObject = remoteStream || null;
  }, [remoteStream]);

  const handleStartCall = async () => {
    if (!selectedPeerId) return;
    try {
      await startCall(selectedPeerId);
    } catch (err) {
      console.error('[VoiceCallTestPanel] startCall failed:', err);
    }
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
    <div style={boxStyle}>
      <strong>Voice 1:1 Test</strong>
      <div style={{ marginTop: 8, fontSize: 12 }}>
        signaling: {isSignalingConnected ? 'connected' : 'disconnected'}
      </div>
      <div style={{ marginTop: 4, fontSize: 12 }}>
        call: {isInCall ? 'in-call' : 'idle'}
      </div>
      <div style={{ marginTop: 4, fontSize: 12 }}>
        session: {activeSessionId ?? '-'} {isSessionReady ? '(ready)' : '(preparing)'}
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

      {error && (
        <div style={{ marginTop: 6, color: '#c62828', fontSize: 12 }}>
          error: {error}
        </div>
      )}

      {sessionError && (
        <div style={{ marginTop: 6, color: '#c62828', fontSize: 12 }}>
          session error: {sessionError}
        </div>
      )}

      <div style={rowStyle}>
        <button onClick={handleStartCall} disabled={!isSignalingConnected || !selectedPeerId || !isSessionReady}>
          Start Call
        </button>
        <button onClick={leaveCall} disabled={!isInCall}>
          Leave
        </button>
        <button onClick={toggleMute} disabled={!isInCall}>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid #eceff1', paddingTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Audio Self Test</div>

        <button
          onClick={toggleMicTest}
          style={{
            width: '100%',
            marginTop: 8,
            height: 36,
            borderRadius: 10,
            border: '1px solid #86efac',
            background: isMicTesting ? '#dcfce7' : '#f0fdf4',
            color: '#166534',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isMicTesting ? 'Stop Mic Test' : 'Start Mic Test'}
        </button>

        <div style={{ marginTop: 8, fontSize: 11, color: '#4b5563' }}>
          input level: {micLevel}
        </div>
        <div
          style={{
            marginTop: 4,
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: '#e5e7eb',
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

        <div style={{ marginTop: 10, fontSize: 11, color: '#4b5563' }}>
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
            height: 36,
            borderRadius: 10,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#111827',
            fontWeight: 600,
            cursor: isSpeakerTesting ? 'not-allowed' : 'pointer',
            opacity: isSpeakerTesting ? 0.7 : 1
          }}
        >
          {isSpeakerTesting ? 'Playing Test Tone...' : 'Play Speaker Test'}
        </button>
      </div>

      <audio ref={audioRef} autoPlay playsInline />
    </div>
  );
}
