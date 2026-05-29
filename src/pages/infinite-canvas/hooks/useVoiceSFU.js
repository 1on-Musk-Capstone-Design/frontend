import { useEffect, useRef, useState, useCallback } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';
import { buildWebRtcIceConfig } from './webrtcIceConfig';

export function useVoiceSFU({ workspaceId, sessionId, workspaceUserId }) {
  const iceConfigRef = useRef(buildWebRtcIceConfig());
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const producerRef = useRef(null);
  const localStreamRef = useRef(null);
  const fallbackAudioContextRef = useRef(null);
  const fallbackOscillatorRef = useRef(null);
  const pollTimerRef = useRef(null);
  const statsTimerRef = useRef(null);
  const remoteProducerMetaRef = useRef({});
  const consumersRef = useRef({});
  
  // 패널 컴포넌트의 인터페이스에 맞춰 상태 이름 변경 (remoteAudioStreams -> remoteStreams)
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteProducerMeta, setRemoteProducerMeta] = useState({});
  const [isSignalingConnected, setIsSignalingConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState('');
  const [callPhase, setCallPhase] = useState('idle');
  const [sfuStats, setSfuStats] = useState({
    producersSeen: 0,
    remoteProducersSeen: 0,
    consumersCreated: 0,
    lastPollAt: null,
    lastError: ''
  });
  const [sfuMediaStats, setSfuMediaStats] = useState({
    local: null,
    remotes: {}
  });
  const [sfuTransportStates, setSfuTransportStates] = useState({
    send: '-',
    recv: '-'
  });
  const consumedProducerIdsRef = useRef(new Set());

  const extractRtpStats = useCallback((report, direction) => {
    const result = {
      bytes: 0,
      packets: 0,
      timestamp: null
    };

    if (!report || typeof report.forEach !== 'function') {
      return result;
    }

    report.forEach((stat) => {
      if (stat.type !== `${direction}-rtp`) {
        return;
      }

      const isAudio = stat.kind === 'audio' || stat.mediaType === 'audio';
      if (!isAudio) {
        return;
      }

      result.bytes += direction === 'outbound' ? (stat.bytesSent || 0) : (stat.bytesReceived || 0);
      result.packets += direction === 'outbound' ? (stat.packetsSent || 0) : (stat.packetsReceived || 0);
      result.timestamp = stat.timestamp || result.timestamp;
    });

    return result;
  }, []);

  const refreshMediaStats = useCallback(async () => {
    const nextStats = {
      local: null,
      remotes: {}
    };

    try {
      if (producerRef.current) {
        nextStats.local = {
          producerId: producerRef.current.id,
          closed: producerRef.current.closed,
          paused: producerRef.current.paused,
          trackState: producerRef.current.track?.readyState || '',
          trackEnabled: producerRef.current.track?.enabled ?? null,
          ...(extractRtpStats(await producerRef.current.getStats(), 'outbound'))
        };
      }

      const entries = Object.entries(consumersRef.current);
      await Promise.all(entries.map(async ([producerId, consumer]) => {
        nextStats.remotes[producerId] = {
          consumerId: consumer.id,
          closed: consumer.closed,
          paused: consumer.paused,
          trackState: consumer.track?.readyState || '',
          trackMuted: consumer.track?.muted ?? null,
          ...(extractRtpStats(await consumer.getStats(), 'inbound'))
        };
      }));
    } catch (err) {
      console.warn('[useVoiceSFU] media stats refresh failed:', err);
    }

    setSfuMediaStats(nextStats);
  }, [extractRtpStats]);

  // 1. 라우터 RTP Capabilities 가져오기
  const getRouterCapabilities = useCallback(async () => {
    const { data } = await axios.get(`${API_BASE_URL}/v1/webrtc/sfu/workspaces/${workspaceId}/sessions/${sessionId}/router-capabilities`);
    return data.routerRtpCapabilities;
  }, [workspaceId, sessionId]);

  // 2. 트랜스포트 생성
  const createTransport = useCallback(async (direction, peerId) => {
    const url = `${API_BASE_URL}/v1/webrtc/sfu/workspaces/${workspaceId}/sessions/${sessionId}/transports`;
    console.log('[useVoiceSFU] Creating transport:', { direction, peerId, url });
    try {
      const { data } = await axios.post(url, { peerId, direction });
      console.log('[useVoiceSFU] Transport created:', data);
      return data;
    } catch (err) {
      console.error('[useVoiceSFU] createTransport failed:', err.message, err.response?.status);
      throw err;
    }
  }, [workspaceId, sessionId]);

  // 3. 트랜스포트 연결
  const connectTransport = useCallback(async (transportId, peerId, dtlsParameters) => {
    await axios.post(`${API_BASE_URL}/v1/webrtc/sfu/workspaces/${workspaceId}/sessions/${sessionId}/transports/${transportId}/connect`, { peerId, dtlsParameters });
  }, [workspaceId, sessionId]);

  // 4. 프로듀스(음성 송출)
  const produce = useCallback(async (transportId, peerId, kind, rtpParameters) => {
    const { data } = await axios.post(`${API_BASE_URL}/v1/webrtc/sfu/workspaces/${workspaceId}/sessions/${sessionId}/producers`, { transportId, peerId, kind, rtpParameters });
    return data;
  }, [workspaceId, sessionId]);

  // 5. 컨슘(음성 수신)
  const consume = useCallback(async (transportId, peerId, producerId, rtpCapabilities) => {
    const { data } = await axios.post(`${API_BASE_URL}/v1/webrtc/sfu/workspaces/${workspaceId}/sessions/${sessionId}/consumers`, { transportId, peerId, producerId, rtpCapabilities });
    return data;
  }, [workspaceId, sessionId]);

  const listProducers = useCallback(async () => {
    const { data } = await axios.get(`${API_BASE_URL}/v1/webrtc/sfu/workspaces/${workspaceId}/sessions/${sessionId}/producers`);
    return Array.isArray(data?.producers) ? data.producers : [];
  }, [workspaceId, sessionId]);

  const resumeConsumer = useCallback(async (consumerId, peerId) => {
    await axios.post(
      `${API_BASE_URL}/v1/webrtc/sfu/workspaces/${workspaceId}/sessions/${sessionId}/consumers/${consumerId}/resume`,
      { peerId }
    );
  }, [workspaceId, sessionId]);

  const closePeer = useCallback(async () => {
    if (!workspaceId || !sessionId || !workspaceUserId) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/v1/webrtc/sfu/workspaces/${workspaceId}/sessions/${sessionId}/peers/${workspaceUserId}`
      );
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 500) {
        console.warn('[useVoiceSFU] closePeer ignored:', {
          workspaceId,
          sessionId,
          workspaceUserId,
          status
        });
        return;
      }
      throw err;
    }
  }, [workspaceId, sessionId, workspaceUserId]);

  const stopLocalStream = useCallback(() => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    if (fallbackOscillatorRef.current) {
      try {
        fallbackOscillatorRef.current.stop();
      } catch (err) {
        console.warn('[useVoiceSFU] fallback oscillator stop failed:', err);
      }
      fallbackOscillatorRef.current = null;
    }

    if (fallbackAudioContextRef.current) {
      fallbackAudioContextRef.current.close().catch(() => {});
      fallbackAudioContextRef.current = null;
    }
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

  const resetSessionState = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (statsTimerRef.current) {
      window.clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }

    if (producerRef.current) {
      try {
        producerRef.current.close();
      } catch (err) {
        console.warn('[useVoiceSFU] producer close failed:', err);
      }
      producerRef.current = null;
    }

    if (sendTransportRef.current) {
      try {
        sendTransportRef.current.close();
      } catch (err) {
        console.warn('[useVoiceSFU] send transport close failed:', err);
      }
      sendTransportRef.current = null;
    }

    if (recvTransportRef.current) {
      try {
        recvTransportRef.current.close();
      } catch (err) {
        console.warn('[useVoiceSFU] recv transport close failed:', err);
      }
      recvTransportRef.current = null;
    }

    deviceRef.current = null;
    stopLocalStream();
    setRemoteStreams({});
    consumersRef.current = {};
    remoteProducerMetaRef.current = {};
    setRemoteProducerMeta({});
    setSfuMediaStats({ local: null, remotes: {} });
    setSfuTransportStates({ send: '-', recv: '-' });
    setIsSignalingConnected(false);
    setIsMuted(false);
    setCallPhase('idle');
    setSfuStats({
      producersSeen: 0,
      remoteProducersSeen: 0,
      consumersCreated: 0,
      lastPollAt: null,
      lastError: ''
    });
    consumedProducerIdsRef.current = new Set();
  }, [stopLocalStream]);

  const resumeConsumerWithRetry = useCallback(async (consumerId, peerId) => {
    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await resumeConsumer(consumerId, peerId);
        return;
      } catch (err) {
        lastError = err;
        console.warn('[useVoiceSFU] resume consumer failed:', {
          consumerId,
          attempt,
          error: err
        });
        await new Promise((resolve) => window.setTimeout(resolve, attempt * 250));
      }
    }

    throw lastError;
  }, [resumeConsumer]);

  const connectSFU = useCallback(async () => {
    // [해결 1] 가드 로직: sessionId가 null이거나 유효하지 않으면 실행 중단
    if (!workspaceId || !sessionId || !workspaceUserId) {
        return;
    }

    if (callPhase !== 'idle' && callPhase !== 'error') {
      console.warn('[useVoiceSFU] ignored duplicate Start Call:', { callPhase });
      return;
    }

    try {
      setError(''); // 초기화
      setCallPhase('loading-router-capabilities');

      // 1. 라우터 Capabilities 로드
      const routerRtpCapabilities = await getRouterCapabilities();
      console.log('[useVoiceSFU] routerRtpCapabilities:', routerRtpCapabilities);
      if (!routerRtpCapabilities || typeof routerRtpCapabilities !== 'object' || !routerRtpCapabilities.codecs) {
        throw new Error(`Invalid router RTP capabilities: ${JSON.stringify(routerRtpCapabilities)}`);
      }
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities });
      deviceRef.current = device;
      console.log('[useVoiceSFU] ICE config:', iceConfigRef.current);

      // 2. 송신 트랜스포트 설정
      setCallPhase('creating-send-transport');
      const sendTransportOptions = await createTransport('send', workspaceUserId);
      const sendTransport = device.createSendTransport({
        ...sendTransportOptions,
        ...iceConfigRef.current
      });
      sendTransportRef.current = sendTransport;

      sendTransport.on('connectionstatechange', (state) => {
        console.log('[useVoiceSFU] send transport state:', state);
        setSfuTransportStates((prev) => ({ ...prev, send: state }));
      });

      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await connectTransport(sendTransportOptions.id, workspaceUserId, dtlsParameters);
          callback();
        } catch (err) {
          errback(err);
        }
      });

      sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const result = await produce(sendTransportOptions.id, workspaceUserId, kind, rtpParameters);
          const producerId = result?.id || result?.producerId;
          if (!producerId) {
            throw new Error(`Invalid producer response: ${JSON.stringify(result)}`);
          }
          callback({ id: producerId });
        } catch (err) {
          errback(err);
        }
      });

      // 3. 실제 마이크 트랙 송출 시작
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (mediaErr) {
        const permissionDenied = mediaErr?.name === 'NotAllowedError' || mediaErr?.name === 'PermissionDeniedError';
        if (!permissionDenied) {
          throw mediaErr;
        }

        console.warn('[useVoiceSFU] microphone permission denied, using silent fallback stream');
        stream = await createFallbackAudioStream();
      }

      localStreamRef.current = stream;
      const audioTrack = stream.getAudioTracks()[0];
      setCallPhase('producing-audio');
      producerRef.current = await sendTransport.produce({ track: audioTrack });
      setIsSignalingConnected(true);
      setCallPhase('creating-recv-transport');

      // 4. 수신 트랜스포트 설정 (멀티 유저를 위해 필요)
      const recvTransportOptions = await createTransport('recv', workspaceUserId);
      const recvTransport = device.createRecvTransport({
        ...recvTransportOptions,
        ...iceConfigRef.current
      });
      recvTransportRef.current = recvTransport;

      recvTransport.on('connectionstatechange', (state) => {
        console.log('[useVoiceSFU] recv transport state:', state);
        setSfuTransportStates((prev) => ({ ...prev, recv: state }));
      });

      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await connectTransport(recvTransportOptions.id, workspaceUserId, dtlsParameters);
          callback();
        } catch (err) {
          errback(err);
        }
      });

      setCallPhase('polling-producers');
      const consumeAvailableProducers = async () => {
        if (!recvTransportRef.current || !deviceRef.current) return;

        const producers = await listProducers();
        const activeProducerIds = new Set();
        let remoteProducerCount = 0;
        let createdConsumerCount = 0;
        let lastConsumeError = '';

        console.log('[useVoiceSFU] producers:', producers);

        for (const producer of producers) {
          const producerId = String(producer.producerId || '');
          const producerPeerId = String(producer.peerId || '');

          if (!producerId) continue;
          activeProducerIds.add(producerId);

          if (producerPeerId === String(workspaceUserId)) {
            continue;
          }

          remoteProducerCount += 1;

          if (consumedProducerIdsRef.current.has(producerId)) {
            continue;
          }

          try {
            const consumerData = await consume(
              recvTransportOptions.id,
              workspaceUserId,
              producerId,
              deviceRef.current.rtpCapabilities
            );

            console.log('[useVoiceSFU] consumer created:', consumerData);

            const consumer = await recvTransportRef.current.consume({
              id: consumerData.consumerId,
              producerId: consumerData.producerId,
              kind: consumerData.kind,
              rtpParameters: consumerData.rtpParameters,
              paused: false
            });

            const remoteStream = new MediaStream([consumer.track]);
            consumersRef.current[producerId] = consumer;
            const producerMeta = {
              producerPeerId,
              producerId,
              consumerId: consumerData.consumerId
            };
            remoteProducerMetaRef.current[producerId] = producerMeta;
            setRemoteProducerMeta((prev) => ({
              ...prev,
              [producerId]: producerMeta
            }));
            consumedProducerIdsRef.current.add(producerId);
            createdConsumerCount += 1;
            setRemoteStreams((prev) => ({
              ...prev,
              [producerId]: remoteStream
            }));

            consumer.track.onmute = () => {
              console.warn('[useVoiceSFU] remote track muted:', remoteProducerMetaRef.current[producerId]);
            };
            consumer.track.onunmute = () => {
              console.log('[useVoiceSFU] remote track unmuted:', remoteProducerMetaRef.current[producerId]);
            };
            consumer.track.onended = () => {
              console.warn('[useVoiceSFU] remote track ended:', remoteProducerMetaRef.current[producerId]);
            };

            await resumeConsumerWithRetry(consumerData.consumerId, workspaceUserId);
          } catch (consumeErr) {
            lastConsumeError = consumeErr.response?.data?.message || consumeErr.message || 'consume failed';
            console.warn('[useVoiceSFU] consume failed:', {
              producerId,
              producerPeerId,
              error: consumeErr
            });
          }
        }

        setSfuStats((prev) => ({
          producersSeen: producers.length,
          remoteProducersSeen: remoteProducerCount,
          consumersCreated: prev.consumersCreated + createdConsumerCount,
          lastPollAt: new Date().toISOString(),
          lastError: lastConsumeError
        }));

        setRemoteStreams((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            if (!activeProducerIds.has(key) && !activeProducerIds.has(String(key))) {
              delete next[key];
              delete consumersRef.current[key];
              delete remoteProducerMetaRef.current[key];
            }
          }
          return next;
        });

        setRemoteProducerMeta((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            if (!activeProducerIds.has(key) && !activeProducerIds.has(String(key))) {
              delete next[key];
            }
          }
          return next;
        });
      };

      await consumeAvailableProducers();
      pollTimerRef.current = window.setInterval(() => {
        consumeAvailableProducers().catch((pollErr) => {
          console.warn('[useVoiceSFU] producer poll failed:', pollErr);
          setSfuStats((prev) => ({
            ...prev,
            lastPollAt: new Date().toISOString(),
            lastError: pollErr.response?.data?.message || pollErr.message || 'producer poll failed'
          }));
        });
      }, 3000);
      await refreshMediaStats();
      statsTimerRef.current = window.setInterval(() => {
        refreshMediaStats();
      }, 1000);

      setIsSignalingConnected(true);
      setCallPhase('connected');

    } catch (err) {
      console.error('[useVoiceSFU] Connection Failed:', err);
      // [해결 2] 객체 대신 메시지 문자열만 저장하여 'White Screen' 방지
      const errorMessage = err.response?.data?.message || err.message || "SFU 연결에 실패했습니다.";
      setError(String(errorMessage));
      setIsSignalingConnected(false);
      resetSessionState();
      setCallPhase('error');
    }
  }, [workspaceId, sessionId, workspaceUserId, callPhase, getRouterCapabilities, createTransport, connectTransport, produce, consume, listProducers, resumeConsumerWithRetry, refreshMediaStats, resetSessionState, createFallbackAudioStream]);

  useEffect(() => {
    // cleanup은 컴포넌트가 내려가거나 세션/사용자가 바뀔 때만 수행한다.
    // 연결 상태 변경(isSignalingConnected)마다 실행되면 방금 만든 SFU 연결이 즉시 reset된다.
    return () => {
      closePeer().catch((err) => {
        if (err?.response?.status === 403) {
          return;
        }
        console.warn('[useVoiceSFU] peer cleanup failed:', err);
      });
      resetSessionState();
    };
  }, [closePeer, resetSessionState]);

  const leaveCall = useCallback(async () => {
    try {
      await closePeer();
    } catch (err) {
      if (err?.response?.status === 403) {
        resetSessionState();
        setError('');
        return;
      }
      console.warn('[useVoiceSFU] peer cleanup failed:', err);
    }
    resetSessionState();
    setError('');
  }, [closePeer, resetSessionState]);

  const toggleMute = useCallback(async () => {
    if (!localStreamRef.current) {
      return false;
    }

    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    if (producerRef.current && !producerRef.current.closed) {
      try {
        if (nextMuted) {
          await producerRef.current.pause();
        } else {
          await producerRef.current.resume();
        }
      } catch (err) {
        console.warn('[useVoiceSFU] producer mute toggle failed:', err);
      }
    }

    setIsMuted(nextMuted);
    return nextMuted;
  }, [isMuted]);

  // 패널에서 기대하는 필드명으로 반환
  return {
    isSignalingConnected,
    error,
    callPhase,
    remoteStreams,
    sfuStats,
    sfuMediaStats,
    sfuTransportStates,
    remoteProducerMeta,
    isMuted,
    isInCall: isSignalingConnected,
    callState: error ? 'ERROR' : (isSignalingConnected ? 'CONNECTED' : 'IDLE'),
    callStateLabel: error ? '오류' : (isSignalingConnected ? '연결됨' : '준비 중'),
    callStates: { CONNECTED: 'CONNECTED', IDLE: 'IDLE' },
    connectedPeerIds: Object.keys(remoteStreams),
    startCall: connectSFU,
    leaveCall,
    toggleMute
  };
}
