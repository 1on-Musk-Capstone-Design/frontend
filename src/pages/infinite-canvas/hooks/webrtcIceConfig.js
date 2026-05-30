export const buildWebRtcIceConfig = () => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  const turnUrlsRaw = import.meta.env.VITE_WEBRTC_TURN_URLS;
  const turnUsername = import.meta.env.VITE_WEBRTC_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL;
  const iceTransportPolicy = import.meta.env.VITE_WEBRTC_ICE_TRANSPORT_POLICY;

  if (turnUrlsRaw) {
    const turnUrls = turnUrlsRaw
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    if (turnUrls.length > 0) {
      const turnServer = {
        urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls
      };

      if (turnUsername) {
        turnServer.username = turnUsername;
      }

      if (turnCredential) {
        turnServer.credential = turnCredential;
      }

      iceServers.push(turnServer);
    }
  }

  const config = { iceServers };

  if (iceTransportPolicy === 'relay' || iceTransportPolicy === 'all') {
    config.iceTransportPolicy = iceTransportPolicy;
  }

  return config;
};
