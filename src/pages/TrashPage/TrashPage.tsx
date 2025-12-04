import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import Sidebar from '../MainPage/components/Sidebar/Sidebar'
import styles from './TrashPage.module.css'
import { Project } from '../MainPage/types'
import Modal from '../../components/Modal/Modal'
import axios from 'axios'
import { API_BASE_URL } from '../../config/api'
import ProjectCard from '../MainPage/components/ProjectCard/ProjectCard'

interface TrashPageProps {
  projects?: Project[]
  onRestore?: (id: string) => void
  onPermanentDelete?: (id: string) => void
  onEmptyTrash?: () => void
}

export default function TrashPage({
  projects: externalProjects = [],
  onRestore: externalOnRestore,
  onPermanentDelete: externalOnPermanentDelete,
  onEmptyTrash: externalOnEmptyTrash,
}: TrashPageProps) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>(externalProjects)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [emptyTrashModalOpen, setEmptyTrashModalOpen] = useState(false)
  const [emptyingTrash, setEmptyingTrash] = useState(false)
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

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

  // 워크스페이스 목록 불러오기 (외부에서 전달받지 않은 경우)
  const didInitRef = useRef(false)
  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true

    if (externalProjects && externalProjects.length > 0) {
      setProjects(externalProjects)
      setLoading(false)
    } else {
      fetchWorkspaces()
    }
  }, [])

  const isFetchingRef = useRef(false)
  const fetchWorkspaces = async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setLoading(true)
    setLoadError(null)

    try {
      const accessToken = localStorage.getItem('accessToken')

      if (!accessToken) {
        setLoadError('로그인이 필요합니다.')
        setLoading(false)
        window.location.href = '/auth'
        return
      }

      const res = await axios.get<Array<any>>(
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

            const owner = usersRes.data.find((user: any) => user.role === 'OWNER')
            if (owner) {
              ownerName = owner.name || owner.email || '알 수 없음'
              if (owner.profileImage && owner.profileImage.trim() !== '') {
                if (owner.profileImage.startsWith('/')) {
                  ownerProfileImage = `${API_BASE_URL}${owner.profileImage}`
                } else if (!owner.profileImage.startsWith('http://') && !owner.profileImage.startsWith('https://')) {
                  ownerProfileImage = `${API_BASE_URL}/${owner.profileImage}`
                } else {
                  ownerProfileImage = owner.profileImage
                }
              }

              if (currentUserId && String(owner.id) === currentUserId) {
                isOwner = true
              }
            }
          } catch (err: any) {
            console.error(`워크스페이스 ${workspace.workspaceId} 사용자 목록 불러오기 실패:`, err)
            if (err?.response?.status === 401 || err?.response?.status === 403) {
              setLoadError('인증이 만료되었습니다. 다시 로그인해주세요.')
              throw err
            }
          }

          // localStorage에서 삭제된 프로젝트 목록 동기화
          let isDeleted = false
          try {
            const deleted = JSON.parse(localStorage.getItem('deletedProjects') || '[]') as string[]
            isDeleted = deleted.includes(String(workspace.workspaceId))
          } catch {
            // ignore
          }

          return {
            id: String(workspace.workspaceId),
            title: workspace.name,
            thumbnailUrl: '',
            lastModified: '최근 수정됨',
            ownerName,
            ownerProfileImage,
            isOwner,
            isDeleted
          }
        })
      )

      // 로컬 삭제 스냅샷도 포함 (API 목록에 없더라도 휴지통 표시)
      let snapshotList: Project[] = []
      try {
        const snapshots = JSON.parse(localStorage.getItem('deletedProjectSnapshots') || '{}') as Record<string, any>
        const deletedIds = new Set(Object.keys(snapshots))
        snapshotList = Array.from(deletedIds).map((id) => ({
          id,
          title: snapshots[id]?.title || '삭제된 프로젝트',
          thumbnailUrl: snapshots[id]?.thumbnailUrl || '',
          lastModified: snapshots[id]?.lastModified || '삭제됨',
          ownerName: snapshots[id]?.ownerName,
          ownerProfileImage: snapshots[id]?.ownerProfileImage,
          isOwner: snapshots[id]?.isOwner,
          isDeleted: true,
        }))
      } catch {
        // ignore
      }

      // API에서 가져온 목록과 스냅샷 병합 (중복 제거: API 우선)
      const apiIds = new Set(workspaceProjectsWithOwners.map(p => p.id))
      const merged = [
        ...workspaceProjectsWithOwners,
        ...snapshotList.filter(p => !apiIds.has(p.id)),
      ]

      setProjects(merged)
    } catch (err: any) {
      console.error('워크스페이스 목록 불러오기 실패', err)
      setLoadError(err?.message || '워크스페이스 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem('favorites', JSON.stringify(Array.from(next)))
      return next
    })
  }

  // 휴지통에만 있는 프로젝트 필터링
  const trashedProjects = useMemo(() => {
    let arr = projects.filter((p) => p.isDeleted)
    const q = query.trim().toLowerCase()
    if (q) arr = arr.filter(p => p.title.toLowerCase().includes(q))
    return arr
  }, [projects, query])

  // 프로젝트 복구 핸들러
  function handleRestoreClick(id: string) {
    if (externalOnRestore) {
      externalOnRestore(id)
    } else {
      // 로컬 스토리지에서 삭제 목록/스냅샷 제거
      try {
        const deletedRaw = localStorage.getItem('deletedProjects')
        const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : []
        const updatedDeleted = deletedIds.filter(pid => pid !== id)
        localStorage.setItem('deletedProjects', JSON.stringify(updatedDeleted))

        const snapRaw = localStorage.getItem('deletedProjectSnapshots')
        const snaps: Record<string, any> = snapRaw ? JSON.parse(snapRaw) : {}
        if (snaps && snaps[id]) {
          delete snaps[id]
          localStorage.setItem('deletedProjectSnapshots', JSON.stringify(snaps))
        }
      } catch (e) {
        console.warn('복구 로컬 스토리지 업데이트 실패:', e)
      }

      // 로컬 상태 즉시 반영
      setProjects(prev => prev.map(p => (p.id === id ? { ...p, isDeleted: false } : p)))

      // 홈으로 이동하여 목록에서 복구된 프로젝트 표시
      navigate('/')
    }
  }

  // 프로젝트 영구 삭제 핸들러
  function handleDeleteClick(id: string) {
    const project = trashedProjects.find((p) => p.id === id)
    if (project) {
      setProjectToDelete({ id, title: project.title })
      setDeleteModalOpen(true)
      setDeleteError(null)
    }
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false)
    setProjectToDelete(null)
    setDeleteError(null)
  }

  // 영구 삭제 실행
  async function handleDeleteConfirm() {
    if (!projectToDelete) return

    setDeleting(true)
    setDeleteError(null)

    try {
      if (externalOnPermanentDelete) {
        externalOnPermanentDelete(projectToDelete.id)
      } else {
        // 로컬 상태에서 제거
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id))
      }
      closeDeleteModal()
    } catch (err: any) {
      setDeleteError(err?.message || '프로젝트 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  // 휴지통 비우기 핸들러
  function handleEmptyTrashClick() {
    if (trashedProjects.length === 0) return
    setEmptyTrashModalOpen(true)
  }

  function closeEmptyTrashModal() {
    setEmptyTrashModalOpen(false)
  }

  // 휴지통 비우기 실행
  async function handleEmptyTrashConfirm() {
    setEmptyingTrash(true)

    try {
      if (externalOnEmptyTrash) {
        externalOnEmptyTrash()
      } else {
        // 로컬 상태에서 삭제된 프로젝트 모두 제거
        setProjects(prev => prev.filter(p => !p.isDeleted))
      }
      closeEmptyTrashModal()
    } catch (err: any) {
      console.error('휴지통 비우기 실패:', err)
    } finally {
      setEmptyingTrash(false)
    }
  }

  return (
    <div className={styles.pageRoot}>
      <div className={styles.container}>
        <Sidebar activeMenu="trash" />

        <main className={styles.main}>
          <header className={styles.header}>
            {/* Left: Title */}
            <div style={{ textAlign: 'left' }}>
              <h1 className={styles.title}>휴지통</h1>
              <p className={styles.subtitle}>삭제된 프로젝트를 복구하거나 영구 삭제할 수 있습니다.</p>
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
                  className="h-10 w-full rounded-xl bg-gray-50 border border-black/10 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/40"
                />
              </div>

              {/* Empty Trash Button */}
              {trashedProjects.length > 0 && !loading && (
                <button
                  type="button"
                  onClick={handleEmptyTrashClick}
                  className={styles.emptyTrashButton}
                >
                  휴지통 비우기
                </button>
              )}
            </div>
          </header>

          {/* 휴지통 프로젝트 리스트 */}
          {loading && projects.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>로딩 중...</div>
          ) : loadError && trashedProjects.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>{loadError}</div>
          ) : trashedProjects.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🗑️</div>
              <h2 className={styles.emptyTitle}>휴지통이 비어있습니다</h2>
              <p className={styles.emptyText}>삭제된 프로젝트가 없습니다.</p>
            </div>
          ) : (
            <section className={styles.projectList}>
              <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' }}>
                {trashedProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    id={p.id}
                    thumbnailUrl={p.thumbnailUrl}
                    title={p.title}
                    lastModified={p.lastModified}
                    ownerName={p.ownerName}
                    ownerProfileImage={p.ownerProfileImage}
                    isOwner={p.isOwner}
                    isFavorite={favorites.has(p.id)}
                    onToggleFavorite={toggleFavorite}
                    isTrash={true}
                    onRestore={handleRestoreClick}
                    onPermanentDelete={() => handleDeleteClick(p.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Modal: 영구 삭제 확인 */}
          <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal}>
            <div style={{ marginBottom: '20px' }}>
              <h2
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                프로젝트 영구 삭제
              </h2>
              <p
                style={{
                  margin: 0,
                  color: '#6b7280',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                }}
              >
                정말로{' '}
                <strong style={{ color: '#111827' }}>
                  "{projectToDelete?.title}"
                </strong>{' '}
                  프로젝트를 영구 삭제하시겠습니까?
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                ⚠️ 이 작업은 되돌릴 수 없으며, 프로젝트 내의 모든 메모도 함께
                삭제됩니다.
              </p>
            </div>

            {deleteError && (
              <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  opacity: deleting ? 0.4 : 1,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  background: 'none',
                  border: 'none',
                  transition: 'color 0.2s ease',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  opacity: deleting ? 0.5 : 1,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {deleting ? '삭제 중...' : '영구 삭제'}
              </button>
            </div>
          </Modal>

          {/* Modal: 휴지통 비우기 확인 */}
          <Modal isOpen={emptyTrashModalOpen} onClose={closeEmptyTrashModal}>
            <div style={{ marginBottom: '20px' }}>
              <h2
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                휴지통 비우기
              </h2>
              <p
                style={{
                  margin: 0,
                  color: '#6b7280',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                }}
              >
                정말로 휴지통의 모든 프로젝트({trashedProjects.length}개)를
                영구 삭제하시겠습니까?
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                ⚠️ 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button
                type="button"
                onClick={closeEmptyTrashModal}
                disabled={emptyingTrash}
                style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  opacity: emptyingTrash ? 0.4 : 1,
                  cursor: emptyingTrash ? 'not-allowed' : 'pointer',
                  background: 'none',
                  border: 'none',
                  transition: 'color 0.2s ease',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleEmptyTrashConfirm}
                disabled={emptyingTrash}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  opacity: emptyingTrash ? 0.5 : 1,
                  cursor: emptyingTrash ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {emptyingTrash ? '비우는 중...' : '모두 삭제'}
              </button>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}
