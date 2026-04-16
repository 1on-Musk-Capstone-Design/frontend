import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { SOCKET_SERVER_URL } from '../../../config/api';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const SIGNAL_TYPES = {
  OFFER: 'OFFER',
  ANSWER: 'ANSWER',
  ICE_CANDIDATE: 'ICE_CANDIDATE',
  LEAVE: 'LEAVE'
};

const makeClientMessageId = () => `webrtc-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useVoiceWebRTC = ({ workspaceId, sessionId, workspaceUserId }) => {
  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const peerWorkspaceUserIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [isSignalingConnected, setIsSignalingConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState(null);

  const signalTopic = useMemo(() => {
    if (!workspaceId || !sessionId) return null;
    return `/topic/workspace/${workspaceId}/voice/${sessionId}/signal`;
  }, [workspaceId, sessionId]);

  const closePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    peerWorkspaceUserIdRef.current = null;
    pendingCandidatesRef.current = [];
    setRemoteStream(null);
    setIsInCall(false);
  }, []);

  const stopLocalStream = useCallback(() => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setIsMuted(false);
  }, []);

  const sendSignal = useCallback((payload) => {
    if (!clientRef.current?.active || !clientRef.current?.connected) {
      throw new Error('STOMP signaling is not connected');
    }

    clientRef.current.publish({
      destination: '/app/webrtc/signal',
      body: JSON.stringify({
        workspaceId,
        sessionId,
        fromWorkspaceUserId: workspaceUserId,
        clientMessageId: makeClientMessageId(),
        ...payload
      })
    });
  }, [workspaceId, sessionId, workspaceUserId]);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    localStreamRef.current = stream;
    return stream;
  }, []);

  const createPeerConnection = useCallback(async (targetWorkspaceUserId) => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const stream = await ensureLocalStream();
    const pc = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      const [streamFromRemote] = event.streams;
      if (streamFromRemote) {
        setRemoteStream(streamFromRemote);
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      if (!peerWorkspaceUserIdRef.current) return;

      try {
        sendSignal({
          type: SIGNAL_TYPES.ICE_CANDIDATE,
          toWorkspaceUserId: peerWorkspaceUserIdRef.current,
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        });
      } catch (err) {
        console.error('[VoiceWebRTC] ICE send failed:', err);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsInCall(true);
      }

      if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        setIsInCall(false);
      }
    };

    peerWorkspaceUserIdRef.current = targetWorkspaceUserId;
    peerConnectionRef.current = pc;

    return pc;
  }, [ensureLocalStream, sendSignal]);

  const flushPendingCandidates = useCallback(async () => {
    if (!peerConnectionRef.current || pendingCandidatesRef.current.length === 0) return;

    const candidates = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        await peerConnectionRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.warn('[VoiceWebRTC] addIceCandidate failed:', err);
      }
    }
  }, []);

  const handleOffer = useCallback(async (message) => {
    const targetId = message.fromWorkspaceUserId;
    const pc = await createPeerConnection(targetId);

    await pc.setRemoteDescription(new RTCSessionDescription({
      type: 'offer',
      sdp: message.sdp
    }));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await flushPendingCandidates();

    sendSignal({
      type: SIGNAL_TYPES.ANSWER,
      toWorkspaceUserId: targetId,
      sdp: answer.sdp
    });
  }, [createPeerConnection, flushPendingCandidates, sendSignal]);

  const handleAnswer = useCallback(async (message) => {
    if (!peerConnectionRef.current) return;

    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: message.sdp
    }));

    await flushPendingCandidates();
  }, [flushPendingCandidates]);

  const handleIceCandidate = useCallback(async (message) => {
    if (!message.candidate) return;

    const candidate = new RTCIceCandidate({
      candidate: message.candidate,
      sdpMid: message.sdpMid ?? null,
      sdpMLineIndex: message.sdpMLineIndex ?? null
    });

    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(candidate);
    } catch (err) {
      console.warn('[VoiceWebRTC] addIceCandidate failed:', err);
    }
  }, []);

  const handleLeave = useCallback(() => {
    closePeerConnection();
  }, [closePeerConnection]);

  const handleSignalMessage = useCallback(async (messageBody) => {
    if (!messageBody || messageBody.fromWorkspaceUserId === workspaceUserId) return;

    const targetId = messageBody.toWorkspaceUserId;
    if (targetId && Number(targetId) !== Number(workspaceUserId)) return;

    try {
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
          handleLeave();
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

    const socket = new SockJS(`${SOCKET_SERVER_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
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
    };
  }, [workspaceId, sessionId, workspaceUserId, signalTopic, handleSignalMessage, closePeerConnection, stopLocalStream]);

  const startCall = useCallback(async (targetWorkspaceUserId) => {
    if (!targetWorkspaceUserId) {
      throw new Error('targetWorkspaceUserId is required');
    }

    setError(null);

    const pc = await createPeerConnection(targetWorkspaceUserId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    sendSignal({
      type: SIGNAL_TYPES.OFFER,
      toWorkspaceUserId: targetWorkspaceUserId,
      sdp: offer.sdp
    });
  }, [createPeerConnection, sendSignal]);

  const leaveCall = useCallback(() => {
    if (peerWorkspaceUserIdRef.current && clientRef.current?.connected) {
      try {
        sendSignal({
          type: SIGNAL_TYPES.LEAVE,
          toWorkspaceUserId: peerWorkspaceUserIdRef.current
        });
      } catch (err) {
        console.warn('[VoiceWebRTC] LEAVE signal send failed:', err);
      }
    }

    closePeerConnection();
    stopLocalStream();
  }, [sendSignal, closePeerConnection, stopLocalStream]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return false;

    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);
    return nextMuted;
  }, [isMuted]);

  return {
    isSignalingConnected,
    isInCall,
    isMuted,
    remoteStream,
    error,
    startCall,
    leaveCall,
    toggleMute
  };
};
