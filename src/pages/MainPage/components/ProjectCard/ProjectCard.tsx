import React from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import styles from './ProjectCard.module.css'

export interface ProjectCardProps {
  id: string
  thumbnailUrl?: string
  previewItems?: Array<{ x: number; y: number; width: number; height: number; background?: string }>
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

export default function ProjectCard({ id, thumbnailUrl, previewItems, title, lastModified, ownerName, ownerProfileImage, isOwner, onDelete, onLeave, onInvite, isFavorite = false, onToggleFavorite, isTrash = false, onRestore, onPermanentDelete }: ProjectCardProps) {
  // Pastel palette (UI/UX guided selection)
  const PASTEL_PALETTE = [
    '#FFD1DC', // pastel pink
    '#AEC6CF', // pastel blue
    '#FFFACD', // pastel yellow
    '#77DD77', // pastel green
    '#B39EB5', // pastel purple
    '#FFB347', // pastel orange
  ] as const

  // Deterministic palette selection based on seed (id + title)
  const getPastelFromPalette = (seed: string) => {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0
    }
    const idx = Math.abs(hash) % PASTEL_PALETTE.length
    return PASTEL_PALETTE[idx]
  }

  const [imageError, setImageError] = React.useState(false)
  const localPhoto = typeof window !== 'undefined' ? localStorage.getItem('userPhotoURL') || '' : ''
  const localName = typeof window !== 'undefined' ? localStorage.getItem('userName') || '' : ''
  const effectiveOwnerImage = isOwner ? (localPhoto || ownerProfileImage || '') : (ownerProfileImage || '')
  const hasValidImage = effectiveOwnerImage && effectiveOwnerImage.trim() !== '' && !imageError
  const hasThumbImage = !!(thumbnailUrl && thumbnailUrl.trim() !== '')
  const pastelBg = getPastelFromPalette(`${id}-${title}`)
  const [showThumb, setShowThumb] = React.useState<boolean>(hasThumbImage)
  // 새 프로젝트는 흰 화면으로 표시
  const isEmptyThumbnail = !thumbnailUrl || thumbnailUrl.trim() === ''

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
          <div
            className={`${styles.thumb} ${isTrash ? styles.thumbGrayscale : ''}`}
            style={isEmptyThumbnail ? { background: '#ffffff', overflow: 'hidden', pointerEvents: 'none' } : (showThumb ? undefined : { background: pastelBg, overflow: 'hidden', pointerEvents: 'none' })}
          >
            {/* 사용자 정보를 썸네일 영역 오른쪽 위에 배치 */}
            {ownerName && (
              <div className={styles.ownerInfoOverlay}>
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
            {previewItems && previewItems.length > 0 ? (
              <div
                style={{
                  position: 'relative',
                  width: 1200,
                  height: 720,
                  transform: 'scale(0.25)',
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                }}
              >
                {previewItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: item.x,
                      top: item.y,
                      width: item.width,
                      height: item.height,
                      background: item.background || 'rgba(0,0,0,0.08)',
                      borderRadius: 6,
                    }}
                  />
                ))}
              </div>
            ) : showThumb ? (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img 
                src={thumbnailUrl} 
                alt="" 
                className={styles.img}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  setShowThumb(false) // fall back to solid pastel background
                }}
                onLoad={(e) => {
                  // blob URL인 경우 이미지 로드 성공 확인
                  const target = e.target as HTMLImageElement
                  if (thumbnailUrl && thumbnailUrl.startsWith('blob:')) {
                    // blob URL이 유효한지 확인
                    try {
                      const img = new Image()
                      img.onerror = () => {
                        target.style.display = 'none'
                        setShowThumb(false)
                      }
                      img.src = thumbnailUrl
                    } catch (err) {
                      target.style.display = 'none'
                      setShowThumb(false)
                    }
                  }
                }}
              />
            ) : null}
          </div>

          <div className={styles.body}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.metaContainer}>
              <p className={styles.meta}>{lastModified}</p>
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
