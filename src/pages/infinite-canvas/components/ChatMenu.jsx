import React, { useEffect, useRef, useState } from 'react';
import VoiceSettingsPanel from './VoiceSettingsPanel';

const ChatMenu = ({
  chatChannels,
  voiceChannels,
  editingChannel,
  onSelectChatChannel,
  onSelectVoiceChannel,
  onAddChannel,
  onRemoveChannel,
  onStartEditChannel,
  onEditChannelName,
  onApplyEditChannel,
  activeVoiceChannelId,
  participants = [],
  currentUserId,
  projectName,
  voiceState,
  currentUserName,
  currentUserImage,
  onToggleMute,
  onToggleDeafen,
  onLeaveVoice
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const settingsButtonRef = useRef(null);
  const speakingUserIds = new Set((voiceState?.speakingUserIds || []).map((id) => String(id)));

  const isParticipantSpeaking = (participant) => {
    if (!participant?.id) return false;
    if (speakingUserIds.has(String(participant.id))) return true;
    if (participant.isSpeaking ?? participant.speaking) return true;
    const audioLevel = Number(participant.audioLevel ?? participant.voiceLevel ?? 0);
    return Number.isFinite(audioLevel) && audioLevel > 0.12;
  };

  const isCurrentUserSpeaking = Boolean(
    voiceState?.isCurrentUserSpeaking ||
    (currentUserId && speakingUserIds.has(String(currentUserId)))
  );

  const getInitials = (name = '') => {
    const trimmed = name.trim();
    if (!trimmed) return 'U';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return trimmed.substring(0, 2).toUpperCase();
  };

  const openContextMenu = (event, type, channel) => {
    event.preventDefault();
    setContextMenu({
      type,
      channel,
      x: event.clientX,
      y: event.clientY
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleRename = () => {
    if (!contextMenu) return;
    onStartEditChannel(contextMenu.type, contextMenu.channel);
    closeContextMenu();
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    onRemoveChannel(contextMenu.type, contextMenu.channel.id);
    closeContextMenu();
  };

  const closeSettingsPanel = () => {
    setDeviceModalOpen(false);
  };

  const handleToggleDeafenWithMic = () => {
    if (voiceState?.deafened) {
      if (voiceState?.muted) {
        onToggleMute();
      }
      onToggleDeafen();
      return;
    }

    if (!voiceState?.muted) {
      onToggleMute();
    }
    onToggleDeafen();
  };

  return (
    <div className="chatMenu" onClick={closeContextMenu}>
      <div className="chatMenuSection">
        <div className="chatMenuHeader">
          <span>채팅 채널</span>
          <button
            className="chatMenuAddButton"
            onClick={() => onAddChannel('chat')}
            title="채팅 채널 추가"
            type="button"
          >
            +
          </button>
        </div>
        <div className="chatMenuList">
          {chatChannels.map((channel) => (
            <div
              key={channel.id}
              className="chatMenuItem"
              onContextMenu={(event) => openContextMenu(event, 'chat', channel)}
            >
              <button
                className="chatMenuItemButton"
                onClick={() => onSelectChatChannel(channel.id)}
                type="button"
              >
                <span className="chatMenuPrefix">#</span>
                {editingChannel?.type === 'chat' && editingChannel?.id === channel.id ? (
                  <input
                    className="chatMenuInput"
                    value={editingChannel.name}
                    onChange={(event) => onEditChannelName(event.target.value)}
                    onBlur={onApplyEditChannel}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        onApplyEditChannel();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span>{channel.name}</span>
                )}
              </button>
              <div className="chatMenuActions" />
            </div>
          ))}
        </div>
      </div>
      <div className="chatMenuSection">
        <div className="chatMenuHeader">
          <span>음성 채널</span>
          <button
            className="chatMenuAddButton"
            onClick={() => onAddChannel('voice')}
            title="음성 채널 추가"
            type="button"
          >
            +
          </button>
        </div>
        <div className="chatMenuList">
          {voiceChannels.map((channel) => (
            <div key={channel.id}>
              <div
                className={`chatMenuItem static voiceChannelItem ${channel.id === activeVoiceChannelId ? 'active' : ''}`}
                onContextMenu={(event) => openContextMenu(event, 'voice', channel)}
              >
                <button
                  className="chatMenuItemButton"
                  onClick={() => onSelectVoiceChannel && onSelectVoiceChannel(channel.id)}
                  type="button"
                >
                  <span className="chatMenuPrefix">🔊</span>
                  {editingChannel?.type === 'voice' && editingChannel?.id === channel.id ? (
                    <input
                      className="chatMenuInput"
                      value={editingChannel.name}
                      onChange={(event) => onEditChannelName(event.target.value)}
                      onBlur={onApplyEditChannel}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          onApplyEditChannel();
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span>{channel.name}</span>
                  )}
                </button>
                <div className="chatMenuActions" />
              </div>
              {channel.id === activeVoiceChannelId && participants.length > 0 && (
                <div className="voiceChannelMembers">
                  {participants.map((participant) => (
                    <div className="voiceParticipantItem" key={participant.id}>
                      <div className={`voiceParticipantAvatar ${isParticipantSpeaking(participant) ? 'speaking' : ''}`}>
                        {participant.profileImage ? (
                          <img
                            src={participant.profileImage}
                            alt={participant.name || participant.userName || '사용자'}
                            className="voiceStatusAvatarImage"
                          />
                        ) : (
                          <span className="voiceAvatarInitials">
                            {getInitials(participant.name || participant.userName || '')}
                          </span>
                        )}
                      </div>
                      <div className="voiceParticipantInfo">
                        <span className="voiceParticipantName">
                          {participant.name || participant.userName || participant.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="voiceBottomArea" onClick={(event) => event.stopPropagation()}>
        {voiceState?.isVoiceActive && activeVoiceChannelId && (
          <>
            <div className="voiceMenuDivider" />
            <div className={`voiceConnectionBar status-${voiceState?.connectionStatus || 'connected'}`}>
              <div className="voiceConnectionStatus">
                <span className="voiceConnectionDot" />
                <div>
                  <div className="voiceConnectionTitle">음성 연결 됨</div>
                  <div className="voiceConnectionMeta">
                    {(voiceChannels.find((item) => item.id === activeVoiceChannelId)?.name || '음성 채널')} · {projectName || '프로젝트'}
                  </div>
                </div>
              </div>
              <button
                className="voiceHangupButton"
                type="button"
                title="연결 끊기"
                onClick={onLeaveVoice}
              >
                ×
              </button>
            </div>
          </>
        )}
        <div className="voiceStatusBar">
          <div className="voiceStatusUser">
            <div className={`voiceStatusAvatar ${isCurrentUserSpeaking ? 'speaking' : ''}`}>
              {currentUserImage ? (
                <img
                  src={currentUserImage}
                  alt={currentUserName || '사용자'}
                  className="voiceStatusAvatarImage"
                />
              ) : (
                <span className="voiceAvatarInitials">
                  {getInitials(currentUserName || '')}
                </span>
              )}
            </div>
            <div className="voiceStatusInfo">
              <span className="voiceStatusName">{currentUserName || '사용자'}</span>
            </div>
          </div>
          <div className="voiceStatusActions">
            <button
              className={`voiceStatusButton mute ${voiceState?.muted ? 'active' : ''}`}
              title="마이크 음소거"
              type="button"
              onClick={onToggleMute}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="voiceIcon">
                <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3z" />
                <path d="M19 11a7 7 0 0 1-14 0" />
                <path d="M12 18v3" />
                <path d="M9 21h6" />
              </svg>
            </button>
            <button
              className={`voiceStatusButton deafen ${voiceState?.deafened ? 'active' : ''}`}
              title="헤드셋 음소거"
              type="button"
              onClick={handleToggleDeafenWithMic}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="voiceIcon">
                <path d="M4 13v3a2 2 0 0 0 2 2h2v-6H6a2 2 0 0 0-2 2z" />
                <path d="M20 13v3a2 2 0 0 1-2 2h-2v-6h2a2 2 0 0 1 2 2z" />
                <path d="M4 12a8 8 0 0 1 16 0" />
              </svg>
            </button>
            <button
              className="voiceStatusButton settings"
              title="음성 설정"
              type="button"
              ref={settingsButtonRef}
              onClick={() => {
                if (deviceModalOpen) {
                  closeSettingsPanel();
                } else {
                  setDeviceModalOpen(true);
                }
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="voiceIcon">
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1.2 1.2a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1.2-1.2a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1 1 0 0 1-1-1v-1.6a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1.2-1.2a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.6a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1.2 1.2a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <VoiceSettingsPanel
        open={deviceModalOpen}
        voiceState={voiceState}
        onClose={closeSettingsPanel}
        onToggleMute={onToggleMute}
        onToggleDeafen={onToggleDeafen}
      />
      {contextMenu && (
        <div
          className="chatContextMenu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="chatContextMenuItem"
            onClick={handleRename}
            type="button"
          >
            이름 변경
          </button>
          <button
            className="chatContextMenuItem danger"
            onClick={handleDelete}
            type="button"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatMenu;
