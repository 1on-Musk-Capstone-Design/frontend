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

  function openModal() {
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setForm({ name: '', description: '' })
    setCreateError(null)
  }

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
          return
        }

        const res = await axios.get<WorkspaceListItem[]>(
          `${API_BASE_URL}/v1/workspaces`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

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
        setLoadError(err?.response?.data?.message || err?.message || '워크스페이스 목록을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [])

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

            <div>
              <button className={styles.createButton} type="button" onClick={openModal}>
                새 프로젝트 생성
              </button>
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
        </main>
      </div>
    </div>
  )
}
