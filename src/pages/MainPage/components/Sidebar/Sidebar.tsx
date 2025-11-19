import { useState, useEffect } from 'react'
import styles from './Sidebar.module.css'

interface SidebarProps {
  activeMenu?: string
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

  useEffect(() => {
    // localStorage에서 사용자 정보 가져오기
    const storedName = localStorage.getItem('userName')
    if (storedName) {
      setUserName(storedName)
      setUserInitials(getInitials(storedName))
    }
  }, [])

  return (
    <aside className={styles.sidebar} aria-label="사이드바">
      <div className={styles.profile}>
        <div className={styles.avatar}>{userInitials}</div>
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

      <div className={styles.footer}>버전 1.0</div>
    </aside>
  )
}
