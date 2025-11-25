import React, { useEffect } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  variant?: 'default' | 'card'
}

export default function Modal({ isOpen, onClose, children, variant = 'default' }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      console.log('Modal 컴포넌트: 모달이 열렸습니다')
    }
  }, [isOpen])

  if (!isOpen) return null

  const contentClass = variant === 'card' ? styles.cardVariant : styles.content
  const closeClass = variant === 'card' ? styles.closeBtnCard : styles.closeBtn

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={contentClass} onClick={(e) => e.stopPropagation()}>
        <button aria-label="닫기" className={closeClass} onClick={onClose}>
          ×
        </button>
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  )
}
