import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, X, Plus, Loader2, ExternalLink, Copy, Check,
  FileText, Layers, Zap, ChevronRight, Lightbulb, Users,
  Code2, Calendar, AlignLeft, ArrowRight, CheckCircle2
} from 'lucide-react'
import Sidebar from '../MainPage/components/Sidebar/Sidebar'
import styles from './PRDPage.module.css'

// ─── Types ───────────────────────────────────────────────────────────────────

type Template = 'minimal' | 'standard' | 'detailed'

interface PRDForm {
  projectName: string
  idea: string
  targetUsers: string
  features: string[]
  techStack: string
  timeline: string
  template: Template
}

// ─── Template Config ──────────────────────────────────────────────────────────

const TEMPLATES: { id: Template; label: string; desc: string; icon: typeof FileText; sections: string[] }[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    desc: '핵심만 빠르게',
    icon: Zap,
    sections: ['개요', '문제 정의', '핵심 기능'],
  },
  {
    id: 'standard',
    label: 'Standard',
    desc: '일반적인 PRD 형식',
    icon: FileText,
    sections: ['개요', '문제 정의', '목표', '핵심 기능', '기술 스택', '타임라인'],
  },
  {
    id: 'detailed',
    label: 'Detailed',
    desc: '완전한 상세 문서',
    icon: Layers,
    sections: ['개요', '문제 정의', '목표', '사용자 스토리', '핵심 기능', '기술 스택', '타임라인', '성공 지표', '리스크', '부록'],
  },
]

// ─── Success Modal ────────────────────────────────────────────────────────────

function SuccessModal({ url, onClose, onOpen }: { url: string; onClose: () => void; onOpen: () => void }) {
  const [copied, setCopied] = useState(false)

  function copyUrl() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        {/* Icon */}
        <div className={styles.successIcon}>
          <CheckCircle2 size={32} color="#01CD15" />
        </div>

        <h2 className={styles.modalTitle}>PRD 생성 완료!</h2>
        <p className={styles.modalSubtitle}>
          AI가 PRD 문서를 생성하고 자동 배포했습니다.<br />
          아래 링크로 바로 확인하세요.
        </p>

        {/* URL row */}
        <div className={styles.urlRow}>
          <span className={styles.urlText}>{url}</span>
          <button className={styles.copyBtn} onClick={copyUrl} title="복사">
            {copied ? <Check size={16} color="#01CD15" /> : <Copy size={16} />}
          </button>
        </div>

        {/* Actions */}
        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onClose}>
            닫기
          </button>
          <button className={styles.btnPrimary} onClick={onOpen}>
            <ExternalLink size={16} />
            링크 열기
          </button>
        </div>

        {/* Close X */}
        <button className={styles.modalClose} onClick={onClose}>
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

// ─── Loading Overlay ─────────────────────────────────────────────────────────

const LOADING_STEPS = [
  '아이디어를 분석하는 중...',
  '문서 구조를 설계하는 중...',
  'AI가 내용을 작성하는 중...',
  'PRD 문서를 빌드하는 중...',
  'Vercel에 배포하는 중...',
]

function LoadingOverlay({ step }: { step: number }) {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingCard}>
        <div className={styles.loadingSpinner}>
          <Loader2 size={40} className={styles.spinIcon} />
        </div>
        <h3 className={styles.loadingTitle}>PRD 생성 중</h3>
        <div className={styles.loadingSteps}>
          {LOADING_STEPS.map((s, i) => (
            <div key={i} className={`${styles.loadingStep} ${i < step ? styles.stepDone : i === step ? styles.stepActive : styles.stepPending}`}>
              {i < step
                ? <Check size={14} />
                : i === step
                ? <Loader2 size={14} className={styles.spinIcon} />
                : <div className={styles.stepDot} />}
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PRDPage() {
  const navigate = useNavigate()
  const featureInputRef = useRef<HTMLInputElement>(null)

  // index.css의 overflow:hidden 전역 설정 override — sticky 작동에 필요
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
    if (root) { root.style.height = 'auto'; root.style.overflow = 'visible' }
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      html.style.height   = prevHtmlHeight
      body.style.height   = prevBodyHeight
      if (root) { root.style.height = prevRootHeight; root.style.overflow = prevRootOverflow }
    }
  }, [])

  const [form, setForm] = useState<PRDForm>({
    projectName: '',
    idea: '',
    targetUsers: '',
    features: [],
    techStack: '',
    timeline: '',
    template: 'standard',
  })
  const [featureInput, setFeatureInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof PRDForm, string>>>({})

  // ── Feature chips ──────────────────────────────────────────────────────────

  function addFeature() {
    const trimmed = featureInput.trim()
    if (!trimmed || form.features.includes(trimmed)) return
    setForm(prev => ({ ...prev, features: [...prev.features, trimmed] }))
    setFeatureInput('')
  }

  function removeFeature(f: string) {
    setForm(prev => ({ ...prev, features: prev.features.filter(x => x !== f) }))
  }

  function onFeatureKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addFeature() }
    if (e.key === 'Backspace' && !featureInput && form.features.length > 0) {
      setForm(prev => ({ ...prev, features: prev.features.slice(0, -1) }))
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Partial<Record<keyof PRDForm, string>> = {}
    if (!form.projectName.trim()) errs.projectName = '프로젝트 이름을 입력해 주세요'
    if (!form.idea.trim()) errs.idea = '아이디어를 입력해 주세요'
    if (form.idea.trim().length < 20) errs.idea = '아이디어를 20자 이상 입력해 주세요'
    if (!form.targetUsers.trim()) errs.targetUsers = '타겟 사용자를 입력해 주세요'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Generate ───────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!validate()) return
    setGenerating(true)
    setLoadingStep(0)

    // Simulate step progression
    for (let i = 1; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 1200))
      setLoadingStep(i)
    }
    await new Promise(r => setTimeout(r, 800))

    // TODO: 실제 API 호출로 교체
    // const res = await axios.post(`${API_BASE_URL}/v1/prd/generate`, form)
    // const url = res.data.deployedUrl

    const mockId = Date.now().toString(36)
    const url = `${window.location.origin}/prd/result/${mockId}`

    setGenerating(false)
    setDeployedUrl(url)

    // Store form data for result page (실제 구현시 API 응답으로 교체)
    sessionStorage.setItem(`prd_${mockId}`, JSON.stringify(form))
  }

  function handleOpenLink() {
    if (deployedUrl) window.open(deployedUrl, '_blank')
  }

  const selectedTemplate = TEMPLATES.find(t => t.id === form.template)!
  const isReady = form.projectName.trim() && form.idea.trim().length >= 20 && form.targetUsers.trim()

  return (
    <div className={styles.pageRoot}>
      <Sidebar activeMenu="prd" />

      <main className={styles.main}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <div className={styles.badge}>
              <Sparkles size={14} />
              AI 기반 자동 생성
            </div>
            <h1 className={styles.title}>PRD 생성기</h1>
            <p className={styles.subtitle}>아이디어를 입력하면 AI가 PRD 문서를 작성하고 자동으로 배포합니다</p>
          </div>
        </div>

        {/* ── Content grid ── */}
        <div className={styles.grid}>

          {/* ── Left: Form ── */}
          <div className={styles.formCol}>

            {/* Project Name */}
            <div className={styles.field}>
              <label className={styles.label}>
                <FileText size={15} className={styles.labelIcon} />
                프로젝트 이름 <span className={styles.required}>*</span>
              </label>
              <input
                className={`${styles.input} ${errors.projectName ? styles.inputError : ''}`}
                placeholder="예: 무한 캔버스 협업 툴"
                value={form.projectName}
                onChange={e => { setForm(prev => ({ ...prev, projectName: e.target.value })); setErrors(prev => ({ ...prev, projectName: undefined })) }}
              />
              {errors.projectName && <span className={styles.errorMsg}>{errors.projectName}</span>}
            </div>

            {/* Idea */}
            <div className={styles.field}>
              <label className={styles.label}>
                <Lightbulb size={15} className={styles.labelIcon} />
                아이디어 / 개념 설명 <span className={styles.required}>*</span>
              </label>
              <textarea
                className={`${styles.textarea} ${errors.idea ? styles.inputError : ''}`}
                placeholder="어떤 서비스인지 자세히 설명해 주세요.&#10;예: 실시간으로 여러 사람이 같은 캔버스에서 포스트잇, 도형, 텍스트를 자유롭게 배치하고 협업할 수 있는 무한 캔버스 툴입니다. Figma의 협업 방식에서 영감을 받았으며..."
                rows={5}
                value={form.idea}
                onChange={e => { setForm(prev => ({ ...prev, idea: e.target.value })); setErrors(prev => ({ ...prev, idea: undefined })) }}
              />
              <div className={styles.charCount}>
                <span className={form.idea.length >= 20 ? styles.charOk : styles.charWarn}>
                  {form.idea.length}자
                </span>
                {' '}/{' '}최소 20자
              </div>
              {errors.idea && <span className={styles.errorMsg}>{errors.idea}</span>}
            </div>

            {/* Target Users */}
            <div className={styles.field}>
              <label className={styles.label}>
                <Users size={15} className={styles.labelIcon} />
                타겟 사용자 <span className={styles.required}>*</span>
              </label>
              <input
                className={`${styles.input} ${errors.targetUsers ? styles.inputError : ''}`}
                placeholder="예: 스타트업 팀, 디자이너, 개발자"
                value={form.targetUsers}
                onChange={e => { setForm(prev => ({ ...prev, targetUsers: e.target.value })); setErrors(prev => ({ ...prev, targetUsers: undefined })) }}
              />
              {errors.targetUsers && <span className={styles.errorMsg}>{errors.targetUsers}</span>}
            </div>

            {/* Core Features */}
            <div className={styles.field}>
              <label className={styles.label}>
                <AlignLeft size={15} className={styles.labelIcon} />
                핵심 기능 <span className={styles.optional}>(선택)</span>
              </label>
              <div className={styles.chipBox}>
                {form.features.map(f => (
                  <span key={f} className={styles.chip}>
                    {f}
                    <button className={styles.chipRemove} onClick={() => removeFeature(f)} tabIndex={-1}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  ref={featureInputRef}
                  className={styles.chipInput}
                  placeholder={form.features.length === 0 ? '기능 입력 후 Enter' : ''}
                  value={featureInput}
                  onChange={e => setFeatureInput(e.target.value)}
                  onKeyDown={onFeatureKeyDown}
                />
              </div>
              <p className={styles.hint}>Enter를 눌러 기능을 추가하세요</p>
            </div>

            {/* Two-column: Tech Stack + Timeline */}
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Code2 size={15} className={styles.labelIcon} />
                  기술 스택 <span className={styles.optional}>(선택)</span>
                </label>
                <input
                  className={styles.input}
                  placeholder="예: React, Spring Boot, AWS"
                  value={form.techStack}
                  onChange={e => setForm(prev => ({ ...prev, techStack: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  <Calendar size={15} className={styles.labelIcon} />
                  개발 기간 <span className={styles.optional}>(선택)</span>
                </label>
                <input
                  className={styles.input}
                  placeholder="예: 3개월, 6주"
                  value={form.timeline}
                  onChange={e => setForm(prev => ({ ...prev, timeline: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* ── Right: Template + Preview ── */}
          <div className={`${styles.sideCol} sticky top-6 h-fit self-start`}>

            {/* Template selector */}
            <div className={styles.sideCard}>
              <h3 className={styles.sideCardTitle}>
                <Layers size={16} />
                문서 템플릿
              </h3>
              <div className={styles.templateList}>
                {TEMPLATES.map(tpl => {
                  const Icon = tpl.icon
                  const active = form.template === tpl.id
                  return (
                    <button
                      key={tpl.id}
                      className={`${styles.templateItem} ${active ? styles.templateActive : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, template: tpl.id }))}
                    >
                      <div className={`${styles.templateIconWrap} ${active ? styles.templateIconActive : ''}`}>
                        <Icon size={18} />
                      </div>
                      <div className={styles.templateText}>
                        <span className={styles.templateLabel}>{tpl.label}</span>
                        <span className={styles.templateDesc}>{tpl.desc}</span>
                      </div>
                      {active && <ChevronRight size={16} className={styles.templateCheck} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Preview card */}
            <div className={styles.sideCard}>
              <h3 className={styles.sideCardTitle}>
                <FileText size={16} />
                포함될 섹션
              </h3>
              <ul className={styles.sectionList}>
                {selectedTemplate.sections.map((s, i) => (
                  <li key={i} className={styles.sectionItem}>
                    <span className={styles.sectionNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tip */}
            <div className={styles.tipCard}>
              <Lightbulb size={14} className={styles.tipIcon} />
              <p className={styles.tipText}>
                <strong>팁:</strong> 아이디어를 구체적으로 작성할수록 더 정확한 PRD가 생성됩니다.
                문제 상황, 해결 방법, 기대 효과를 포함해 보세요.
              </p>
            </div>
          </div>
        </div>

        {/* ── Generate Button ── */}
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <span className={`${styles.readyDot} ${isReady ? styles.readyDotOn : ''}`} />
            {isReady ? '생성 준비 완료' : '필수 항목을 입력해 주세요'}
          </div>
          <button
            className={`${styles.generateBtn} ${!isReady ? styles.generateBtnDisabled : ''}`}
            onClick={handleGenerate}
            disabled={!isReady || generating}
          >
            <Sparkles size={20} />
            PRD 생성 및 배포
            <ArrowRight size={18} />
          </button>
        </div>
      </main>

      {/* ── Loading Overlay ── */}
      {generating && <LoadingOverlay step={loadingStep} />}

      {/* ── Success Modal ── */}
      {deployedUrl && (
        <SuccessModal
          url={deployedUrl}
          onClose={() => setDeployedUrl(null)}
          onOpen={handleOpenLink}
        />
      )}
    </div>
  )
}
