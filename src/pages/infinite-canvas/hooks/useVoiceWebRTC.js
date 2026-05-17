import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { SOCKET_SERVER_URL } from '../../../config/api';

const buildIceServers = () => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  const turnUrlsRaw = import.meta.env.VITE_WEBRTC_TURN_URLS;
  const turnUsername = import.meta.env.VITE_WEBRTC_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL;
  const iceTransportPolicy = import.meta.env.VITE_WEBRTC_ICE_TRANSPORT_POLICY;

  if (turnUrlsRaw) {
    const turnUrls = turnUrlsRaw
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    if (turnUrls.length > 0) {
      const turnServer = {
        urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls
      };

      if (turnUsername) {
        turnServer.username = turnUsername;
      }

      if (turnCredential) {
        turnServer.credential = turnCredential;
      }

      iceServers.push(turnServer);
    }
  }

  const config = { iceServers };

  if (iceTransportPolicy === 'relay' || iceTransportPolicy === 'all') {
    config.iceTransportPolicy = iceTransportPolicy;
  }

  return config;
};

const parseCandidateType = (candidateLine = '') => {
  if (!candidateLine || typeof candidateLine !== 'string') {
    return 'unknown';
  }

  const parts = candidateLine.trim().split(/\s+/);
  const typeIndex = parts.indexOf('typ');
  if (typeIndex >= 0 && parts[typeIndex + 1]) {
    return parts[typeIndex + 1];
  }

  return 'unknown';
};

const logSelectedIcePair = async (pc, peerId) => {
  if (!pc) return;

  try {
    const stats = await pc.getStats();
    let selectedPair = null;

    stats.forEach((report) => {
      if (report.type !== 'candidate-pair') return;
      const isSelected = report.selected || report.nominated;
      if (isSelected && report.state === 'succeeded' && !selectedPair) {
        selectedPair = report;
      }
    });

    if (!selectedPair) {
      console.log(`[VoiceWebRTC] [${peerId}] No selected ICE pair yet.`);
      return;
    }

    const local = stats.get(selectedPair.localCandidateId);
    const remote = stats.get(selectedPair.remoteCandidateId);

    console.log(
      `[VoiceWebRTC] [${peerId}] Selected ICE pair => local:${local?.candidateType || 'unknown'} remote:${remote?.candidateType || 'unknown'} protocol:${selectedPair.protocol || 'unknown'}`
    );
  } catch (err) {
    console.warn(`[VoiceWebRTC] [${peerId}] Failed to read ICE stats:`, err);
  }
};

const SIGNAL_TYPES = {
  OFFER: 'OFFER',
  ANSWER: 'ANSWER',
  ICE_CANDIDATE: 'ICE_CANDIDATE',
  LEAVE: 'LEAVE'
};

const CALL_STATES = {
  IDLE: 'IDLE',
  SIGNALING_READY: 'SIGNALING_READY',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR'
};

const CALL_STATE_LABELS_KO = {
  [CALL_STATES.IDLE]: '대기 중',
  [CALL_STATES.SIGNALING_READY]: '시그널링 준비됨',
  [CALL_STATES.CONNECTING]: '연결 시도 중',
  [CALL_STATES.CONNECTED]: '통화 연결됨',
  [CALL_STATES.RECONNECTING]: '재연결 시도 중',
  [CALL_STATES.ERROR]: '오류 발생'
};

const makeClientMessageId = () => `webrtc-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useVoiceWebRTC = ({ workspaceId, sessionId, workspaceUserId }) => {
  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const fallbackAudioContextRef = useRef(null);
  const fallbackOscillatorRef = useRef(null);
  const pendingCandidatesRef = useRef(new Map());
  const disconnectTimersRef = useRef(new Map());

  const [isSignalingConnected, setIsSignalingConnected] = useState(false);
  const [connectedPeerIds, setConnectedPeerIds] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [error, setError] = useState(null);
  const [peerRuntimeStates, setPeerRuntimeStates] = useState({});
  const [signalStats, setSignalStats] = useState({
    offerSent: 0,
    answerSent: 0,
    iceSent: 0,
    offerReceived: 0,
    answerReceived: 0,
    iceReceived: 0
  });

  const signalTopic = useMemo(() => {
    if (!workspaceId || !sessionId) return null;
    return `/topic/workspace/${workspaceId}/voice/${sessionId}/signal`;
  }, [workspaceId, sessionId]);

  const isInCall = connectedPeerIds.length > 0;

  const callState = useMemo(() => {
    if (error) return CALL_STATES.ERROR;
    if (!isSignalingConnected) return CALL_STATES.IDLE;

    if (connectedPeerIds.length > 0) {
      return CALL_STATES.CONNECTED;
    }

    const runtimeStateList = Object.values(peerRuntimeStates);
    if (runtimeStateList.length === 0) {
      return CALL_STATES.SIGNALING_READY;
    }

    const isReconnecting = runtimeStateList.some((state) => (
      state.connectionState === 'disconnected'
      || state.iceConnectionState === 'disconnected'
      || state.connectionState === 'failed'
      || state.iceConnectionState === 'failed'
    ));
    if (isReconnecting) {
      return CALL_STATES.RECONNECTING;
    }

    return CALL_STATES.CONNECTING;
  }, [error, isSignalingConnected, connectedPeerIds, peerRuntimeStates]);

  const callStateLabel = useMemo(
    () => CALL_STATE_LABELS_KO[callState] || callState,
    [callState]
  );

  const remoteStream = useMemo(() => {
    const streamList = Object.values(remoteStreams);
    return streamList.length > 0 ? streamList[0] : null;
  }, [remoteStreams]);

  const setPendingCandidate = useCallback((peerId, candidate) => {
    if (!peerId || !candidate) return;

    const current = pendingCandidatesRef.current.get(peerId) || [];
    current.push(candidate);
    pendingCandidatesRef.current.set(peerId, current);
  }, []);

  const updatePeerRuntimeState = useCallback((peerId, patch) => {
    if (!peerId) return;

    const normalizedPeerId = String(peerId);
    setPeerRuntimeStates((prev) => ({
      ...prev,
      [normalizedPeerId]: {
        ...(prev[normalizedPeerId] || {}),
        ...patch
      }
    }));
  }, []);

  const clearPeerRuntimeState = useCallback((peerId) => {
    if (!peerId) return;

    const normalizedPeerId = String(peerId);
    setPeerRuntimeStates((prev) => {
      if (!prev[normalizedPeerId]) return prev;
      const next = { ...prev };
      delete next[normalizedPeerId];
      return next;
    });
  }, []);

  const clearPeerState = useCallback((peerId) => {
    if (!peerId) return;

    pendingCandidatesRef.current.delete(peerId);

    setRemoteStreams((prev) => {
      if (!prev[peerId]) return prev;
      const next = { ...prev };
      delete next[peerId];
      return next;
    });

    setConnectedPeerIds((prev) => prev.filter((id) => String(id) !== String(peerId)));
  }, []);

  const markPeerConnected = useCallback((peerId) => {
    if (!peerId) return;

    const normalizedPeerId = String(peerId);
    setConnectedPeerIds((prev) => {
      if (prev.some((id) => String(id) === normalizedPeerId)) return prev;
      return [...prev, normalizedPeerId];
    });
  }, []);

  const removePeerConnection = useCallback((peerId) => {
    if (!peerId) return;

    const timerId = disconnectTimersRef.current.get(peerId);
    if (timerId) {
      clearTimeout(timerId);
      disconnectTimersRef.current.delete(peerId);
    }

    const map = peerConnectionsRef.current;
    const pc = map.get(peerId);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      map.delete(peerId);
    }

    clearPeerState(peerId);
    clearPeerRuntimeState(peerId);
  }, [clearPeerState, clearPeerRuntimeState]);

  const closePeerConnection = useCallback(() => {
    disconnectTimersRef.current.forEach((timerId) => {
      clearTimeout(timerId);
    });
    disconnectTimersRef.current = new Map();

    const map = peerConnectionsRef.current;
    map.forEach((pc) => {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
    });

    peerConnectionsRef.current = new Map();
    pendingCandidatesRef.current = new Map();
    setPeerRuntimeStates({});
    setRemoteStreams({});
    setConnectedPeerIds([]);
  }, []);

  const stopLocalStream = useCallback(() => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    if (fallbackOscillatorRef.current) {
      try {
        fallbackOscillatorRef.current.stop();
      } catch (err) {
        console.warn('[VoiceWebRTC] fallback oscillator stop failed:', err);
      }
      fallbackOscillatorRef.current = null;
    }

    if (fallbackAudioContextRef.current) {
      fallbackAudioContextRef.current.close().catch(() => {});
      fallbackAudioContextRef.current = null;
    }

    setIsMuted(false);
  }, []);

  const createFallbackAudioStream = useCallback(async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('AudioContext is not supported in this browser');
    }

    const context = new AudioContextClass();
    if (context.state === 'suspended') {
      await context.resume();
    }

    const destination = context.createMediaStreamDestination();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0;

    oscillator.connect(gainNode);
    gainNode.connect(destination);
    oscillator.start();

    fallbackAudioContextRef.current = context;
    fallbackOscillatorRef.current = oscillator;

    return destination.stream;
  }, []);

  const sendSignal = useCallback((payload) => {
    if (!clientRef.current?.active || !clientRef.current?.connected) {
      throw new Error('STOMP signaling is not connected');
    }

    const accessToken = localStorage.getItem('accessToken');

    clientRef.current.publish({
      destination: '/app/webrtc/signal',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: JSON.stringify({
        workspaceId,
        sessionId,
        fromWorkspaceUserId: workspaceUserId,
        clientMessageId: makeClientMessageId(),
        ...payload
      })
    });

    setSignalStats((prev) => {
      switch (payload.type) {
        case SIGNAL_TYPES.OFFER:
          return { ...prev, offerSent: prev.offerSent + 1 };
        case SIGNAL_TYPES.ANSWER:
          return { ...prev, answerSent: prev.answerSent + 1 };
        case SIGNAL_TYPES.ICE_CANDIDATE:
          return { ...prev, iceSent: prev.iceSent + 1 };
        default:
          return prev;
      }
    });
  }, [workspaceId, sessionId, workspaceUserId]);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
    } catch (mediaErr) {
      const permissionDenied = mediaErr?.name === 'NotAllowedError' || mediaErr?.name === 'PermissionDeniedError';
      if (!permissionDenied) {
        throw mediaErr;
      }

      console.warn('[VoiceWebRTC] microphone permission denied, using silent fallback stream');
      stream = await createFallbackAudioStream();
    }

    localStreamRef.current = stream;
    return stream;
  }, [createFallbackAudioStream]);

  const createPeerConnection = useCallback(async (targetWorkspaceUserId) => {
    if (!targetWorkspaceUserId) {
      throw new Error('targetWorkspaceUserId is required');
    }

    const peerId = String(targetWorkspaceUserId);
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing) return existing;

    const stream = await ensureLocalStream();
    const pc = new RTCPeerConnection(buildIceServers());

    updatePeerRuntimeState(peerId, {
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState
    });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      const [streamFromRemote] = event.streams;
      if (streamFromRemote) {
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: streamFromRemote
        }));
        // 원격 트랙이 도착하면 실제 미디어 경로가 연결된 상태로 본다.
        markPeerConnected(peerId);
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      const localCandidateType = parseCandidateType(event.candidate.candidate);
      console.log(
        `[VoiceWebRTC] [${peerId}] Local ICE candidate gathered: ${localCandidateType}`
      );

      try {
        sendSignal({
          type: SIGNAL_TYPES.ICE_CANDIDATE,
          toWorkspaceUserId: peerId,
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        });
      } catch (err) {
        console.error('[VoiceWebRTC] ICE send failed:', err);
      }
    };

    pc.onconnectionstatechange = () => {
      updatePeerRuntimeState(peerId, {
        connectionState: pc.connectionState
      });

      if (pc.connectionState === 'connected') {
        const timerId = disconnectTimersRef.current.get(peerId);
        if (timerId) {
          clearTimeout(timerId);
          disconnectTimersRef.current.delete(peerId);
        }

        markPeerConnected(peerId);
        logSelectedIcePair(pc, peerId);
      }

      if (pc.connectionState === 'disconnected') {
        // disconnected 는 일시적인 네트워크 변동일 수 있어 잠시 대기 후 정리한다.
        const existingTimer = disconnectTimersRef.current.get(peerId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timeoutId = setTimeout(() => {
          const currentPc = peerConnectionsRef.current.get(peerId);
          if (!currentPc || currentPc.connectionState === 'connected') {
            disconnectTimersRef.current.delete(peerId);
            return;
          }
          removePeerConnection(peerId);
          disconnectTimersRef.current.delete(peerId);
        }, 8000);

        disconnectTimersRef.current.set(peerId, timeoutId);
      }

      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        removePeerConnection(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      updatePeerRuntimeState(peerId, {
        iceConnectionState: pc.iceConnectionState
      });

      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        markPeerConnected(peerId);
        logSelectedIcePair(pc, peerId);
      }

      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        removePeerConnection(peerId);
      }
    };

    peerConnectionsRef.current.set(peerId, pc);

    return pc;
  }, [ensureLocalStream, sendSignal, removePeerConnection, markPeerConnected, updatePeerRuntimeState]);

  const flushPendingCandidates = useCallback(async (peerId) => {
    if (!peerId) return;

    const pc = peerConnectionsRef.current.get(String(peerId));
    if (!pc) return;

    const candidates = pendingCandidatesRef.current.get(String(peerId)) || [];
    if (candidates.length === 0) return;

    pendingCandidatesRef.current.delete(String(peerId));

    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('[VoiceWebRTC] addIceCandidate failed:', err);
      }
    }
  }, []);

  const handleOffer = useCallback(async (message) => {
    const targetId = message.fromWorkspaceUserId;
    const pc = await createPeerConnection(targetId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: message.sdp
      }));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await flushPendingCandidates(targetId);

      sendSignal({
        type: SIGNAL_TYPES.ANSWER,
        toWorkspaceUserId: targetId,
        sdp: answer.sdp
      });
    } catch (err) {
      console.error('[VoiceWebRTC] handleOffer error:', err);
      setError(`offer handling error: ${err.message}`);
    }
  }, [createPeerConnection, flushPendingCandidates, sendSignal]);

  const handleAnswer = useCallback(async (message) => {
    const peerId = String(message.fromWorkspaceUserId || '');
    if (!peerId) return;

    const pc = peerConnectionsRef.current.get(peerId);
    if (!pc) return;

    // only set remote description if in correct signaling state
    if (pc.signalingState !== 'have-local-offer') {
      console.warn(`[VoiceWebRTC] ignoring answer from ${peerId}, signalingState: ${pc.signalingState}`);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: message.sdp
      }));
    } catch (err) {
      console.error('[VoiceWebRTC] setRemoteDescription error:', err);
      setError(`connection error: ${err.message}`);
    }

    await flushPendingCandidates(peerId);
  }, [flushPendingCandidates]);

  const handleIceCandidate = useCallback(async (message) => {
    if (!message.candidate) return;

    const peerId = String(message.fromWorkspaceUserId || '');
    if (!peerId) return;

    const candidate = new RTCIceCandidate({
      candidate: message.candidate,
      sdpMid: message.sdpMid ?? null,
      sdpMLineIndex: message.sdpMLineIndex ?? null
    });

    const pc = peerConnectionsRef.current.get(peerId);
    if (!pc || !pc.remoteDescription) {
      setPendingCandidate(peerId, candidate);
      return;
    }

    try {
      await pc.addIceCandidate(candidate);
    } catch (err) {
      console.warn('[VoiceWebRTC] addIceCandidate failed:', err);
    }
  }, [setPendingCandidate]);

  const handleLeave = useCallback((message) => {
    const peerId = String(message?.fromWorkspaceUserId || '');
    if (!peerId) {
      closePeerConnection();
      return;
    }

    removePeerConnection(peerId);
  }, [closePeerConnection, removePeerConnection]);

  const handleSignalMessage = useCallback(async (messageBody) => {
    if (!messageBody || messageBody.fromWorkspaceUserId === workspaceUserId) return;

    const targetId = messageBody.toWorkspaceUserId;
    if (targetId && Number(targetId) !== Number(workspaceUserId)) return;

    try {
      setSignalStats((prev) => {
        switch (messageBody.type) {
          case SIGNAL_TYPES.OFFER:
            return { ...prev, offerReceived: prev.offerReceived + 1 };
          case SIGNAL_TYPES.ANSWER:
            return { ...prev, answerReceived: prev.answerReceived + 1 };
          case SIGNAL_TYPES.ICE_CANDIDATE:
            return { ...prev, iceReceived: prev.iceReceived + 1 };
          default:
            return prev;
        }
      });

      switch (messageBody.type) {
        case SIGNAL_TYPES.OFFER:
          await handleOffer(messageBody);
          break;
        case SIGNAL_TYPES.ANSWER:
          await handleAnswer(messageBody);
          break;
        case SIGNAL_TYPES.ICE_CANDIDATE:
          await handleIceCandidate(messageBody);
          break;
        case SIGNAL_TYPES.LEAVE:
          handleLeave(messageBody);
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.message || 'Failed to process signaling message');
      console.error('[VoiceWebRTC] Signal handling error:', err);
    }
  }, [workspaceUserId, handleOffer, handleAnswer, handleIceCandidate, handleLeave]);

  useEffect(() => {
    if (!workspaceId || !sessionId || !workspaceUserId || !signalTopic) return;

    const accessToken = localStorage.getItem('accessToken');

    const socket = new SockJS(`${SOCKET_SERVER_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        workspaceId: String(workspaceId),
        userId: String(workspaceUserId)
      },
      onConnect: () => {
        setIsSignalingConnected(true);
        subscriptionRef.current = client.subscribe(signalTopic, async (message) => {
          try {
            const body = JSON.parse(message.body);
            await handleSignalMessage(body);
          } catch (parseError) {
            console.warn('[VoiceWebRTC] Invalid signal payload', parseError);
          }
        });
      },
      onStompError: (frame) => {
        setError(frame.headers?.message || 'STOMP error');
        setIsSignalingConnected(false);
      },
      onWebSocketClose: () => {
        setIsSignalingConnected(false);
      },
      onWebSocketError: () => {
        setError('WebSocket error');
      },
      debug: () => {}
    });

    clientRef.current = client;
    client.activate();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      if (client.active) {
        client.deactivate();
      }

      clientRef.current = null;
      closePeerConnection();
      stopLocalStream();
      setIsSignalingConnected(false);
      setError(null);
      setPeerRuntimeStates({});
      setSignalStats({
        offerSent: 0,
        answerSent: 0,
        iceSent: 0,
        offerReceived: 0,
        answerReceived: 0,
        iceReceived: 0
      });
    };
  }, [workspaceId, sessionId, workspaceUserId, signalTopic, handleSignalMessage, closePeerConnection, stopLocalStream]);

  const startCall = useCallback(async (targetWorkspaceUserId) => {
    if (!targetWorkspaceUserId) {
      throw new Error('targetWorkspaceUserId is required');
    }

    if (Number(targetWorkspaceUserId) === Number(workspaceUserId)) {
      return;
    }

    setError(null);

    const pc = await createPeerConnection(targetWorkspaceUserId);
    if (pc.signalingState !== 'stable') {
      return;
    }

    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    sendSignal({
      type: SIGNAL_TYPES.OFFER,
      toWorkspaceUserId: targetWorkspaceUserId,
      sdp: offer.sdp
    });
  }, [createPeerConnection, sendSignal, workspaceUserId]);

  const startGroupCall = useCallback(async (targetWorkspaceUserIds = []) => {
    const uniqueTargets = Array.from(
      new Set(
        (targetWorkspaceUserIds || [])
          .map((id) => String(id))
          .filter((id) => id && Number(id) !== Number(workspaceUserId))
      )
    );

    const results = await Promise.allSettled(uniqueTargets.map((id) => startCall(id)));
    const rejected = results.filter((result) => result.status === 'rejected');
    if (rejected.length > 0) {
      const firstReason = rejected[0]?.reason?.message || rejected[0]?.reason || 'unknown';
      throw new Error(`Failed to start ${rejected.length} peer call(s): ${String(firstReason)}`);
    }
  }, [startCall, workspaceUserId]);

  const leaveCall = useCallback(() => {
    if (clientRef.current?.connected) {
      peerConnectionsRef.current.forEach((_, peerId) => {
        try {
          sendSignal({
            type: SIGNAL_TYPES.LEAVE,
            toWorkspaceUserId: peerId
          });
        } catch (err) {
          console.warn('[VoiceWebRTC] LEAVE signal send failed:', err);
        }
      });
    }

    peerConnectionsRef.current.forEach((pc, peerId) => {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      clearPeerState(peerId);
    });

    peerConnectionsRef.current = new Map();
    pendingCandidatesRef.current = new Map();
    setPeerRuntimeStates({});
    setRemoteStreams({});
    setConnectedPeerIds([]);
    stopLocalStream();
  }, [sendSignal, stopLocalStream, clearPeerState]);

  const leavePeerCall = useCallback((targetWorkspaceUserId) => {
    const peerId = String(targetWorkspaceUserId || '');
    if (!peerId) return;

    if (clientRef.current?.connected) {
      try {
        sendSignal({
          type: SIGNAL_TYPES.LEAVE,
          toWorkspaceUserId: peerId
        });
      } catch (err) {
        console.warn('[VoiceWebRTC] LEAVE signal send failed:', err);
      }
    }

    removePeerConnection(peerId);

    if (peerConnectionsRef.current.size === 0) {
      stopLocalStream();
    }
  }, [sendSignal, removePeerConnection, stopLocalStream]);

  const toggleMute = useCallback(async () => {
    if (!localStreamRef.current) {
      try {
        await ensureLocalStream();
      } catch (err) {
        console.warn('[VoiceWebRTC] Failed to acquire local stream for mute toggle:', err);
        return false;
      }
    }

    const nextMuted = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);
    return nextMuted;
  }, [isMuted, ensureLocalStream]);

  return {
    isSignalingConnected,
    isInCall,
    callState,
    callStateLabel,
    callStates: CALL_STATES,
    connectedPeerIds,
    isMuted,
    remoteStream,
    remoteStreams,
    peerRuntimeStates,
    error,
    signalStats,
    startCall,
    startGroupCall,
    leaveCall,
    leavePeerCall,
    toggleMute
  };
};
