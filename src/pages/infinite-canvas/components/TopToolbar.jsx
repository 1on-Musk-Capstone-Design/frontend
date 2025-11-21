import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOOLBAR_CONSTANTS } from '../constants';

const TopToolbar = ({ 
  projectName = '프로젝트',
  participants = [],
  inviteLink = '',
  onCopyInviteLink,
  onGenerateInviteLink
}) => {
  const navigate = useNavigate();
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const [isParticipantsDropdownOpen, setIsParticipantsDropdownOpen] = useState(false);
  const shareDropdownRef = useRef(null);
  const participantsDropdownRef = useRef(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target) && 
          !event.target.closest('.topToolbarInviteButton')) {
        if (isShareDropdownOpen) {
          setIsShareDropdownOpen(false);
        }
      }
      if (participantsDropdownRef.current && !participantsDropdownRef.current.contains(event.target) && 
          !event.target.closest('.topToolbarParticipantsButton')) {
        if (isParticipantsDropdownOpen) {
          setIsParticipantsDropdownOpen(false);
        }
      }
    };

    if (isShareDropdownOpen || isParticipantsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareDropdownOpen, isParticipantsDropdownOpen]);

  const handleGoToMain = () => {
    navigate('/');
  };

  return (
    <div 
      className="topToolbar"
      style={{
        position: 'fixed',
        top: `${TOOLBAR_CONSTANTS.BOTTOM_OFFSET}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: TOOLBAR_CONSTANTS.Z_INDEX,
        willChange: 'transform',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        backgroundColor: '#ffffff',
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* 메인으로 돌아가기 버튼 */}
      <button
        onClick={handleGoToMain}
        className="toolbarButton"
        title="메인 화면으로 돌아가기"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </button>

      {/* 구분선 */}
      <div className="toolbarDivider"></div>

      {/* 프로젝트 이름 (짧게 표시) */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: '#1a1a1a',
          padding: '0 8px',
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={projectName}
      >
        {projectName}
      </div>

      {/* 구분선 */}
      <div className="toolbarDivider"></div>

      {/* 참가자 목록 버튼 */}
      <div style={{ position: 'relative' }}>
        <button
          className="toolbarButton topToolbarParticipantsButton"
          onClick={() => {
            setIsParticipantsDropdownOpen(!isParticipantsDropdownOpen);
            setIsShareDropdownOpen(false);
          }}
          title={`참가자 ${participants.length}명`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </button>

        {/* 참가자 목록 드롭다운 */}
        {isParticipantsDropdownOpen && (
          <div 
            ref={participantsDropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '8px',
              minWidth: '200px',
              maxWidth: '300px',
              zIndex: 10001,
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b6b6b', marginBottom: '8px', textTransform: 'uppercase' }}>
              참가자 ({participants.length}명)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {participants.length === 0 ? (
                <div style={{ padding: '8px', fontSize: '12px', color: '#6b6b6b', textAlign: 'center' }}>
                  참가자가 없습니다
                </div>
              ) : (
                participants.map((participant) => (
                  <div
                    key={participant.id}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#1a1a1a',
                      backgroundColor: participant.isCurrentUser ? '#f0f0f0' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: participant.isCurrentUser ? 'var(--theme-primary)' : '#6b6b6b',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {participant.name || participant.id}
                    </span>
                    {participant.isCurrentUser && (
                      <span style={{ fontSize: '10px', color: '#6b6b6b', flexShrink: 0 }}>(나)</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="toolbarDivider"></div>

      {/* 초대 버튼 */}
      <div style={{ position: 'relative' }}>
        <button
          className="toolbarButton topToolbarInviteButton"
          onClick={() => {
            setIsShareDropdownOpen(!isShareDropdownOpen);
            setIsParticipantsDropdownOpen(false);
          }}
          title="초대하기"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </button>

        {/* 초대 드롭다운 */}
        {isShareDropdownOpen && (
          <div 
            ref={shareDropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '8px',
              minWidth: '250px',
              zIndex: 10001
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b6b6b', marginBottom: '8px', textTransform: 'uppercase' }}>
              초대 링크
            </div>
            {!inviteLink ? (
              <button
                onClick={onGenerateInviteLink}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--theme-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--theme-primary-hover)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--theme-primary)'}
              >
                초대 링크 생성
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '4px',
                    fontSize: '11px',
                    backgroundColor: '#f8f8f8',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={onCopyInviteLink}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'var(--theme-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--theme-primary-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--theme-primary)'}
                >
                  복사
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopToolbar;

