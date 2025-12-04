import styles from './Sidebar.module.css'
import {
  LayoutDashboard,
  Bell,
  Star,
  Settings,
  LogOut,
  Trash2
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

interface SidebarProps {
  activeMenu?: string
  unreadNotifications?: boolean
}

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
  ]

  const navigate = useNavigate()

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
      <nav className={styles.nav} aria-label="사이드바 메뉴">
        <ul className="flex flex-col gap-1">
          {topMenus.map(item => {
            const active = activeMenu === item.key
            const Icon = item.icon
            if (!Icon) return null
            return (
              <li key={item.key}>
                <a
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${active ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="w-6 h-6 flex items-center justify-center relative">
                    <Icon className={active ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'} size={20} />
                    {item.key === 'notifications' && item.badge ? (
                      <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" style={{ marginLeft: 14, marginTop: -2 }} />
                    ) : null}
                  </span>
                  <span>{item.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
        {/* 하단 Footer Section */}
        <div className="mt-auto border-t pt-2 pb-4 px-2 flex flex-col gap-1">
          {/* 휴지통 메뉴 */}
          <Link
            to="/trash"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeMenu === 'trash' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'}`}
            aria-current={activeMenu === 'trash' ? 'page' : undefined}
          >
            <span className="w-6 h-6 flex items-center justify-center">
              <Trash2 className={activeMenu === 'trash' ? 'text-red-600' : 'text-gray-400 group-hover:text-red-600'} size={20} />
            </span>
            <span>휴지통</span>
          </Link>
          {/* 설정 메뉴 */}
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeMenu === 'settings' ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'}`}
            aria-current={activeMenu === 'settings' ? 'page' : undefined}
          >
            <span className="w-6 h-6 flex items-center justify-center">
              <Settings className={activeMenu === 'settings' ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'} size={20} />
            </span>
            <span>설정</span>
          </Link>
          {/* 로그아웃 버튼 */}
          <button
            type="button"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-gray-700 mt-1 hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
          >
            <span className="w-6 h-6 flex items-center justify-center">
              <LogOut className="text-gray-400 group-hover:text-red-600" size={20} />
            </span>
            <span>로그아웃</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}

