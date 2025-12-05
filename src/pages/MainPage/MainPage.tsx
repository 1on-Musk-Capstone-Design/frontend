import { useState, useEffect, useMemo } from 'react'
import { Grid, List as ListIcon, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProjectList from './components/ProjectList/ProjectList'
import Sidebar from './components/Sidebar/Sidebar'
import styles from './MainPage.module.css'
import { Project } from './types'
import Modal from '../../components/Modal/Modal'
import axios from 'axios'
import { API_BASE_URL, normalizeThumbnailUrl } from '../../config/api'

// form state types
interface NewProjectForm {
  name: string
  description?: string
}

// API 응답 타입
interface WorkspaceListItem {
  workspaceId: number
  name: string
}

export default function MainPage(): JSX.Element {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<NewProjectForm>({ name: '', description: '' })
  const [projects, setProjects] = useState<Project[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [projectToInvite, setProjectToInvite] = useState<{ id: string; title: string } | null>(null)
  const [inviteLink, setInviteLink] = useState<string>('')
  const [inviteLinkExpiresAt, setInviteLinkExpiresAt] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  // 정렬 상태 제거
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  // 탭 상태: all | mine | shared
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'shared'>('all')

  // localStorage에서 즐겨찾기 로드
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      try {
        const favoriteIds = JSON.parse(savedFavorites)
        setFavorites(new Set(favoriteIds))
      } catch (e) {
        console.warn('즐겨찾기 로드 실패:', e)
      }
    }
  }, [])

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      // localStorage에 저장
      localStorage.setItem('favorites', JSON.stringify(Array.from(next)))
      return next
    })
  }
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [projectToLeave, setProjectToLeave] = useState<{ id: string; title: string } | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [authExpiredModalOpen, setAuthExpiredModalOpen] = useState(false)

  // 모달 상태 추적 (디버깅용)
  useEffect(() => {
    if (authExpiredModalOpen) {
      console.log('인증 만료 모달이 열렸습니다!')
    }
  }, [authExpiredModalOpen])


  function openModal() {
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setForm({ name: '', description: '' })
    setCreateError(null)
  }

  // 로그인 상태 확인
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    setIsLoggedIn(!!accessToken)
  }, [])

  // 초대 토큰이 있으면 수락 처리 (로그인 후 콜백에서 처리하므로 여기서는 제거)
  // 이 로직은 CallbackPage에서 처리됨

  // 워크스페이스 목록 불러오기
  useEffect(() => {
    const fetchWorkspaces = async () => {
      setLoading(true)
      setLoadError(null)
      
      try {
        const accessToken = localStorage.getItem('accessToken')
        
        if (!accessToken) {
          setLoadError('로그인이 필요합니다.')
          setLoading(false)
          setIsLoggedIn(false)
          setAuthExpiredModalOpen(true)
          return
        }
        
        // accessToken이 있으면 로그인 상태로 설정하고 API 호출 시도
        setIsLoggedIn(true)

        const res = await axios.get<WorkspaceListItem[]>(
          `${API_BASE_URL}/v1/workspaces`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )


        // 현재 사용자 ID 추출
        let currentUserId: string | null = null
        try {
          const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]))
          currentUserId = String(tokenPayload.user_id || tokenPayload.sub)
        } catch (e) {
          console.warn('JWT 토큰 파싱 실패:', e)
        }

        // 각 워크스페이스의 사용자 목록을 병렬로 가져와서 OWNER 찾기
        const workspaceProjectsWithOwners = await Promise.all(
          res.data.map(async (workspace) => {
            let ownerName = '알 수 없음'
            let ownerProfileImage: string | undefined = undefined
            let isOwner = false

            try {
              const usersRes = await axios.get(
                `${API_BASE_URL}/v1/workspaces/${workspace.workspaceId}/users`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`
                  }
                }
              )

              // OWNER 역할을 가진 사용자 찾기
              const owner = usersRes.data.find((user: any) => user.role === 'OWNER')
              if (owner) {
                ownerName = owner.name || owner.email || '알 수 없음'
                
                // profileImage가 유효한 문자열인 경우에만 설정
                if (owner.profileImage && owner.profileImage.trim() !== '') {
                  // 상대 경로인 경우 절대 경로로 변환
                  if (owner.profileImage.startsWith('/')) {
                    ownerProfileImage = `${API_BASE_URL}${owner.profileImage}`
                  } else if (!owner.profileImage.startsWith('http://') && !owner.profileImage.startsWith('https://')) {
                    // 상대 경로인 경우 (http/https로 시작하지 않으면)
                    ownerProfileImage = `${API_BASE_URL}/${owner.profileImage}`
                  } else {
                    ownerProfileImage = owner.profileImage
                  }
                } else {
                  ownerProfileImage = undefined
                }
                
                // 현재 사용자가 OWNER인지 확인
                if (currentUserId && String(owner.id) === currentUserId) {
                  isOwner = true
                }
              } else {
                console.warn(`워크스페이스 ${workspace.workspaceId}에서 OWNER를 찾을 수 없습니다.`)
              }
            } catch (err: any) {
              console.error(`워크스페이스 ${workspace.workspaceId} 사용자 목록 불러오기 실패:`, err)
              // 사용자 목록 조회 중 인증 오류 발생 시에도 처리
              if (err?.response?.status === 401 || err?.response?.status === 403) {
                console.log('사용자 목록 조회 중 인증 오류 감지! 모달 표시 시작')
                setIsLoggedIn(false)
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('userName')
                localStorage.removeItem('userEmail')
                setAuthExpiredModalOpen(true)
                console.log('사용자 목록 조회 중 모달 상태 업데이트 완료')
                // 더 이상 다른 워크스페이스를 처리할 필요 없으므로 중단
                throw err
              }
            }

            // 생성일 포맷팅: /v1/workspaces/{id}에서 createdAt 사용
            let createdAtStr: string = new Date().toLocaleDateString()
            try {
              const wsRes = await axios.get(
                `${API_BASE_URL}/v1/workspaces/${workspace.workspaceId}`,
                {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                }
              )
              const createdSrc = (wsRes.data as any).createdAt || (wsRes.data as any).created_at
              if (createdSrc) {
                const d = new Date(createdSrc)
                createdAtStr = isNaN(d.getTime()) ? new Date().toLocaleDateString() : d.toLocaleDateString()
              }
            } catch (e) {
              // 세부 조회 실패 시 목록의 createdAt 또는 오늘 날짜로 대체
              const fallback = (workspace as any).createdAt || (workspace as any).created_at
              if (fallback) {
                try {
                  const d = new Date(fallback)
                  createdAtStr = isNaN(d.getTime()) ? new Date().toLocaleDateString() : d.toLocaleDateString()
                } catch (_) {
                  createdAtStr = new Date().toLocaleDateString()
                }
              }
            }

            // 썸네일 URL 처리
            let thumbnailUrl = ''
            const rawThumb: string | undefined = (workspace as any).thumbnailUrl
            if (rawThumb) {
              if (rawThumb.startsWith('http://') || rawThumb.startsWith('https://')) {
                thumbnailUrl = rawThumb
              } else if (rawThumb.startsWith('/')) {
                thumbnailUrl = `${API_BASE_URL}${rawThumb}`
              } else {
                thumbnailUrl = `${API_BASE_URL}/${rawThumb}`
              }
              thumbnailUrl = normalizeThumbnailUrl(thumbnailUrl)
            }

            return {
              id: String(workspace.workspaceId),
              title: workspace.name,
              thumbnailUrl,
              lastModified: createdAtStr,
              ownerName,
              ownerProfileImage,
              isOwner,
              isDeleted: false // 백엔드에서 이미 삭제된 것은 제외되므로 항상 false
            }
          })
        )

        setProjects(workspaceProjectsWithOwners)
        
        // 초대 수락 플래그가 있으면 제거 (목록 새로고침 완료)
        if (localStorage.getItem('inviteAccepted') === 'true') {
          localStorage.removeItem('inviteAccepted')
        }
      } catch (err: any) {
        console.error('워크스페이스 목록 불러오기 실패', err)
        
        // axios 오류인지 확인
        const isAxiosError = err?.isAxiosError || err?.response !== undefined || err?.request !== undefined
        const status = err?.response?.status
        
        if (isAxiosError && (status === 401 || status === 403)) {
          // 인증 오류 시 로그아웃 처리 및 모달 표시
          console.log('인증 오류 감지! 모달 표시 시작')
          setIsLoggedIn(false)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('userName')
          localStorage.removeItem('userEmail')
          console.log('setAuthExpiredModalOpen(true) 호출 전')
          setAuthExpiredModalOpen(true)
          console.log('setAuthExpiredModalOpen(true) 호출 후')
        } else {
          setLoadError(err?.response?.data?.message || err?.message || '워크스페이스 목록을 불러오는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }

    // accessToken이 있으면 API 호출 시도, 없으면 모달 표시
    const accessToken = localStorage.getItem('accessToken')
    
    if (accessToken) {
      fetchWorkspaces()
    } else {
      setIsLoggedIn(false)
      setLoading(false)
      // accessToken이 없으면 인증 만료 모달 표시
      setAuthExpiredModalOpen(true)
    }
  }, [])

  // 로그인 핸들러
  const handleLogin = () => {
    window.location.href = '/auth'
  }

  // 인증 만료 모달 닫기 및 로그인 페이지로 이동
  const handleAuthExpiredConfirm = () => {
    setAuthExpiredModalOpen(false)
    window.location.href = '/auth'
  }

  // 로그아웃 핸들러
  // const handleLogout = () => {
  //   localStorage.removeItem('accessToken')
  //   localStorage.removeItem('refreshToken')
  //   localStorage.removeItem('userName')
  //   localStorage.removeItem('userEmail')
  //   setIsLoggedIn(false)
  //   setProjects([])
  //   setLoadError(null)
  // }

  // 워크스페이스 생성
  async function handleCreate() {
    if (!form.name.trim()) return
    setCreating(true)
    setCreateError(null)
    
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const res = await axios.post<{ workspaceId: number; name: string }>(
        `${API_BASE_URL}/v1/workspaces`,
        { 
          name: form.name.trim(),
          role: 'OWNER' // 워크스페이스 생성자는 OWNER
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // 생성된 워크스페이스의 생성일을 상세 API로 조회
      let createdAtStr = new Date().toLocaleDateString()
      try {
        const accessToken2 = localStorage.getItem('accessToken')
        if (accessToken2) {
          const wsRes = await axios.get(
            `${API_BASE_URL}/v1/workspaces/${res.data.workspaceId}`,
            { headers: { 'Authorization': `Bearer ${accessToken2}` } }
          )
          const createdSrc = (wsRes.data as any).createdAt || (wsRes.data as any).created_at
          if (createdSrc) {
            const d = new Date(createdSrc)
            createdAtStr = isNaN(d.getTime()) ? new Date().toLocaleDateString() : d.toLocaleDateString()
          }
        }
      } catch (_) {
        // ignore and keep today
      }

      // 생성된 워크스페이스를 Project 타입으로 변환
      const newProject: Project = {
        id: String(res.data.workspaceId),
        title: res.data.name,
        thumbnailUrl: '',
        lastModified: createdAtStr,
      }

      setProjects((s) => [newProject, ...s])
      closeModal()
    } catch (err: any) {
      console.error('워크스페이스 생성 실패', err)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        // 인증 오류 시 로그아웃 처리 및 모달 표시
        setIsLoggedIn(false)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        closeModal()
        setAuthExpiredModalOpen(true)
      } else {
        setCreateError(
          err?.response?.data?.message || 
          err?.message || 
          '워크스페이스 생성 중 오류가 발생했습니다.'
        )
      }
    } finally {
      setCreating(false)
    }
  }

  // 프로젝트 삭제 핸들러
  function handleDeleteClick(id: string) {
    const project = projects.find((p) => p.id === id)
    if (project) {
      setProjectToDelete({ id, title: project.title })
      setDeleteModalOpen(true)
      setDeleteError(null)
    }
  }

  // 프로젝트 초대 핸들러
  function handleInviteClick(id: string) {
    const project = projects.find((p) => p.id === id)
    if (project) {
      setProjectToInvite({ id, title: project.title })
      setInviteModalOpen(true)
      setInviteLink('')
      setInviteLinkExpiresAt('')
      setInviteError(null)
    }
  }

  // 프로젝트 나가기 핸들러
  function handleLeaveClick(id: string) {
    const project = projects.find((p) => p.id === id)
    if (project) {
      setProjectToLeave({ id, title: project.title })
      setLeaveModalOpen(true)
      setLeaveError(null)
    }
  }

  function closeLeaveModal() {
    setLeaveModalOpen(false)
    setProjectToLeave(null)
    setLeaveError(null)
  }

  // 워크스페이스 나가기 확인
  async function handleLeaveConfirm() {
    if (!projectToLeave) return

    setLeaving(true)
    setLeaveError(null)

    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.')
      }

      // 현재 사용자 ID 추출
      let currentUserId: string | null = null
      try {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]))
        currentUserId = String(tokenPayload.user_id || tokenPayload.sub)
      } catch (e) {
        throw new Error('사용자 정보를 가져올 수 없습니다.')
      }

      if (!currentUserId) {
        throw new Error('사용자 ID를 찾을 수 없습니다.')
      }

      // 워크스페이스에서 사용자 제거
      await axios.delete(
        `${API_BASE_URL}/v1/workspaces/${projectToLeave.id}/users/${currentUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      // 프로젝트 목록에서 제거
      setProjects((s) => s.filter((p) => p.id !== projectToLeave.id))
      closeLeaveModal()
    } catch (err: any) {
      console.error('워크스페이스 나가기 실패', err)
      
      let errorMessage = '워크스페이스 나가기 중 오류가 발생했습니다.'
      
      if (err?.response) {
        const status = err.response.status
        const data = err.response.data
        
        if (status === 401 || status === 403) {
          // 인증 오류 시 로그아웃 처리 및 모달 표시
          setIsLoggedIn(false)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('userName')
          localStorage.removeItem('userEmail')
          closeLeaveModal()
          setAuthExpiredModalOpen(true)
          return
        } else if (status === 404) {
          errorMessage = data?.message || '워크스페이스를 찾을 수 없습니다.'
        } else {
          errorMessage = data?.message || data?.error || `서버 오류 (${status})`
        }
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setLeaveError(errorMessage)
    } finally {
      setLeaving(false)
    }
  }

  function closeInviteModal() {
    setInviteModalOpen(false)
    setProjectToInvite(null)
    setInviteLink('')
    setInviteLinkExpiresAt('')
    setInviteError(null)
  }

  // 초대 링크 생성
  async function handleGenerateInviteLink() {
    if (!projectToInvite) return

    setGenerating(true)
    setInviteError(null)

    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const res = await axios.post<{
        token: string
        inviteUrl: string
        expiresAt: string
      }>(
        `${API_BASE_URL}/v1/workspaces/${projectToInvite.id}/invite-link`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      // 초대 링크 URL 처리 (전체 URL이면 그대로, 상대 경로면 현재 도메인과 결합)
      let inviteUrl = res.data.inviteUrl || res.data.token
      if (inviteUrl) {
        if (inviteUrl.startsWith('http://') || inviteUrl.startsWith('https://')) {
          // 전체 URL이면 그대로 사용
        } else if (inviteUrl.startsWith('/')) {
          // 절대 경로인 경우
          inviteUrl = `${window.location.origin}${inviteUrl}`
        } else if (inviteUrl.startsWith('invite/')) {
          // invite/로 시작하는 경우
          inviteUrl = `${window.location.origin}/${inviteUrl}`
        } else {
          // 토큰만 있는 경우
          inviteUrl = `${window.location.origin}/invite/${inviteUrl}`
        }
      }
      setInviteLink(inviteUrl)
      setInviteLinkExpiresAt(res.data.expiresAt)
    } catch (err: any) {
      console.error('초대 링크 생성 실패', err)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        // 인증 오류 시 로그아웃 처리 및 모달 표시
        setIsLoggedIn(false)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        closeInviteModal()
        setAuthExpiredModalOpen(true)
      } else {
        setInviteError(
          err?.response?.data?.message ||
          err?.message ||
          '초대 링크 생성 중 오류가 발생했습니다.'
        )
      }
    } finally {
      setGenerating(false)
    }
  }

  // 초대 링크 복사
  function handleCopyInviteLink() {
    if (!inviteLink) return

    navigator.clipboard.writeText(inviteLink).then(() => {
      alert('초대 링크가 클립보드에 복사되었습니다!')
    }).catch(() => {
      // 폴백
      const textArea = document.createElement('textarea')
      textArea.value = inviteLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('초대 링크가 클립보드에 복사되었습니다!')
    })
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false)
    setProjectToDelete(null)
    setDeleteError(null)
  }

  // 프로젝트 삭제 실행
  async function handleDeleteConfirm() {
    if (!projectToDelete) return

    setDeleting(true)
    setDeleteError(null)

    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.')
      }

      // 백엔드 API 호출: Soft Delete
      await axios.delete(
        `${API_BASE_URL}/v1/workspaces/${projectToDelete.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      // 프로젝트 목록에서 제거 (삭제된 것은 일반 목록에 표시되지 않음)
      setProjects((s) => s.filter((p) => p.id !== projectToDelete.id))
      closeDeleteModal()
    } catch (err: any) {
      console.error('워크스페이스 삭제 실패', err)
      
      let errorMessage = '워크스페이스 삭제 중 오류가 발생했습니다.'
      
      if (err?.response) {
        const status = err.response.status
        const data = err.response.data
        
        if (status === 401 || status === 403) {
          // 인증 오류 시 로그아웃 처리 및 모달 표시
          setIsLoggedIn(false)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('userName')
          localStorage.removeItem('userEmail')
          closeDeleteModal()
          setAuthExpiredModalOpen(true)
          return
        } else if (status === 404) {
          errorMessage = data?.message || '워크스페이스를 찾을 수 없습니다.'
        } else {
          errorMessage = data?.message || data?.error || `서버 오류 (${status})`
        }
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setDeleteError(errorMessage)
    } finally {
      setDeleting(false)
    }
  }


  // 탭 + 검색 필터 적용
  const filteredProjects = useMemo(() => {
    let arr = projects.filter((p) => !p.isDeleted) // 삭제되지 않은 프로젝트만 표시
    if (activeTab === 'mine') {
      arr = arr.filter(p => p.isOwner)
    } else if (activeTab === 'shared') {
      arr = arr.filter(p => !p.isOwner)
    }
    const q = query.trim().toLowerCase()
    if (q) arr = arr.filter(p => p.title.toLowerCase().includes(q))
    return arr
  }, [projects, query, activeTab])

  // 정렬 적용
  // 정렬 기능 제거: 필터링만 적용
  const sortedProjects = filteredProjects

  return (
    <div className={styles.pageRoot}>
      <div className={styles.container}>
        <Sidebar activeMenu="home" />

        <main className={styles.main}>
          <header className={styles.header}>
            {/* Left: Information group */}
            <div style={{ textAlign: 'left' }}>
              <h1 className={styles.title}>전체 프로젝트</h1>
              <p className={styles.subtitle}>당신의 최근 프로젝트를 확인하세요.</p>
            </div>

            {/* Right: Control group */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="프로젝트 검색..."
                  aria-label="프로젝트 검색"
                  className="h-10 w-full rounded-xl bg-gray-50 border border-black/10 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#01CD15]/30 focus:border-[#01CD15]/40"
                />
              </div>

              {/* View & Sort toggle */}
              <div className="flex border border-black/10 rounded-xl overflow-hidden">
                <button
                  type="button"
                  aria-label="그리드 보기"
                  onClick={() => setViewMode('grid')}
                  className={`w-10 h-10 flex items-center justify-center ${viewMode === 'grid' ? 'bg-[#01CD15] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  type="button"
                  aria-label="리스트 보기"
                  onClick={() => setViewMode('list')}
                  className={`w-10 h-10 flex items-center justify-center ${viewMode === 'list' ? 'bg-[#01CD15] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <ListIcon size={18} />
                </button>
              </div>

              {/* Create/Login */}
              {isLoggedIn ? (
                <button
                  className={styles.createButton}
                  type="button"
                  onClick={openModal}
                  style={{ height: 40, padding: '0 16px', display: 'inline-flex', alignItems: 'center' }}
                >
                  새 프로젝트 생성
                </button>
              ) : (
                <button
                  className={styles.createButton}
                  type="button"
                  onClick={handleLogin}
                  style={{ height: 40, padding: '0 16px', display: 'inline-flex', alignItems: 'center' }}
                >
                  로그인
                </button>
              )}
            </div>
          </header>

          {/* 프로젝트 필터 탭 */}
          <nav className="flex gap-6 border-b border-gray-200 mb-2 mt-2" aria-label="프로젝트 필터 탭">
            <button
              type="button"
              className={`pb-2 px-1 text-base font-medium transition-colors border-b-2 ${activeTab === 'all' ? 'text-gray-900 border-green-500' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
              onClick={() => setActiveTab('all')}
            >
              전체
            </button>
            <button
              type="button"
              className={`pb-2 px-1 text-base font-medium transition-colors border-b-2 ${activeTab === 'mine' ? 'text-gray-900 border-green-500' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
              onClick={() => setActiveTab('mine')}
            >
              내 프로젝트
            </button>
            <button
              type="button"
              className={`pb-2 px-1 text-base font-medium transition-colors border-b-2 ${activeTab === 'shared' ? 'text-gray-900 border-green-500' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
              onClick={() => setActiveTab('shared')}
            >
              공유 문서함
            </button>
          </nav>

          <ProjectList
            projects={sortedProjects}
            viewMode={viewMode}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onDelete={handleDeleteClick}
            onInvite={handleInviteClick}
            onLeave={handleLeaveClick}
            loading={loading}
            loadError={loadError}
          />

          {/* Modal: 새 프로젝트 생성 (Card Variant) */}
          <Modal isOpen={isModalOpen} onClose={closeModal} variant="card">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">새 프로젝트 생성</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="project-name" className="block mb-2 text-sm font-medium text-gray-700">
                    프로젝트 이름 <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="project-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="프로젝트 이름을 입력하세요 (예: 2024 마케팅 기획)"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="project-desc" className="block mb-2 text-sm font-medium text-gray-700">
                    간단한 설명 <span className="text-gray-400 text-xs font-medium">(선택)</span>
                  </label>
                  <textarea
                    id="project-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    placeholder="프로젝트에 대한 설명을 자유롭게 적어주세요."
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed resize-y text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  />
                </div>
                {createError && (
                  <p className="text-sm text-red-600">{createError}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={creating}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!form.name.trim() || creating}
                  className="h-10 px-6 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-none"
                >
                  {creating ? '생성 중...' : '생성하기'}
                </button>
              </div>
            </div>
          </Modal>

          {/* Modal: 프로젝트 초대 */}
          <Modal isOpen={inviteModalOpen} onClose={closeInviteModal}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                프로젝트 초대
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                <strong style={{ color: '#111827' }}>"{projectToInvite?.title}"</strong> 프로젝트에 사용자를 초대하세요.
              </p>
            </div>

            {inviteError && (
              <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
                {inviteError}
              </div>
            )}

            {!inviteLink ? (
              <div className={styles.formActions}>
                <button 
                  className={styles.ghostBtn} 
                  type="button" 
                  onClick={closeInviteModal} 
                  disabled={generating}
                >
                  취소
                </button>
                <button 
                  className={styles.primaryBtn} 
                  type="button" 
                  onClick={handleGenerateInviteLink} 
                  disabled={generating}
                >
                  {generating ? '생성 중...' : '초대 링크 생성'}
                </button>
              </div>
            ) : (
              <div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>초대 링크</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className={styles.input}
                      type="text"
                      value={inviteLink}
                      readOnly
                      style={{ flex: 1 }}
                    />
                    <button
                      className={styles.primaryBtn}
                      type="button"
                      onClick={handleCopyInviteLink}
                    >
                      복사
                    </button>
                  </div>
                </div>
                {inviteLinkExpiresAt && (
                  <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                    만료일: {new Date(inviteLinkExpiresAt).toLocaleString('ko-KR')}
                  </p>
                )}
                <div className={styles.formActions}>
                  <button 
                    className={styles.ghostBtn} 
                    type="button" 
                    onClick={closeInviteModal}
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* Modal: 프로젝트 삭제 확인 */}
          <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                프로젝트 삭제
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                정말로 <strong style={{ color: '#111827' }}>"{projectToDelete?.title}"</strong> 프로젝트를 삭제하시겠습니까?
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#f59e0b', fontSize: '0.875rem' }}>
                💡 삭제된 프로젝트는 휴지통에서 복구할 수 있습니다.
              </p>
            </div>

            {deleteError && (
              <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
                {deleteError}
              </div>
            )}

            <div className={styles.formActions}>
              <button 
                className={styles.ghostBtn} 
                type="button" 
                onClick={closeDeleteModal} 
                disabled={deleting}
              >
                취소
              </button>
              <button 
                className={styles.dangerBtn} 
                type="button" 
                onClick={handleDeleteConfirm} 
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </Modal>

          {/* Modal: 프로젝트 나가기 확인 */}
          <Modal isOpen={leaveModalOpen} onClose={closeLeaveModal}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                프로젝트 나가기
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                정말로 <strong style={{ color: '#111827' }}>"{projectToLeave?.title}"</strong> 프로젝트에서 나가시겠습니까?
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#f59e0b', fontSize: '0.875rem' }}>
                ⚠️ 나가면 이 프로젝트에 다시 접근할 수 없습니다. 다시 참여하려면 초대를 받아야 합니다.
              </p>
            </div>

            {leaveError && (
              <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
                {leaveError}
              </div>
            )}

            <div className={styles.formActions}>
              <button 
                className={styles.ghostBtn} 
                type="button" 
                onClick={closeLeaveModal} 
                disabled={leaving}
              >
                취소
              </button>
              <button 
                className={styles.primaryBtn} 
                type="button" 
                onClick={handleLeaveConfirm} 
                disabled={leaving}
                style={{ 
                  background: '#f59e0b',
                  color: 'white'
                }}
              >
                {leaving ? '나가는 중...' : '나가기'}
              </button>
            </div>
          </Modal>

          {/* Modal: 인증 만료 */}
          <Modal isOpen={authExpiredModalOpen} onClose={() => {}}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                로그인이 만료되었습니다
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                세션이 만료되어 다시 로그인이 필요합니다.
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#f59e0b', fontSize: '0.875rem' }}>
                ⚠️ 로그인 페이지로 이동합니다.
              </p>
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                onClick={handleAuthExpiredConfirm}
                style={{ 
                  width: '100%',
                  background: '#01CD15',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1e7b0b'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#01CD15'
                }}
              >
                로그인하기
              </button>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}
