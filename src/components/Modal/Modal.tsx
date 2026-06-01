import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  variant?: 'default' | 'card' | 'bare'
  showCloseButton?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  children,
  variant = 'default',
  showCloseButton = true
}: ModalProps) {
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

  const contentClass = variant === 'card' ? styles.cardVariant : variant === 'bare' ? styles.bareVariant : styles.content
  const closeClass = variant === 'card' ? styles.closeBtnCard : styles.closeBtn

  const modalElement = (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={contentClass} onClick={(e) => e.stopPropagation()}>
        {showCloseButton && (
          <button aria-label="닫기" className={closeClass} onClick={onClose}>
            ×
          </button>
        )}
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  )

  return createPortal(modalElement, document.body)
}
