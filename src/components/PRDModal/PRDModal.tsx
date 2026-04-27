import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Sparkles, FileText, Layers, GitBranch,
  Check, Loader2, ChevronDown, ChevronUp,
  Search, CheckSquare, Square, AlertCircle,
  ArrowRight, Users, Zap, Target,
  Code2, TrendingUp, Shield, Download, X
} from 'lucide-react'
import axios from 'axios'
import { usePRDModal } from '../../context/PRDModalContext'
import { PrdCompletionPanel } from '../prd/PrdCompletionPanel'
import { PrdMarkdownBody } from '../prd/PrdMarkdownBody'
import { API_BASE_URL } from '../../config/api'
import styles from './PRDModal.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IdeaCard {
  id: string | number
  text: string
  selected: boolean
}

type TabId = 'prd' | 'spec' | 'flow'
type GenerateState = 'idle' | 'loading' | 'done' | 'error'

interface PRDResult {
  projectName: string
  cards: string[]
  generatedAt: string
  prdMarkdown?: string
  vercelPreviewUrl?: string
  vercelProductionUrl?: string
  githubRepoUrl?: string
  ideaId?: number
  jobId?: number
  workspaceId?: number
  prdViewUrl?: string
  prdViewPath?: string
}

const STEPS = [
  '아이디어 카드 분석 중...',
  'AI가 내용을 이해하는 중...',
  'PRD 구조 설계 중...',
  '문서 작성 중...',
  '완료',
]

const DEMO_CARDS: Omit<IdeaCard, 'selected'>[] = [
  { id: 'demo-1', text: '실시간 협업 캔버스에서 여러 사용자가 동시에 포스트잇을 추가·편집할 수 있어야 한다' },
  { id: 'demo-2', text: '드래그 앤 드롭으로 카드 위치를 자유롭게 변경 가능해야 한다' },
  { id: 'demo-3', text: '카드에 색상 태그를 붙여 카테고리를 구분할 수 있어야 한다' },
  { id: 'demo-4', text: 'AI가 카드 내용을 분석해 자동으로 그룹핑을 제안해야 한다' },
  { id: 'demo-5', text: '캔버스 히스토리(실행 취소/다시 실행)를 지원해야 한다' },
  { id: 'demo-6', text: '완성된 캔버스를 PNG/PDF로 내보낼 수 있어야 한다' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePRD(projectName: string, cards: string[]) {
  const features = cards.slice(0, 6).map((c, i) => ({
    name: c.split(/[.。\n]/)[0].trim().slice(0, 35) || `기능 ${i + 1}`,
    priority: i < 2 ? 'Must Have' : i < 4 ? 'Should Have' : 'Could Have',
    desc: c.slice(0, 80),
    acceptance: [`${c.slice(0, 20)}... 정상 동작`, '응답 시간 200ms 이내', '에러 없이 완료'],
  }))
  const flowSteps = [
    { step: 1, actor: '사용자', action: '서비스 접속 및 로그인', result: '메인 화면 진입' },
    { step: 2, actor: '사용자', action: '핵심 기능 탐색', result: '기능 목록 확인' },
    ...cards.slice(0, 3).map((c, i) => ({
      step: i + 3,
      actor: '사용자',
      action: c.split(/[.。\n]/)[0].trim().slice(0, 40) || `작업 ${i + 3}`,
      result: '성공적으로 완료',
    })),
    { step: cards.length + 3, actor: '시스템', action: '결과 저장 및 알림', result: '완료 상태 반영' },
  ]
  return { features, flowSteps }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IdeaCardItem({ card, onToggle }: { card: IdeaCard; onToggle: (id: string | number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = card.text.length > 60

  return (
    <div
      className={`${styles.card} ${card.selected ? styles.cardSelected : ''}`}
      onClick={() => onToggle(card.id)}
    >
      <div className={styles.cardCheckbox}>
        {card.selected ? <CheckSquare size={14} className={styles.checkOn} /> : <Square size={14} className={styles.checkOff} />}
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardText}>
          {isLong && !expanded ? card.text.slice(0, 60) + '…' : card.text}
        </p>
        {isLong && (
          <button className={styles.expandBtn} onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}>
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
    </div>
  )
}

function LoadingPanel({ step }: { step: number }) {
  return (
    <div className={styles.loadingWrap}>
      <Loader2 size={28} className={styles.spinIcon} />
      <h3 className={styles.loadingTitle}>PRD 생성 중</h3>
      <div className={styles.loadingSteps}>
        {STEPS.map((s, i) => (
          <div key={i} className={`${styles.loadingStep} ${i < step ? styles.stepDone : i === step ? styles.stepActive : styles.stepPending}`}>
            {i < step ? <Check size={12} /> : i === step ? <Loader2 size={12} className={styles.spinIcon} /> : <span className={styles.stepDot} />}
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyPanel() {
  return (
    <div className={styles.emptyWrap}>
      <Sparkles size={28} className={styles.emptyIcon} />
      <h3 className={styles.emptyTitle}>PRD를 생성해보세요</h3>
      <p className={styles.emptyDesc}>왼쪽에서 카드를 선택한 뒤<br />"PRD 생성하기"를 눌러주세요</p>
    </div>
  )
}

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'prd', label: 'PRD', icon: FileText },
  { id: 'spec', label: '기능명세서', icon: Layers },
  { id: 'flow', label: '유저플로우', icon: GitBranch },
]

function PRDTab({ result }: { result: PRDResult }) {
  if (result.prdMarkdown) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.prdMarkdownDoc}>
          <PrdMarkdownBody markdown={result.prdMarkdown} />
        </div>
      </div>
    )
  }
  const { features } = makePRD(result.projectName, result.cards)
  return (
    <div className={styles.tabContent}>
      <div className={styles.prdSection}>
        <div className={styles.prdSectionHead}><Target size={14} /><span>프로젝트 개요</span></div>
        <p className={styles.prdBody}>
          <strong>{result.projectName}</strong>은(는) {result.cards.length}개의 아이디어 카드를 분석하여 작성된 PRD입니다.
        </p>
      </div>
      <div className={styles.prdSection}>
        <div className={styles.prdSectionHead}><Zap size={14} /><span>핵심 기능 요약</span></div>
        <div className={styles.featureSummaryList}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureSummaryItem}>
              <span className={`${styles.priorityBadge} ${f.priority === 'Must Have' ? styles.must : f.priority === 'Should Have' ? styles.should : styles.could}`}>{f.priority}</span>
              <span className={styles.featureSummaryName}>{f.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.prdSection}>
        <div className={styles.prdSectionHead}><TrendingUp size={14} /><span>성공 지표</span></div>
        <div className={styles.metricGrid}>
          {[
            { label: '주요 기능', value: `${features.filter(f => f.priority === 'Must Have').length}개` },
            { label: '총 카드', value: `${result.cards.length}개` },
            { label: '생성일', value: result.generatedAt },
          ].map(m => (
            <div key={m.label} className={styles.metricItem}>
              <div className={styles.metricValue}>{m.value}</div>
              <div className={styles.metricLabel}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SpecTab({ result }: { result: PRDResult }) {
  const { features } = makePRD(result.projectName, result.cards)
  return (
    <div className={styles.tabContent}>
      <div className={styles.prdSection}>
        <div className={styles.prdSectionHead}><Code2 size={14} /><span>기능 명세서</span></div>
        <div className={styles.specTable}>
          <div className={styles.specTableHead}><span>기능명</span><span>우선순위</span><span>설명</span></div>
          {features.map((f, i) => (
            <div key={i} className={styles.specTableRow}>
              <span className={styles.specName}>{f.name}</span>
              <span className={`${styles.priorityBadge} ${f.priority === 'Must Have' ? styles.must : f.priority === 'Should Have' ? styles.should : styles.could}`}>{f.priority}</span>
              <span className={styles.specDesc}>{f.desc || '-'}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.prdSection}>
        <div className={styles.prdSectionHead}><Shield size={14} /><span>인수 조건</span></div>
        {features.slice(0, 3).map((f, i) => (
          <div key={i} className={styles.acceptanceBlock}>
            <div className={styles.acceptanceName}>{f.name}</div>
            {f.acceptance.map((a, j) => (
              <div key={j} className={styles.acceptanceItem}><Check size={11} className={styles.checkOn} /><span>{a}</span></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function FlowTab({ result }: { result: PRDResult }) {
  const { flowSteps } = makePRD(result.projectName, result.cards)
  return (
    <div className={styles.tabContent}>
      <div className={styles.prdSection}>
        <div className={styles.prdSectionHead}><GitBranch size={14} /><span>유저플로우</span></div>
        <div className={styles.flowList}>
          {flowSteps.map((s, i) => (
            <div key={i} className={styles.flowItem}>
              <div className={styles.flowLeft}>
                <div className={styles.flowNode}>{s.step}</div>
                {i < flowSteps.length - 1 && <div className={styles.flowLine} />}
              </div>
              <div className={styles.flowContent}>
                <div className={styles.flowActor}><Users size={10} />{s.actor}</div>
                <div className={styles.flowAction}>{s.action}</div>
                <div className={styles.flowResult}><ArrowRight size={10} />{s.result}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Modal Component ─────────────────────────────────────────────────────

export default function PRDModal() {
  const { isOpen, workspaceId, projectName, closePRDModal } = usePRDModal()

  const [cards, setCards] = useState<IdeaCard[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [query, setQuery] = useState('')
  const [genState, setGenState] = useState<GenerateState>('idle')
  const [genStep, setGenStep] = useState(0)
  const [result, setResult] = useState<PRDResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('prd')
  const resultRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setGenState('idle')
      setResult(null)
      setErrorMsg('')
      setQuery('')
      setActiveTab('prd')
    }
  }, [isOpen])

  // Load cards when modal opens
  useEffect(() => {
    if (!isOpen) return
    async function load() {
      if (!workspaceId) {
        setCards(DEMO_CARDS.map(c => ({ ...c, selected: true })))
        return
      }
      setLoadingCards(true)
      try {
        const token = localStorage.getItem('accessToken')
        const res = await axios.get(`${API_BASE_URL}/v1/ideas/workspaces/${workspaceId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const items: IdeaCard[] = (res.data as any[])
          .filter((d: any) => (d.content || d.text || '').trim().length > 0)
          .map((d: any) => ({ id: d.id, text: d.content || d.text || '', selected: true }))
        setCards(items.length > 0 ? items : DEMO_CARDS.map(c => ({ ...c, selected: true })))
      } catch {
        setCards(DEMO_CARDS.map(c => ({ ...c, selected: true })))
      } finally {
        setLoadingCards(false)
      }
    }
    load()
  }, [isOpen, workspaceId])

  const toggleCard = useCallback((id: string | number) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c))
  }, [])

  const selectedCount = cards.filter(c => c.selected).length
  const allSelected = cards.length > 0 && selectedCount === cards.length

  function toggleAll() {
    setCards(prev => prev.map(c => ({ ...c, selected: !allSelected })))
  }

  const filteredCards = cards.filter(c => c.text.toLowerCase().includes(query.toLowerCase()))

  function handleSaveDocument() {
    if (!result) return
    const title = document.title
    document.title = `${result.projectName}_PRD_${result.generatedAt}`
    window.print()
    document.title = title
  }

  async function handleGenerate() {
    const selected = cards.filter(c => c.selected)
    if (selected.length === 0) return
    setGenState('loading')
    setGenStep(0)
    setErrorMsg('')

    const stepTimer = setInterval(() => {
      setGenStep(prev => {
        if (prev >= STEPS.length - 2) { clearInterval(stepTimer); return prev }
        return prev + 1
      })
    }, 900)

    try {
      if (workspaceId) {
        const token = localStorage.getItem('accessToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const body = selected.map((c, i) => `### 카드 ${i + 1}\n${c.text}`).join('\n\n---\n\n')
        const ideaRes = await axios.post(
          `${API_BASE_URL}/v1/ideas`,
          { workspaceId: Number(workspaceId), content: `[PRD_PIPELINE]\n${body}` },
          { headers: { ...headers, 'Content-Type': 'application/json' } }
        )
        const ideaId = ideaRes.data.id
        const pipelineRes = await axios.post(
          `${API_BASE_URL}/v1/ideas/${ideaId}/prototype/pipeline`,
          {}, { headers, params: { sync: false }, validateStatus: (s: number) => s >= 200 && s < 300 }
        )
        const jobId = pipelineRes.data.jobId
        for (let i = 0; i < 90; i++) {
          await new Promise(r => setTimeout(r, 2000))
          const poll = await axios.get(`${API_BASE_URL}/v1/ideas/${ideaId}/prototype/jobs/${jobId}`, { headers })
          if (poll.data.status === 'FAILED') throw new Error(poll.data.message || 'PRD 생성 실패')
          const isDeployed = poll.data.status === 'DEPLOYED'
          const fallbackReady =
            i >= 60 &&
            ['PRD_GENERATED', 'UI_GENERATED', 'CODE_GENERATED', 'GITHUB_PUSHED'].includes(
              poll.data.status
            ) &&
            Boolean((poll.data.prdMarkdown || '').trim())
          if (isDeployed || fallbackReady) {
            clearInterval(stepTimer)
            setGenStep(STEPS.length - 1)
            const p = poll.data as {
              prdMarkdown?: string
              prdViewUrl?: string
              prdViewPath?: string
              workspaceId?: number
              ideaId?: number
              jobId?: number
              vercelPreviewUrl?: string
              vercelProductionUrl?: string
              githubRepoUrl?: string
            }
            const wsNum = Number(workspaceId)
            const ws = p.workspaceId ?? (Number.isFinite(wsNum) ? wsNum : undefined)
            const jid = p.jobId ?? jobId
            setResult({
              projectName,
              cards: selected.map(c => c.text),
              generatedAt: new Date().toLocaleDateString('ko-KR'),
              prdMarkdown: p.prdMarkdown || undefined,
              prdViewUrl: p.prdViewUrl || undefined,
              prdViewPath: p.prdViewPath || undefined,
              ideaId: p.ideaId ?? ideaId,
              jobId: jid,
              workspaceId: ws,
              vercelPreviewUrl: p.vercelPreviewUrl || undefined,
              vercelProductionUrl: p.vercelProductionUrl || undefined,
              githubRepoUrl: p.githubRepoUrl || undefined,
            })
            setGenState('done')
            const toOpen =
              (typeof p.prdViewUrl === 'string' && p.prdViewUrl.trim()) ||
              (p.prdViewPath &&
                `${window.location.origin}${p.prdViewPath.startsWith('/') ? '' : '/'}${p.prdViewPath}`) ||
              (ws != null && jid != null
                ? `${window.location.origin}/prd/workspaces/${ws}/prds/${jid}`
                : '')
            if (toOpen) {
              window.open(toOpen, '_blank', 'noopener,noreferrer')
            }
            return
          }
        }
        throw new Error('시간 초과: 잠시 후 다시 시도해주세요')
      } else {
        await new Promise(r => setTimeout(r, 4500))
        clearInterval(stepTimer)
        setGenStep(STEPS.length - 1)
        setResult({ projectName, cards: selected.map(c => c.text), generatedAt: new Date().toLocaleDateString('ko-KR') })
        setGenState('done')
      }
    } catch (err: any) {
      clearInterval(stepTimer)
      setErrorMsg(err?.response?.data?.message || err?.message || 'PRD 생성에 실패했습니다')
      setGenState('error')
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={closePRDModal}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.badge}><Sparkles size={11} />AI 기반 자동 생성</div>
            <h2 className={styles.title}>PRD 생성기</h2>
            {projectName && <span className={styles.projectTag}>{projectName}</span>}
          </div>
          <button className={styles.closeBtn} onClick={closePRDModal} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        {/* Split layout */}
        <div className={styles.splitLayout}>

          {/* Left panel */}
          <div className={styles.leftPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>아이디어 카드</span>
              <span className={styles.cardCount}>{selectedCount}/{cards.length}</span>
            </div>

            <div className={styles.searchWrap}>
              <Search size={12} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="카드 검색..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            <button className={styles.selectAllBtn} onClick={toggleAll}>
              {allSelected ? <CheckSquare size={13} className={styles.checkOn} /> : <Square size={13} className={styles.checkOff} />}
              <span>전체 {allSelected ? '해제' : '선택'}</span>
            </button>

            <div className={styles.cardList}>
              {loadingCards ? (
                <div className={styles.cardsLoading}><Loader2 size={16} className={styles.spinIcon} /><span>불러오는 중...</span></div>
              ) : filteredCards.length === 0 ? (
                <div className={styles.cardsEmpty}><AlertCircle size={14} /><span>카드가 없습니다</span></div>
              ) : (
                filteredCards.map(card => <IdeaCardItem key={card.id} card={card} onToggle={toggleCard} />)
              )}
            </div>

            <div className={styles.leftFooter}>
              <button
                className={styles.generateBtn}
                onClick={handleGenerate}
                disabled={selectedCount === 0 || genState === 'loading'}
              >
                {genState === 'loading' ? (
                  <><Loader2 size={14} className={styles.spinIcon} />생성 중...</>
                ) : (
                  <><Sparkles size={14} />PRD 생성하기<ArrowRight size={13} /></>
                )}
              </button>
            </div>
          </div>

          {/* Right panel */}
          <div className={styles.rightPanel}>
            {genState === 'idle' && <EmptyPanel />}
            {genState === 'loading' && <LoadingPanel step={genStep} />}
            {genState === 'error' && (
              <div className={styles.errorWrap}>
                <AlertCircle size={26} className={styles.errorIcon} />
                <h3 className={styles.errorTitle}>생성 실패</h3>
                <p className={styles.errorMsg}>{errorMsg}</p>
                <button className={styles.retryBtn} onClick={() => setGenState('idle')}>다시 시도</button>
              </div>
            )}
            {genState === 'done' && result && (
              <div className={styles.resultWrap} ref={resultRef}>
                {((result.workspaceId != null && result.jobId != null) || result.prdViewUrl) && (
                  <PrdCompletionPanel
                    info={{
                      workspaceId: result.workspaceId,
                      jobId: result.jobId,
                      ideaId: result.ideaId,
                      prdViewUrl: result.prdViewUrl,
                      prdViewPath: result.prdViewPath,
                    }}
                  />
                )}
                <div className={styles.tabBar}>
                  {TABS.map(tab => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <Icon size={12} />{tab.label}
                      </button>
                    )
                  })}
                  <div className={styles.tabSuccess}><Check size={11} />완료</div>
                  <button className={styles.saveDocBtn} onClick={handleSaveDocument}>
                    <Download size={12} />저장
                  </button>
                </div>
                {activeTab === 'prd' && <PRDTab result={result} />}
                {activeTab === 'spec' && <SpecTab result={result} />}
                {activeTab === 'flow' && <FlowTab result={result} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
