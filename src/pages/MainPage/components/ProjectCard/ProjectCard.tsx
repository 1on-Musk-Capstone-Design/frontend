import React from 'react'
import { Link } from 'react-router-dom'
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
}

export default function ProjectCard({ id, thumbnailUrl, title, lastModified, ownerName, ownerProfileImage, isOwner, onDelete, onLeave, onInvite }: ProjectCardProps) {
  const [imageError, setImageError] = React.useState(false)
  const hasValidImage = ownerProfileImage && ownerProfileImage.trim() !== '' && !imageError

  // 디버깅: 프로필 이미지 정보 로그
  React.useEffect(() => {
    if (ownerName) {
      console.log(`ProjectCard [${title}] 프로필 이미지 정보:`, {
        ownerName,
        ownerProfileImage,
        hasValidImage,
        imageError,
        isOwner
      })
    }
  }, [ownerName, ownerProfileImage, hasValidImage, imageError, isOwner, title])

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

  return (
    <div className={styles.cardWrapper}>
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
            <div className={styles.metaContainer}>
              <p className={styles.meta}>{lastModified}</p>
              {ownerName && (
                <div className={styles.ownerInfo}>
                  <div className={styles.ownerBadgeContainer}>
                    {hasValidImage ? (
                      <img 
                        src={ownerProfileImage} 
                        alt={ownerName} 
                        className={styles.ownerProfileImage}
                        onError={(e) => {
                          console.error(`프로필 이미지 로드 실패 [${title}]:`, ownerProfileImage, e)
                          setImageError(true)
                        }}
                        onLoad={() => {
                          console.log(`프로필 이미지 로드 성공 [${title}]:`, ownerProfileImage)
                        }}
                      />
                    ) : (
                      <div className={styles.ownerProfilePlaceholder}>
                        {ownerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={styles.ownerText}>
                      {isOwner ? '내 프로젝트' : ownerName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      </Link>
      <div className={styles.actionButtons}>
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
      </div>
    </div>
  )
}
