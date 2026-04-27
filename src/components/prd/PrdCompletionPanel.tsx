import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { ExternalLink, Copy, Check, RefreshCw, Globe } from 'lucide-react'
import { API_BASE_URL } from '../../config/api'
import styles from './PrdCompletionPanel.module.css'

export type PrdCompletionInfo = {
  workspaceId?: number
  jobId?: number
  ideaId?: number
  prdViewUrl?: string
  prdViewPath?: string
}

type Props = {
  info: PrdCompletionInfo | null
}

function buildOpenUrl(info: PrdCompletionInfo | null): string | null {
  if (!info) return null
  const u = info.prdViewUrl?.trim()
  if (u) return u
  const p = info.prdViewPath?.trim()
  if (p) {
    if (p.startsWith('http')) return p
    return `${window.location.origin}${p.startsWith('/') ? '' : '/'}${p}`
  }
  if (info.workspaceId != null && info.jobId != null) {
    return `${window.location.origin}/prd/workspaces/${info.workspaceId}/prds/${info.jobId}`
  }
  return null
}

export function PrdCompletionPanel({ info }: Props) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  const openUrl = buildOpenUrl(info)

  const loadPreview = useCallback(async () => {
    if (info?.workspaceId == null || info?.jobId == null) {
      setPreviewHtml(null)
      setPreviewError('워크스페이스·작업 ID가 없어 프리뷰를 불러올 수 없습니다.')
      return
    }
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setPreviewError('로그인이 필요해 프리뷰를 불러올 수 없습니다.')
      return
    }
    setLoadingPreview(true)
    setPreviewError(null)
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/v1/workspaces/${info.workspaceId}/prds/${info.jobId}/preview`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'text' }
      )
      setPreviewHtml(typeof data === 'string' ? data : null)
    } catch {
      setPreviewHtml(null)
      setPreviewError('미리보기를 불러오지 못했습니다. 잠시 후 새로고침 해 보세요.')
    } finally {
      setLoadingPreview(false)
    }
  }, [info?.workspaceId, info?.jobId])

  useEffect(() => {
    if (info?.workspaceId != null && info?.jobId != null) {
      void loadPreview()
    } else {
      setPreviewHtml(null)
      setPreviewError(null)
    }
  }, [info?.workspaceId, info?.jobId, loadPreview])

  if (!info || (openUrl == null && info.workspaceId == null)) {
    return null
  }

  function copyUrl() {
    if (!openUrl) return
    void navigator.clipboard.writeText(openUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function openInNewTab() {
    if (!openUrl) return
    window.open(openUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <Globe size={18} className={styles.titleIcon} />
        <h3 className={styles.title}>PRD가 준비되었어요</h3>
      </div>
      <p className={styles.lead}>
        아래 링크로 팀과 같은 PRD·미리보기 화면을 열 수 있어요. 새 탭이 뜨지 않았다면 버튼을 눌러 주세요.
      </p>
      {openUrl && (
        <div className={styles.urlRow}>
          <code className={styles.urlText}>{openUrl}</code>
          <button type="button" className={styles.iconBtn} onClick={copyUrl} title="URL 복사">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button type="button" className={styles.primaryBtn} onClick={openInNewTab}>
            <ExternalLink size={15} />
            새 탭에서 열기
          </button>
        </div>
      )}

      <div className={styles.previewHead}>
        <span className={styles.previewLabel}>화면 미리보기</span>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => void loadPreview()}
          disabled={loadingPreview}
        >
          <RefreshCw size={14} className={loadingPreview ? styles.spin : ''} />
          새로고침
        </button>
      </div>
      {loadingPreview && !previewHtml && !previewError && (
        <div className={styles.previewLoading}>프리뷰 불러오는 중…</div>
      )}
      {previewHtml && (
        <div className={styles.iframeShell}>
          <iframe
            title="prototype-preview"
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-same-origin"
            className={styles.iframe}
          />
        </div>
      )}
      {previewError && (
        <div className={styles.previewError}>{previewError}</div>
      )}
    </div>
  )
}
