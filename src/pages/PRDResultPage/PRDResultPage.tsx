import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Sparkles, ExternalLink, Copy, Check, Menu, X,
  FileText, Target, Lightbulb, Users, Code2, Calendar,
  TrendingUp, AlertTriangle, BookOpen, ChevronRight,
  Clock, Zap, Shield, Globe, ArrowUpRight, Download,
  CheckCircle2, Circle, Hash
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
}

// ─── Mock PRD content generator ────────────────────────────────────────────
// 실제 구현 시 API 응답으로 교체

function generatePRD(data: PRDData) {
  const features = data.features.length > 0
    ? data.features
    : ['사용자 인증', '핵심 기능 구현', '실시간 데이터 처리', '반응형 UI', '알림 시스템']

  const techList = data.techStack
    ? data.techStack.split(/[,，、]/).map(t => t.trim()).filter(Boolean)
    : ['React', 'TypeScript', 'Node.js', 'PostgreSQL']

  return {
    overview: {
      description: data.idea,
      vision: `${data.projectName}은(는) ${data.targetUsers}를 위해 설계된 혁신적인 솔루션으로, 기존의 복잡하고 비효율적인 프로세스를 단순화하여 생산성을 극대화합니다.`,
      status: 'In Development',
      version: '1.0.0',
      createdAt: data.generatedAt || new Date().toLocaleDateString('ko-KR'),
    },
    problem: {
      statement: `${data.targetUsers}는 현재 효율적인 도구의 부재로 인해 여러 어려움을 겪고 있습니다. 기존 솔루션들은 학습 곡선이 높거나 협업 기능이 부족하여 팀 생산성을 저하시키고 있습니다.`,
      painPoints: [
        '기존 도구의 복잡한 인터페이스로 인한 낮은 접근성',
        '실시간 협업 기능 부재로 인한 커뮤니케이션 병목',
        '데이터 파편화로 인한 의사결정 지연',
        '온보딩 시간이 길어 초기 진입 장벽이 높음',
      ],
    },
    goals: [
      { type: 'primary', text: `${data.targetUsers}의 핵심 워크플로우 효율 40% 개선` },
      { type: 'primary', text: '사용자 온보딩 시간 10분 이내 달성' },
      { type: 'secondary', text: '월간 활성 사용자 1,000명 확보 (6개월 내)' },
      { type: 'secondary', text: 'NPS(순 추천 지수) 50 이상 유지' },
    ],
    features: features.map((f, i) => ({
      name: f,
      priority: i < 2 ? 'Must Have' : i < 4 ? 'Should Have' : 'Could Have',
      description: `${f} 기능을 통해 사용자는 더 빠르고 직관적인 방식으로 작업을 완료할 수 있습니다.`,
      acceptance: [`${f} 화면이 정상적으로 렌더링됨`, `에러 없이 동작 완료`, `응답 시간 200ms 이내`],
    })),
    techStack: {
      frontend: techList.slice(0, 2).length > 0 ? techList.slice(0, 2) : ['React', 'TypeScript'],
      backend: techList.slice(2, 4).length > 0 ? techList.slice(2, 4) : ['Node.js', 'Express'],
      database: techList.slice(4, 5).length > 0 ? techList.slice(4, 5) : ['PostgreSQL'],
      infra: ['Vercel', 'AWS S3', 'GitHub Actions'],
    },
    timeline: {
      duration: data.timeline || '3개월',
      phases: [
        { phase: 'Phase 1', name: '설계 & 프로토타입', duration: '2주', tasks: ['요구사항 분석', 'UI/UX 와이어프레임', '기술 스택 확정', 'DB 스키마 설계'] },
        { phase: 'Phase 2', name: '핵심 기능 개발', duration: '6주', tasks: ['사용자 인증 시스템', '핵심 기능 구현', 'API 개발', '단위 테스트'] },
        { phase: 'Phase 3', name: '통합 & 테스트', duration: '2주', tasks: ['통합 테스트', '성능 최적화', '보안 검토', '버그 수정'] },
        { phase: 'Phase 4', name: '배포 & 런칭', duration: '2주', tasks: ['프로덕션 배포', 'CI/CD 설정', '모니터링 설정', '초기 사용자 온보딩'] },
      ],
    },
    metrics: [
      { name: '월간 활성 사용자', target: '1,000명+', timeframe: '6개월' },
      { name: '사용자 유지율', target: '70%+', timeframe: '30일' },
      { name: '페이지 로드 시간', target: '< 2초', timeframe: '측정 지속' },
      { name: 'API 가동률', target: '99.9%', timeframe: '월간' },
    ],
    risks: [
      { level: 'high', title: '기술 부채 누적', mitigation: '코드 리뷰 프로세스 강화 및 리팩토링 스프린트 정기 시행' },
      { level: 'medium', title: '일정 지연 위험', mitigation: 'MVP 범위 명확히 정의하고 이터레이티브 개발 방식 채택' },
      { level: 'low', title: '사용자 채택률 저조', mitigation: '초기 베타 사용자 확보 및 지속적인 피드백 수집' },
    ],
  }
}

// ─── Section Components ────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, id }: { icon: typeof FileText; title: string; id: string }) {
  return (
    <div className={styles.sectionHeader} id={id}>
      <div className={styles.sectionIconWrap}>
        <Icon size={18} />
      </div>
      <h2 className={styles.sectionTitle}>{title}</h2>
    </div>
  )
}

const PRIORITY_STYLE: Record<string, string> = {
  'Must Have': styles.priorityMust,
  'Should Have': styles.priorityShould,
  'Could Have': styles.priorityCould,
}

const RISK_STYLE: Record<string, string> = {
  high: styles.riskHigh,
  medium: styles.riskMedium,
  low: styles.riskLow,
}

// ─── TOC ──────────────────────────────────────────────────────────────────

const TOC_ITEMS = [
  { id: 'overview', label: '개요', icon: FileText },
  { id: 'problem', label: '문제 정의', icon: AlertTriangle },
  { id: 'goals', label: '목표', icon: Target },
  { id: 'features', label: '핵심 기능', icon: Zap },
  { id: 'tech', label: '기술 스택', icon: Code2 },
  { id: 'timeline', label: '타임라인', icon: Calendar },
  { id: 'metrics', label: '성공 지표', icon: TrendingUp },
  { id: 'risks', label: '리스크', icon: Shield },
]

// ─── Main ─────────────────────────────────────────────────────────────────

export default function PRDResultPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<PRDData | null>(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [tocOpen, setTocOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // PRD 결과 페이지에서 스크롤 활성화
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')

    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevHtmlHeight   = html.style.height
    const prevBodyHeight   = body.style.height
    const prevRootHeight   = root ? root.style.height   : ''
    const prevRootOverflow = root ? root.style.overflow : ''

    html.style.overflow = 'auto'
    body.style.overflow = 'auto'
    html.style.height   = 'auto'
    body.style.height   = 'auto'
    // root의 overflow는 건드리지 않음 — overflow:auto가 있으면 #root가
    // sticky scroll container가 되어 position:sticky가 작동하지 않음
    if (root) { root.style.height = 'auto'; root.style.overflow = 'visible' }

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      html.style.height   = prevHtmlHeight
      body.style.height   = prevBodyHeight
      if (root) { root.style.height = prevRootHeight; root.style.overflow = prevRootOverflow }
    }
  }, [])

  useEffect(() => {
    // 실제 구현: API로 PRD 데이터 fetch
    // const res = await axios.get(`${API_BASE_URL}/v1/prd/${id}`)
    // setData(res.data)

    // Mock: sessionStorage에서 로드 (일반 id 또는 ws_{workspaceId} 형식 모두 지원)
    const key1 = id ? `prd_${id}` : null
    const key2 = id ? `prd_ws_${id?.replace('ws_', '')}` : null
    const stored = (key1 && sessionStorage.getItem(key1))
      || (key2 && sessionStorage.getItem(key2))
      || null
    if (stored) {
      const raw = JSON.parse(stored)
      // workspaceId 기반 데이터 변환 (카드 배열 → PRDData)
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
        })
      } else {
        setData(raw)
      }
    } else {
      // Demo fallback
      setData({
        projectName: '무한 캔버스 협업 툴',
        idea: '실시간으로 여러 사람이 같은 캔버스에서 포스트잇, 도형, 텍스트를 자유롭게 배치하고 협업할 수 있는 무한 캔버스 툴입니다. Figma의 협업 방식에서 영감을 받았으며, 프로젝트 기획 및 브레인스토밍 단계에서의 협업을 극대화하는 것이 목표입니다.',
        targetUsers: '스타트업 팀, 프로덕트 매니저, UX 디자이너',
        features: ['실시간 공동 편집', '무한 캔버스', '스티커 노트', '도형 그리기', '텍스트 블록', '댓글 & 리액션'],
        techStack: 'React, TypeScript, Spring Boot, WebSocket, PostgreSQL, AWS',
        timeline: '3개월',
        template: 'detailed',
        generatedAt: new Date().toLocaleDateString('ko-KR'),
      })
    }
  }, [id])

  // Scroll-based active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = TOC_ITEMS.map(item => document.getElementById(item.id))
      const scrollY = window.scrollY + 120

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i]
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(TOC_ITEMS[i].id)
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (!el) return

    const NAV_HEIGHT = 64        // sticky nav 높이
    const EXTRA_PADDING = 28     // 제목 위 여백

    const elTop    = el.getBoundingClientRect().top + window.scrollY
    const elHeight = el.offsetHeight
    const vpHeight = window.innerHeight - NAV_HEIGHT

    // 섹션이 뷰포트보다 짧으면 중앙 정렬, 길면 제목 기준으로만 정렬
    const targetScrollY =
      elHeight < vpHeight
        ? elTop - NAV_HEIGHT - (vpHeight - elHeight) / 2
        : elTop - NAV_HEIGHT - EXTRA_PADDING

    window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' })
    setActiveSection(id)
    setTocOpen(false)
  }

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!data) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner} />
        <p>PRD 문서를 불러오는 중...</p>
      </div>
    )
  }

  const prd = generatePRD(data)

  return (
    <div className={styles.page}>
      {/* ── Top Nav ── */}
      <header className={styles.nav}>
        <div className={styles.navLeft}>
          <div className={styles.navLogo}>
            <Sparkles size={18} />
          </div>
          <div className={styles.navMeta}>
            <span className={styles.navTitle}>{data.projectName}</span>
            <span className={styles.navBadge}>PRD v{prd.overview.version}</span>
          </div>
        </div>

        <div className={styles.navRight}>
          <span className={styles.navDate}>
            <Clock size={13} />
            {prd.overview.createdAt}
          </span>
          <button className={styles.navBtn} onClick={copyUrl}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? '복사됨' : '링크 복사'}
          </button>
          <button className={styles.navBtnPrimary}>
            <Download size={15} />
            PDF 저장
          </button>
          <button
            className={styles.tocToggle}
            onClick={() => setTocOpen(!tocOpen)}
          >
            {tocOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* ── TOC Sidebar ── */}
        <aside className={`${styles.toc} ${tocOpen ? styles.tocOpen : ''}`}>
          <div className={styles.tocInner}>
            <div className={styles.tocHeader}>목차</div>
            <nav>
              {TOC_ITEMS.map(item => {
                const Icon = item.icon
                const active = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    className={`${styles.tocItem} ${active ? styles.tocItemActive : ''}`}
                    onClick={() => scrollTo(item.id)}
                  >
                    <Icon size={15} className={styles.tocIcon} />
                    <span>{item.label}</span>
                    {active && <ChevronRight size={13} className={styles.tocArrow} />}
                  </button>
                )
              })}
            </nav>

            <div className={styles.tocFooter}>
              <div className={styles.tocStatusDot} />
              <span>{prd.overview.status}</span>
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className={styles.content} ref={contentRef}>

          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroBadge}>
              <Sparkles size={13} />
              AI Generated PRD
            </div>
            <h1 className={styles.heroTitle}>{data.projectName}</h1>
            <p className={styles.heroSubtitle}>{prd.overview.description.slice(0, 120)}...</p>
            <div className={styles.heroMeta}>
              <span className={styles.heroMetaItem}>
                <Users size={14} />
                {data.targetUsers}
              </span>
              <span className={styles.heroMetaItem}>
                <Calendar size={14} />
                {prd.timeline.duration}
              </span>
              <span className={styles.heroMetaItem}>
                <Globe size={14} />
                배포 완료
              </span>
            </div>
          </div>

          {/* ── Overview ── */}
          <section className={styles.section} id="overview">
            <SectionHeader icon={FileText} title="개요" id="overview-h" />
            <div className={styles.overviewGrid}>
              <div className={styles.overviewMain}>
                <p className={styles.bodyText}>{prd.overview.vision}</p>
              </div>
              <div className={styles.overviewCards}>
                {[
                  { label: '상태', value: prd.overview.status, icon: CheckCircle2, color: '#01CD15' },
                  { label: '버전', value: prd.overview.version, icon: Hash, color: '#6366f1' },
                  { label: '타겟', value: data.targetUsers.split(',')[0], icon: Users, color: '#f59e0b' },
                  { label: '기간', value: prd.timeline.duration, icon: Clock, color: '#0ea5e9' },
                ].map(card => (
                  <div key={card.label} className={styles.metaCard}>
                    <card.icon size={16} style={{ color: card.color }} />
                    <div>
                      <div className={styles.metaCardLabel}>{card.label}</div>
                      <div className={styles.metaCardValue}>{card.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Problem ── */}
          <section className={styles.section} id="problem">
            <SectionHeader icon={AlertTriangle} title="문제 정의" id="problem-h" />
            <div className={styles.problemBox}>
              <p className={styles.bodyText}>{prd.problem.statement}</p>
            </div>
            <div className={styles.painPoints}>
              {prd.problem.painPoints.map((p, i) => (
                <div key={i} className={styles.painPoint}>
                  <div className={styles.painNum}>{i + 1}</div>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Goals ── */}
          <section className={styles.section} id="goals">
            <SectionHeader icon={Target} title="목표" id="goals-h" />
            <div className={styles.goalsList}>
              {prd.goals.map((g, i) => (
                <div key={i} className={`${styles.goalItem} ${g.type === 'primary' ? styles.goalPrimary : styles.goalSecondary}`}>
                  <div className={`${styles.goalDot} ${g.type === 'primary' ? styles.goalDotPrimary : styles.goalDotSecondary}`} />
                  <span>{g.text}</span>
                  <span className={`${styles.goalTag} ${g.type === 'primary' ? styles.goalTagPrimary : styles.goalTagSecondary}`}>
                    {g.type === 'primary' ? 'Primary' : 'Secondary'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Features ── */}
          <section className={styles.section} id="features">
            <SectionHeader icon={Zap} title="핵심 기능" id="features-h" />
            <div className={styles.featureGrid}>
              {prd.features.map((f, i) => (
                <div key={i} className={styles.featureCard}>
                  <div className={styles.featureCardHeader}>
                    <span className={styles.featureName}>{f.name}</span>
                    <span className={`${styles.priorityBadge} ${PRIORITY_STYLE[f.priority] || ''}`}>
                      {f.priority}
                    </span>
                  </div>
                  <p className={styles.featureDesc}>{f.description}</p>
                  <div className={styles.featureAcceptance}>
                    <span className={styles.featureAccTitle}>인수 조건</span>
                    {f.acceptance.map((a, j) => (
                      <div key={j} className={styles.acceptanceItem}>
                        <CheckCircle2 size={13} className={styles.acceptanceIcon} />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tech Stack ── */}
          <section className={styles.section} id="tech">
            <SectionHeader icon={Code2} title="기술 스택" id="tech-h" />
            <div className={styles.techGrid}>
              {[
                { label: 'Frontend', items: prd.techStack.frontend, color: '#6366f1' },
                { label: 'Backend', items: prd.techStack.backend, color: '#0ea5e9' },
                { label: 'Database', items: prd.techStack.database, color: '#f59e0b' },
                { label: 'Infrastructure', items: prd.techStack.infra, color: '#10b981' },
              ].map(stack => (
                <div key={stack.label} className={styles.techCategory}>
                  <div className={styles.techCategoryLabel} style={{ color: stack.color }}>
                    {stack.label}
                  </div>
                  <div className={styles.techTags}>
                    {stack.items.map(item => (
                      <span key={item} className={styles.techTag} style={{ borderColor: `${stack.color}30`, background: `${stack.color}08`, color: stack.color }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Timeline ── */}
          <section className={styles.section} id="timeline">
            <SectionHeader icon={Calendar} title="타임라인" id="timeline-h" />
            <div className={styles.timeline}>
              {prd.timeline.phases.map((phase, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={styles.timelineLeft}>
                    <div className={styles.timelineNode}>
                      <span>{i + 1}</span>
                    </div>
                    {i < prd.timeline.phases.length - 1 && <div className={styles.timelineLine} />}
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelinePhase}>{phase.phase}</span>
                      <span className={styles.timelineName}>{phase.name}</span>
                      <span className={styles.timelineDuration}>
                        <Clock size={12} />
                        {phase.duration}
                      </span>
                    </div>
                    <div className={styles.timelineTasks}>
                      {phase.tasks.map((task, j) => (
                        <span key={j} className={styles.timelineTask}>
                          <Circle size={6} fill="currentColor" />
                          {task}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Metrics ── */}
          <section className={styles.section} id="metrics">
            <SectionHeader icon={TrendingUp} title="성공 지표" id="metrics-h" />
            <div className={styles.metricsGrid}>
              {prd.metrics.map((m, i) => (
                <div key={i} className={styles.metricCard}>
                  <div className={styles.metricTarget}>{m.target}</div>
                  <div className={styles.metricName}>{m.name}</div>
                  <div className={styles.metricTimeframe}>
                    <Clock size={11} />
                    {m.timeframe}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Risks ── */}
          <section className={styles.section} id="risks">
            <SectionHeader icon={Shield} title="리스크" id="risks-h" />
            <div className={styles.risksList}>
              {prd.risks.map((r, i) => (
                <div key={i} className={styles.riskItem}>
                  <div className={`${styles.riskLevel} ${RISK_STYLE[r.level] || ''}`}>
                    {r.level.toUpperCase()}
                  </div>
                  <div className={styles.riskBody}>
                    <div className={styles.riskTitle}>{r.title}</div>
                    <div className={styles.riskMitigation}>
                      <ArrowUpRight size={13} />
                      {r.mitigation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className={styles.docFooter}>
            <div className={styles.docFooterLogo}>
              <Sparkles size={16} />
              AI PRD Generator
            </div>
            <p className={styles.docFooterText}>
              이 문서는 AI에 의해 자동 생성되었습니다. 실제 개발 전 팀 리뷰를 권장합니다.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
