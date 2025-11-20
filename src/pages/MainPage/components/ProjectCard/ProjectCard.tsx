import React from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import styles from './ProjectCard.module.css'

export interface ProjectCardProps {
  id: string
  thumbnailUrl?: string
  title: string
  lastModified: string
  onDelete?: (id: string) => void
  onInvite?: (id: string) => void
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
}

export default function ProjectCard({ id, thumbnailUrl, title, lastModified, onDelete, onInvite, isFavorite = false, onToggleFavorite }: ProjectCardProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete) {
      onDelete(id)
    }
  }

  const handleInviteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onInvite) {
      onInvite(id)
    }
  }

  return (
    <div className={styles.cardWrapper}>
      {/* Favorite star overlay */}
      {onToggleFavorite && (
        <button
          type="button"
          aria-label={isFavorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(id); }}
          className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-gray-400 hover:text-yellow-500"
          style={{ color: isFavorite ? '#fbbf24' : undefined }}
        >
          <Star size={18} fill={isFavorite ? '#fbbf24' : 'none'} color={isFavorite ? '#fbbf24' : 'currentColor'} />
        </button>
      )}
      <Link to={`/canvas/${id}`} className={styles.linkReset} aria-label={`열기 ${title}`}>
        <article className={styles.card}>
          <div className={styles.thumb}>
            {thumbnailUrl ? (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={thumbnailUrl} alt={`${title} 썸네일`} className={styles.img} />
            ) : (
              <div className={styles.placeholder}>썸네일</div>
            )}
          </div>

          <div className={styles.body}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.meta}>{lastModified}</p>
          </div>
        </article>
      </Link>
      <div className={styles.actionButtons}>
        {onInvite && (
          <button
            className={styles.inviteButton}
            onClick={handleInviteClick}
            aria-label={`${title} 초대`}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 3.33333V12.6667M3.33333 8H12.6667"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            className={styles.deleteButton}
            onClick={handleDeleteClick}
            aria-label={`${title} 삭제`}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.66667 7.33333V11.3333"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.33333 7.33333V11.3333"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
