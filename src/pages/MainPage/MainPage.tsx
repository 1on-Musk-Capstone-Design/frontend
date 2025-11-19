import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import ProjectCard from './components/ProjectCard/ProjectCard'
import styles from './MainPage.module.css'
import { Project } from './types'
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

export default function MainPage(): JSX.Element {
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

  // 초대 토큰이 있으면 수락 처리
  useEffect(() => {
    const pendingInviteToken = localStorage.getItem('pendingInviteToken')
    if (pendingInviteToken && isLoggedIn) {
      // 초대 수락 페이지로 이동
      window.location.href = `/invite/${pendingInviteToken}`
      localStorage.removeItem('pendingInviteToken')
    }
  }, [isLoggedIn])

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
        
        setIsLoggedIn(true)

        // JWT 토큰에서 user_id 추출 (디버깅용)
        try {
          const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
          const userId = tokenPayload.user_id || tokenPayload.sub;
          console.log('현재 로그인한 사용자 ID:', userId);
        } catch (e) {
          console.warn('JWT 토큰 파싱 실패:', e);
        }

        const res = await axios.get<WorkspaceListItem[]>(
          `${API_BASE_URL}/v1/workspaces`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

        console.log('워크스페이스 목록 API 응답:', {
          count: res.data.length,
          workspaces: res.data
        });

        // API 응답을 Project 타입으로 변환
        const workspaceProjects: Project[] = res.data.map((workspace) => ({
          id: String(workspace.workspaceId),
          title: workspace.name,
          thumbnailUrl: '',
          lastModified: '최근 수정됨', // API에 수정일 정보가 없으면 기본값
        }))

        setProjects(workspaceProjects)
      } catch (err: any) {
        console.error('워크스페이스 목록 불러오기 실패', err)
        if (err?.response?.status === 401) {
          // 인증 오류 시 로그아웃 처리
          setIsLoggedIn(false)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          setLoadError('로그인이 만료되었습니다. 다시 로그인해주세요.')
        } else {
          setLoadError(err?.response?.data?.message || err?.message || '워크스페이스 목록을 불러오는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (isLoggedIn) {
      fetchWorkspaces()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn])

  // 로그인 핸들러
  const handleLogin = () => {
    window.location.href = '/auth'
  }

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    setIsLoggedIn(false)
    setProjects([])
    setLoadError(null)
  }

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
        { name: form.name.trim() },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // 생성된 워크스페이스를 Project 타입으로 변환
      const newProject: Project = {
        id: String(res.data.workspaceId),
        title: res.data.name,
        thumbnailUrl: '',
        lastModified: '방금 수정됨',
      }

      setProjects((s) => [newProject, ...s])
      closeModal()
    } catch (err: any) {
      console.error('워크스페이스 생성 실패', err)
      setCreateError(
        err?.response?.data?.message || 
        err?.message || 
        '워크스페이스 생성 중 오류가 발생했습니다.'
      )
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
      setInviteError(
        err?.response?.data?.message ||
        err?.message ||
        '초대 링크 생성 중 오류가 발생했습니다.'
      )
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

      await axios.delete(
        `${API_BASE_URL}/v1/workspaces/${projectToDelete.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      // 프로젝트 목록에서 제거
      setProjects((s) => s.filter((p) => p.id !== projectToDelete.id))
      closeDeleteModal()
    } catch (err: any) {
      console.error('워크스페이스 삭제 실패', err)
      
      let errorMessage = '워크스페이스 삭제 중 오류가 발생했습니다.'
      
      if (err?.response) {
        const status = err.response.status
        const data = err.response.data
        
        if (status === 403) {
          errorMessage = '삭제 권한이 없습니다. 이 워크스페이스의 소유자만 삭제할 수 있습니다.'
          if (data?.message) {
            errorMessage = `권한 오류: ${data.message}`
          }
        } else if (status === 401) {
          errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.'
          if (data?.message) {
            errorMessage = `인증 오류: ${data.message}`
          }
        } else if (status === 404) {
          errorMessage = '워크스페이스를 찾을 수 없습니다.'
          if (data?.message) {
            errorMessage = data.message
          }
        } else if (data?.message) {
          errorMessage = data.message
        } else if (data?.error) {
          errorMessage = data.error
        }
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setDeleteError(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={styles.pageRoot}>
      <div className={styles.container}>
        <Sidebar activeMenu="home" />

        <main className={styles.main}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>전체 프로젝트</h1>
              <p className={styles.subtitle}>당신의 최근 프로젝트를 확인하세요.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {isLoggedIn ? (
                <>
                  <button className={styles.createButton} type="button" onClick={openModal}>
                    새 프로젝트 생성
                  </button>
                  <button 
                    className={styles.logoutButton} 
                    type="button" 
                    onClick={handleLogout}
                    style={{
                      padding: '10px 16px',
                      background: 'transparent',
                      color: '#6b7280',
                      border: '1px solid rgba(15,23,42,0.06)',
                      borderRadius: '10px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 180ms ease'
                    }}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button 
                  className={styles.createButton} 
                  type="button" 
                  onClick={handleLogin}
                >
                  로그인
                </button>
              )}
            </div>
          </header>

          <section className={styles.gridSection} aria-label="프로젝트 목록">
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                로딩 중...
              </div>
            ) : loadError ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
                <p>{loadError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  style={{ marginTop: '10px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  다시 시도
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                워크스페이스가 없습니다. 새 프로젝트를 생성해보세요.
              </div>
            ) : (
              projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  thumbnailUrl={p.thumbnailUrl}
                  lastModified={p.lastModified}
                  onDelete={handleDeleteClick}
                  onInvite={handleInviteClick}
                />
              ))
            )}
          </section>

          {/* Modal: 새 프로젝트 생성 */}
          <Modal isOpen={isModalOpen} onClose={closeModal}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="project-name">프로젝트 이름 <span className={styles.required}>*</span></label>
              <input
                id="project-name"
                className={styles.input}
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="project-desc">간단한 설명</label>
              <textarea
                id="project-desc"
                className={styles.textarea}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>

            {createError && (
              <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
                {createError}
              </div>
            )}
            <div className={styles.formActions}>
              <button className={styles.ghostBtn} type="button" onClick={closeModal} disabled={creating}>취소</button>
              <button className={styles.primaryBtn} type="button" onClick={handleCreate} disabled={!form.name.trim() || creating}>
                {creating ? '생성 중...' : '생성하기'}
              </button>
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
              <p style={{ margin: '8px 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                ⚠️ 이 작업은 되돌릴 수 없으며, 프로젝트 내의 모든 메모도 함께 삭제됩니다.
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
        </main>
      </div>
    </div>
  )
}
