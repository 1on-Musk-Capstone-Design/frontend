import React, { useEffect, useRef, useState } from 'react';

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
  maxHeight: embedded ? 'min(100%, 78vh)' : '78vh',
  padding: 16,
  borderRadius: 18,
  border: '1px solid rgba(148,163,184,0.24)',
  background: 'rgba(255,255,255,0.88)',
  boxShadow: '0 16px 36px rgba(15,23,42,0.12)',
  backdropFilter: 'blur(12px)',
  overflowY: 'auto'
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
  fontWeight: 700
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
  candidatePeers = [],
  embedded = false,
  voiceSession
}) {
  const {
    activeSessionId = null,
    isSessionReady = false,
    sessionError = '',
    isInCall = false,
    isMuted = false,
    callState = '',
    callStateLabel = '',
    callStates = {},
    callPhase = '',
    error = '',
    connectedPeerIds = [],
    remoteStreams = {},
    remoteProducerMeta = {},
    sfuStats = {},
    sfuMediaStats = {},
    sfuTransportStates = {},
    toggleMute = async () => {},
    leaveCall = async () => {}
  } = voiceSession || {};

  const callStateColors = (() => {
    switch (callState) {
      case callStates.CONNECTED:
        return { border: '#60a5fa', background: '#dbeafe', color: '#1d4ed8' };
      case callStates.SIGNALING_READY:
        return { border: '#86efac', background: '#dcfce7', color: '#166534' };
      case callStates.CONNECTING:
      case callStates.RECONNECTING:
        return { border: '#fcd34d', background: '#fef3c7', color: '#92400e' };
      case callStates.ERROR:
        return { border: '#fca5a5', background: '#fee2e2', color: '#b91c1c' };
      default:
        return { border: '#d1d5db', background: '#f3f4f6', color: '#374151' };
    }
  })();

  const handleToggleMute = async () => {
    try {
      await toggleMute();
    } catch (err) {
      console.error('[VoiceCallTestPanel] toggleMute failed:', err);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveCall();
    } catch (err) {
      console.error('[VoiceCallTestPanel] leaveCall failed:', err);
    }
  };

  const remoteEntries = Object.entries(remoteStreams || {});

  return (
    <div style={getBoxStyle(embedded)}>
      <div style={panelHeaderStyle}>
        <div style={panelTitleStyle}>
          <div style={panelEyebrowStyle}>Voice Debug</div>
          <strong style={{ fontSize: 18, letterSpacing: '-0.02em' }}>Call Control Panel</strong>
          <div style={panelSubtextStyle}>실제 음성 엔진 상태를 점검하는 디버그 패널입니다.</div>
        </div>
        <div
          style={{
            ...statusChipStyle,
            background: '#dbeafe',
            color: '#1d4ed8',
            marginLeft: 0,
            whiteSpace: 'nowrap'
          }}
        >
          SFU
        </div>
      </div>

      <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>
        workspace: {workspaceId || '-'} / workspaceUser: {currentWorkspaceUserId || '-'}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>
        Current session: {activeSessionId ?? '-'} {isSessionReady ? 'ready' : 'preparing'}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>
        Candidate peers: {candidatePeers.map((peer) => peer.id).join(', ') || '-'}
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
          fontWeight: 700
        }}
      >
        현재 통화 상태: {callStateLabel || callState || 'IDLE'}
      </div>

      {(sessionError || error) && (
        <div
          style={{
            ...bannerStyle,
            borderColor: '#fecaca',
            background: '#fef2f2',
            color: '#b91c1c'
          }}
        >
          {sessionError || error}
        </div>
      )}

      <div style={actionRowStyle}>
        <button type="button" style={primaryButtonStyle} onClick={handleToggleMute}>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button
          type="button"
          style={{ ...primaryButtonStyle, borderColor: '#fecaca', color: '#b91c1c' }}
          onClick={handleLeave}
        >
          Leave
        </button>
      </div>

      <div style={statusGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>SFU Phase</div>
          <div style={statValueStyle}>{callPhase || '-'}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Connected peers</div>
          <div style={statValueStyle}>{connectedPeerIds.length}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>SFU Transport</div>
          <div style={statValueStyle}>
            send {sfuTransportStates?.send || '-'}, recv {sfuTransportStates?.recv || '-'}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Remote streams</div>
          <div style={statValueStyle}>{remoteEntries.length}</div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Remote Audio</div>
        {remoteEntries.length === 0 && (
          <div style={{ fontSize: 12, color: '#64748b' }}>아직 수신 중인 원격 오디오가 없습니다.</div>
        )}
        {remoteEntries.map(([producerId, stream]) => {
          const producerMeta = remoteProducerMeta[producerId] || {};
          const consumer = sfuStats.consumers?.find((item) => String(item.producerId) === String(producerId));

          return (
            <RemoteAudioPlayer
              key={producerId}
              peerId={producerMeta.producerPeerId || '-'}
              producerId={producerId}
              consumerId={consumer?.consumerId || '-'}
              stream={stream}
            />
          );
        })}
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>SFU Stats</div>
        <pre style={{ margin: 0, fontSize: 11, color: '#334155', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(
            {
              phase: callPhase,
              producers: sfuStats.producers?.length || 0,
              consumers: sfuStats.consumers?.length || 0,
              remoteProducers: sfuStats.remoteProducerIds?.length || 0,
              media: sfuMediaStats,
              transports: sfuTransportStates,
              inCall: isInCall
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
