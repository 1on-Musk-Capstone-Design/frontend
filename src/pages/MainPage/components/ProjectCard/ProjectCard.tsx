import React from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import styles from './ProjectCard.module.css'

export interface ProjectCardProps {
  id: string
  thumbnailUrl?: string
  title: string
  lastModified: string
  ownerName?: string
  ownerProfileImage?: string
  isOwner?: boolean
  onDelete?: (id: string) => void
  onLeave?: (id: string) => void
  onInvite?: (id: string) => void
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
  isTrash?: boolean
  onRestore?: (id: string) => void
  onPermanentDelete?: (id: string) => void
}

export default function ProjectCard({ id, thumbnailUrl, title, lastModified, ownerName, ownerProfileImage, isOwner, onDelete, onLeave, onInvite, isFavorite = false, onToggleFavorite, isTrash = false, onRestore, onPermanentDelete }: ProjectCardProps) {
  // Stable light pastel color via high-range RGB (based on id + title)
  const getPastelRGB = (seed: string) => {
    let h1 = 0, h2 = 0, h3 = 0
    for (let i = 0; i < seed.length; i++) {
      const c = seed.charCodeAt(i)
      h1 = (h1 * 31 + c) | 0
      h2 = (h2 * 33 + c) | 0
      h3 = (h3 * 37 + c) | 0
    }
    const clamp = (n: number) => {
      const min = 200, max = 245 // high RGB for lighter pastels
      const x = Math.abs(n) % (max - min + 1)
      return min + x
    }
    const r = clamp(h1)
    const g = clamp(h2)
    const b = clamp(h3)
    return `rgb(${r}, ${g}, ${b})`
  }

  const [imageError, setImageError] = React.useState(false)
  const localPhoto = typeof window !== 'undefined' ? localStorage.getItem('userPhotoURL') || '' : ''
  const localName = typeof window !== 'undefined' ? localStorage.getItem('userName') || '' : ''
  const effectiveOwnerImage = isOwner ? (localPhoto || ownerProfileImage || '') : (ownerProfileImage || '')
  const hasValidImage = effectiveOwnerImage && effectiveOwnerImage.trim() !== '' && !imageError
  const hasThumbImage = !!(thumbnailUrl && thumbnailUrl.trim() !== '')
  const pastelBg = getPastelRGB(`${id}-${title}`)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete) {
      onDelete(id)
    }
  }

  const handleLeaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onLeave) {
      onLeave(id)
    }
  }

  const handleInviteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onInvite) {
      onInvite(id)
    }
  }

  const handleRestoreClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onRestore) onRestore(id)
  }

  const handlePermanentDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onPermanentDelete) onPermanentDelete(id)
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
          <div className={`${styles.thumb} ${isTrash ? styles.thumbGrayscale : ''}`} style={hasThumbImage ? undefined : { background: pastelBg }}>
            {hasThumbImage ? (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={thumbnailUrl} alt={`${title} 썸네일`} className={styles.img} />
            ) : null}
          </div>

          <div className={styles.body}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.metaContainer}>
              <p className={styles.meta}>{lastModified}</p>
              {ownerName && (
                <div className={styles.ownerInfo}>
                  <div className={styles.ownerBadgeContainer}>
                    {hasValidImage ? (
                      <img 
                        src={effectiveOwnerImage} 
                        alt={isOwner ? (localName || ownerName || '내 프로젝트') : (ownerName || '소유자')} 
                        className={styles.ownerProfileImage}
                        onError={() => {
                          setImageError(true)
                        }}
                      />
                    ) : (
                      <div className={styles.ownerProfilePlaceholder}>
                        {(isOwner ? (localName || ownerName || 'N') : (ownerName || 'N')).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={styles.ownerText}>
                      {isOwner ? (localName || '내 프로젝트') : ownerName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      </Link>
      <div className={styles.actionButtons}>
        {isTrash ? (
          <>
            {onRestore && (
              <button
                className={styles.restoreButton}
                onClick={handleRestoreClick}
                aria-label={`${title} 복구`}
                type="button"
                title="복구"
              >
                {/* RotateCcw icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V1L7 6l5 5V7c3.86 0 7 3.14 7 7 0 1.11-.27 2.16-.75 3.08l1.46 1.46A8.96 8.96 0 0 0 21 14c0-4.97-4.03-9-9-9z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </button>
            )}
            {onPermanentDelete && (
              <button
                className={styles.permanentDeleteButton}
                onClick={handlePermanentDeleteClick}
                aria-label={`${title} 영구 삭제`}
                type="button"
                title="영구 삭제"
              >
                {/* Trash2 icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M7 6v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M10 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <>
            {onInvite && isOwner && (
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
            {isOwner && onDelete && (
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
            {!isOwner && onLeave && (
              <button
                className={styles.leaveButton}
                onClick={handleLeaveClick}
                aria-label={`${title} 나가기`}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10.6667 12L14 8M14 8L10.6667 4M14 8H2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
