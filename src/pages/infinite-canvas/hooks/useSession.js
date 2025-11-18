import { useState, useEffect, useRef } from 'react';

/**
 * 세션 관리 훅
 * 초대 링크 생성, 참가자 관리 등을 담당
 */
export const useSession = () => {
  const [sessionId, setSessionId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [inviteLink, setInviteLink] = useState('');
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const currentUserId = useRef(`user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // URL에서 세션 ID 가져오기 또는 새로 생성
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSessionId = urlParams.get('session');
    
    if (urlSessionId) {
      // URL에 세션 ID가 있으면 해당 세션에 참가
      setSessionId(urlSessionId);
      joinSession(urlSessionId);
    } else {
      // 세션 ID가 없으면 새로 생성
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      createSession(newSessionId);
    }
  }, []);

  // 세션 ID 생성
  const generateSessionId = () => {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // 새 세션 생성
  const createSession = async (sessionId) => {
    // TODO: API 호출로 세션 생성
    // const response = await fetch(`/api/sessions`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ sessionId, userId: currentUserId.current })
    // });
    
    // 현재 사용자를 참가자로 추가
    setParticipants([{
      id: currentUserId.current,
      name: '나',
      isCurrentUser: true
    }]);
    
    // 초대 링크 생성
    const link = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
    setInviteLink(link);
  };

  // 세션 참가
  const joinSession = async (sessionId) => {
    // TODO: API 호출로 세션 참가
    // const response = await fetch(`/api/sessions/${sessionId}/join`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId: currentUserId.current })
    // });
    
    // 현재 사용자를 참가자로 추가
    setParticipants(prev => {
      const exists = prev.some(p => p.id === currentUserId.current);
      if (exists) return prev;
      return [...prev, {
        id: currentUserId.current,
        name: '나',
        isCurrentUser: true
      }];
    });
  };

  // 초대 링크 복사
  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert('초대 링크가 클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('링크 복사 실패:', err);
      // 폴백: 텍스트 선택
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('초대 링크가 클립보드에 복사되었습니다!');
    }
  };

  // 참가자 추가 (다른 사용자가 참가했을 때)
  const addParticipant = (participant) => {
    setParticipants(prev => {
      const exists = prev.some(p => p.id === participant.id);
      if (exists) return prev;
      return [...prev, participant];
    });
  };

  // 참가자 제거
  const removeParticipant = (participantId) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  return {
    sessionId,
    participants,
    inviteLink,
    isShareDropdownOpen,
    setIsShareDropdownOpen,
    copyInviteLink,
    addParticipant,
    removeParticipant,
    currentUserId: currentUserId.current
  };
};

