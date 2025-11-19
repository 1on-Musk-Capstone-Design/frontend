import { useState } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import ProjectCard from './components/ProjectCard/ProjectCard'
import styles from './MainPage.module.css'
import { Project } from './types'
import Modal from '../../components/Modal/Modal'

// form state types
interface NewProjectForm {
  name: string
  description?: string
}

// NOTE: This component assumes your project uses a global design system (CSS variables
// such as --primary-color). If not provided, the CSS modules below provide sensible
// defaults. The goal is to avoid introducing new global styles and keep styling
// component-scoped via CSS Modules.

const sampleProjects: Project[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `proj_${(i + 1).toString().padStart(2, '0')}`,
  title: i === 0 ? '알파 프로젝트' : `프로젝트 ${i + 1}`,
  thumbnailUrl: '',
  lastModified: i === 0 ? '어제 수정됨' : `${i + 1}일 전 수정됨`,
}))

export default function MainPage(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<NewProjectForm>({ name: '', description: '' })
  const [projects, setProjects] = useState<Project[]>(sampleProjects)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  function openModal() {
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setForm({ name: '', description: '' })
  }

  async function handleCreate() {
    if (!form.name.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      // Assumption: POST /api/projects accepts { title, description } and returns created project with id
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.name.trim(), description: form.description }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }

      const created = await res.json()

      // If API doesn't return all fields, normalize
      const newProject: Project = {
        id: String(created.id || created._id || `proj_${Date.now()}`),
        title: created.title || form.name.trim(),
        thumbnailUrl: created.thumbnailUrl || '',
        lastModified: created.lastModified || '방금 수정됨',
      }

      setProjects((s) => [newProject, ...s])
      closeModal()
    } catch (err: any) {
      console.error('프로젝트 생성 실패', err)
      setCreateError(err?.message || '프로젝트 생성 중 오류가 발생했습니다.')
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
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                id={p.id}
                title={p.title}
                thumbnailUrl={p.thumbnailUrl}
                lastModified={p.lastModified}
              />
            ))}
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

            <div className={styles.formActions}>
              <button className={styles.ghostBtn} type="button" onClick={closeModal}>취소</button>
              <button className={styles.primaryBtn} type="button" onClick={handleCreate} disabled={!form.name.trim()}>생성하기</button>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}
