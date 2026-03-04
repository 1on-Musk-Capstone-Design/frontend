import { useState, useRef, useCallback, useEffect } from 'react';

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const PINCH_ON_THRESHOLD = 0.055;
const PINCH_OFF_THRESHOLD = 0.075;
const ZOOM_SENSITIVITY = 0.2;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

// 랜드마크 인덱스
const THUMB_TIP = 4;
const INDEX_TIP = 8;

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Frontend-only NUI: camera + MediaPipe Hands in the browser.
 * Returns handState compatible with existing gesture logic: { x, y, gesture, zoom_scale }.
 * x, y: normalized 0..1 (viewport).
 */
export function useNuiHandTracking(enabled) {
  const [handState, setHandState] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const twoHandBaselineRef = useRef(null); // initial combined pinch for zoom
  const cumulativeZoomRef = useRef(1);
  const pinchActiveRef = useRef(false);

  const processFrame = useCallback((video) => {
    const landmarker = handLandmarkerRef.current;
    if (!landmarker || !video || video.readyState < 2) return;
    const now = performance.now() / 1000;
    if (lastVideoTimeRef.current === video.currentTime) return;
    lastVideoTimeRef.current = video.currentTime;

    const results = landmarker.detectForVideo(video, now);

    if (!results.landmarks || results.landmarks.length === 0) {
      setHandState((prev) =>
        prev ? { ...prev, active: false, gesture: 'none' } : null
      );
      twoHandBaselineRef.current = null;
      pinchActiveRef.current = false;
      return;
    }

    // Primary hand: prefer right for cursor
    const handedness = results.handednesses || [];
    let primaryIdx = 0;
    if (results.landmarks.length > 1 && handedness[1]?.[0]?.categoryName === 'Right') {
      primaryIdx = 1;
    }
    const primary = results.landmarks[primaryIdx];
    if (!primary || primary.length < 9) return;

    const indexTip = primary[INDEX_TIP];
    const thumbTip = primary[THUMB_TIP];
    const pinchDist = distance(indexTip, thumbTip);
    const isPinch = pinchDist < (pinchActiveRef.current ? PINCH_OFF_THRESHOLD : PINCH_ON_THRESHOLD);
    pinchActiveRef.current = isPinch;

    // Normalized cursor (mirror for natural feel)
    const x = 1 - indexTip.x;
    const y = indexTip.y;

    let gesture = 'none';

    // 1. Pinch Drag
    if (isPinch) {
      gesture = 'pinch_drag';
    }

    // 2. Two-hand Zoom (Normal: Farther -> Zoom In, Closer -> Zoom Out)
    // Condition: Both hands visible & Both pinching
    if (results.landmarks.length >= 2) {
      const other = results.landmarks[1 - primaryIdx];
      const otherPinchDist = distance(other[THUMB_TIP], other[INDEX_TIP]);
      const isOtherPinch = otherPinchDist < PINCH_OFF_THRESHOLD;

      if (isPinch && isOtherPinch) {
        gesture = 'zoom';
        const dHands = distance(indexTip, other[INDEX_TIP]);
        
        if (twoHandBaselineRef.current == null) {
          twoHandBaselineRef.current = dHands;
        }

        if (twoHandBaselineRef.current > 1e-6) {
          // Normal Logic:
          // Distance Increase -> Scale Increase
          // ratio = current / prev
          const ratio = dHands / twoHandBaselineRef.current;
          
          // Higher zoom sensitivity (requested)
          const dampedRatio = 1 + (ratio - 1) * ZOOM_SENSITIVITY;
          
          cumulativeZoomRef.current *= dampedRatio;
          cumulativeZoomRef.current = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, cumulativeZoomRef.current));
        }
        twoHandBaselineRef.current = dHands;
      } else {
        twoHandBaselineRef.current = null;
      }
    } else {
      twoHandBaselineRef.current = null;
    }

    setHandState({
      active: true,
      x,
      y,
      gesture,
      zoom_scale: cumulativeZoomRef.current
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setHandState(null);
      setError(null);
      setStatus('idle');
      twoHandBaselineRef.current = null;
      cumulativeZoomRef.current = 1;
      pinchActiveRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setError(null);

    (async () => {
      try {
        const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const resolver = await FilesetResolver.forVisionTasks(WASM_BASE);
        const handLandmarker = await HandLandmarker.createFromOptions(resolver, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: 'video',
          numHands: 2
        });
        if (cancelled) return;
        handLandmarkerRef.current = handLandmarker;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.play().catch(() => {});
        }
        setStatus('ready');

        const loop = () => {
          if (cancelled) return;
          if (videoRef.current && videoRef.current.readyState >= 2) {
            processFrame(videoRef.current);
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Camera or hand model failed');
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [enabled, processFrame]);

  return { handState, videoRef, error, status };
}
