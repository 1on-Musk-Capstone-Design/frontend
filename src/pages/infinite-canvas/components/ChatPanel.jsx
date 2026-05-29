import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import ChatMenu from './ChatMenu';
import ChatView from './ChatView';
import { useVoiceSFU } from '../hooks/useVoiceSFU';
import { API_BASE_URL } from '../../../config/api';

const VOICE_MEMBER_REFRESH_INTERVAL_MS = 1000;

function RemoteVoiceAudio({ producerId, stream, muted, outputDeviceId, onLevel }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.srcObject = stream || null;
    audioRef.current.muted = Boolean(muted);
    audioRef.current.volume = muted ? 0 : 1;

    if (typeof audioRef.current.setSinkId === 'function' && outputDeviceId) {
      audioRef.current.setSinkId(outputDeviceId).catch((err) => {
        console.warn('[ChatPanel] output device switch failed', err);
      });
    }

    if (stream && !muted) {
      audioRef.current.play().catch((err) => {
        if (err?.name !== 'AbortError') {
          console.warn('[ChatPanel] remote voice autoplay blocked', err);
        }
      });
    }
  }, [stream, muted, outputDeviceId]);

  useEffect(() => {
    if (!stream || !onLevel) return undefined;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return undefined;

    let disposed = false;
    let animationId = null;
    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.86;
    const source = audioContext.createMediaStreamSource(stream);
    const data = new Uint8Array(analyser.fftSize);
    source.connect(analyser);

    const tick = () => {
      if (disposed) return;
      analyser.getByteTimeDomainData(data);
      let total = 0;
      for (let index = 0; index < data.length; index += 1) {
        const normalized = (data[index] - 128) / 128;
        total += normalized * normalized;
      }
      onLevel(producerId, Math.sqrt(total / data.length));
      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      disposed = true;
      if (animationId) cancelAnimationFrame(animationId);
      source.disconnect();
      audioContext.close().catch(() => {});
      onLevel(producerId, 0);
    };
  }, [producerId, stream, onLevel]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

const ChatPanel = ({ 
  messages = [], 
  onLocationClick, 
  onVisibilityChange,
  onSendMessage,
  participants = [],
  currentUserId = null,
  currentUserName = '',
  currentUserImage = '',
  workspaceId = null,
  projectName = '프로젝트'
}) => {
  const legacyStorageKey = 'infinite-canvas-chat-state';
  const storageKey = workspaceId ? `infinite-canvas-chat-state-${workspaceId}` : legacyStorageKey;
  const initialChatChannels = [{ id: 'chat-1', name: '채팅방1' }];
  const initialVoiceChannels = [{ id: 'voice-1', name: '음성채널1' }];
  const initialLocalMessages = [
    { id: 1, text: "안녕하세요! 무한 캔버스에 오신 것을 환영합니다.", sender: "system", time: "10:30", channelId: initialChatChannels[0].id },
    { id: 2, text: "텍스트 필드를 생성하고 편집해보세요.", sender: "system", time: "10:31", channelId: initialChatChannels[0].id },
    { id: 3, text: "드래그로 캔버스를 이동할 수 있습니다.", sender: "system", time: "10:32", channelId: initialChatChannels[0].id }
  ];

  const loadPersistedState = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('채팅 상태 복원 실패', err);
      return null;
    }
  };

  const persisted = loadPersistedState();

  const [chatChannels, setChatChannels] = useState(
    persisted?.chatChannels?.length ? persisted.chatChannels : initialChatChannels
  );
  const [voiceChannels, setVoiceChannels] = useState(
    persisted?.voiceChannels?.length ? persisted.voiceChannels : initialVoiceChannels
  );
  const [activeChatChannelId, setActiveChatChannelId] = useState(
    persisted?.activeChatChannelId || initialChatChannels[0].id
  );
  const [editingChannel, setEditingChannel] = useState(null);
  const [view, setView] = useState(persisted?.view || 'menu');
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState(
    persisted?.activeVoiceChannelId || initialVoiceChannels[0].id
  );
  const [localMessages, setLocalMessages] = useState(
    persisted?.localMessages?.length ? persisted.localMessages : initialLocalMessages
  );
  const [newMessage, setNewMessage] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceMembersByChannel, setVoiceMembersByChannel] = useState(new Map());
  const [isCurrentUserSpeaking, setIsCurrentUserSpeaking] = useState(false);
  const [voiceControls, setVoiceControls] = useState({
    muted: false,
    deafened: false,
    settingsOpen: false,
    inputSettingsOpen: false,
    outputSettingsOpen: false
  });
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const speakingAudioContextRef = useRef(null);
  const speakingAnalyserRef = useRef(null);
  const speakingDataRef = useRef(null);
  const speakingStreamRef = useRef(null);
  const speakingSourceRef = useRef(null);
  const speakingAnimationRef = useRef(null);
  const lastSpeakingAtRef = useRef(0);
  const joinedVoiceSessionRef = useRef(null);
  const [activeVoiceSessionId, setActiveVoiceSessionId] = useState(null);
  const [isVoiceSessionReady, setIsVoiceSessionReady] = useState(false);
  const [voiceSessionError, setVoiceSessionError] = useState('');
  const [shouldStartSfuVoice, setShouldStartSfuVoice] = useState(false);
  const [inputDevices, setInputDevices] = useState([{ deviceId: 'default', label: '기본 마이크' }]);
  const [outputDevices, setOutputDevices] = useState([{ deviceId: 'default', label: '기본 출력' }]);
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState(
    localStorage.getItem('voice-input-device-id') || 'default'
  );
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState(
    localStorage.getItem('voice-output-device-id') || 'default'
  );
  const [remoteVoiceLevels, setRemoteVoiceLevels] = useState({});
  const [voiceSessionIdsByChannel, setVoiceSessionIdsByChannel] = useState({});
  const currentVoiceUserId = useMemo(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const byEmail = storedEmail
      ? participants.find((participant) => participant.email && participant.email === storedEmail)
      : null;
    if (byEmail?.id) return byEmail.id;

    const byName = currentUserName
      ? participants.find((participant) => participant.name && participant.name === currentUserName)
      : null;
    const resolvedId = byName?.id || currentUserId || localStorage.getItem('userId');
    if (resolvedId && Number.isFinite(Number(resolvedId))) {
      return resolvedId;
    }
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? '1'
      : resolvedId;
  }, [currentUserId, currentUserName, participants]);

  const sfuVoice = useVoiceSFU({
    workspaceId,
    sessionId: activeVoiceSessionId,
    workspaceUserId: currentVoiceUserId,
    inputDeviceId: selectedInputDeviceId
  });

  const normalizeDeviceLabel = (label, fallback) => {
    if (!label) return fallback;
    return label
      .replace(/^Default\s*-\s*/i, '')
      .replace(/^기본값?\s*-\s*/i, '')
      .trim() || fallback;
  };

  const refreshMediaDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const makeLabel = (device, fallback, index) => (
        normalizeDeviceLabel(device.label, `${fallback} ${index + 1}`)
      );
      const isVirtualDefaultDevice = (device) => {
        const id = String(device.deviceId || '').toLowerCase();
        const label = String(device.label || '').toLowerCase();
        return id === 'default'
          || id === 'communications'
          || label.includes('communications')
          || label.includes('communication')
          || label.includes('커뮤니케이션');
      };
      const dedupeDevices = (items) => {
        const seen = new Set();
        return items.filter((device) => {
          const key = device.label.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };
      const nextInputs = dedupeDevices(devices
        .filter((device) => device.kind === 'audioinput')
        .filter((device) => !isVirtualDefaultDevice(device))
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: makeLabel(device, '마이크', index)
        })));
      const nextOutputs = dedupeDevices(devices
        .filter((device) => device.kind === 'audiooutput')
        .filter((device) => !isVirtualDefaultDevice(device))
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: makeLabel(device, '스피커', index)
        })));
      const fallbackInputs = nextInputs.length ? nextInputs : [{ deviceId: 'default', label: '마이크' }];
      const fallbackOutputs = nextOutputs.length ? nextOutputs : [{ deviceId: 'default', label: '스피커' }];

      setInputDevices(fallbackInputs);
      setOutputDevices(fallbackOutputs);
      setSelectedInputDeviceId((prev) => (
        fallbackInputs.some((device) => device.deviceId === prev) ? prev : fallbackInputs[0].deviceId
      ));
      setSelectedOutputDeviceId((prev) => (
        fallbackOutputs.some((device) => device.deviceId === prev) ? prev : fallbackOutputs[0].deviceId
      ));
    } catch (err) {
      console.warn('[ChatPanel] media device list failed', err);
    }
  }, []);

  useEffect(() => {
    refreshMediaDevices();
    if (!navigator.mediaDevices?.addEventListener) return undefined;

    navigator.mediaDevices.addEventListener('devicechange', refreshMediaDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshMediaDevices);
    };
  }, [refreshMediaDevices]);

  useEffect(() => {
    localStorage.setItem('voice-input-device-id', selectedInputDeviceId);
  }, [selectedInputDeviceId]);

  useEffect(() => {
    localStorage.setItem('voice-output-device-id', selectedOutputDeviceId);
  }, [selectedOutputDeviceId]);

  const handleSelectInputDevice = useCallback(async (deviceId) => {
    setSelectedInputDeviceId(deviceId || 'default');
    if (sfuVoice.isInCall) {
      await sfuVoice.leaveCall?.();
      setIsVoiceSessionReady(true);
      setShouldStartSfuVoice(true);
    }
  }, [sfuVoice]);

  const handleSelectOutputDevice = useCallback((deviceId) => {
    setSelectedOutputDeviceId(deviceId || 'default');
  }, []);

  const handleRemoteVoiceLevel = useCallback((producerId, level) => {
    setRemoteVoiceLevels((prev) => {
      const roundedLevel = Math.round(level * 1000) / 1000;
      if (prev[producerId] === roundedLevel) return prev;
      return { ...prev, [producerId]: roundedLevel };
    });
  }, []);

  const remoteVoiceParticipants = useMemo(() => {
    const remotePeerIds = Object.values(sfuVoice.remoteProducerMeta || {})
      .map((meta) => String(meta.producerPeerId || ''))
      .filter(Boolean);

    return [...new Set(remotePeerIds)].map((peerId) => {
      const matched = participants.find((participant) => String(participant.id) === peerId);
      if (matched) return matched;

      const level = Object.entries(sfuVoice.remoteProducerMeta || {}).reduce((max, [producerId, meta]) => (
        String(meta.producerPeerId) === peerId ? Math.max(max, Number(remoteVoiceLevels[producerId] || 0)) : max
      ), 0);

      return {
        id: peerId,
        name: `사용자 ${peerId}`,
        userName: `사용자 ${peerId}`,
        audioLevel: level
      };
    });
  }, [participants, remoteVoiceLevels, sfuVoice.remoteProducerMeta]);

  const getOpenVoiceSessions = useCallback(async () => {
    if (!workspaceId) return [];

    const accessToken = localStorage.getItem('accessToken');
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const sessionsRes = await axios.get(
      `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice`,
      { headers }
    );
    return (Array.isArray(sessionsRes.data) ? sessionsRes.data : [])
      .filter((session) => !session.endedAt)
      .sort((a, b) => {
        const aId = Number(a.id ?? a.voiceSessionId ?? 0);
        const bId = Number(b.id ?? b.voiceSessionId ?? 0);
        if (aId && bId) return aId - bId;
        const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        return aTime - bTime;
      });
  }, [workspaceId]);

  const refreshVoiceMembers = useCallback(async () => {
    if (!workspaceId) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const sessions = await getOpenVoiceSessions();
      const nextSessionMap = {};
      const nextMembersMap = new Map();

      await Promise.all(voiceChannels.map(async (channel, index) => {
        const sessionId = Number(sessions[index]?.id ?? sessions[index]?.voiceSessionId);
        if (!Number.isFinite(sessionId)) {
          nextMembersMap.set(channel.id, []);
          return;
        }

        nextSessionMap[channel.id] = sessionId;
        const usersRes = await axios.get(
          `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${sessionId}/users`,
          { headers }
        );
        const activeUsers = (Array.isArray(usersRes.data) ? usersRes.data : [])
          .filter((user) => user.active !== false && !user.leftAt)
          .map((user) => {
            const id = user.workspaceUserId;
            const matched = participants.find((participant) => String(participant.id) === String(id));
            return {
              id,
              name: matched?.name || matched?.userName || user.workspaceUserName || `사용자 ${id}`,
              userName: matched?.userName || user.workspaceUserName || `사용자 ${id}`,
              profileImage: matched?.profileImage || matched?.image || '',
              audioLevel: matched?.audioLevel || 0,
              isSpeaking: matched?.isSpeaking || false
            };
          });
        nextMembersMap.set(channel.id, activeUsers);
      }));

      setVoiceSessionIdsByChannel(nextSessionMap);
      setVoiceMembersByChannel(nextMembersMap);
    } catch (err) {
      console.warn('[ChatPanel] voice members refresh failed', err);
    }
  }, [getOpenVoiceSessions, participants, voiceChannels, workspaceId]);

  useEffect(() => {
    refreshVoiceMembers();
    const timerId = window.setInterval(refreshVoiceMembers, VOICE_MEMBER_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timerId);
  }, [refreshVoiceMembers]);

  // 가시성 변경 시 부모에게 알림
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(!isHidden);
    }
  }, [isHidden, onVisibilityChange]);

  // 상태 저장
  useEffect(() => {
    try {
      const payload = {
        chatChannels,
        voiceChannels,
        localMessages,
        activeChatChannelId,
        activeVoiceChannelId,
        view
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {
      console.warn('채팅 상태 저장 실패', err);
    }
  }, [chatChannels, voiceChannels, localMessages, activeChatChannelId, view]);

  useEffect(() => {
    if (!chatChannels.find((channel) => channel.id === activeChatChannelId)) {
      setActiveChatChannelId(chatChannels[0]?.id || initialChatChannels[0].id);
    }
  }, [chatChannels, activeChatChannelId, initialChatChannels]);

  useEffect(() => {
    if (!voiceChannels.find((channel) => channel.id === activeVoiceChannelId)) {
      setActiveVoiceChannelId(voiceChannels[0]?.id || initialVoiceChannels[0].id);
    }
  }, [voiceChannels, activeVoiceChannelId, initialVoiceChannels]);

  useEffect(() => {
    const shouldDetectSpeaking = isVoiceActive && !voiceControls.muted && !voiceControls.deafened;

    const cleanupSpeakingDetection = async () => {
      if (speakingAnimationRef.current) {
        cancelAnimationFrame(speakingAnimationRef.current);
        speakingAnimationRef.current = null;
      }
      if (speakingSourceRef.current) {
        try {
          speakingSourceRef.current.disconnect();
        } catch (error) {
          console.warn('마이크 소스 정리 실패', error);
        }
        speakingSourceRef.current = null;
      }
      if (speakingStreamRef.current) {
        speakingStreamRef.current.getTracks().forEach((track) => track.stop());
        speakingStreamRef.current = null;
      }
      if (speakingAudioContextRef.current) {
        try {
          if (speakingAudioContextRef.current.state !== 'closed') {
            await speakingAudioContextRef.current.close();
          }
        } catch (error) {
          if (error?.name !== 'InvalidStateError') {
            console.warn('오디오 컨텍스트 종료 실패', error);
          }
        }
        speakingAudioContextRef.current = null;
      }
      speakingAnalyserRef.current = null;
      speakingDataRef.current = null;
      lastSpeakingAtRef.current = 0;
      setIsCurrentUserSpeaking(false);
    };

    if (!shouldDetectSpeaking) {
      cleanupSpeakingDetection();
      return undefined;
    }

    let isDisposed = false;

    const startSpeakingDetection = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });

        if (isDisposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.86;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.fftSize);
        speakingAudioContextRef.current = audioContext;
        speakingAnalyserRef.current = analyser;
        speakingDataRef.current = dataArray;
        speakingStreamRef.current = stream;
        speakingSourceRef.current = source;

        const detectSpeaking = () => {
          if (isDisposed || !speakingAnalyserRef.current || !speakingDataRef.current) {
            return;
          }

          speakingAnalyserRef.current.getByteTimeDomainData(speakingDataRef.current);
          let total = 0;
          for (let index = 0; index < speakingDataRef.current.length; index += 1) {
            const normalized = (speakingDataRef.current[index] - 128) / 128;
            total += normalized * normalized;
          }

          const rms = Math.sqrt(total / speakingDataRef.current.length);
          const now = performance.now();
          const speakingNow = rms > 0.035;

          if (speakingNow) {
            lastSpeakingAtRef.current = now;
          }

          const isActive = speakingNow || now - lastSpeakingAtRef.current < 260;
          setIsCurrentUserSpeaking((prev) => (prev === isActive ? prev : isActive));

          speakingAnimationRef.current = requestAnimationFrame(detectSpeaking);
        };

        speakingAnimationRef.current = requestAnimationFrame(detectSpeaking);
      } catch (error) {
        console.warn('마이크 음성 감지 초기화 실패', error);
      }
    };

    startSpeakingDetection();

    return () => {
      isDisposed = true;
      cleanupSpeakingDetection();
    };
  }, [isVoiceActive, voiceControls.muted, voiceControls.deafened]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // API로 채팅 메시지 전송 (서버에서 메시지 목록을 새로고침하므로 로컬에 추가하지 않음)
      if (onSendMessage) {
        try {
          await onSendMessage(newMessage, activeChatChannelId);
        } catch (err) {
          console.error('채팅 메시지 전송 실패', err);
        }
      }

      setLocalMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: newMessage,
          sender: 'me',
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          channelId: activeChatChannelId
        }
      ]);
      
      setNewMessage("");
    }
  };

  // 활성 채널 메시지만 표시 (channelId 없는 외부 메시지는 제외)
  const resolvedActiveChannelId = activeChatChannelId || chatChannels[0]?.id || initialChatChannels[0].id;
  const channelMessages = [
    ...localMessages,
    ...messages.filter((message) => message.channelId)
  ].filter((message) => message.channelId === resolvedActiveChannelId);

  const allMessages = channelMessages.sort((a, b) => {
    // 타임스탬프가 있으면 타임스탬프로, 없으면 시간 문자열로 정렬
    const timeA = a.timestamp || new Date(a.time).getTime();
    const timeB = b.timestamp || new Date(b.time).getTime();
    return timeA - timeB; // 오래된 것부터 정렬
  });

  // 이전 메시지와 같은 사용자인지 확인 (이름 표시 여부 결정)
  const shouldShowName = (message, index) => {
    if (message.sender === 'system' || message.sender === 'me') return false;
    if (index === 0) return true;
    const prevMessage = allMessages[index - 1];
    return prevMessage.userId !== message.userId || prevMessage.sender !== 'other';
  };

  // 사용자가 스크롤하는지 감지
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      // 사용자가 스크롤 중임을 표시
      setIsUserScrolling(true);
      
      // 스크롤이 맨 아래에 있는지 확인
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px 여유
      
      // 맨 아래에 있으면 사용자 스크롤 상태 해제
      if (isAtBottom) {
        setIsUserScrolling(false);
      }
      
      // 스크롤이 멈춘 후 일정 시간이 지나면 자동 스크롤 재개
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        if (isAtBottom) {
          setIsUserScrolling(false);
        }
      }, 1000);
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    if (messagesContainerRef.current && !isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 메시지가 추가될 때마다 자동 스크롤 (사용자가 스크롤 중이 아닐 때만)
  useEffect(() => {
    scrollToBottom();
  }, [allMessages, isUserScrolling]);

  const activeChatChannel = chatChannels.find((channel) => channel.id === activeChatChannelId) || chatChannels[0] || initialChatChannels[0];
  const activeVoiceChannel = voiceChannels.find((channel) => channel.id === activeVoiceChannelId) || voiceChannels[0] || initialVoiceChannels[0];
  const getVoiceChannelIndex = (channelId) => {
    const index = voiceChannels.findIndex((channel) => channel.id === channelId);
    return index >= 0 ? index : 0;
  };

  const updateVoiceMembership = (channelId, member, remove = false) => {
    if (!channelId || !member) return;
    setVoiceMembersByChannel((prev) => {
      const next = new Map(prev);
      const current = next.get(channelId) || [];
      const filtered = current.filter((item) => String(item.id) !== String(member.id));
      next.set(channelId, remove ? filtered : [...filtered, member]);
      return next;
    });
  };

  const toggleVoiceControl = (key) => {
    setVoiceControls((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleVoiceMute = () => {
    const nextMuted = sfuVoice.toggleMute?.();
    setVoiceControls((prev) => ({
      ...prev,
      muted: typeof nextMuted === 'boolean' ? nextMuted : !prev.muted
    }));
  };

  const toggleInputSettings = () => {
    setVoiceControls((prev) => ({
      ...prev,
      inputSettingsOpen: !prev.inputSettingsOpen,
      outputSettingsOpen: false
    }));
  };

  const toggleOutputSettings = () => {
    setVoiceControls((prev) => ({
      ...prev,
      outputSettingsOpen: !prev.outputSettingsOpen,
      inputSettingsOpen: false
    }));
  };


  const setupVoiceSession = async (channelId = activeVoiceChannelId) => {
    if (!workspaceId || !currentVoiceUserId) {
      throw new Error('워크스페이스 또는 사용자 정보가 없습니다.');
    }

    const userId = Number(currentVoiceUserId);
    if (!Number.isFinite(userId)) {
      throw new Error('음성 연결에는 숫자형 워크스페이스 사용자 ID가 필요합니다.');
    }

    const accessToken = localStorage.getItem('accessToken');
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const openSessions = await getOpenVoiceSessions();

    const channelIndex = getVoiceChannelIndex(channelId);
    while (openSessions.length <= channelIndex) {
      const createRes = await axios.post(
        `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice`,
        {},
        { headers }
      );
      openSessions.push(createRes.data);
    }

    let sessionId = openSessions[channelIndex]?.id;

    const numericSessionId = Number(sessionId);
    if (!Number.isFinite(numericSessionId)) {
      throw new Error('유효한 음성 세션 ID를 확인하지 못했습니다.');
    }

    const isAlreadyJoined = async () => {
      const usersRes = await axios.get(
        `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${numericSessionId}/users`,
        { headers }
      );
      const activeUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
      return activeUsers.some((user) => Number(user.workspaceUserId) === userId);
    };

    if (!(await isAlreadyJoined())) {
      try {
        await axios.post(
          `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${numericSessionId}/users`,
          { workspaceUserId: userId },
          { headers }
        );
      } catch (joinErr) {
        const status = joinErr?.response?.status;
        if (status !== 400 && status !== 403) {
          throw joinErr;
        }

        if (!(await isAlreadyJoined())) {
          throw joinErr;
        }
      }
    }

    joinedVoiceSessionRef.current = numericSessionId;
    setVoiceSessionIdsByChannel((prev) => ({
      ...prev,
      [channelId]: numericSessionId
    }));
    setActiveVoiceSessionId(numericSessionId);
    setIsVoiceSessionReady(true);
    refreshVoiceMembers();
  };

  const leaveVoiceSession = async (channelId = activeVoiceChannelId) => {
    const sessionId = joinedVoiceSessionRef.current;
    const userId = Number(currentVoiceUserId);

    try {
      await sfuVoice.leaveCall?.();
      if (workspaceId && sessionId && Number.isFinite(userId)) {
        const accessToken = localStorage.getItem('accessToken');
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        await axios.delete(
          `${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${sessionId}/users/${userId}`,
          { headers }
        );
      }
    } catch (err) {
      console.warn('[ChatPanel] voice leave failed', err);
    }

    joinedVoiceSessionRef.current = null;
    setActiveVoiceSessionId(null);
    setIsVoiceSessionReady(false);
    setShouldStartSfuVoice(false);
    setVoiceSessionError('');
    setIsVoiceActive(false);
    if (currentVoiceUserId) {
      updateVoiceMembership(channelId, {
        id: currentVoiceUserId
      }, true);
    }
    refreshVoiceMembers();
  };

  const handleJoinVoice = async (channelId = activeVoiceChannelId) => {
    if (!channelId) return;

    try {
      setVoiceSessionError('');
      const previousVoiceChannelId = activeVoiceChannelId;
      if (isVoiceActive && previousVoiceChannelId && previousVoiceChannelId !== channelId) {
        await leaveVoiceSession(previousVoiceChannelId);
      }
      setActiveVoiceChannelId(channelId);
      setIsVoiceActive(true);
      setIsVoiceSessionReady(false);

      if (currentVoiceUserId) {
        updateVoiceMembership(channelId, {
          id: currentVoiceUserId,
          name: currentUserName,
          profileImage: currentUserImage
        });
      }

      await setupVoiceSession(channelId);
      setShouldStartSfuVoice(true);
    } catch (err) {
      console.error('[ChatPanel] voice join failed', err);
      setVoiceSessionError(err?.response?.data?.message || err?.message || '음성 연결에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (!shouldStartSfuVoice || !isVoiceSessionReady || !activeVoiceSessionId) return;

    setShouldStartSfuVoice(false);
    if (sfuVoice.isInCall || sfuVoice.callPhase === 'connected') return;

    sfuVoice.startCall().catch((err) => {
      console.error('[ChatPanel] SFU start failed', err);
      setVoiceSessionError(err?.response?.data?.message || err?.message || 'SFU 연결에 실패했습니다.');
    });
  }, [activeVoiceSessionId, isVoiceSessionReady, sfuVoice, shouldStartSfuVoice]);

  const handleLeaveVoice = async () => {
    await leaveVoiceSession(activeVoiceChannelId);
  };

  useEffect(() => () => {
    if (joinedVoiceSessionRef.current) {
      handleLeaveVoice();
    }
  }, []);

  useEffect(() => {
    const leaveOnPageHide = () => {
      const sessionId = joinedVoiceSessionRef.current;
      const userId = Number(currentVoiceUserId);
      if (!workspaceId || !sessionId || !Number.isFinite(userId)) return;

      fetch(`${API_BASE_URL}/v1/webrtc/sfu/workspaces/${workspaceId}/sessions/${sessionId}/peers/${userId}`, {
        method: 'DELETE',
        keepalive: true
      }).catch(() => {});

      fetch(`${API_BASE_URL}/v1/workspaces/${workspaceId}/voice/${sessionId}/users/${userId}`, {
        method: 'DELETE',
        keepalive: true
      }).catch(() => {});
    };

    window.addEventListener('pagehide', leaveOnPageHide);
    window.addEventListener('beforeunload', leaveOnPageHide);
    return () => {
      window.removeEventListener('pagehide', leaveOnPageHide);
      window.removeEventListener('beforeunload', leaveOnPageHide);
    };
  }, [currentVoiceUserId, workspaceId]);

  const activeVoiceMembers = [
    ...(voiceMembersByChannel.get(activeVoiceChannelId) || []),
    ...remoteVoiceParticipants
  ].filter((participant, index, array) => (
    array.findIndex((item) => String(item.id) === String(participant.id)) === index
  ));
  const voiceMembersByChannelObject = Object.fromEntries(voiceMembersByChannel);
  const speakingUserIds = [];
  participants.forEach((participant) => {
    if (!participant?.id) return;
    const speakingFlag = Boolean(participant.isSpeaking ?? participant.speaking);
    const audioLevel = Number(participant.audioLevel ?? participant.voiceLevel ?? 0);
    if (speakingFlag || (Number.isFinite(audioLevel) && audioLevel > 0.12)) {
      speakingUserIds.push(String(participant.id));
    }
  });
  Object.entries(sfuVoice.remoteProducerMeta || {}).forEach(([producerId, meta]) => {
    const level = Number(remoteVoiceLevels[producerId] || 0);
    if (meta?.producerPeerId && level > 0.025) {
      speakingUserIds.push(String(meta.producerPeerId));
    }
  });
  if (isCurrentUserSpeaking && currentVoiceUserId) {
    speakingUserIds.push(String(currentVoiceUserId));
  }

  const createChannel = (type) => {
    const id = `${type}-${Date.now()}`;
    const name = type === 'chat' ? `채팅방${chatChannels.length + 1}` : `음성채널${voiceChannels.length + 1}`;
    if (type === 'chat') {
      setChatChannels((prev) => [...prev, { id, name }]);
    } else {
      setVoiceChannels((prev) => [...prev, { id, name }]);
    }
  };

  const removeChannel = (type, id) => {
    if (type === 'chat') {
      if (chatChannels.length <= 1) return;
      const nextChannels = chatChannels.filter((channel) => channel.id !== id);
      setChatChannels(nextChannels);
      if (activeChatChannelId === id) {
        setActiveChatChannelId(nextChannels[0]?.id || 'chat-1');
        setView('menu');
      }
    } else {
      if (voiceChannels.length <= 1) return;
      setVoiceChannels((prev) => prev.filter((channel) => channel.id !== id));
    }
  };

  const startEditChannel = (type, channel) => {
    setEditingChannel({ type, id: channel.id, name: channel.name });
  };

  const applyEditChannel = () => {
    if (!editingChannel) return;
    const trimmedName = editingChannel.name.trim();
    if (!trimmedName) {
      setEditingChannel(null);
      return;
    }
    if (editingChannel.type === 'chat') {
      setChatChannels((prev) => prev.map((channel) => channel.id === editingChannel.id ? { ...channel, name: trimmedName } : channel));
    } else {
      setVoiceChannels((prev) => prev.map((channel) => channel.id === editingChannel.id ? { ...channel, name: trimmedName } : channel));
    }
    setEditingChannel(null);
  };

  return (
    <>
      {/* 채팅 패널 토글 버튼 */}
      {isHidden && (
        <button
          className="chatToggle"
          onClick={() => setIsHidden(false)}
          title="채팅 열기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      )}

      {/* 채팅 패널 */}
      <div className={`chatPanel ${isHidden ? 'hidden' : ''}`}>
        {/* 헤더 */}
        <div className="chatHeader">
          <div className="chatHeaderTitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            {/* 채팅 제목 */}
            <span 
              className="chatHeaderText" 
              style={{ 
                fontSize: '13px', 
                fontWeight: 500, 
                color: '#1a1a1a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: '1 1 auto',
                minWidth: 0
              }}
            >
              {view === 'menu' && '채널 선택'}
              {view === 'chat' && `${activeChatChannel?.name || '채팅방'}`}
            </span>
          </div>
          {view === 'chat' && (
            <button
              className="chatBackButton"
              onClick={() => setView('menu')}
              title="메뉴로"
            >
              −
            </button>
          )}
          <button
            className="chatCloseButton"
            onClick={() => setIsHidden(true)}
            title="채팅 닫기"
          >
            ×
          </button>
        </div>

        {/* 메시지 목록 */}
        <div className="chatContent">
          {view === 'menu' ? (
            <ChatMenu
              chatChannels={chatChannels}
              voiceChannels={voiceChannels}
              editingChannel={editingChannel}
              onSelectChatChannel={(channelId) => {
                setActiveChatChannelId(channelId);
                setView('chat');
              }}
              onSelectVoiceChannel={(channelId) => {
                setActiveVoiceChannelId(channelId);
                setView('menu');
                handleJoinVoice(channelId);
              }}
              onAddChannel={createChannel}
              onRemoveChannel={removeChannel}
              onStartEditChannel={startEditChannel}
              onEditChannelName={(name) => setEditingChannel((prev) => prev ? { ...prev, name } : prev)}
              onApplyEditChannel={applyEditChannel}
              activeVoiceChannelId={activeVoiceChannelId}
              participants={activeVoiceMembers}
              participantsByChannel={voiceMembersByChannelObject}
              currentUserId={currentVoiceUserId}
              projectName={projectName}
              voiceState={{
                isVoiceActive,
                connectionStatus: isVoiceActive ? 'connected' : 'idle',
                muted: voiceControls.muted,
                deafened: voiceControls.deafened,
                settingsOpen: voiceControls.settingsOpen,
                speakingUserIds,
                isCurrentUserSpeaking,
                error: voiceSessionError || sfuVoice.error,
                callPhase: sfuVoice.callPhase
              }}
              currentUserName={currentUserName}
              currentUserImage={currentUserImage}
              onToggleMute={toggleVoiceMute}
              onToggleDeafen={() => toggleVoiceControl('deafened')}
              onToggleInputSettings={toggleInputSettings}
              onToggleOutputSettings={toggleOutputSettings}
              inputSettingsOpen={voiceControls.inputSettingsOpen}
              outputSettingsOpen={voiceControls.outputSettingsOpen}
              inputDevices={inputDevices}
              outputDevices={outputDevices}
              selectedInputDeviceId={selectedInputDeviceId}
              selectedOutputDeviceId={selectedOutputDeviceId}
              onSelectInputDevice={handleSelectInputDevice}
              onSelectOutputDevice={handleSelectOutputDevice}
              onRefreshDevices={refreshMediaDevices}
              onLeaveVoice={handleLeaveVoice}
            />
          ) : (
            <ChatView
              messages={allMessages}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              shouldShowName={shouldShowName}
              onLocationClick={onLocationClick}
              newMessage={newMessage}
              onChangeMessage={setNewMessage}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>
      </div>
      {Object.entries(sfuVoice.remoteStreams || {}).map(([producerId, stream]) => (
        <RemoteVoiceAudio
          key={producerId}
          producerId={producerId}
          stream={stream}
          muted={voiceControls.deafened}
          outputDeviceId={selectedOutputDeviceId}
          onLevel={handleRemoteVoiceLevel}
        />
      ))}
    </>
  );
};

export default ChatPanel;
