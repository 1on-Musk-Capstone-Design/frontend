import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function VoiceSettingsPanel({
  open,
  voiceState,
  onClose,
  onToggleMute,
  onToggleDeafen
}) {
  const [selectedInputDevice, setSelectedInputDevice] = useState('기본 마이크');
  const [selectedOutputDevice, setSelectedOutputDevice] = useState('기본 출력');
  const [inputVolume, setInputVolume] = useState(80);
  const [outputVolume, setOutputVolume] = useState(70);
  const [inputDropdownOpen, setInputDropdownOpen] = useState(false);
  const [outputDropdownOpen, setOutputDropdownOpen] = useState(false);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const settingsPanelRef = useRef(null);
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

  const inputDevices = ['기본 마이크', '외장 마이크'];
  const outputDevices = ['기본 출력', '스피커', '헤드셋'];

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
    setInputDropdownOpen(false);
    setOutputDropdownOpen(false);
    stopMicTest();
    onClose?.();
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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16,
          latency: 0
        },
        video: false
      });

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
            micMonitorGainRef.current.gain.setTargetAtTime(0, micAudioContextRef.current.currentTime, 0.06);
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
      console.warn('[VoiceSettingsPanel] 마이크 테스트 시작 실패', error);
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
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (settingsPanelRef.current && !settingsPanelRef.current.contains(event.target)) {
        closeSettingsPanel();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  useEffect(() => () => {
    stopMicTest();
  }, []);

  if (!open) return null;

  return createPortal(
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
                <span>{selectedInputDevice}</span>
              </button>
              {inputDropdownOpen && (
                <div className="deviceModalDropdown">
                  {inputDevices.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`deviceModalDropdownItem ${selectedInputDevice === item ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedInputDevice(item);
                        setInputDropdownOpen(false);
                      }}
                    >
                      {item}
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
                <span>{selectedOutputDevice}</span>
              </button>
              {outputDropdownOpen && (
                <div className="deviceModalDropdown">
                  {outputDevices.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`deviceModalDropdownItem ${selectedOutputDevice === item ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedOutputDevice(item);
                        setOutputDropdownOpen(false);
                      }}
                    >
                      {item}
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
        <div className="deviceModalMicTestRow">
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
  );
}
