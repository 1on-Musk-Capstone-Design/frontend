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
  onLeave?: (id: string) => void
  loading: boolean
  loadError: string | null
}

export default function ProjectList({ projects, viewMode, favorites, toggleFavorite, onDelete, onInvite, onLeave, loading, loadError }: ProjectListProps) {
  if (viewMode === 'grid') {
    return (
      <section aria-label="프로젝트 그리드" style={{ marginTop: 24, backgroundColor: '#ffffff' }}>
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
                ownerName={p.ownerName}
                ownerProfileImage={p.ownerProfileImage}
                isOwner={p.isOwner}
                onDelete={onDelete}
                {...(onLeave ? { onLeave } : {})}
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
    <section aria-label="프로젝트 리스트" style={{ marginTop: 32, backgroundColor: '#ffffff' }}>
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
          <div
            className="grid grid-cols-[40px_1fr_140px_120px_80px] gap-3 px-2 pb-3"
          >
            <div className="flex items-center justify-center text-base font-semibold text-gray-700"><Star size={16} /></div>
            <div className="text-base font-semibold text-gray-700">제목</div>
            <div className="text-base font-semibold text-gray-700">파일수</div>
            <div className="text-base font-semibold text-gray-700">최근 수정</div>
            <div className="flex items-center justify-center text-base font-semibold text-gray-700">관리</div>
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