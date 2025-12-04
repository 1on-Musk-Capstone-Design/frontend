import { useState, useEffect, useMemo } from 'react'
import { Grid, List as ListIcon, Search } from 'lucide-react'
import ProjectList from '../MainPage/components/ProjectList/ProjectList'
import Sidebar from '../MainPage/components/Sidebar/Sidebar'
import styles from '../MainPage/MainPage.module.css'
import { Project } from '../MainPage/types'
import Modal from '../../components/Modal/Modal'
import axios from 'axios'
import { API_BASE_URL } from '../../config/api'

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

export default function StarredPage(): JSX.Element {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authExpiredModalOpen, setAuthExpiredModalOpen] = useState(false)
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

  // 로그인 상태 확인
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    setIsLoggedIn(!!accessToken)
  }, [])

  // 즐겨찾기된 프로젝트 필터링
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(p => favorites.has(p.id))
    
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(lowerQuery)
      )
    }
    
    return filtered
  }, [projects, favorites, query])

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
          return
        }

        const response = await axios.get<WorkspaceListItem[]>(
          `${API_BASE_URL}/v1/workspaces`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        const workspaceProjectsWithOwners: Project[] = response.data.map((workspace: WorkspaceListItem) => ({
          id: String(workspace.workspaceId),
          title: workspace.name,
          thumbnailUrl: '',
          lastModified: '방금 수정됨',
          isOwner: true,
        }))

        setProjects(workspaceProjectsWithOwners)
      } catch (err: any) {
        console.error('워크스페이스 목록 불러오기 실패', err)
        
        const isAxiosError = err?.isAxiosError || err?.response !== undefined || err?.request !== undefined
        const status = err?.response?.status
        
        if (isAxiosError && (status === 401 || status === 403)) {
          setIsLoggedIn(false)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('userName')
          localStorage.removeItem('userEmail')
          setAuthExpiredModalOpen(true)
        } else {
          setLoadError(err?.response?.data?.message || err?.message || '워크스페이스 목록을 불러오는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }

    const accessToken = localStorage.getItem('accessToken')
    
    if (accessToken) {
      fetchWorkspaces()
    } else {
      setIsLoggedIn(false)
      setLoading(false)
      setAuthExpiredModalOpen(true)
    }
  }, [])

  const handleAuthExpiredConfirm = () => {
    setAuthExpiredModalOpen(false)
    window.location.href = '/auth'
  }

  function handleDeleteClick(id: string) {
    const project = projects.find((p) => p.id === id)
    if (project) {
      setProjectToDelete({ id, title: project.title })
      setDeleteModalOpen(true)
      setDeleteError(null)
    }
  }

  async function handleDeleteConfirm() {
    if (!projectToDelete) return
    
    setDeleting(true)
    setDeleteError(null)
    
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.')
      }

      await axios.delete(
        `${API_BASE_URL}/v1/workspaces/${projectToDelete.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      setProjects((s) => s.filter((p) => p.id !== projectToDelete.id))
      setDeleteModalOpen(false)
      setProjectToDelete(null)
    } catch (err: any) {
      console.error('워크스페이스 삭제 실패', err)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        setDeleteModalOpen(false)
        setAuthExpiredModalOpen(true)
      } else {
        setDeleteError(
          err?.response?.data?.message || 
          err?.message || 
          '워크스페이스 삭제 중 오류가 발생했습니다.'
        )
      }
    } finally {
      setDeleting(false)
    }
  }

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

  async function handleGenerateInviteLink() {
    if (!projectToInvite) return
    
    setGenerating(true)
    setInviteError(null)
    
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const response = await axios.post(
        `${API_BASE_URL}/v1/workspaces/${projectToInvite.id}/invite`,
        { expiresInHours: 24 },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const inviteLink = `${window.location.origin}/invite/${response.data.token}`
      setInviteLink(inviteLink)
      setInviteLinkExpiresAt(response.data.expiresAt)
    } catch (err: any) {
      console.error('초대 링크 생성 실패', err)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setIsLoggedIn(false)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        setInviteModalOpen(false)
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

  function handleCopyInviteLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      alert('초대 링크가 복사되었습니다!')
    }
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false)
    setProjectToDelete(null)
  }

  function closeInviteModal() {
    setInviteModalOpen(false)
    setProjectToInvite(null)
    setInviteLink('')
    setInviteLinkExpiresAt('')
  }

  return (
    <div className={styles.pageRoot}>
      <Sidebar activeMenu="starred" />
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>즐겨찾기</h1>
            <p className={styles.subtitle}>별표된 프로젝트를 확인하세요.</p>
          </div>
        </div>

        {/* 컨트롤 바 */}
        <div className="flex gap-3 items-center mb-6 flex-wrap">
          {/* 검색 바 */}
          <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex gap-2 border border-gray-200 rounded-lg p-1 bg-white">
            <button
              className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setViewMode('grid')}
              aria-label="그리드 보기"
            >
              <Grid size={18} />
            </button>
            <button
              className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setViewMode('list')}
              aria-label="리스트 보기"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        {/* 프로젝트 리스트 */}
        <ProjectList
          projects={filteredProjects}
          viewMode={viewMode}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          onDelete={handleDeleteClick}
          onInvite={handleInviteClick}
          loading={loading}
          loadError={loadError}
        />

        {/* 모달들 */}
        <Modal
          isOpen={authExpiredModalOpen}
          title="인증 만료"
          message="로그인이 필요합니다. 로그인 페이지로 이동합니다."
          onConfirm={handleAuthExpiredConfirm}
          confirmButtonText="로그인하기"
          showCancelButton={false}
        />

        <Modal
          isOpen={deleteModalOpen}
          title="프로젝트 삭제"
          message={`'${projectToDelete?.title}'을(를) 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.`}
          onConfirm={handleDeleteConfirm}
          onCancel={closeDeleteModal}
          confirmButtonText="삭제"
          confirmButtonStyle="danger"
          loading={deleting}
          error={deleteError}
        />

        <Modal
          isOpen={inviteModalOpen}
          title="프로젝트 초대"
          message={`'${projectToInvite?.title}'에 사람들을 초대할 수 있습니다.`}
          onConfirm={handleGenerateInviteLink}
          onCancel={closeInviteModal}
          confirmButtonText={generating ? '생성 중...' : '초대 링크 생성'}
          loading={generating}
          error={inviteError}
          inviteLink={inviteLink}
          inviteLinkExpiresAt={inviteLinkExpiresAt}
          onCopyInviteLink={handleCopyInviteLink}
        />
      </main>
    </div>
  )
}
