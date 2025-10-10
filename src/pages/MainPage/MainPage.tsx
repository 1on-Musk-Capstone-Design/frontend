import React from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import ProjectCard from './components/ProjectCard/ProjectCard'
import styles from './MainPage.module.css'
import { Project } from './types'

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
              <button className={styles.createButton} type="button">
                새 프로젝트 생성
              </button>
            </div>
          </header>

          <section className={styles.gridSection} aria-label="프로젝트 목록">
            {sampleProjects.map((p) => (
              <ProjectCard
                key={p.id}
                id={p.id}
                title={p.title}
                thumbnailUrl={p.thumbnailUrl}
                lastModified={p.lastModified}
              />
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}
