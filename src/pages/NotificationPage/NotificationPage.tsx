import { useMemo, useState, useEffect } from 'react'
import { Folder } from 'lucide-react'
import Sidebar from '../MainPage/components/Sidebar/Sidebar'
import styles from './NotificationPage.module.css'

// 알림 데이터 타입
interface Notification {
  id: string
  projectName: string
  userName: string
  timestamp: Date
  type: 'enter' | 'leave'
  isRead: boolean
  userImage?: string
}

// 더미 데이터
const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    projectName: '2024 마케팅 기획',
    userName: '김철수',
    timestamp: new Date(Date.now() - 5 * 60000),
    type: 'enter',
    isRead: false
  },
  {
    id: '2',
    projectName: '제품 기획안',
    userName: '이영희',
    timestamp: new Date(Date.now() - 12 * 60000),
    type: 'leave',
    isRead: false
  },
  {
    id: '3',
    projectName: '디자인 시스템',
    userName: '박민준',
    timestamp: new Date(Date.now() - 25 * 60000),
    type: 'enter',
    isRead: true
  },
  {
    id: '4',
    projectName: '2024 마케팅 기획',
    userName: '정수진',
    timestamp: new Date(Date.now() - 45 * 60000),
    type: 'leave',
    isRead: true
  },
  {
    id: '5',
    projectName: '모바일 앱 개발',
    userName: '이준호',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60000),
    type: 'enter',
    isRead: false
  },
  {
    id: '6',
    projectName: '제품 기획안',
    userName: '강예은',
    timestamp: new Date(Date.now() - 2.5 * 60 * 60000),
    type: 'enter',
    isRead: true
  },
  {
    id: '7',
    projectName: '디자인 시스템',
    userName: '조대운',
    timestamp: new Date(Date.now() - 3 * 60 * 60000),
    type: 'leave',
    isRead: true
  }
]

// 시간 포맷팅 함수
function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric'
  })
}

// 사용자 이니셜 생성
function getUserInitials(name: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  } else if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return 'U'
}

export default function NotificationPage(): JSX.Element {
  const [currentUserImage, setCurrentUserImage] = useState<string>('')
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS)

  // 사용자 프로필 이미지 로드
  useEffect(() => {
    const userImage = localStorage.getItem('userImage')
    if (userImage) {
      setCurrentUserImage(userImage)
    }
  }, [])

  // 알림 클릭 시 읽음 처리
  const handleNotificationClick = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    )
  }

  // 최신순으로 정렬된 알림
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )
  }, [notifications])

  return (
    <div className={styles.pageRoot}>
      <Sidebar activeMenu="notifications" />
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>알림</h1>
            <p className={styles.subtitle}>프로젝트의 활동 알림을 확인하세요.</p>
          </div>
        </div>

        {/* 알림 리스트 */}
        <div className={styles.notificationList}>
          {sortedNotifications.length === 0 ? (
            <div className={styles.emptyState}>
              <p>알림이 없습니다.</p>
            </div>
          ) : (
            sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationCard} ${!notification.isRead ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                {/* 프로필 아바타 */}
                <div className={styles.avatarContainer}>
                  {currentUserImage ? (
                    <img src={currentUserImage} alt={notification.userName} className={styles.avatarImage} />
                  ) : (
                    getUserInitials(notification.userName)
                  )}
                </div>

                {/* 콘텐츠 */}
                <div className={styles.content}>
                  <div className={styles.messageHeader}>
                    <span className={styles.message}>
                      {notification.userName}님이 {notification.type === 'enter' ? '입장했습니다' : '퇴장했습니다'}
                    </span>
                    <span className={`${styles.badge} ${styles[notification.type]}`}>
                      {notification.type === 'enter' ? '입장' : '퇴장'}
                    </span>
                  </div>
                  <div className={styles.projectName}>
                    <Folder size={14} className={styles.folderIcon} />
                    {notification.projectName}
                  </div>
                </div>

                {/* 시간 */}
                <div className={styles.timeContainer}>
                  <div className={styles.time}>{formatTime(notification.timestamp)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
