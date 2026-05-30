import { useEffect, useRef, useState } from 'react';

export function useLocalSpeakingIndicator(enabled) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingAudioContextRef = useRef(null);
  const speakingAnalyserRef = useRef(null);
  const speakingDataRef = useRef(null);
  const speakingStreamRef = useRef(null);
  const speakingSourceRef = useRef(null);
  const speakingAnimationRef = useRef(null);
  const lastSpeakingAtRef = useRef(0);

  useEffect(() => {
    const cleanupSpeakingDetection = async () => {
      if (speakingAnimationRef.current) {
        cancelAnimationFrame(speakingAnimationRef.current);
        speakingAnimationRef.current = null;
      }
      if (speakingSourceRef.current) {
        try {
          speakingSourceRef.current.disconnect();
        } catch (error) {
          console.warn('[useLocalSpeakingIndicator] 마이크 소스 정리 실패', error);
        }
        speakingSourceRef.current = null;
      }
      if (speakingStreamRef.current) {
        speakingStreamRef.current.getTracks().forEach((track) => track.stop());
        speakingStreamRef.current = null;
      }
      if (speakingAudioContextRef.current) {
        try {
          await speakingAudioContextRef.current.close();
        } catch (error) {
          console.warn('[useLocalSpeakingIndicator] 오디오 컨텍스트 종료 실패', error);
        }
        speakingAudioContextRef.current = null;
      }
      speakingAnalyserRef.current = null;
      speakingDataRef.current = null;
      lastSpeakingAtRef.current = 0;
      setIsSpeaking(false);
    };

    if (!enabled) {
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

          const active = speakingNow || now - lastSpeakingAtRef.current < 260;
          setIsSpeaking((prev) => (prev === active ? prev : active));

          speakingAnimationRef.current = requestAnimationFrame(detectSpeaking);
        };

        speakingAnimationRef.current = requestAnimationFrame(detectSpeaking);
      } catch (error) {
        console.warn('[useLocalSpeakingIndicator] 마이크 음성 감지 초기화 실패', error);
      }
    };

    startSpeakingDetection();

    return () => {
      isDisposed = true;
      cleanupSpeakingDetection();
    };
  }, [enabled]);

  return isSpeaking;
}
