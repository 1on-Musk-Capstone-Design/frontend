import { useMemo, useState, useEffect, useRef } from 'react'
import { Folder } from 'lucide-react'
import { Client } from '@stomp/stompjs'
// @ts-ignore - sockjs-client 타입 정의 없음
import SockJS from 'sockjs-client'
import axios from 'axios'
import { SOCKET_SERVER_URL, API_BASE_URL } from '../../config/api'
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

// localStorage에서 알림 불러오기
const loadNotificationsFromStorage = (): Notification[] => {
  try {
    const stored = localStorage.getItem('notifications')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Date 객체 복원
      return parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }))
    }
  } catch (e) {
    console.error('[알림] localStorage에서 알림 불러오기 실패:', e)
  }
  return []
}

// localStorage에 알림 저장
const saveNotificationsToStorage = (notifications: Notification[]) => {
  try {
    localStorage.setItem('notifications', JSON.stringify(notifications))
  } catch (e) {
    console.error('[알림] localStorage에 알림 저장 실패:', e)
  }
}

export default function NotificationPage(): JSX.Element {
  const [currentUserImage, setCurrentUserImage] = useState<string>('')
  const [notifications, setNotifications] = useState<Notification[]>(loadNotificationsFromStorage)
  const [workspaces, setWorkspaces] = useState<Array<{ workspaceId: number; name: string }>>([])
  const clientRef = useRef<Client | null>(null)
  const subscriptionsRef = useRef<Array<{ path: string; subscription: any }>>([])
  const workspaceMapRef = useRef<Map<number, string>>(new Map())

  // 사용자 프로필 이미지 로드
  useEffect(() => {
    const userImage = localStorage.getItem('userImage')
    if (userImage) {
      setCurrentUserImage(userImage)
    }
  }, [])

  // 워크스페이스 목록 불러오기
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        if (!accessToken) {
          console.warn('[알림] 로그인이 필요합니다.')
          return
        }

        console.log('[알림] 워크스페이스 목록 불러오기 시작')
        const res = await axios.get<Array<{ workspaceId: number; name: string }>>(
          `${API_BASE_URL}/v1/workspaces`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

        console.log('[알림] 워크스페이스 목록 불러오기 완료:', res.data.length, '개')
        setWorkspaces(res.data)
        // 워크스페이스 ID -> 이름 매핑 저장
        const map = new Map<number, string>()
        res.data.forEach(ws => {
          map.set(ws.workspaceId, ws.name)
          console.log('[알림] 워크스페이스 매핑:', ws.workspaceId, '->', ws.name)
        })
        workspaceMapRef.current = map
      } catch (err) {
        console.error('[알림] 워크스페이스 목록 불러오기 실패:', err)
      }
    }

    fetchWorkspaces()
    
    // 주기적으로 워크스페이스 목록 갱신 (30초마다)
    const interval = setInterval(() => {
      fetchWorkspaces()
    }, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  // WebSocket 구독 설정
  useEffect(() => {
    if (workspaces.length === 0) {
      console.log('[알림 웹소켓] 워크스페이스 목록이 비어있어 구독을 건너뜁니다.')
      return
    }

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      console.log('[알림 웹소켓] 액세스 토큰이 없어 구독을 건너뜁니다.')
      return
    }

    console.log('[알림 웹소켓] 구독 설정 시작 - 워크스페이스 개수:', workspaces.length)
    workspaces.forEach(ws => {
      console.log('[알림 웹소켓] 워크스페이스:', ws.workspaceId, ws.name)
    })

    // 기존 연결이 있으면 정리
    if (clientRef.current) {
      console.log('[알림 웹소켓] 기존 연결 정리 시작')
      if (clientRef.current.connected) {
        subscriptionsRef.current.forEach(sub => {
          try {
            sub.subscription.unsubscribe()
            console.log('[알림 웹소켓] 구독 해제:', sub.path)
          } catch (e) {
            console.error('[알림 웹소켓] 구독 해제 오류:', e)
          }
        })
        subscriptionsRef.current = []
      }
      try {
        clientRef.current.deactivate()
        console.log('[알림 웹소켓] 기존 연결 비활성화 완료')
      } catch (e) {
        console.error('[알림 웹소켓] 연결 해제 오류:', e)
      }
    }

    // STOMP 클라이언트 생성
    const socketUrl = `${SOCKET_SERVER_URL}/ws`
    console.log('[알림 웹소켓] 소켓 URL:', socketUrl)
    const socket = new SockJS(socketUrl)
    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('[알림 웹소켓] STOMP 디버그:', str)
      },
      onConnect: (frame) => {
        console.log('[알림 웹소켓] 연결 성공:', frame)
        console.log('[알림 웹소켓] 연결된 워크스페이스 개수:', workspaces.length)

        // 각 워크스페이스에 대해 알림 구독
        workspaces.forEach(workspace => {
          const subscriptionPath = `/topic/workspace/${workspace.workspaceId}/users`
          console.log('[알림 웹소켓] 구독 시작:', subscriptionPath)

          try {
            const subscription = stompClient.subscribe(subscriptionPath, (message) => {
              console.log('[알림 웹소켓] 알림 수신:', message.body)
              
              try {
                let data: any
                let messageText: string = ''
                
                // 메시지가 JSON 형식인지 확인
                try {
                  data = JSON.parse(message.body)
                  messageText = data.message || message.body
                } catch {
                  // JSON이 아니면 문자열로 처리
                  messageText = message.body
                  data = { message: messageText }
                }
                
                console.log('[알림 웹소켓] 파싱된 데이터:', data)
                console.log('[알림 웹소켓] 메시지 텍스트:', messageText)

                // 현재 사용자 ID 추출
                let currentUserId: string | null = null
                try {
                  const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]))
                  currentUserId = String(tokenPayload.user_id || tokenPayload.sub)
                } catch (e) {
                  console.warn('JWT 토큰 파싱 실패:', e)
                }

                // 자신이 발생시킨 이벤트는 무시
                if (data.userId && String(data.userId) === currentUserId) {
                  console.log('[알림 웹소켓] 자신의 이벤트 무시')
                  return
                }

                // 알림 타입 확인
                let notificationType = data.type
                if (!notificationType) {
                  // 메시지 내용으로 타입 추론
                  if (messageText.includes('참여') || messageText.includes('입장')) {
                    notificationType = 'user_joined'
                  } else if (messageText.includes('떠났') || messageText.includes('나갔') || messageText.includes('퇴장') || messageText.includes('제거')) {
                    notificationType = 'user_left'
                  } else {
                    // 기본값: 메시지가 있으면 참여로 간주
                    notificationType = 'user_joined'
                  }
                }
                const isEnter = notificationType === 'user_joined' || notificationType === 'enter'

                // 워크스페이스 이름 가져오기
                const workspaceName = workspaceMapRef.current.get(workspace.workspaceId) || workspace.name || '알 수 없는 프로젝트'
                
                // 사용자 이름 추출 (백엔드에서 JSON으로 보내면 우선 사용)
                let userName = data.userName || data.name
                if (!userName || userName === '알 수 없는 사용자') {
                  // 메시지에서 사용자 이름 추출 시도
                  // "사용자 {name}가 워크스페이스에 참여했습니다." 형식
                  // "사용자 {name}가 워크스페이스를 떠났습니다." 형식
                  // "사용자 {name}가 워크스페이스에서 제거되었습니다." 형식
                  const match = messageText.match(/사용자\s+([^가님이]+?)(?:가|님이)/)
                  if (match) {
                    userName = match[1].trim()
                  } else {
                    // "사용자 {name}가" 형식 (더 넓은 범위)
                    const match2 = messageText.match(/사용자\s+([^가]+)가/)
                    if (match2) {
                      userName = match2[1].trim()
                    } else {
                      // "{name}님이" 형식
                      const match3 = messageText.match(/([^님이]+)님이/)
                      if (match3) {
                        userName = match3[1].trim()
                      } else {
                        console.warn('[알림 웹소켓] 사용자 이름 추출 실패, 메시지:', messageText)
                        userName = '알 수 없는 사용자'
                      }
                    }
                  }
                }
                
                console.log('[알림 웹소켓] 추출된 사용자 이름:', userName, '원본 메시지:', messageText)

                // 새 알림 생성
                const newNotification: Notification = {
                  id: `${workspace.workspaceId}-${Date.now()}-${Math.random()}`,
                  projectName: workspaceName,
                  userName: userName,
                  timestamp: new Date(),
                  type: isEnter ? 'enter' : 'leave',
                  isRead: false
                }

                // 알림 목록에 추가 (항상 추가, 중복 방지는 타임스탬프 기반으로만)
                setNotifications(prev => {
                  // 같은 워크스페이스, 같은 사용자, 같은 타입의 매우 최근 알림(1초 이내)만 무시
                  const veryRecent = prev.find(n => 
                    n.projectName === newNotification.projectName &&
                    n.userName === newNotification.userName &&
                    n.type === newNotification.type &&
                    Math.abs(newNotification.timestamp.getTime() - n.timestamp.getTime()) < 1000 // 1초 이내
                  )
                  if (veryRecent) {
                    console.log('[알림 웹소켓] 매우 최근 중복 알림 무시 (1초 이내)')
                    return prev
                  }
                  console.log('[알림 웹소켓] 새 알림 추가:', newNotification)
                  const updated = [newNotification, ...prev]
                  // localStorage에 저장
                  saveNotificationsToStorage(updated)
                  return updated
                })
              } catch (e) {
                console.error('[알림 웹소켓] 메시지 파싱 오류:', e)
                console.error('[알림 웹소켓] 원본 body:', message.body)
              }
            })

            subscriptionsRef.current.push({ path: subscriptionPath, subscription })
            console.log('[알림 웹소켓] 구독 완료:', subscriptionPath, '구독 ID:', subscription.id)
          } catch (subscribeError) {
            console.error('[알림 웹소켓] 구독 오류:', subscriptionPath, subscribeError)
          }
        })
        
        console.log('[알림 웹소켓] 총 구독 개수:', subscriptionsRef.current.length)
        subscriptionsRef.current.forEach(sub => {
          console.log('[알림 웹소켓] 활성 구독:', sub.path)
        })
      },
      onStompError: (frame) => {
        console.error('[알림 웹소켓] STOMP 오류:', frame)
        console.error('[알림 웹소켓] STOMP 오류 상세:', {
          command: frame.command,
          headers: frame.headers,
          body: frame.body
        })
      },
      onWebSocketClose: (event) => {
        console.log('[알림 웹소켓] WebSocket 연결 해제:', event)
        console.log('[알림 웹소켓] 종료 코드:', event.code, '이유:', event.reason)
      },
      onDisconnect: () => {
        console.log('[알림 웹소켓] STOMP 연결 끊김')
      },
      onWebSocketError: (event) => {
        console.error('[알림 웹소켓] WebSocket 오류:', event)
      }
    })

    clientRef.current = stompClient
    console.log('[알림 웹소켓] STOMP 클라이언트 활성화 시작')
    stompClient.activate()

    // 정리 함수
    return () => {
      console.log('[알림 웹소켓] 정리 시작')
      subscriptionsRef.current.forEach(sub => {
        try {
          sub.subscription.unsubscribe()
        } catch (e) {
          console.error('구독 해제 오류:', e)
        }
      })
      subscriptionsRef.current = []
      
      if (clientRef.current) {
        try {
          clientRef.current.deactivate()
        } catch (e) {
          console.error('WebSocket 연결 해제 오류:', e)
        }
        clientRef.current = null
      }
    }
  }, [workspaces])

  // 알림 클릭 시 읽음 처리
  const handleNotificationClick = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
      // localStorage에 저장
      saveNotificationsToStorage(updated)
      return updated
    })
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
