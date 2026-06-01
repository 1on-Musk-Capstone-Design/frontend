import { useState } from 'react'
import { ExternalLink, Copy, Check, Globe, FileText, Layers, GitBranch } from 'lucide-react'
import {
  PRDTabContent,
  SpecTabContent,
  FlowTabContent,
  type PRDData,
} from '../../pages/PRDResultPage/PRDResultPage'
import styles from './PrdCompletionPanel.module.css'

export type PrdCompletionInfo = {
  workspaceId?: number
  jobId?: number
  ideaId?: number
  prdViewUrl?: string
  prdViewPath?: string
}

type TabId = 'prd' | 'spec' | 'flow'

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'prd', label: 'PRD', icon: FileText },
  { id: 'spec', label: '기능명세서', icon: Layers },
  { id: 'flow', label: '유저플로우', icon: GitBranch },
]

type Props = {
  info: PrdCompletionInfo | null
  prdData?: PRDData
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

export function PrdCompletionPanel({ info, prdData }: Props) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('prd')

  const openUrl = buildOpenUrl(info)

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

      {prdData && (
        <div className={styles.previewCard}>
          <div className={styles.previewTabBar}>
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`${styles.previewTabBtn} ${activeTab === tab.id ? styles.previewTabBtnActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className={styles.previewTabContent}>
            {activeTab === 'prd' && <PRDTabContent data={prdData} />}
            {activeTab === 'spec' && <SpecTabContent data={prdData} />}
            {activeTab === 'flow' && <FlowTabContent data={prdData} />}
          </div>
        </div>
      )}
    </div>
  )
}
