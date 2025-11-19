import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './Sidebar.module.css'
import { API_BASE_URL } from '../../../../config/api'

interface SidebarProps {
  activeMenu?: string
}

interface UserInfo {
  id: number
  email: string
  name: string
  profileImage: string | null
}

const menuItems = [
  { key: 'home', label: '홈' },
  { key: 'account', label: '내 계정' },
  { key: 'all_files', label: '모든 파일' },
  { key: 'shared', label: '공유 문서' },
  { key: 'team', label: '팀 프로젝트' },
]

// 사용자 이름에서 이니셜 추출 함수
function getInitials(name: string): string {
  if (!name) return 'U'
  
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    // 이름과 성이 모두 있으면 각각의 첫 글자
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  } else if (parts.length === 1) {
    // 한 단어면 첫 두 글자
    return parts[0].substring(0, 2).toUpperCase()
  }
  return 'U'
}

export default function Sidebar({ activeMenu = 'home' }: SidebarProps) {
  const [userName, setUserName] = useState<string>('사용자')
  const [userInitials, setUserInitials] = useState<string>('U')
  const [profileImage, setProfileImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        if (!accessToken) {
          // 토큰이 없으면 localStorage에서 기본 정보 사용
          const storedName = localStorage.getItem('userName')
          if (storedName) {
            setUserName(storedName)
            setUserInitials(getInitials(storedName))
          }
          return
        }

        const res = await axios.get<UserInfo>(
          `${API_BASE_URL}/v1/users/me`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

        // 사용자 정보 설정
        if (res.data.name) {
          setUserName(res.data.name)
          setUserInitials(getInitials(res.data.name))
        }
        
        if (res.data.profileImage) {
          setProfileImage(res.data.profileImage)
        }

        // localStorage에도 저장 (다른 곳에서 사용할 수 있도록)
        if (res.data.name) {
          localStorage.setItem('userName', res.data.name)
        }
        if (res.data.email) {
          localStorage.setItem('userEmail', res.data.email)
        }
      } catch (err) {
        console.error('사용자 정보 불러오기 실패', err)
        // 실패 시 localStorage에서 기본 정보 사용
        const storedName = localStorage.getItem('userName')
        if (storedName) {
          setUserName(storedName)
          setUserInitials(getInitials(storedName))
        }
      }
    }

    fetchUserInfo()
  }, [])

  return (
    <aside className={styles.sidebar} aria-label="사이드바">
      <div className={styles.profile}>
        <div className={styles.avatar}>
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={userName}
              className={styles.avatarImage}
            />
          ) : (
            userInitials
          )}
        </div>
        <div>
          <div className={styles.name}>{userName}</div>
          <div className={styles.meta}>프로필</div>
        </div>
      </div>

      <nav className={styles.nav} aria-label="주 네비게이션">
        <ul>
          {menuItems.map((m) => {
            const active = m.key === activeMenu
            return (
              <li key={m.key}>
                <a href="#" className={`${styles.link} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
                  <span className={styles.icon}>{m.label[0]}</span>
                  <span>{m.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <button
          onClick={() => {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('userName')
            localStorage.removeItem('userEmail')
            window.location.href = '/'
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            color: '#6b7280',
            border: '1px solid rgba(15,23,42,0.06)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 180ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8f9fa'
            e.currentTarget.style.color = '#111827'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#6b7280'
          }}
        >
          로그아웃
        </button>
        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#9ca3af' }}>버전 1.0</div>
      </div>
    </aside>
  )
}
