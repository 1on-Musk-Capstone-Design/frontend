import React from 'react'
import ProjectCard from '../ProjectCard/ProjectCard'
import { Project } from '../../types'
import { Star } from 'lucide-react'
import { ProjectRow } from './ProjectRow'

interface ProjectListProps {
  projects: Project[]
  viewMode: 'grid' | 'list'
  favorites: Set<string>
  toggleFavorite: (id: string) => void
  onDelete: (id: string) => void
  onInvite: (id: string) => void
  loading: boolean
  loadError: string | null
}

export default function ProjectList({ projects, viewMode, favorites, toggleFavorite, onDelete, onInvite, loading, loadError }: ProjectListProps) {
  if (viewMode === 'grid') {
    return (
      <section aria-label="프로젝트 그리드" style={{ marginTop: 24 }}>
        {loading && projects.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>로딩 중...</div>
        ) : loadError && projects.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>{loadError}</div>
        ) : (
          <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' }}>
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                id={p.id}
                title={p.title}
                thumbnailUrl={p.thumbnailUrl}
                lastModified={p.lastModified}
                onDelete={onDelete}
                onInvite={onInvite}
                isFavorite={favorites.has(p.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </section>
    )
  }

  // list mode
  return (
    <section aria-label="프로젝트 리스트" style={{ marginTop: 32 }}>
      {projects.length === 0 && !loading && !loadError && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>표시할 프로젝트가 없습니다.</div>
      )}
      {loading && projects.length === 0 && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>로딩 중...</div>
      )}
      {loadError && projects.length === 0 && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#dc2626' }}>{loadError}</div>
      )}
      {projects.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 140px 120px 80px',
            gap: 12,
            padding: '0 8px 12px 8px',
            fontSize: 12,
            fontWeight: 600,
            color: '#374151'
          }}>
            <div style={{ textAlign: 'center' }}><Star size={14} /></div>
            <div>제목</div>
            <div>파일수</div>
            <div>최근 수정</div>
            <div style={{ textAlign: 'center' }}>액션</div>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {projects.map(p => (
              <ProjectRow
                key={p.id}
                project={p}
                fileCount={Math.floor(Math.random() * 25) + 1}
                isFavorite={favorites.has(p.id)}
                onToggleFavorite={toggleFavorite}
                onInvite={onInvite}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}