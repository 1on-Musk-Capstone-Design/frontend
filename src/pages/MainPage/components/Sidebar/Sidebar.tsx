import React from 'react'
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

export default function Sidebar({ activeMenu = 'home' }: SidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="사이드바">
      <div className={styles.profile}>
        <div className={styles.avatar}>JC</div>
        <div>
          <div className={styles.name}>Jae Choi</div>
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
