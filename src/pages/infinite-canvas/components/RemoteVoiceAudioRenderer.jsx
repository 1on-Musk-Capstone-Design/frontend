import React, { useEffect, useRef, useState } from 'react';

function HiddenRemoteAudio({ stream }) {
  const audioRef = useRef(null);
  const [playbackError, setPlaybackError] = useState('');

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
    if (stream) {
      playRemoteAudio();
    }
  }, [stream]);

  return (
    <>
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        onCanPlay={playRemoteAudio}
        style={{ display: 'none' }}
      />
      {playbackError && (
        <button
          type="button"
          onClick={playRemoteAudio}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: 10001,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #fecaca',
            background: '#fff',
            color: '#b91c1c',
            fontSize: 12,
            fontWeight: 700
          }}
        >
          원격 음성 재생
        </button>
      )}
    </>
  );
}

export default function RemoteVoiceAudioRenderer({ remoteStreams = {} }) {
  const remoteEntries = Object.entries(remoteStreams || {});

  if (remoteEntries.length === 0) {
    return null;
  }

  return (
    <>
      {remoteEntries.map(([producerId, stream]) => (
        <HiddenRemoteAudio key={producerId} stream={stream} />
      ))}
    </>
  );
}
