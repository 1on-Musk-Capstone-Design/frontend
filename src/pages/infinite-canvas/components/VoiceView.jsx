import React from 'react';

const VoiceView = ({
  channel,
  participants = [],
  currentUserId,
  currentUserName,
  isVoiceActive,
  muted,
  deafened,
  onJoin,
  onLeave,
  onToggleMute,
  onToggleDeafen,
  onToggleSettings
}) => {
  const safeParticipants = participants.length
    ? participants
    : [{ id: currentUserId || 'me', name: currentUserName || '사용자' }];

  return (
    <div className="voiceView">
      <div className="voiceHeader">
        <div className="voiceHeaderInfo">
          <span className="voiceHeaderIcon">🔊</span>
          <div>
            <div className="voiceChannelName">{channel?.name || '음성 채널'}</div>
            <div className="voiceChannelStatus">
              {isVoiceActive ? '연결됨' : '연결 대기'}
            </div>
          </div>
        </div>
        <button
          className="voiceJoinButton"
          type="button"
          onClick={isVoiceActive ? onLeave : onJoin}
        >
          {isVoiceActive ? '나가기' : '참여하기'}
        </button>
      </div>

      <div className="voiceParticipants">
        <div className="voiceParticipantsHeader">참여자</div>
        <div className="voiceParticipantsList">
          {safeParticipants.map((participant) => (
            <div className="voiceParticipantItem" key={participant.id}>
              <div className="voiceParticipantAvatar" />
              <div className="voiceParticipantInfo">
                <span className="voiceParticipantName">
                  {participant.name || participant.userName || '사용자'}
                </span>
                {String(participant.id) === String(currentUserId) && (
                  <span className="voiceParticipantTag">나</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="voiceStatusBar" onClick={(event) => event.stopPropagation()}>
        <div className="voiceStatusUser">
          <div className="voiceStatusAvatar" />
          <div className="voiceStatusInfo">
            <span className="voiceStatusName">{currentUserName || '사용자'}</span>
            <span className="voiceStatusState">
              {isVoiceActive ? '음성 연결됨' : '음성 연결 대기'}
            </span>
          </div>
        </div>
        <div className="voiceStatusActions">
          <button
            className={`voiceStatusButton ${muted ? 'active' : ''}`}
            title="마이크 음소거"
            type="button"
            onClick={onToggleMute}
          >
            {muted ? '🎙️❌' : '🎙️'}
          </button>
          <button
            className={`voiceStatusButton ${deafened ? 'active' : ''}`}
            title="헤드셋 음소거"
            type="button"
            onClick={onToggleDeafen}
          >
            {deafened ? '🔇' : '🎧'}
          </button>
          <button
            className="voiceStatusButton"
            title="장치 설정"
            type="button"
            onClick={onToggleSettings}
          >
            ^
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceView;
