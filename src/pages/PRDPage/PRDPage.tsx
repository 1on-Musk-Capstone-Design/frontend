import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Sparkles, FileText, Layers, GitBranch,
  Check, Loader2, ChevronDown, ChevronUp,
  Search, CheckSquare, Square, AlertCircle,
  ArrowRight, Users, Zap, Target,
  Code2, TrendingUp, Shield, Download
} from 'lucide-react'
import axios from 'axios'
import Sidebar from '../MainPage/components/Sidebar/Sidebar'
import { PrdCompletionPanel } from '../../components/prd/PrdCompletionPanel'
import { API_BASE_URL } from '../../config/api'
import {
  PRDTabContent,
  SpecTabContent,
  FlowTabContent,
  type PRDData,
} from '../PRDResultPage/PRDResultPage'
import styles from './PRDPage.module.css'

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

// ─── Loading steps ────────────────────────────────────────────────────────────

const STEPS = [
  '아이디어 카드 분석 중...',
  'AI가 내용을 이해하는 중...',
  'PRD 구조 설계 중...',
  '문서 작성 중...',
  '완료',
]

// ─── Mock PRD generator ───────────────────────────────────────────────────────

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

// ─── DEMO CARDS ───────────────────────────────────────────────────────────────

const DEMO_CARDS: Omit<IdeaCard, 'selected'>[] = [
  { id: 'demo-1', text: '실시간 협업 캔버스에서 여러 사용자가 동시에 포스트잇을 추가·편집할 수 있어야 한다' },
  { id: 'demo-2', text: '드래그 앤 드롭으로 카드 위치를 자유롭게 변경 가능해야 한다' },
  { id: 'demo-3', text: '카드에 색상 태그를 붙여 카테고리를 구분할 수 있어야 한다' },
  { id: 'demo-4', text: 'AI가 카드 내용을 분석해 자동으로 그룹핑을 제안해야 한다' },
  { id: 'demo-5', text: '캔버스 히스토리(실행 취소/다시 실행)를 지원해야 한다' },
  { id: 'demo-6', text: '완성된 캔버스를 PNG/PDF로 내보낼 수 있어야 한다' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function IdeaCardItem({
  card,
  onToggle,
}: {
  card: IdeaCard
  onToggle: (id: string | number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isLong = card.text.length > 80

  return (
    <div
      className={`${styles.card} ${card.selected ? styles.cardSelected : ''}`}
      onClick={() => onToggle(card.id)}
    >
      <div className={styles.cardCheckbox}>
        {card.selected
          ? <CheckSquare size={16} className={styles.checkOn} />
          : <Square size={16} className={styles.checkOff} />
        }
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardText}>
          {isLong && !expanded ? card.text.slice(0, 80) + '…' : card.text}
        </p>
        {isLong && (
          <button
            className={styles.expandBtn}
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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
      <div className={styles.loadingSpinner}>
        <Loader2 size={36} className={styles.spinIcon} />
      </div>
      <h3 className={styles.loadingTitle}>PRD 생성 중</h3>
      <div className={styles.loadingSteps}>
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`${styles.loadingStep} ${
              i < step ? styles.stepDone : i === step ? styles.stepActive : styles.stepPending
            }`}
          >
            {i < step
              ? <Check size={13} />
              : i === step
              ? <Loader2 size={13} className={styles.spinIcon} />
              : <span className={styles.stepDot} />}
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
      <div className={styles.emptyIcon}>
        <Sparkles size={32} />
      </div>
      <h3 className={styles.emptyTitle}>PRD를 생성해보세요</h3>
      <p className={styles.emptyDesc}>
        왼쪽에서 아이디어 카드를 선택한 뒤<br />
        "PRD 생성하기" 버튼을 눌러주세요
      </p>
      <div className={styles.emptyHints}>
        {[
          { icon: FileText, text: 'PRD 문서 자동 작성' },
          { icon: Layers, text: '기능 명세서 생성' },
          { icon: GitBranch, text: '유저플로우 시각화' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className={styles.emptyHint}>
            <Icon size={14} />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab content components ───────────────────────────────────────────────────

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
        <div className={styles.prdSectionHead}>
          <Target size={16} />
          <span>프로젝트 개요</span>
        </div>
        <p className={styles.prdBody}>
          <strong>{result.projectName}</strong>은(는) 사용자의 아이디어를 바탕으로 설계된 제품입니다.
          총 <strong>{result.cards.length}개</strong>의 아이디어 카드를 분석하여 PRD를 작성했습니다.
        </p>
      </div>

      <div className={styles.prdSection}>
        <div className={styles.prdSectionHead}>
          <Zap size={16} />
          <span>핵심 기능 요약</span>
        </div>
        <div className={styles.featureSummaryList}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureSummaryItem}>
              <span className={`${styles.priorityBadge} ${
                f.priority === 'Must Have' ? styles.must :
                f.priority === 'Should Have' ? styles.should : styles.could
              }`}>{f.priority}</span>
              <span className={styles.featureSummaryName}>{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.prdSection}>
        <div className={styles.prdSectionHead}>
          <Users size={16} />
          <span>목표 사용자</span>
        </div>
        <p className={styles.prdBody}>프로젝트 팀원 및 이해관계자</p>
      </div>

      <div className={styles.prdSection}>
        <div className={styles.prdSectionHead}>
          <TrendingUp size={16} />
          <span>성공 지표</span>
        </div>
        <div className={styles.metricGrid}>
          {[
            { label: '주요 기능 구현', value: `${features.filter(f => f.priority === 'Must Have').length}개` },
            { label: '총 카드 분석', value: `${result.cards.length}개` },
            { label: '생성 일시', value: result.generatedAt },
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
        <div className={styles.prdSectionHead}>
          <Code2 size={16} />
          <span>기능 명세서</span>
        </div>
        <div className={styles.specTable}>
          <div className={styles.specTableHead}>
            <span>기능명</span>
            <span>우선순위</span>
            <span>설명</span>
          </div>
          {features.map((f, i) => (
            <div key={i} className={styles.specTableRow}>
              <span className={styles.specName}>{f.name}</span>
              <span className={`${styles.priorityBadge} ${
                f.priority === 'Must Have' ? styles.must :
                f.priority === 'Should Have' ? styles.should : styles.could
              }`}>{f.priority}</span>
              <span className={styles.specDesc}>{f.desc || '-'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.prdSection}>
        <div className={styles.prdSectionHead}>
          <Shield size={16} />
          <span>인수 조건</span>
        </div>
        {features.slice(0, 3).map((f, i) => (
          <div key={i} className={styles.acceptanceBlock}>
            <div className={styles.acceptanceName}>{f.name}</div>
            {f.acceptance.map((a, j) => (
              <div key={j} className={styles.acceptanceItem}>
                <Check size={12} className={styles.checkOn} />
                <span>{a}</span>
              </div>
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
        <div className={styles.prdSectionHead}>
          <GitBranch size={16} />
          <span>유저플로우</span>
          
        </div>
        <div className={styles.flowList}>
          {flowSteps.map((s, i) => (
            <div key={i} className={styles.flowItem}>
              <div className={styles.flowLeft}>
                <div className={styles.flowNode}>{s.step}</div>
                {i < flowSteps.length - 1 && <div className={styles.flowLine} />}
              </div>
              <div className={styles.flowContent}>
                <div className={styles.flowActor}>
                  <Users size={11} />
                  {s.actor}
                </div>
                <div className={styles.flowAction}>{s.action}</div>
                <div className={styles.flowResult}>
                  <ArrowRight size={11} />
                  {s.result}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function toPRDData(result: PRDResult): PRDData {
  return {
    projectName: result.projectName,
    idea: result.cards.join('\n\n'),
    targetUsers: '프로젝트 팀원',
    features: result.cards.map(c => c.split(/[.。\n]/)[0].trim().slice(0, 30)).filter(Boolean),
    techStack: '',
    timeline: '',
    template: 'standard',
    generatedAt: result.generatedAt,
    prdMarkdown: result.prdMarkdown,
    vercelPreviewUrl: result.vercelPreviewUrl,
    vercelProductionUrl: result.vercelProductionUrl,
    githubRepoUrl: result.githubRepoUrl,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'prd', label: 'PRD', icon: FileText },
  { id: 'spec', label: '기능명세서', icon: Layers },
  { id: 'flow', label: '유저플로우', icon: GitBranch },
]

export default function PRDPage() {
  const [searchParams] = useSearchParams()
  const workspaceIdRaw = searchParams.get('workspaceId')
  const workspaceIdNum = workspaceIdRaw ? Number(workspaceIdRaw) : NaN
  const workspaceId = Number.isFinite(workspaceIdNum) && workspaceIdNum > 0 ? workspaceIdNum : null
  const projectName = searchParams.get('projectName') || '내 프로젝트'

  const [cards, setCards] = useState<IdeaCard[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [query, setQuery] = useState('')

  const [genState, setGenState] = useState<GenerateState>('idle')
  const [genStep, setGenStep] = useState(0)
  const [result, setResult] = useState<PRDResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('prd')
  const resultRef = useRef<HTMLDivElement>(null)

  // ── 문서 저장 (인쇄 → PDF) ──────────────────────────────────────────────
  function handleSaveDocument() {
    if (!result) return
    const title = document.title
    document.title = `${result.projectName}_PRD_${result.generatedAt}`
    window.print()
    document.title = title
  }

  // ── Load idea cards ──────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      if (workspaceId == null) {
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
          .map((d: any) => ({
            id: d.id,
            text: d.content || d.text || '',
            selected: true,
          }))
        setCards(items.length > 0 ? items : DEMO_CARDS.map(c => ({ ...c, selected: true })))
      } catch {
        setCards(DEMO_CARDS.map(c => ({ ...c, selected: true })))
      } finally {
        setLoadingCards(false)
      }
    }
    load()
  }, [workspaceId])

  // ── Card selection ───────────────────────────────────────────────────────

  const toggleCard = useCallback((id: string | number) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c))
  }, [])

  const selectedCount = cards.filter(c => c.selected).length
  const allSelected = cards.length > 0 && selectedCount === cards.length

  function toggleAll() {
    const next = !allSelected
    setCards(prev => prev.map(c => ({ ...c, selected: next })))
  }

  const filteredCards = cards.filter(c =>
    c.text.toLowerCase().includes(query.toLowerCase())
  )

  // ── Generate ─────────────────────────────────────────────────────────────

  async function handleGenerate() {
    const selected = cards.filter(c => c.selected)
    if (selected.length === 0) return

    setGenState('loading')
    setGenStep(0)
    setErrorMsg('')

    // Step progression animation
    const stepTimer = setInterval(() => {
      setGenStep(prev => {
        if (prev >= STEPS.length - 2) { clearInterval(stepTimer); return prev }
        return prev + 1
      })
    }, 900)

    try {
      if (workspaceId != null) {
        // Real API flow
        const token = localStorage.getItem('accessToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        // Create/update bundle idea
        const body = selected.map((c, i) => `### 카드 ${i + 1}\n${c.text}`).join('\n\n---\n\n')
        const ideaRes = await axios.post(
          `${API_BASE_URL}/v1/ideas`,
          { workspaceId, content: `[PRD_PIPELINE]\n${body}` },
          { headers: { ...headers, 'Content-Type': 'application/json' } }
        )
        const ideaId = ideaRes.data.id

        // Start pipeline
        const pipelineRes = await axios.post(
          `${API_BASE_URL}/v1/ideas/${ideaId}/prototype/pipeline`,
          {},
          { headers, params: { sync: false }, validateStatus: s => s >= 200 && s < 300 }
        )
        const jobId = pipelineRes.data.jobId

        // Poll
        for (let i = 0; i < 90; i++) {
          await new Promise(r => setTimeout(r, 2000))
          const poll = await axios.get(
            `${API_BASE_URL}/v1/ideas/${ideaId}/prototype/jobs/${jobId}`,
            { headers }
          )
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
            const ws = p.workspaceId ?? workspaceId
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
              workspaceId: ws ?? undefined,
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
        // Mock flow (no workspaceId)
        await new Promise(r => setTimeout(r, 4500))
        clearInterval(stepTimer)
        setGenStep(STEPS.length - 1)
        setResult({
          projectName,
          cards: selected.map(c => c.text),
          generatedAt: new Date().toLocaleDateString('ko-KR'),
        })
        setGenState('done')
      }
    } catch (err: any) {
      clearInterval(stepTimer)
      const msg = err?.response?.data?.message || err?.message || 'PRD 생성에 실패했습니다'
      setErrorMsg(msg)
      setGenState('error')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.pageRoot}>
      <Sidebar activeMenu="prd" />

      <div className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.badge}>
              <Sparkles size={13} />
              AI 기반 자동 생성
            </div>
            <h1 className={styles.title}>PRD 생성기</h1>
            <p className={styles.subtitle}>아이디어 카드를 선택해 PRD 문서를 자동으로 만들어보세요</p>
          </div>
          {workspaceId && (
            <div className={styles.workspaceBadge}>
              <FileText size={13} />
              {projectName}
            </div>
          )}
        </div>

        {/* Split layout */}
        <div className={styles.splitLayout}>

          {/* ── Left panel ── */}
          <div className={styles.leftPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>아이디어 카드</span>
              <span className={styles.cardCount}>
                {selectedCount}/{cards.length} 선택
              </span>
            </div>

            {/* Search */}
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="카드 검색..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            {/* Select all */}
            <button className={styles.selectAllBtn} onClick={toggleAll}>
              {allSelected
                ? <CheckSquare size={15} className={styles.checkOn} />
                : <Square size={15} className={styles.checkOff} />}
              <span>전체 {allSelected ? '해제' : '선택'}</span>
            </button>

            {/* Card list */}
            <div className={styles.cardList}>
              {loadingCards ? (
                <div className={styles.cardsLoading}>
                  <Loader2 size={20} className={styles.spinIcon} />
                  <span>카드 불러오는 중...</span>
                </div>
              ) : filteredCards.length === 0 ? (
                <div className={styles.cardsEmpty}>
                  <AlertCircle size={18} />
                  <span>카드가 없습니다</span>
                </div>
              ) : (
                filteredCards.map(card => (
                  <IdeaCardItem key={card.id} card={card} onToggle={toggleCard} />
                ))
              )}
            </div>

            {/* Generate button */}
            <div className={styles.leftFooter}>
              <button
                className={styles.generateBtn}
                onClick={handleGenerate}
                disabled={selectedCount === 0 || genState === 'loading'}
              >
                {genState === 'loading' ? (
                  <>
                    <Loader2 size={17} className={styles.spinIcon} />
                    생성 중...
                  </>
                ) : (
                  <>
                    PRD 생성하기
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
              {selectedCount === 0 && (
                <p className={styles.generateHint}>카드를 1개 이상 선택해주세요</p>
              )}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className={styles.rightPanel}>
            {genState === 'idle' && <EmptyPanel />}
            {genState === 'loading' && <LoadingPanel step={genStep} />}
            {genState === 'error' && (
              <div className={styles.errorWrap}>
                <AlertCircle size={32} className={styles.errorIcon} />
                <h3 className={styles.errorTitle}>생성 실패</h3>
                <p className={styles.errorMsg}>{errorMsg}</p>
                <button className={styles.retryBtn} onClick={() => setGenState('idle')}>
                  다시 시도
                </button>
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
                    prdData={toPRDData(result)}
                  />
                )}
                {/* Tab bar */}
                <div className={styles.tabBar}>
                  {TABS.map(tab => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    )
                  })}
                  <div className={styles.tabSuccess}>
                    <Check size={13} />
                    생성 완료
                  </div>
                  <button className={styles.saveDocBtn} onClick={handleSaveDocument}>
                    <Download size={14} />
                    문서로 저장
                  </button>
                </div>

                {/* Tab content */}
                {activeTab === 'prd' && <PRDTabContent data={toPRDData(result)} />}
                {activeTab === 'spec' && <SpecTabContent data={toPRDData(result)} />}
                {activeTab === 'flow' && <FlowTabContent data={toPRDData(result)} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
