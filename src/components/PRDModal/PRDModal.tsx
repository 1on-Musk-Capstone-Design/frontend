/**
 * PRDModal — 공유 PRD 생성 모달
 * - loading: 단계별 진행 표시
 * - success: 배포 URL + 복사 / 열기 버튼
 * - error: 오류 메시지 + 재시도
 */
import React, { useState } from 'react'
import {
  Sparkles, X, Check, Copy, ExternalLink,
  Loader2, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react'
import styles from './PRDModal.module.css'

export type PRDModalStatus = 'loading' | 'success' | 'error' | 'idle'

export interface PRDModalStep {
  label: string
  done: boolean
  active: boolean
}

interface PRDModalProps {
  isOpen: boolean
  status: PRDModalStatus
  steps: PRDModalStep[]
  deployedUrl?: string
  errorMessage?: string
  projectName?: string
  onClose: () => void
  onRetry?: () => void
}

export default function PRDModal({
  isOpen,
  status,
  steps,
  deployedUrl,
  errorMessage,
  projectName,
  onClose,
  onRetry,
}: PRDModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  function copyUrl() {
    if (!deployedUrl) return
    navigator.clipboard.writeText(deployedUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function openUrl() {
    if (deployedUrl) window.open(deployedUrl, '_blank')
  }

  return (
    <div className={styles.overlay} onClick={status !== 'loading' ? onClose : undefined}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>

        {/* ── 닫기 버튼 ── */}
        {status !== 'loading' && (
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        )}

        {/* ═══════════════ LOADING ═══════════════ */}
        {status === 'loading' && (
          <div className={styles.loadingBody}>
            <div className={styles.loadingIconWrap}>
              <Loader2 size={36} className={styles.spin} color="#01CD15" />
            </div>
            <h3 className={styles.loadingTitle}>
              {projectName ? `"${projectName}" PRD 생성 중` : 'PRD 생성 중'}
            </h3>
            <p className={styles.loadingSubtitle}>카드 아이디어를 분석하고 PRD를 작성합니다</p>

            <div className={styles.stepList}>
              {steps.map((step, i) => (
                <div key={i} className={`${styles.step} ${step.done ? styles.stepDone : step.active ? styles.stepActive : styles.stepWait}`}>
                  <div className={styles.stepIconWrap}>
                    {step.done
                      ? <Check size={13} />
                      : step.active
                      ? <Loader2 size={13} className={styles.spin} />
                      : <span className={styles.stepDot} />}
                  </div>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ SUCCESS ═══════════════ */}
        {status === 'success' && deployedUrl && (
          <div className={styles.successBody}>
            <div className={styles.successIconWrap}>
              <CheckCircle2 size={36} color="#01CD15" />
            </div>
            <h3 className={styles.successTitle}>PRD 생성 완료!</h3>
            <p className={styles.successSubtitle}>
              {projectName
                ? `"${projectName}"의 PRD 문서가 생성되었습니다.`
                : 'PRD 문서가 생성 및 배포되었습니다.'}
              <br />
              아래 링크로 바로 확인하세요.
            </p>

            <div className={styles.urlRow}>
              <span className={styles.urlText}>{deployedUrl}</span>
              <button className={styles.copyBtn} onClick={copyUrl} title="링크 복사">
                {copied ? <Check size={14} color="#01CD15" /> : <Copy size={14} />}
              </button>
            </div>

            <div className={styles.actions}>
              <button className={styles.btnGhost} onClick={onClose}>닫기</button>
              <button className={styles.btnPrimary} onClick={openUrl}>
                <ExternalLink size={15} />
                PRD 보러가기
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ ERROR ═══════════════ */}
        {status === 'error' && (
          <div className={styles.errorBody}>
            <div className={styles.errorIconWrap}>
              <AlertCircle size={36} color="#ef4444" />
            </div>
            <h3 className={styles.errorTitle}>생성 실패</h3>
            <p className={styles.errorMsg}>{errorMessage || '알 수 없는 오류가 발생했습니다.'}</p>
            <div className={styles.actions}>
              <button className={styles.btnGhost} onClick={onClose}>닫기</button>
              {onRetry && (
                <button className={styles.btnPrimary} onClick={onRetry}>
                  <Sparkles size={15} />
                  다시 시도
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
