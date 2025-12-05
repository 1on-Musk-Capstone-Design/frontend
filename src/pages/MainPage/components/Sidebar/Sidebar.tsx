import { useState, useEffect } from 'react'

import styles from './Sidebar.module.css'

import {
  LayoutDashboard,
  Bell,
  Star,
  Trash2,
  Settings,
  LogOut
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../../../../config/api'

interface SidebarProps {
  activeMenu?: string
  unreadNotifications?: boolean
}

interface UserInfo {
  id: number
  email: string
  name: string
  profileImage: string | null
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

export default function Sidebar({ activeMenu = 'home', unreadNotifications = false }: SidebarProps) {
  const [userName, setUserName] = useState<string>('사용자')
  const [userInitials, setUserInitials] = useState<string>('U')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<boolean>(false)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        if (!accessToken) {
          // 토큰이 없으면 localStorage에서 기본 정보 사용
          const storedName = localStorage.getItem('userName')
          const storedPhoto = localStorage.getItem('userPhotoURL')
          if (storedName) {
            setUserName(storedName)
            setUserInitials(getInitials(storedName))
          }
          if (storedPhoto) {
            setProfileImage(storedPhoto)
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
          // 절대/상대 경로 정규화
          const url = res.data.profileImage
          let normalized = url
          if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            normalized = url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`
          }
          setProfileImage(normalized)
          localStorage.setItem('userPhotoURL', normalized)
        }

        // localStorage에도 저장 (다른 곳에서 사용할 수 있도록)
        if (res.data.name) {
          localStorage.setItem('userName', res.data.name)
        }
        if (res.data.email) {
          localStorage.setItem('userEmail', res.data.email)
        }
      } catch (err: any) {
        console.error('사용자 정보 불러오기 실패', err)
        // axios 오류인지 확인
        const isAxiosError = err?.isAxiosError || err?.response !== undefined || err?.request !== undefined
        const status = err?.response?.status

        // 401 또는 403 오류인 경우 토큰 제거
        if (isAxiosError && (status === 401 || status === 403)) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('userName')
          localStorage.removeItem('userEmail')
          // 페이지 새로고침하여 MainPage의 모달이 표시되도록 함
          window.location.reload()
        } else {
          // 실패 시 localStorage에서 기본 정보 사용
          const storedName = localStorage.getItem('userName')
          if (storedName) {
            setUserName(storedName)
            setUserInitials(getInitials(storedName))
          }
        }
      }
    }

    fetchUserInfo()

    // 로컬 스토리지 변경(설정 페이지에서 저장) 시 실시간 반영
    const onStorage = (e: StorageEvent) => {
      try {
        if (e.key === 'userName' && e.newValue) {
          setUserName(e.newValue)
          setUserInitials(getInitials(e.newValue))
        }
        if (e.key === 'userPhotoURL') {
          setProfileImage(e.newValue)
          setImageError(false)
        }
      } catch {}
    }
    const onCustomUpdate = () => {
      const storedName = localStorage.getItem('userName')
      const storedPhoto = localStorage.getItem('userPhotoURL')
      if (storedName) {
        setUserName(storedName)
        setUserInitials(getInitials(storedName))
      }
      if (storedPhoto) {
        setProfileImage(storedPhoto)
        setImageError(false)
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('user-profile-updated', onCustomUpdate as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('user-profile-updated', onCustomUpdate as EventListener)
    }
  }, [])

  // 메뉴 정의 (상단)
  const topMenus = [
    { key: 'home', label: '홈', icon: LayoutDashboard, href: '/' },
    { key: 'notifications', label: '알림', icon: Bell, href: '/notifications', badge: unreadNotifications },
    { key: 'starred', label: '즐겨찾기', icon: Star, href: '/starred' },
  ]

  const navigate = useNavigate()

  // 실제 로그아웃 처리 함수
  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    navigate('/auth', { replace: true })
  }

  return (
    <aside className={styles.sidebar} aria-label="사이드바">
      {/* 프로필 영역 */}
      <div className={styles.profile}>
        <div className={styles.avatar}>
          {profileImage && !imageError ? (
            <img
              src={profileImage}
              alt={userName}
              className={styles.avatarImage}
              onError={() => {
                setImageError(true)
              }}
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

      <nav className="flex flex-col flex-1" aria-label="사이드바 메뉴">
        <ul className="flex flex-col gap-1">
          {topMenus.map(item => {
            const active = activeMenu === item.key
            const Icon = item.icon as (typeof LayoutDashboard) | undefined

            return (
              <li key={item.key}>
                <Link
                  to={item.href || '#'}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${active ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {Icon && <Icon size={20} className={active ? 'text-green-600' : 'text-gray-400'} />}
                  <span>{item.label}</span>
                  {item.key === 'notifications' && (item as any).badge ? (
                    <span className="ml-auto block w-2 h-2 bg-red-500 rounded-full" />
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* 하단 섹션: 휴지통, 설정, 로그아웃 */}
        <div className="mt-auto border-t border-gray-200 pt-4 pb-2 flex flex-col gap-1">
          {/* 휴지통 메뉴 */}
          <Link
            to="/trash"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeMenu === 'trash' ? 'bg-red-50 text-red-600' : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'}`}
            aria-current={activeMenu === 'trash' ? 'page' : undefined}
          >
            <Trash2 size={20} className={activeMenu === 'trash' ? 'text-red-600' : 'text-gray-400'} />
            <span>휴지통</span>
          </Link>

          {/* 설정 메뉴 */}
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeMenu === 'settings' ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'}`}
            aria-current={activeMenu === 'settings' ? 'page' : undefined}
          >
            <Settings size={20} className={activeMenu === 'settings' ? 'text-green-600' : 'text-gray-400'} />
            <span>설정</span>
          </Link>

          {/* 로그아웃 버튼 */}
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

