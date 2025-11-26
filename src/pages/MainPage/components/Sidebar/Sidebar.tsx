import { useState, useEffect } from 'react'
import styles from './Sidebar.module.css'
import {
  LayoutDashboard,
  Bell,
  Star,
  FolderOpen,
  Users,
  Trash2,
  Settings,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  activeMenu?: string
  unreadNotifications?: boolean
}

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

import { useNavigate, Link } from 'react-router-dom';

export default function Sidebar({ activeMenu = 'home', unreadNotifications = false }: SidebarProps) {
  // TODO: 사용자 정보 fetch 및 프로필 구현은 기존과 동일하게 유지 (생략)
  // 임시 프로필
  const userName = '사용자'
  const userInitials = 'U'
  const profileImage = null

  // 메뉴 정의 (상단 통합)
  const topMenus = [
    { key: 'home', label: '홈', icon: LayoutDashboard, href: '/' },
    { key: 'notifications', label: '알림', icon: Bell, href: '/notifications', badge: unreadNotifications },
    { key: 'starred', label: '즐겨찾기', icon: Star, href: '/starred' },
    { key: 'divider', isDivider: true }, // 구분선 추가
    { key: 'trash', label: '휴지통', icon: Trash2, href: '/trash' },
    { key: 'settings', label: '설정', icon: Settings, href: '/settings' },
  ]

  const navigate = useNavigate();

  // 실제 로그아웃 처리 함수
  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/auth', { replace: true });
  }

  return (
    <aside className={styles.sidebar} aria-label="사이드바">
      <div className={styles.profile}>
        <div className={styles.avatar}>
          {profileImage ? (
            <img src={profileImage} alt={userName} className={styles.avatarImage} />
          ) : (
            userInitials
          )}
        </div>
        <div>
          <div className={styles.name}>{userName}</div>
          <div className={styles.meta}>프로필</div>
        </div>
      </div>
      <nav className="flex flex-col flex-1" aria-label="사이드바 메뉴">
        <ul className="flex flex-col gap-1">
          {topMenus.map(item => {
            // 구분선 처리
            if (item.isDivider) {
              return <li key={item.key} className="my-2 border-t border-gray-200" />
            }
            const active = activeMenu === item.key
            const Icon = item.icon
            return (
              <li key={item.key}>
                <Link
                  to={item.href || '#'}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${active ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {Icon && <Icon size={20} className={active ? 'text-green-600' : 'text-gray-400'} />}
                  <span>{item.label}</span>
                  {item.key === 'notifications' && item.badge ? (
                    <span className="ml-auto block w-2 h-2 bg-red-500 rounded-full" />
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
        {/* 로그아웃 버튼만 최하단에 고정 */}
        <div className="mt-auto border-t border-gray-200 pt-4 pb-2">
          <button
            type="button"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-gray-700 w-full hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut size={20} className="text-gray-400" />
            <span>로그아웃</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}
