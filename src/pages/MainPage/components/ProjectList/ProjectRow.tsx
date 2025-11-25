import React from 'react'
import { Star, UserPlus, Trash } from 'lucide-react'
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
    <li
      className="grid grid-cols-[40px_1fr_140px_120px_80px] gap-3 items-center py-4 px-3 mb-2 bg-white rounded-lg border border-black/5 hover:bg-gray-50 transition-colors"
      style={{ position: 'relative' }}
    >
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
      <div className="text-[15px] font-medium text-gray-900">{project.title}</div>
      <div className="text-sm text-gray-500">{fileCount}개</div>
      <div className="text-sm text-gray-500">{project.lastModified}</div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onInvite(project.id)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 transition-colors group"
          aria-label="프로젝트 초대"
        >
          <UserPlus size={18} className="text-blue-500 group-hover:text-blue-600 transition-colors" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(project.id)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors group"
          aria-label="프로젝트 삭제"
        >
          <Trash size={18} className="text-red-500 group-hover:text-red-600 transition-colors" />
        </button>
      </div>
    </li>
  )
}