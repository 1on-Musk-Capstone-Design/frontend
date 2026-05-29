import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  participantsByChannel = {},
  currentUserId,
  projectName,
  voiceState,
  currentUserName,
  currentUserImage,
  onToggleMute,
  onToggleDeafen,
  inputDevices = [{ deviceId: 'default', label: '기본 마이크' }],
  outputDevices = [{ deviceId: 'default', label: '기본 출력' }],
  selectedInputDeviceId = 'default',
  selectedOutputDeviceId = 'default',
  onSelectInputDevice,
  onSelectOutputDevice,
  onRefreshDevices,
  onLeaveVoice
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [inputVolume, setInputVolume] = useState(80);
  const [outputVolume, setOutputVolume] = useState(70);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [inputDropdownOpen, setInputDropdownOpen] = useState(false);
  const [outputDropdownOpen, setOutputDropdownOpen] = useState(false);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const settingsPanelRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const micStreamRef = useRef(null);
  const micAudioContextRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micDataRef = useRef(null);
  const micRafRef = useRef(null);
  const micInputGainRef = useRef(null);
  const micMonitorGainRef = useRef(null);
  const micLevelSmoothRef = useRef(0);
  const inputVolumeRef = useRef(80);
  const outputVolumeRef = useRef(70);
  const gateStateRef = useRef({
    isOpen: false,
    silenceFrames: 0
  });
  const micRestoreStateRef = useRef({
    shouldUnmute: false,
    shouldUndeafen: false
  });

  const selectedInputDevice = inputDevices.find((device) => device.deviceId === selectedInputDeviceId) || inputDevices[0];
  const selectedOutputDevice = outputDevices.find((device) => device.deviceId === selectedOutputDeviceId) || outputDevices[0];
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

  const handleSelectInputDevice = (deviceId) => {
    onSelectInputDevice?.(deviceId);
    setInputDropdownOpen(false);
  };

  const handleSelectOutputDevice = (deviceId) => {
    onSelectOutputDevice?.(deviceId);
    setOutputDropdownOpen(false);
  };

  const stopMicTest = () => {
    if (micRafRef.current) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (micAudioContextRef.current) {
      micAudioContextRef.current.close().catch(() => {});
      micAudioContextRef.current = null;
    }
    micAnalyserRef.current = null;
    micDataRef.current = null;
    micInputGainRef.current = null;
    micMonitorGainRef.current = null;
    micLevelSmoothRef.current = 0;
    gateStateRef.current = {
      isOpen: false,
      silenceFrames: 0
    };
    setMicLevel(0);
    setIsMicTesting(false);

    if (micRestoreStateRef.current.shouldUndeafen && onToggleDeafen) {
      onToggleDeafen();
    }
    if (micRestoreStateRef.current.shouldUnmute && onToggleMute) {
      onToggleMute();
    }
    micRestoreStateRef.current = {
      shouldUnmute: false,
      shouldUndeafen: false
    };
  };

  const closeSettingsPanel = () => {
    setDeviceModalOpen(false);
    setInputDropdownOpen(false);
    setOutputDropdownOpen(false);
    stopMicTest();
  };

  const startMicTest = async () => {
    try {
      const shouldAutoMute = !voiceState?.muted;
      const shouldAutoDeafen = !voiceState?.deafened;

      if (shouldAutoMute && onToggleMute) {
        onToggleMute();
      }
      if (shouldAutoDeafen && onToggleDeafen) {
        onToggleDeafen();
      }

      micRestoreStateRef.current = {
        shouldUnmute: shouldAutoMute,
        shouldUndeafen: shouldAutoDeafen
      };

      const audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16,
          latency: 0
      };

      if (selectedInputDeviceId && selectedInputDeviceId !== 'default') {
        audioConstraints.deviceId = { exact: selectedInputDeviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false
      });

      onRefreshDevices?.();

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.9;
      const inputGain = context.createGain();
      inputGain.gain.value = Math.max(0, Math.min(1, inputVolume / 100));

      const highPassFilter = context.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.value = 140;

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -32;
      compressor.knee.value = 18;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.2;

      const monitorGain = context.createGain();
      // 하울링 위험을 줄이기 위해 모니터링은 낮은 게인으로 유지
      monitorGain.gain.value = Math.max(0, Math.min(0.28, (outputVolume / 100) * 0.28));

      const lowPassFilter = context.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.value = 4300;

      const humNotchFilter = context.createBiquadFilter();
      humNotchFilter.type = 'notch';
      humNotchFilter.frequency.value = 60;
      humNotchFilter.Q.value = 3;

      const source = context.createMediaStreamSource(stream);
      source.connect(inputGain);
      inputGain.connect(highPassFilter);
      highPassFilter.connect(compressor);
      compressor.connect(lowPassFilter);
      lowPassFilter.connect(humNotchFilter);
      humNotchFilter.connect(analyser);
      humNotchFilter.connect(monitorGain);
      monitorGain.connect(context.destination);

      const data = new Uint8Array(analyser.fftSize);

      micStreamRef.current = stream;
      micAudioContextRef.current = context;
      micAnalyserRef.current = analyser;
      micDataRef.current = data;
      micInputGainRef.current = inputGain;
      micMonitorGainRef.current = monitorGain;
      micLevelSmoothRef.current = 0;
      gateStateRef.current = {
        isOpen: false,
        silenceFrames: 0
      };
      setIsMicTesting(true);

      const updateLevel = () => {
        if (!micAnalyserRef.current || !micDataRef.current) return;

        const inputVolumeNow = inputVolumeRef.current;
        const outputVolumeNow = outputVolumeRef.current;

        if (inputVolumeNow <= 0) {
          micLevelSmoothRef.current = 0;
          setMicLevel(0);
          if (micMonitorGainRef.current && micAudioContextRef.current) {
            micMonitorGainRef.current.gain.setTargetAtTime(
              0,
              micAudioContextRef.current.currentTime,
              0.06
            );
          }
          micRafRef.current = requestAnimationFrame(updateLevel);
          return;
        }

        micAnalyserRef.current.getByteTimeDomainData(micDataRef.current);
        let sum = 0;
        for (let index = 0; index < micDataRef.current.length; index += 1) {
          const normalized = (micDataRef.current[index] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / micDataRef.current.length);
        const inputRatio = Math.max(0, Math.min(1, inputVolumeNow / 100));
        const openThreshold = 0.018 + inputRatio * 0.008;
        const closeThreshold = openThreshold * 0.75;
        const normalizedLevel = Math.max(0, (rms - closeThreshold) / 0.048);
        const boostedLevel = Math.min(1, Math.pow(normalizedLevel, 0.42));
        const targetLevel = Math.round(boostedLevel * 100);

        const gateState = gateStateRef.current;
        if (rms >= openThreshold) {
          gateState.isOpen = true;
          gateState.silenceFrames = 0;
        } else if (rms <= closeThreshold) {
          gateState.silenceFrames += 1;
          if (gateState.silenceFrames >= 8) {
            gateState.isOpen = false;
          }
        }

        const speechRatio = Math.min(1, Math.max(0, (rms - closeThreshold) / 0.055));
        const baseMonitorGain = Math.max(0, Math.min(0.5, (outputVolumeNow / 100) * 0.5));

        if (micMonitorGainRef.current && micAudioContextRef.current) {
          const nextMonitorGain = gateState.isOpen
            ? baseMonitorGain * (0.22 + speechRatio * 0.78)
            : 0;
          micMonitorGainRef.current.gain.setTargetAtTime(
            nextMonitorGain,
            micAudioContextRef.current.currentTime,
            gateState.isOpen ? 0.025 : 0.16
          );
        }

        const smoothLevel = micLevelSmoothRef.current * 0.72 + targetLevel * 0.28;
        micLevelSmoothRef.current = smoothLevel;
        setMicLevel(Math.round(smoothLevel));

        micRafRef.current = requestAnimationFrame(updateLevel);
      };

      micRafRef.current = requestAnimationFrame(updateLevel);
    } catch (error) {
      if (micRestoreStateRef.current.shouldUndeafen && onToggleDeafen) {
        onToggleDeafen();
      }
      if (micRestoreStateRef.current.shouldUnmute && onToggleMute) {
        onToggleMute();
      }
      micRestoreStateRef.current = {
        shouldUnmute: false,
        shouldUndeafen: false
      };
      console.warn('[ChatMenu] 마이크 테스트 시작 실패', error);
    }
  };

  const toggleMicTest = async () => {
    if (isMicTesting) {
      stopMicTest();
      return;
    }
    await startMicTest();
  };

  useEffect(() => {
    inputVolumeRef.current = inputVolume;
    outputVolumeRef.current = outputVolume;
  }, [inputVolume, outputVolume]);

  useEffect(() => {
    if (!isMicTesting) return;

    if (micInputGainRef.current) {
      micInputGainRef.current.gain.setTargetAtTime(
        Math.max(0, Math.min(1, Math.pow(inputVolume / 100, 1.08))),
        micAudioContextRef.current?.currentTime || 0,
        0.04
      );
    }

    if (micMonitorGainRef.current) {
      micMonitorGainRef.current.gain.setTargetAtTime(
        Math.max(0, Math.min(0.5, (outputVolume / 100) * 0.5)),
        micAudioContextRef.current?.currentTime || 0,
        0.04
      );
    }
  }, [isMicTesting, inputVolume, outputVolume]);

  useEffect(() => {
    if (!isMicTesting) return undefined;

    const resumeMicTestContext = () => {
      if (!document.hidden && micAudioContextRef.current?.state === 'suspended') {
        micAudioContextRef.current.resume().catch((error) => {
          console.warn('[ChatMenu] 마이크 테스트 오디오 재개 실패', error);
        });
      }
    };

    document.addEventListener('visibilitychange', resumeMicTestContext);
    window.addEventListener('focus', resumeMicTestContext);
    return () => {
      document.removeEventListener('visibilitychange', resumeMicTestContext);
      window.removeEventListener('focus', resumeMicTestContext);
    };
  }, [isMicTesting]);

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

  useEffect(() => {
    if (!deviceModalOpen) return;

    const handleOutsideClick = (event) => {
      const clickedInsidePanel = settingsPanelRef.current && settingsPanelRef.current.contains(event.target);
      const clickedSettingsButton = settingsButtonRef.current && settingsButtonRef.current.contains(event.target);

      if (!clickedInsidePanel && !clickedSettingsButton) {
        closeSettingsPanel();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [deviceModalOpen]);

  useEffect(() => () => {
    stopMicTest();
  }, []);

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
              {(() => {
                const channelParticipants = participantsByChannel[channel.id] || (channel.id === activeVoiceChannelId ? participants : []);
                return channelParticipants.length > 0 && (
                <div className="voiceChannelMembers">
                  {channelParticipants.map((participant) => (
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
                );
              })()}
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
                    {`${voiceChannels.find((item) => item.id === activeVoiceChannelId)?.name || '음성 채널'} · ${projectName || '프로젝트'}`}
                  </div>
                </div>
              </div>
              <button
                className="voiceHangupButton"
                type="button"
                title="연결 끊기"
                onClick={onLeaveVoice}
              >
                📞
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
                  onRefreshDevices?.();
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
      {deviceModalOpen && createPortal(
        <div className="voiceSettingsPanel" ref={settingsPanelRef}>
          <div className="deviceModal">
            <div className="deviceModalHeader">
              <div className="deviceModalTitle">음성 설정</div>
              <button
                type="button"
                className="deviceModalCloseButton"
                aria-label="음성 설정 닫기"
                onClick={closeSettingsPanel}
              >
                ×
              </button>
            </div>
            <div className="deviceModalBody">
              <div className="deviceModalColumn">
                <div className="deviceModalSectionTitle">마이크</div>
                <div className="deviceModalField">
                  <button
                    type="button"
                    className={`deviceModalSelectButton ${inputDropdownOpen ? 'open' : ''}`}
                    onClick={() => {
                      setInputDropdownOpen((prev) => !prev);
                      setOutputDropdownOpen(false);
                    }}
                  >
                    <span>{selectedInputDevice?.label || '기본 마이크'}</span>
                  </button>
                  {inputDropdownOpen && (
                    <div className="deviceModalDropdown">
                      {inputDevices.map((item) => (
                        <button
                          key={item.deviceId}
                          type="button"
                          className={`deviceModalDropdownItem ${selectedInputDeviceId === item.deviceId ? 'selected' : ''}`}
                          onClick={() => handleSelectInputDevice(item.deviceId)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="deviceModalSectionTitle">마이크 음량</div>
                <input
                  className="deviceModalSlider"
                  type="range"
                  min="0"
                  max="100"
                  value={inputVolume}
                  style={{ '--slider-progress': `${inputVolume}%` }}
                  onChange={(event) => setInputVolume(Number(event.target.value))}
                />
              </div>
              <div className="deviceModalColumn">
                <div className="deviceModalSectionTitle">스피커</div>
                <div className="deviceModalField">
                  <button
                    type="button"
                    className={`deviceModalSelectButton ${outputDropdownOpen ? 'open' : ''}`}
                    onClick={() => {
                      setOutputDropdownOpen((prev) => !prev);
                      setInputDropdownOpen(false);
                    }}
                  >
                    <span>{selectedOutputDevice?.label || '기본 출력'}</span>
                  </button>
                  {outputDropdownOpen && (
                    <div className="deviceModalDropdown">
                      {outputDevices.map((item) => (
                        <button
                          key={item.deviceId}
                          type="button"
                          className={`deviceModalDropdownItem ${selectedOutputDeviceId === item.deviceId ? 'selected' : ''}`}
                          onClick={() => handleSelectOutputDevice(item.deviceId)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="deviceModalSectionTitle">스피커 음량</div>
                <input
                  className="deviceModalSlider"
                  type="range"
                  min="0"
                  max="100"
                  value={outputVolume}
                  style={{ '--slider-progress': `${outputVolume}%` }}
                  onChange={(event) => setOutputVolume(Number(event.target.value))}
                />
              </div>
            </div>
            <div className="deviceModalMicTestCard">
              <button
                type="button"
                className={`deviceModalMicTestButton ${isMicTesting ? 'active' : ''}`}
                onClick={toggleMicTest}
              >
                {isMicTesting ? '마이크 테스트 중지' : '마이크 테스트'}
              </button>
              <div className="deviceModalMicLevelWrap">
                <div className="deviceModalMicLevelBar" aria-hidden="true">
                  <div
                    className="deviceModalMicLevelFill"
                    style={{ width: `${micLevel > 0 ? Math.max(8, micLevel) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
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
