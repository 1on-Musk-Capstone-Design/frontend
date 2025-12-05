import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className={styles.icon} />
      case 'error':
        return <XCircle size={20} className={styles.icon} />
      case 'warning':
        return <AlertCircle size={20} className={styles.icon} />
      default:
        return null
    }
  }

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.content}>
        {getIcon()}
        <span className={styles.message}>{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={styles.closeButton}
        aria-label="닫기"
      >
        <X size={16} />
      </button>
    </div>
  )
}
