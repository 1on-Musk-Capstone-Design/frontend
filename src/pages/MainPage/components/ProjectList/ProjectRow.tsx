import React from 'react'
import { Star } from 'lucide-react'
import { Project } from '../../types'

interface ProjectRowProps {
  project: Project
  fileCount: number
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
  onInvite: (id: string) => void
  onDelete: (id: string) => void
}

export function ProjectRow({ project, fileCount, isFavorite, onToggleFavorite, onInvite, onDelete }: ProjectRowProps) {
  return (
    <li style={{
      display: 'grid',
      gridTemplateColumns: '40px 1fr 140px 120px 80px',
      gap: 12,
      alignItems: 'center',
      padding: '10px 12px',
      border: '1px solid rgba(0,0,0,0.06)',
      borderRadius: 10,
      marginBottom: 8,
      background: '#fff',
      position: 'relative'
    }}>
      <button
        type="button"
        onClick={() => onToggleFavorite(project.id)}
        aria-label={isFavorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.08)',
          background: isFavorite ? '#fef3c7' : 'transparent',
          color: isFavorite ? '#f59e0b' : '#9ca3af',
          cursor: 'pointer'
        }}
      >
        <Star size={16} fill={isFavorite ? '#fbbf24' : 'none'} />
      </button>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{project.title}</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{fileCount}개</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{project.lastModified}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => onInvite(project.id)}
          style={{
            padding: '4px 8px',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 6,
            background: '#fff',
            fontSize: 11,
            cursor: 'pointer'
          }}
        >초대</button>
        <button
          type="button"
          onClick={() => onDelete(project.id)}
          style={{
            padding: '4px 8px',
            border: '1px solid #dc2626',
            borderRadius: 6,
            background: '#dc2626',
            color: '#fff',
            fontSize: 11,
            cursor: 'pointer'
          }}
        >삭제</button>
      </div>
    </li>
  )
}