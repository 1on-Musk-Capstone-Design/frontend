import React from 'react'
import { Link } from 'react-router-dom'
import styles from './ProjectCard.module.css'

export interface ProjectCardProps {
  id: string
  thumbnailUrl?: string
  title: string
  lastModified: string
}

export default function ProjectCard({ id, thumbnailUrl, title, lastModified }: ProjectCardProps) {
  return (
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
  )
}
