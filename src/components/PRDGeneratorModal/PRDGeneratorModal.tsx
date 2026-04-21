import { useState, useEffect, useCallback } from 'react'
import {
  Sparkles, FileText, Layers, GitBranch,
  Check, Loader2, ChevronDown, ChevronUp,
  Search, CheckSquare, Square, AlertCircle,
  ArrowRight, X, Users, Zap, Target,
  Code2, TrendingUp, Shield, Clock
} from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../../config/api'
import styles from './PRDGeneratorModal.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IdeaCard { id: string | number; text: string; selected: boolean }
type TabId = 'prd' | 'spec' | 'flow'
type GenState = 'idle' | 'loading' | 'done' | 'error'
interface PRDResult { projectName: string; cards: string[]; generatedAt: string; prdMarkdown?: string }

const STEPS = ['아이디어 카드 분석 중...', 'AI가 내용을 이해하는 중...', 'PRD 구조 설계 중...', '문서 작성 중...', '완료']

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'prd', label: 'PRD', icon: FileText },
  { id: 'spec', label: '기능명세서', icon: Layers },
  { id: 'flow', label: '유저플로우', icon: GitBranch },
]

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
      step: i + 3, actor: '사용자',
      action: c.split(/[.。\n]/)[0].trim().slice(0, 40) || `작업 ${i + 3}`,
      result: '성공적으로 완료',
    })),
    { step: cards.length + 3, actor: '시스템', action: '결과 저장 및 알림', result: '완료 상태 반영' },
  ]
  return { features, flowSteps }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CardItem({ card, onToggle }: { card: IdeaCard; onToggle: (id: string | number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = card.text.length > 80
  return (
    <div className={`${styles.card} ${card.selected ? styles.cardSelected : ''}`} onClick={() => onToggle(card.id)}>
      <div className={styles.cardCheck}>
        {card.selected ? <CheckSquare size={15} className={styles.checkOn} /> : <Square size={15} className={styles.checkOff} />}
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardText}>{isLong && !expanded ? card.text.slice(0, 80) + '…' : card.text}</p>
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
    <div className={styles.centerWrap}>
      <Loader2 size={34} className={`${styles.spinIcon} ${styles.greenText}`} />
      <h3 className={styles.panelTitle2}>PRD 생성 중</h3>
      <div className={styles.stepList}>
        {STEPS.map((s, i) => (
          <div key={i} className={`${styles.step} ${i < step ? styles.stepDone : i === step ? styles.stepActive : styles.stepPending}`}>
            {i < step ? <Check size={12} /> : i === step ? <Loader2 size={12} className={styles.spinIcon} /> : <span className={styles.dot} />}
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyPanel() {
  return (
    <div className={styles.centerWrap}>
      <div className={styles.emptyIcon}><Sparkles size={28} /></div>
      <h3 className={styles.panelTitle2}>PRD를 생성해보세요</h3>
      <p className={styles.emptyDesc}>왼쪽에서 카드를 선택한 뒤<br />버튼을 눌러주세요</p>
      <div className={styles.emptyHints}>
        {[{ icon: FileText, t: 'PRD 문서' }, { icon: Layers, t: '기능 명세서' }, { icon: GitBranch, t: '유저플로우' }].map(({ icon: Icon, t }) => (
          <span key={t} className={styles.hint}><Icon size={13} />{t}</span>
        ))}
      </div>
    </div>
  )
}

function PRDTab({ result }: { result: PRDResult }) {
  if (result.prdMarkdown) return <div className={styles.tabContent}><pre className={styles.markdownBlock}>{result.prdMarkdown}</pre></div>
  const { features } = makePRD(result.projectName, result.cards)
  return (
    <div className={styles.tabContent}>
      <Section icon={Target} title="프로젝트 개요">
        <p className={styles.bodyText}><strong>{result.projectName}</strong> — 총 <strong>{result.cards.length}개</strong> 카드 기반으로 생성된 PRD입니다.</p>
      </Section>
      <Section icon={Zap} title="핵심 기능 요약">
        <div className={styles.featureList}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureRow}>
              <PriorityBadge p={f.priority} />
              <span className={styles.featureName}>{f.name}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section icon={TrendingUp} title="성공 지표">
        <div className={styles.metricGrid}>
          {[
            { v: `${features.filter(f => f.priority === 'Must Have').length}개`, l: 'Must Have 기능' },
            { v: `${result.cards.length}개`, l: '분석 카드' },
            { v: result.generatedAt, l: '생성 일시' },
          ].map(m => (
            <div key={m.l} className={styles.metricItem}>
              <div className={styles.metricVal}>{m.v}</div>
              <div className={styles.metricLabel}>{m.l}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function SpecTab({ result }: { result: PRDResult }) {
  const { features } = makePRD(result.projectName, result.cards)
  return (
    <div className={styles.tabContent}>
      <Section icon={Code2} title="기능 명세서">
        <div className={styles.specTable}>
          <div className={styles.specHead}><span>기능명</span><span>우선순위</span><span>설명</span></div>
          {features.map((f, i) => (
            <div key={i} className={styles.specRow}>
              <span className={styles.specName}>{f.name}</span>
              <PriorityBadge p={f.priority} />
              <span className={styles.specDesc}>{f.desc || '-'}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section icon={Shield} title="인수 조건">
        {features.slice(0, 3).map((f, i) => (
          <div key={i} className={styles.acceptBlock}>
            <div className={styles.acceptName}>{f.name}</div>
            {f.acceptance.map((a, j) => (
              <div key={j} className={styles.acceptItem}><Check size={11} className={styles.checkOn} /><span>{a}</span></div>
            ))}
          </div>
        ))}
      </Section>
    </div>
  )
}

function FlowTab({ result }: { result: PRDResult }) {
  const { flowSteps } = makePRD(result.projectName, result.cards)
  return (
    <div className={styles.tabContent}>
      <Section icon={GitBranch} title="유저플로우">
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
      </Section>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: typeof FileText; title: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}><Icon size={14} /><span>{title}</span></div>
      {children}
    </div>
  )
}

function PriorityBadge({ p }: { p: string }) {
  return <span className={`${styles.badge} ${p === 'Must Have' ? styles.must : p === 'Should Have' ? styles.should : styles.could}`}>{p}</span>
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean
  workspaceId: string
  projectName: string
  onClose: () => void
}

const DEMO: Omit<IdeaCard, 'selected'>[] = [
  { id: 'd1', text: '실시간 협업 캔버스에서 여러 사용자가 동시에 포스트잇을 추가·편집할 수 있어야 한다' },
  { id: 'd2', text: '드래그 앤 드롭으로 카드 위치를 자유롭게 변경 가능해야 한다' },
  { id: 'd3', text: '카드에 색상 태그를 붙여 카테고리를 구분할 수 있어야 한다' },
  { id: 'd4', text: 'AI가 카드 내용을 분석해 자동으로 그룹핑을 제안해야 한다' },
  { id: 'd5', text: '캔버스 히스토리(실행 취소/다시 실행)를 지원해야 한다' },
]

export default function PRDGeneratorModal({ isOpen, workspaceId, projectName, onClose }: Props) {
  const [cards, setCards] = useState<IdeaCard[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [query, setQuery] = useState('')
  const [genState, setGenState] = useState<GenState>('idle')
  const [genStep, setGenStep] = useState(0)
  const [result, setResult] = useState<PRDResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('prd')

  // ── Load cards ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    setGenState('idle')
    setResult(null)
    setErrorMsg('')
    setQuery('')

    async function load() {
      if (!workspaceId) { setCards(DEMO.map(c => ({ ...c, selected: true }))); return }
      setLoadingCards(true)
      try {
        const token = localStorage.getItem('accessToken')
        const res = await axios.get(`${API_BASE_URL}/v1/ideas/workspaces/${workspaceId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const items: IdeaCard[] = (res.data as any[])
          .filter((d: any) => (d.content || d.text || '').trim().length > 0)
          .map((d: any) => ({ id: d.id, text: d.content || d.text || '', selected: true }))
        setCards(items.length > 0 ? items : DEMO.map(c => ({ ...c, selected: true })))
      } catch { setCards(DEMO.map(c => ({ ...c, selected: true }))) }
      finally { setLoadingCards(false) }
    }
    load()
  }, [isOpen, workspaceId])

  // ── Selection ───────────────────────────────────────────────────────────────
  const toggleCard = useCallback((id: string | number) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c))
  }, [])
  const selectedCount = cards.filter(c => c.selected).length
  const allSelected = cards.length > 0 && selectedCount === cards.length
  const filteredCards = cards.filter(c => c.text.toLowerCase().includes(query.toLowerCase()))

  // ── Generate ────────────────────────────────────────────────────────────────
  async function handleGenerate() {
    const selected = cards.filter(c => c.selected)
    if (selected.length === 0) return
    setGenState('loading'); setGenStep(0); setErrorMsg('')

    const timer = setInterval(() => setGenStep(p => { if (p >= STEPS.length - 2) { clearInterval(timer); return p }; return p + 1 }), 900)

    try {
      if (workspaceId) {
        const token = localStorage.getItem('accessToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const body = selected.map((c, i) => `### 카드 ${i + 1}\n${c.text}`).join('\n\n---\n\n')
        const ideaRes = await axios.post(`${API_BASE_URL}/v1/ideas`,
          { workspaceId: Number(workspaceId), content: `[PRD_PIPELINE]\n${body}` },
          { headers: { ...headers, 'Content-Type': 'application/json' } })
        const ideaId = ideaRes.data.id
        const pipelineRes = await axios.post(`${API_BASE_URL}/v1/ideas/${ideaId}/prototype/pipeline`, {},
          { headers, params: { sync: false }, validateStatus: s => s >= 200 && s < 300 })
        const jobId = pipelineRes.data.jobId
        for (let i = 0; i < 90; i++) {
          await new Promise(r => setTimeout(r, 2000))
          const poll = await axios.get(`${API_BASE_URL}/v1/ideas/${ideaId}/prototype/jobs/${jobId}`, { headers })
          if (poll.data.status === 'FAILED') throw new Error(poll.data.message || 'PRD 생성 실패')
          if (['DEPLOYED', 'PRD_GENERATED', 'UI_GENERATED', 'CODE_GENERATED', 'GITHUB_PUSHED'].includes(poll.data.status)) {
            clearInterval(timer); setGenStep(STEPS.length - 1)
            setResult({ projectName, cards: selected.map(c => c.text), generatedAt: new Date().toLocaleDateString('ko-KR'), prdMarkdown: poll.data.prdMarkdown || undefined })
            setGenState('done'); return
          }
        }
        throw new Error('시간 초과: 잠시 후 다시 시도해주세요')
      } else {
        await new Promise(r => setTimeout(r, 4500))
        clearInterval(timer); setGenStep(STEPS.length - 1)
        setResult({ projectName, cards: selected.map(c => c.text), generatedAt: new Date().toLocaleDateString('ko-KR') })
        setGenState('done')
      }
    } catch (err: any) {
      clearInterval(timer)
      setErrorMsg(err?.response?.data?.message || err?.message || 'PRD 생성에 실패했습니다')
      setGenState('error')
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalBadge}><Sparkles size={12} />AI PRD 생성기</div>
            <h2 className={styles.modalTitle}>{projectName}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>

          {/* Left panel */}
          <div className={styles.leftPanel}>
            <div className={styles.leftHeader}>
              <span className={styles.panelTitle}>아이디어 카드</span>
              <span className={styles.countBadge}>{selectedCount}/{cards.length} 선택</span>
            </div>

            <div className={styles.searchWrap}>
              <Search size={13} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="카드 검색..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>

            <button className={styles.selectAllBtn} onClick={() => setCards(p => p.map(c => ({ ...c, selected: !allSelected })))}>
              {allSelected ? <CheckSquare size={14} className={styles.checkOn} /> : <Square size={14} className={styles.checkOff} />}
              <span>전체 {allSelected ? '해제' : '선택'}</span>
            </button>

            <div className={styles.cardList}>
              {loadingCards ? (
                <div className={styles.centerWrap2}><Loader2 size={18} className={styles.spinIcon} /><span>불러오는 중...</span></div>
              ) : filteredCards.length === 0 ? (
                <div className={styles.centerWrap2}><AlertCircle size={16} /><span>카드가 없습니다</span></div>
              ) : filteredCards.map(c => <CardItem key={c.id} card={c} onToggle={toggleCard} />)}
            </div>

            <div className={styles.leftFooter}>
              <button className={styles.generateBtn} onClick={handleGenerate} disabled={selectedCount === 0 || genState === 'loading'}>
                {genState === 'loading'
                  ? <><Loader2 size={15} className={styles.spinIcon} />생성 중...</>
                  : <><Sparkles size={15} />PRD 생성하기<ArrowRight size={14} /></>}
              </button>
              {selectedCount === 0 && <p className={styles.genHint}>카드를 1개 이상 선택해주세요</p>}
            </div>
          </div>

          {/* Right panel */}
          <div className={styles.rightPanel}>
            {genState === 'idle' && <EmptyPanel />}
            {genState === 'loading' && <LoadingPanel step={genStep} />}
            {genState === 'error' && (
              <div className={styles.centerWrap}>
                <AlertCircle size={30} style={{ color: '#ef4444' }} />
                <h3 className={styles.panelTitle2}>생성 실패</h3>
                <p className={styles.emptyDesc}>{errorMsg}</p>
                <button className={styles.retryBtn} onClick={() => setGenState('idle')}>다시 시도</button>
              </div>
            )}
            {genState === 'done' && result && (
              <div className={styles.resultWrap}>
                <div className={styles.tabBar}>
                  {TABS.map(tab => {
                    const Icon = tab.icon
                    return (
                      <button key={tab.id} className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <Icon size={13} />{tab.label}
                      </button>
                    )
                  })}
                  <div className={styles.successBadge}><Check size={12} />생성 완료</div>
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
