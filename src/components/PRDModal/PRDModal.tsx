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

function canPreviewInIframe(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

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
  usingFallbackUrl?: boolean
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
  usingFallbackUrl,
  errorMessage,
  projectName,
  onClose,
  onRetry,
}: PRDModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const showDeployPreview = status === 'success' && Boolean(deployedUrl && canPreviewInIframe(deployedUrl))

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
      <div
        className={`${styles.card}${showDeployPreview ? ` ${styles.cardWithPreview}` : ''}`}
        onClick={e => e.stopPropagation()}
      >

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
                ? `"${projectName}" PRD가 생성되었습니다.`
                : 'PRD가 생성되었습니다.'}
              {usingFallbackUrl ? (
                <>
                  <br />
                  배포 URL이 준비되지 않아 결과 페이지 링크를 제공합니다.
                </>
              ) : null}
              {showDeployPreview ? (
                <>
                  <br />
                  아래에서 배포 미리보기를 확인하세요.
                </>
              ) : (
                <>
                  <br />
                  아래 링크로 확인하세요.
                </>
              )}
            </p>

            {showDeployPreview && deployedUrl && (
              <div className={styles.previewWrap}>
                <iframe
                  title="배포 미리보기"
                  src={deployedUrl}
                  className={styles.previewFrame}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
                <p className={styles.previewHint}>
                  일부 배포 URL은 보안 정책(X-Frame-Options)으로 미리보기가 비어 보일 수 있습니다. 새 탭에서 열기를
                  이용하세요.
                </p>
              </div>
            )}

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
                새 탭에서 열기
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
