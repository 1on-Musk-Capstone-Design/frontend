import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../../config/api'
import {
  Sparkles, FileText, Layers, GitBranch,
  Check, Copy, Download,
  Users, Zap, Target, Code2, TrendingUp, Shield,
  ArrowRight, AlertCircle, Loader2
} from 'lucide-react'
import styles from './PRDResultPage.module.css'

// ─── Types ─────────────────────────────────────────────────────────────────

interface PRDData {
  projectName: string
  idea: string
  targetUsers: string
  features: string[]
  techStack: string
  timeline: string
  template: 'minimal' | 'standard' | 'detailed'
  generatedAt?: string
  prdMarkdown?: string
  vercelPreviewUrl?: string
  vercelProductionUrl?: string
  githubRepoUrl?: string
  prototypeMessage?: string
  simulated?: boolean
  sourceFiles?: { path: string; content: string }[]
}

type TabId = 'prd' | 'spec' | 'flow'

// ─── Helpers ───────────────────────────────────────────────────────────────

function isLocalDevBrowser() {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1'
}

async function tryDevBootstrapLogin(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/auth/dev/bootstrap`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data?.accessToken) {
      localStorage.setItem('accessToken', data.accessToken)
      if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
      return true
    }
  } catch { /* noop */ }
  return false
}

function extractCardsFromMarkdown(markdown: string): string[] {
  const unique: string[] = []
  const seen = new Set<string>()
  for (const line of markdown.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('[PRD_PIPELINE]') || t.startsWith('#') || /^카드\s*\d+$/.test(t)) continue
    if (t.length < 16 || t.includes('|') || t.startsWith('-') || t.startsWith('*')) continue
    if (!seen.has(t)) { seen.add(t); unique.push(t) }
    if (unique.length >= 6) break
  }
  return unique
}

function makeSpec(data: PRDData) {
  const extracted = data.prdMarkdown ? extractCardsFromMarkdown(data.prdMarkdown) : []
  const featureNames = extracted.length > 0
    ? extracted
    : data.features.length > 0
    ? data.features
    : ['사용자 인증', '핵심 기능 구현', '실시간 데이터 처리', '반응형 UI', '알림 시스템']

  const features = featureNames.slice(0, 6).map((f, i) => ({
    name: f,
    priority: i < 2 ? 'Must Have' : i < 4 ? 'Should Have' : 'Could Have',
    desc: `${f} 관련 상세 기능 구현`,
    acceptance: [`${f} 정상 동작 확인`, '응답 시간 200ms 이내', '에러 없이 완료'],
  }))

  const flowSteps = [
    { step: 1, actor: '사용자', action: '서비스 접속 및 로그인', result: '메인 화면 진입' },
    { step: 2, actor: '사용자', action: '핵심 기능 탐색', result: '기능 목록 확인' },
    ...featureNames.slice(0, 3).map((f, i) => ({
      step: i + 3, actor: '사용자',
      action: f.slice(0, 40) || `작업 ${i + 3}`,
      result: '성공적으로 완료',
    })),
    { step: featureNames.length + 3, actor: '시스템', action: '결과 저장 및 알림', result: '완료 상태 반영' },
  ]

  return { features, flowSteps }
}

// ─── Sub components ─────────────────────────────────────────────────────────

function Section({ id, icon: Icon, title, children }: { id?: string; icon: typeof FileText; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className={styles.prdSection}>
      <div className={styles.prdSectionHead}><Icon size={16} /><span>{title}</span></div>
      {children}
    </div>
  )
}

function PriorityBadge({ p }: { p: string }) {
  return (
    <span className={`${styles.priorityBadge} ${p === 'Must Have' ? styles.must : p === 'Should Have' ? styles.should : styles.could}`}>
      {p}
    </span>
  )
}

function SubRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.subSection}>
      <span className={styles.subLabel}>{label}</span>
      <p className={styles.subValue}>{value}</p>
    </div>
  )
}

function PRDTabContent({ data }: { data: PRDData }) {
  const { features } = makeSpec(data)
  const cards = data.prdMarkdown ? extractCardsFromMarkdown(data.prdMarkdown) : []
  const oneLiner = cards[0] || (data.idea ? data.idea.split(/[.。\n]/)[0].replace(/^#+\s*/, '').trim().slice(0, 80) : '')

  return (
    <div className={styles.tabContent}>

      <Section id="sec-overview" icon={Target} title="프로젝트 개요">
        <SubRow label="한 줄 정의" value={oneLiner || `${data.projectName} — 사용자를 위한 제품`} />
        <SubRow label="제품 목표" value={`${data.targetUsers || '사용자'}가 효율적으로 핵심 문제를 해결할 수 있도록 돕는 제품을 만드는 것`} />
        <SubRow label="배경" value={cards.length > 1 ? cards[1] : data.idea ? data.idea.replace(/\[PRD_PIPELINE\]/g, '').replace(/#+/g, '').trim().slice(0, 120) : `${data.projectName}의 필요성에 따라 기획되었습니다.`} />
      </Section>

      <Section id="sec-problem" icon={Zap} title="문제 및 해결 방안">
        <SubRow label="사용자 문제" value={`${data.targetUsers || '사용자'}가 기존 방식으로는 원하는 결과를 빠르고 정확하게 얻기 어렵습니다.`} />
        <SubRow label="해결 방안" value={`${data.projectName}은(는) ${features.slice(0, 2).map(f => f.name).join(', ')} 등의 핵심 기능을 통해 문제를 해결합니다.`} />
        <SubRow label="차별점" value={`${data.techStack ? `${data.techStack} 기반의 ` : ''}빠른 실행과 직관적인 UX로 기존 솔루션과 차별화됩니다.`} />
      </Section>

      <Section id="sec-features" icon={Code2} title="핵심 기능 요약">
        <div className={styles.featureSummaryList}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureSummaryItem}>
              <PriorityBadge p={f.priority} />
              <span className={styles.featureSummaryName}>{f.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="sec-users" icon={Users} title="목표 사용자">
        <SubRow label="타겟 사용자" value={data.targetUsers || '프로젝트 팀원 및 이해관계자'} />
        <SubRow label="사용자 시나리오" value={`사용자가 서비스에 접속하여 ${features[0]?.name || '핵심 기능'}을 활용하고, 목표를 달성하는 흐름을 경험합니다.`} />
      </Section>

      <Section id="sec-success" icon={TrendingUp} title="성공, 위험 요소">
        <SubRow label="핵심 지표" value={`Must Have 기능 ${features.filter(f => f.priority === 'Must Have').length}개 완료율, 개발 기간 ${data.timeline || '미정'} 준수, 초기 사용자 피드백 긍정률`} />
        <SubRow label="리스크" value="개발 일정 지연, 핵심 기능 완성도 미흡, 초기 사용자 유입 부족 등의 리스크가 존재하며 단계별 검증으로 대응합니다." />
      </Section>

    </div>
  )
}

function SpecTabContent({ data }: { data: PRDData }) {
  const { features } = makeSpec(data)
  return (
    <div className={styles.tabContent}>
      <Section id="sec-spec" icon={Code2} title="기능 명세서">
        <div className={styles.specTable}>
          <div className={styles.specTableHead}>
            <span>기능명</span><span>우선순위</span><span>설명</span>
          </div>
          {features.map((f, i) => (
            <div key={i} className={styles.specTableRow}>
              <span className={styles.specName}>{f.name}</span>
              <PriorityBadge p={f.priority} />
              <span className={styles.specDesc}>{f.desc || '-'}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="sec-acceptance" icon={Shield} title="인수 조건">
        {features.slice(0, 3).map((f, i) => (
          <div key={i} className={styles.acceptanceBlock}>
            <div className={styles.acceptanceName}>{f.name}</div>
            {f.acceptance.map((a, j) => (
              <div key={j} className={styles.acceptanceItem}>
                <Check size={12} className={styles.checkOn} /><span>{a}</span>
              </div>
            ))}
          </div>
        ))}
      </Section>
    </div>
  )
}

function FlowTabContent({ data }: { data: PRDData }) {
  const { flowSteps } = makeSpec(data)
  return (
    <div className={styles.tabContent}>
      <Section id="sec-flow" icon={GitBranch} title="유저플로우">
        <div className={styles.flowList}>
          {flowSteps.map((s, i) => (
            <div key={i} className={styles.flowItem}>
              <div className={styles.flowLeft}>
                <div className={styles.flowNode}>{s.step}</div>
                {i < flowSteps.length - 1 && <div className={styles.flowLine} />}
              </div>
              <div className={styles.flowContent}>
                <div className={styles.flowActor}><Users size={11} />{s.actor}</div>
                <div className={styles.flowAction}>{s.action}</div>
                <div className={styles.flowResult}><ArrowRight size={11} />{s.result}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ─── Tabs & Sidebar config ──────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'prd', label: 'PRD', icon: FileText },
  { id: 'spec', label: '기능명세서', icon: Layers },
  { id: 'flow', label: '유저플로우', icon: GitBranch },
]

const SIDEBAR_SECTIONS: Record<TabId, { id: string; label: string }[]> = {
  prd: [
    { id: 'sec-overview', label: '프로젝트 개요' },
    { id: 'sec-problem', label: '문제 및 해결 방안' },
    { id: 'sec-features', label: '핵심 기능 요약' },
    { id: 'sec-users', label: '목표 사용자' },
    { id: 'sec-success', label: '성공, 위험 요소' },
  ],
  spec: [
    { id: 'sec-spec', label: '기능 명세서' },
    { id: 'sec-acceptance', label: '인수 조건' },
  ],
  flow: [
    { id: 'sec-flow', label: '유저플로우' },
  ],
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function PRDResultPage() {
  const { id, workspaceId: wsPath, prdId: prdPath } = useParams<{
    id?: string
    workspaceId?: string
    prdId?: string
  }>()
  const [searchParams] = useSearchParams()
  const jobIdParam = searchParams.get('jobId')

  const [data, setData] = useState<PRDData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('prd')
  const [activeSection, setActiveSection] = useState<string>('sec-overview')
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 윈도우 스크롤 방지 — 콘텐츠 컨테이너가 독립 스크롤
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const appRoot = document.getElementById('root')
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevHtmlHeight = html.style.height
    const prevBodyHeight = body.style.height
    const prevRootHeight = appRoot ? appRoot.style.height : ''
    const prevRootOverflow = appRoot ? appRoot.style.overflow : ''
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.height = '100%'
    body.style.height = '100%'
    if (appRoot) { appRoot.style.height = '100%'; appRoot.style.overflow = 'hidden' }
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      html.style.height = prevHtmlHeight
      body.style.height = prevBodyHeight
      if (appRoot) { appRoot.style.height = prevRootHeight; appRoot.style.overflow = prevRootOverflow }
    }
  }, [])

  // Scroll Spy — 스크롤 이벤트 기반 (섹션 크기와 무관하게 정확히 동작)
  useEffect(() => {
    const container = scrollRef.current
    const sections = SIDEBAR_SECTIONS[activeTab]
    setActiveSection(sections[0]?.id ?? '')
    if (!container || !data) return

    const detect = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const containerTop = container.getBoundingClientRect().top

      // 바닥 20px 이내 → 마지막 섹션 활성
      if (scrollHeight - scrollTop - clientHeight < 20) {
        const last = sections[sections.length - 1]
        if (last) setActiveSection(last.id)
        return
      }

      // 컨테이너 상단 30% 지점을 기준으로 그 위에 있는 마지막 섹션을 활성
      const threshold = containerTop + clientHeight * 0.3
      let active = sections[0]?.id ?? ''
      for (const { id } of sections) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= threshold) active = id
      }
      setActiveSection(active)
    }

    const timer = setTimeout(detect, 80)
    container.addEventListener('scroll', detect, { passive: true })

    return () => {
      clearTimeout(timer)
      container.removeEventListener('scroll', detect)
    }
  }, [activeTab, data])

  useEffect(() => {
    const load = async () => {
      setLoadError(null)

      // 워크스페이스 URL: /prd/workspaces/:workspaceId/prds/:prdId
      if (wsPath && prdPath) {
        let token = localStorage.getItem('accessToken')
        const ws = parseInt(wsPath, 10)
        const prd = parseInt(prdPath, 10)
        if (!token && isLocalDevBrowser()) {
          const ok = await tryDevBootstrapLogin()
          if (ok) token = localStorage.getItem('accessToken')
        }
        if (token && !Number.isNaN(ws) && !Number.isNaN(prd)) {
          try {
            const headers = { Authorization: `Bearer ${token}` }
            const [jobRes] = await Promise.all([
              axios.get(`${API_BASE_URL}/v1/workspaces/${ws}/prds/${prd}`, { headers }),
            ])
            const j = jobRes.data as {
              prdMarkdown?: string
              vercelPreviewUrl?: string
              vercelProductionUrl?: string
              githubRepoUrl?: string
              message?: string
              simulated?: boolean
            }
            const firstLine = (j.prdMarkdown || '').split('\n').find(l => l.trim().length > 0) || 'PRD'
            const projectName = firstLine.replace(/^#+\s*/, '').slice(0, 80) || `Workspace ${ws} PRD`
            setData({
              projectName,
              idea: (j.prdMarkdown || '').slice(0, 500) || '팀 PRD',
              targetUsers: '서비스 사용자',
              features: ['AI 생성 PRD', '팀 협업', '서버 배포 URL'],
              techStack: 'React, Spring Boot',
              timeline: '—',
              template: 'standard',
              generatedAt: new Date().toLocaleDateString('ko-KR'),
              prdMarkdown: j.prdMarkdown,
              vercelPreviewUrl: j.vercelPreviewUrl,
              vercelProductionUrl: j.vercelProductionUrl,
              githubRepoUrl: j.githubRepoUrl,
              prototypeMessage: j.message,
              simulated: j.simulated,
            })
            return
          } catch (e: any) {
            const status = e?.response?.status
            if (status === 401 || status === 403) {
              setLoadError('접근 권한이 없습니다. 워크스페이스 멤버 계정으로 로그인해 주세요.')
            } else {
              setLoadError('문서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
            }
            return
          }
        }
        setLoadError('로그인이 필요합니다. 로그인 후 PRD URL을 다시 열어주세요.')
        return
      }

      // 기존 URL: /prd/result/:ideaId?jobId=...
      if (id && jobIdParam) {
        let token = localStorage.getItem('accessToken')
        const ideaId = parseInt(id, 10)
        const jId = parseInt(jobIdParam, 10)
        if (!token && isLocalDevBrowser()) {
          const ok = await tryDevBootstrapLogin()
          if (ok) token = localStorage.getItem('accessToken')
        }
        if (token && !Number.isNaN(ideaId) && !Number.isNaN(jId)) {
          try {
            const headers = { Authorization: `Bearer ${token}` }
            const jobRes = await axios.get(
              `${API_BASE_URL}/v1/ideas/${ideaId}/prototype/jobs/${jId}`, { headers }
            )
            const j = jobRes.data as {
              prdMarkdown?: string
              vercelPreviewUrl?: string
              vercelProductionUrl?: string
              githubRepoUrl?: string
              message?: string
              simulated?: boolean
            }
            const firstLine = (j.prdMarkdown || '').split('\n').find(l => l.trim().length > 0) || 'PRD'
            const projectName = firstLine.replace(/^#+\s*/, '').slice(0, 80) || '프로젝트 PRD'
            setData({
              projectName,
              idea: (j.prdMarkdown || '').slice(0, 500) || '팀 PRD',
              targetUsers: '서비스 사용자',
              features: ['AI 생성 PRD', '팀 협업', 'API 연동'],
              techStack: 'React, Spring Boot',
              timeline: '—',
              template: 'standard',
              generatedAt: new Date().toLocaleDateString('ko-KR'),
              prdMarkdown: j.prdMarkdown,
              vercelPreviewUrl: j.vercelPreviewUrl,
              vercelProductionUrl: j.vercelProductionUrl,
              githubRepoUrl: j.githubRepoUrl,
              prototypeMessage: j.message,
              simulated: j.simulated,
            })
            return
          } catch (e: any) {
            const status = e?.response?.status
            if (status === 401 || status === 403) {
              setLoadError('접근 권한이 없습니다 (401/403).')
            } else {
              setLoadError('문서를 불러오지 못했습니다.')
            }
          }
        }
      }

      // sessionStorage fallback
      const key1 = id ? `prd_${id}` : null
      const key2 = id ? `prd_ws_${id?.replace('ws_', '')}` : null
      const stored = (key1 && sessionStorage.getItem(key1))
        || (key2 && sessionStorage.getItem(key2))
        || null
      if (stored) {
        const raw = JSON.parse(stored)
        if (raw.cards && !raw.idea) {
          setData({
            projectName: raw.projectName || '프로젝트',
            idea: raw.cards.join('\n\n'),
            targetUsers: raw.targetUsers || '프로젝트 팀원',
            features: raw.features || raw.cards.slice(0, 8).map((c: string) => c.split(/[.。\n]/)[0].trim().slice(0, 30)),
            techStack: raw.techStack || '',
            timeline: raw.timeline || '',
            template: raw.template || 'standard',
            generatedAt: raw.generatedAt,
            prdMarkdown: typeof raw.prdMarkdown === 'string' ? raw.prdMarkdown : undefined,
            vercelPreviewUrl: typeof raw.vercelPreviewUrl === 'string' ? raw.vercelPreviewUrl : undefined,
            vercelProductionUrl: typeof raw.vercelProductionUrl === 'string' ? raw.vercelProductionUrl : undefined,
            githubRepoUrl: typeof raw.githubRepoUrl === 'string' ? raw.githubRepoUrl : undefined,
          })
        } else {
          setData({ ...raw })
        }
        return
      }

      // Demo fallback
      setData({
        projectName: '무한 캔버스 협업 툴',
        idea: '실시간으로 여러 사람이 같은 캔버스에서 포스트잇, 도형, 텍스트를 자유롭게 배치하고 협업할 수 있는 무한 캔버스 툴입니다.',
        targetUsers: '스타트업 팀, 프로덕트 매니저, UX 디자이너',
        features: ['실시간 공동 편집', '무한 캔버스', '스티커 노트', '도형 그리기', '텍스트 블록', '댓글 & 리액션'],
        techStack: 'React, TypeScript, Spring Boot, WebSocket, PostgreSQL',
        timeline: '3개월',
        template: 'detailed',
        generatedAt: new Date().toLocaleDateString('ko-KR'),
      })
    }
    void load()
  }, [id, jobIdParam, wsPath, prdPath])

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function savePdf() {
    const prev = document.title
    document.title = `${data?.projectName || 'PRD'}_PRD`

    // 인라인 스타일로 설정된 overflow: hidden 임시 해제
    const html = document.documentElement
    const body = document.body
    const appRoot = document.getElementById('root')
    const wrap = scrollRef.current

    html.style.overflow = 'visible'
    html.style.height = 'auto'
    body.style.overflow = 'visible'
    body.style.height = 'auto'
    if (appRoot) { appRoot.style.overflow = 'visible'; appRoot.style.height = 'auto' }
    if (wrap) { wrap.style.overflow = 'visible'; wrap.style.height = 'auto'; wrap.style.maxHeight = 'none' }

    window.print()

    // 복원
    html.style.overflow = 'hidden'
    html.style.height = '100%'
    body.style.overflow = 'hidden'
    body.style.height = '100%'
    if (appRoot) { appRoot.style.overflow = 'hidden'; appRoot.style.height = '100%' }
    if (wrap) { wrap.style.overflow = ''; wrap.style.height = ''; wrap.style.maxHeight = '' }

    document.title = prev
  }

  // ─── Loading / Error ───────────────────────────────────────────────────────

  if (!data) {
    return (
      <div className={styles.loadingPage}>
        {loadError ? (
          <>
            <AlertCircle size={32} style={{ color: '#ef4444' }} />
            <p>{loadError}</p>
          </>
        ) : (
          <>
            <Loader2 size={32} className={styles.spinIcon} />
            <p>PRD 문서를 불러오는 중...</p>
          </>
        )}
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badge}><Sparkles size={13} />AI 기반 자동 생성</div>
          <h1 className={styles.title}>{data.projectName} PRD</h1>
          <p className={styles.subtitle}>아이디어 카드를 기반으로 자동 생성된 PRD 문서입니다</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.actionBtn} onClick={copyUrl}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '복사됨' : '링크 복사'}
          </button>
          <button className={styles.actionBtnPrimary} onClick={savePdf}>
            <Download size={14} />PDF 저장
          </button>
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className={styles.pageBody}>

        {/* Sticky sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <p className={styles.sidebarTitle}>목차</p>
            <nav className={styles.sidebarNav}>
              {SIDEBAR_SECTIONS[activeTab].map(({ id, label }) => (
                <button
                  key={id}
                  className={`${styles.sidebarItem} ${activeSection === id ? styles.sidebarItemActive : ''}`}
                  onClick={() => {
                    const el = document.getElementById(id)
                    const container = scrollRef.current
                    if (!el || !container) return
                    const elRect = el.getBoundingClientRect()
                    const containerRect = container.getBoundingClientRect()
                    const scrollTop = container.scrollTop + elRect.top - containerRect.top - 16
                    container.scrollTo({ top: scrollTop, behavior: 'smooth' })
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className={styles.main}>
          <div className={styles.resultWrap}>

            {/* Tab bar — 고정 (스크롤 안 됨) */}
            <div className={styles.tabBar}>
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={14} />{tab.label}
                  </button>
                )
              })}
            </div>

            {/* 탭 콘텐츠 — 이 영역만 스크롤 */}
            <div ref={scrollRef} className={styles.tabContentWrap}>
              {activeTab === 'prd' && <PRDTabContent data={data} />}
              {activeTab === 'spec' && <SpecTabContent data={data} />}
              {activeTab === 'flow' && <FlowTabContent data={data} />}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
