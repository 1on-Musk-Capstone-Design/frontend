import React, { useState, useRef, useEffect } from 'react';
import ChatMenu from './ChatMenu';
import ChatView from './ChatView';

const ChatPanel = ({ 
  messages = [], 
  onLocationClick, 
  onVisibilityChange,
  onSendMessage,
  participants = [],
  currentUserId = null,
  currentWorkspaceUserId = null,
  currentUserName = '',
  currentUserImage = '',
  workspaceId = null,
  projectName = '프로젝트',
  externalVoiceChannels = null,
  externalVoiceParticipants = null,
  externalActiveVoiceChannelId = null,
  externalVoiceState = null,
  onAddVoiceChannel,
  onJoinVoiceChannel,
  onLeaveVoiceChannel,
  onToggleVoiceMute,
  onToggleVoiceDeafen
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
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

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

  const resolvedVoiceChannels = Array.isArray(externalVoiceChannels) ? externalVoiceChannels : voiceChannels;
  const voiceCurrentUserId = currentWorkspaceUserId ?? currentUserId;
  const effectiveActiveVoiceChannelId = externalActiveVoiceChannelId || activeVoiceChannelId;
  const effectiveVoiceState = {
    isVoiceActive: Boolean(effectiveActiveVoiceChannelId),
    connectionStatus: effectiveActiveVoiceChannelId ? 'connected' : 'idle',
    muted: false,
    ...(externalVoiceState || {}),
    deafened: Boolean(externalVoiceState?.deafened)
  };

  useEffect(() => {
    if (!chatChannels.find((channel) => channel.id === activeChatChannelId)) {
      setActiveChatChannelId(chatChannels[0]?.id || initialChatChannels[0].id);
    }
  }, [chatChannels, activeChatChannelId, initialChatChannels]);

  useEffect(() => {
    if (!resolvedVoiceChannels.find((channel) => channel.id === activeVoiceChannelId)) {
      setActiveVoiceChannelId(resolvedVoiceChannels[0]?.id || initialVoiceChannels[0].id);
    }
  }, [resolvedVoiceChannels, activeVoiceChannelId, initialVoiceChannels]);

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
  const toggleVoiceControl = async (key) => {
    if (key === 'muted' && onToggleVoiceMute) {
      try {
        await onToggleVoiceMute();
      } catch (err) {
        console.error('음소거 토글 실패', err);
      }
      return;
    }

    if (key === 'deafened' && onToggleVoiceDeafen) {
      onToggleVoiceDeafen();
    }
  };


  const handleJoinVoice = (channelId = activeVoiceChannelId) => {
    if (!channelId) return;
    setActiveVoiceChannelId(channelId);
    if (onJoinVoiceChannel) {
      onJoinVoiceChannel(channelId);
    }
  };

  const handleLeaveVoice = () => {
    if (onLeaveVoiceChannel) {
      onLeaveVoiceChannel(activeVoiceChannelId);
    }
  };

  useEffect(() => {
    if (!externalActiveVoiceChannelId) return;
    setActiveVoiceChannelId(externalActiveVoiceChannelId);
  }, [externalActiveVoiceChannelId]);

  const activeVoiceMembers = Array.isArray(externalVoiceParticipants)
    ? externalVoiceParticipants
    : [];
  const displayedVoiceMembers = (() => {
    const merged = new Map();

    activeVoiceMembers.forEach((participant) => {
      const participantId = participant?.workspaceUserId ?? participant?.id;
      if (!participantId) return;

      merged.set(String(participantId), {
        ...participant,
        id: participantId,
        name: participant.workspaceUserName || participant.name || participant.userName || participantId
      });
    });

    return Array.from(merged.values());
  })();

  const speakingUserIds = [];
  participants.forEach((participant) => {
    if (!participant?.id) return;
    const speakingFlag = Boolean(participant.isSpeaking ?? participant.speaking);
    const audioLevel = Number(participant.audioLevel ?? participant.voiceLevel ?? 0);
    if (speakingFlag || (Number.isFinite(audioLevel) && audioLevel > 0.12)) {
      speakingUserIds.push(String(participant.id));
    }
  });
  if (effectiveVoiceState.isCurrentUserSpeaking && voiceCurrentUserId) {
    speakingUserIds.push(String(voiceCurrentUserId));
  }

  const mergedSpeakingUserIds = Array.from(
    new Set([
      ...speakingUserIds.map((id) => String(id)),
      ...((externalVoiceState?.speakingUserIds || []).map((id) => String(id)))
    ])
  );
  effectiveVoiceState.speakingUserIds = mergedSpeakingUserIds;
  effectiveVoiceState.isCurrentUserSpeaking = Boolean(externalVoiceState?.isCurrentUserSpeaking);

  const createChannel = (type) => {
    const id = `${type}-${Date.now()}`;
    const name = type === 'chat' ? `채팅방${chatChannels.length + 1}` : `음성채널${voiceChannels.length + 1}`;
    if (type === 'chat') {
      setChatChannels((prev) => [...prev, { id, name }]);
    } else {
      if (onAddVoiceChannel) {
        onAddVoiceChannel();
      } else {
        setVoiceChannels((prev) => [...prev, { id, name }]);
      }
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
      if (resolvedVoiceChannels.length <= 1) return;
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
              title="채널 목록으로 돌아가기"
              aria-label="채널 목록으로 돌아가기"
            >
              ←
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
              voiceChannels={resolvedVoiceChannels}
              editingChannel={editingChannel}
              onSelectChatChannel={(channelId) => {
                setActiveChatChannelId(channelId);
                setView('chat');
              }}
              onSelectVoiceChannel={(channelId) => {
                setView('menu');
                handleJoinVoice(channelId);
              }}
              onAddChannel={createChannel}
              onRemoveChannel={removeChannel}
              onStartEditChannel={startEditChannel}
              onEditChannelName={(name) => setEditingChannel((prev) => prev ? { ...prev, name } : prev)}
              onApplyEditChannel={applyEditChannel}
              activeVoiceChannelId={effectiveActiveVoiceChannelId}
              participants={displayedVoiceMembers}
              currentUserId={voiceCurrentUserId}
              projectName={projectName}
              voiceState={effectiveVoiceState}
              currentUserName={currentUserName}
              currentUserImage={currentUserImage}
              onToggleMute={() => toggleVoiceControl('muted')}
              onToggleDeafen={() => toggleVoiceControl('deafened')}
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
    </>
  );
};

export default ChatPanel;
