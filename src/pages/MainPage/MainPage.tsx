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
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [projectToLeave, setProjectToLeave] = useState<{ id: string; title: string } | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

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
          return
        }
        
        setIsLoggedIn(true)

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
                
                // 디버깅: OWNER 정보 로그
                console.log(`워크스페이스 ${workspace.workspaceId} OWNER 정보:`, {
                  id: owner.id,
                  name: owner.name,
                  email: owner.email,
                  profileImage: owner.profileImage,
                  profileImageType: typeof owner.profileImage,
                  profileImageLength: owner.profileImage?.length,
                  isCurrentUser: currentUserId && String(owner.id) === currentUserId
                })
                
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
                  console.log(`최종 프로필 이미지 URL: ${ownerProfileImage}`)
                } else {
                  ownerProfileImage = undefined
                  console.log(`프로필 이미지가 없거나 빈 문자열입니다.`)
                }
                
                // 현재 사용자가 OWNER인지 확인
                if (currentUserId && String(owner.id) === currentUserId) {
                  isOwner = true
                }
              } else {
                console.warn(`워크스페이스 ${workspace.workspaceId}에서 OWNER를 찾을 수 없습니다.`)
              }
            } catch (err) {
              console.error(`워크스페이스 ${workspace.workspaceId} 사용자 목록 불러오기 실패:`, err)
            }

            return {
              id: String(workspace.workspaceId),
              title: workspace.name,
              thumbnailUrl: '',
              lastModified: '최근 수정됨',
              ownerName,
              ownerProfileImage,
              isOwner
            }
          })
        )

        setProjects(workspaceProjectsWithOwners)
        
        // 초대 수락 플래그가 있으면 제거 (목록 새로고침 완료)
        if (localStorage.getItem('inviteAccepted') === 'true') {
          localStorage.removeItem('inviteAccepted')
          console.log('초대 수락 후 워크스페이스 목록이 업데이트되었습니다.')
        }
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
        
        if (status === 403) {
          errorMessage = data?.message || data?.error || '나가기 권한이 없습니다.'
        } else if (status === 401) {
          errorMessage = data?.message || data?.error || '인증이 만료되었습니다. 다시 로그인해주세요.'
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
      console.error('에러 상세 정보:', {
        status: err?.response?.status,
        data: err?.response?.data,
        headers: err?.response?.headers,
        workspaceId: projectToDelete.id
      })
      
      let errorMessage = '워크스페이스 삭제 중 오류가 발생했습니다.'
      
      if (err?.response) {
        const status = err.response.status
        const data = err.response.data
        
        if (status === 403) {
          errorMessage = data?.message || data?.error || '삭제 권한이 없습니다. 이 워크스페이스의 소유자만 삭제할 수 있습니다.'
        } else if (status === 401) {
          errorMessage = data?.message || data?.error || '인증이 만료되었습니다. 다시 로그인해주세요.'
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
                  ownerName={p.ownerName}
                  ownerProfileImage={p.ownerProfileImage}
                  isOwner={p.isOwner}
                  onDelete={handleDeleteClick}
                  onLeave={handleLeaveClick}
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
        </main>
      </div>
    </div>
  )
}
