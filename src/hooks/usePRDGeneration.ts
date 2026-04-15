/**
 * usePRDGeneration
 * PRD 생성 로직을 캡슐화한 공유 훅.
 * MainPage (프로젝트 카드) 와 InfiniteCanvasPage (캔버스 툴바) 양쪽에서 사용.
 *
 * 백엔드(Capstone) Idea Prototype 파이프라인과 연동:
 * POST /v1/ideas/{ideaId}/prototype/pipeline → GET .../prototype/jobs/{jobId} 폴링
 */
import { useState, useCallback } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { PRD_PIPELINE_IDEA_PREFIX, isPrdPipelineIdeaContent } from '../constants/prd'
import type { PRDModalStatus, PRDModalStep } from '../components/PRDModal/PRDModal'

const BASE_STEPS: string[] = [
  '카드 아이디어 수집 중...',
  'AI가 내용을 분석하는 중...',
  'PRD 구조를 설계하는 중...',
  '문서를 작성하는 중...',
  '배포 링크를 생성하는 중...',
]

type PrototypeJobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PRD_GENERATED'
  | 'UI_GENERATED'
  | 'CODE_GENERATED'
  | 'GITHUB_PUSHED'
  | 'DEPLOYED'
  | 'FAILED'

interface PrototypePipelineResponse {
  jobId: number
  ideaId: number
  status: PrototypeJobStatus
  prdMarkdown?: string | null
  uiStructureJson?: string | null
  githubRepoUrl?: string | null
  vercelPreviewUrl?: string | null
  vercelProductionUrl?: string | null
  simulated?: boolean
  vercelDeploymentApiUsed?: boolean | null
  message?: string | null
}

interface PrototypeJobAcceptedResponse {
  jobId: number
  ideaId: number
  status: PrototypeJobStatus
  message?: string | null
}

function buildSteps(currentIndex: number): PRDModalStep[] {
  return BASE_STEPS.map((label, i) => ({
    label,
    done: i < currentIndex,
    active: i === currentIndex,
  }))
}

interface TextCard {
  id: number | string
  text: string
  [key: string]: unknown
}

export interface PRDGenerationState {
  isOpen: boolean
  status: PRDModalStatus
  steps: PRDModalStep[]
  deployedUrl?: string
  usingFallbackUrl?: boolean
  errorMessage?: string
}

function authHeaders(): Record<string, string> {
  const accessToken = localStorage.getItem('accessToken')
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

function apiErrorMessage(err: unknown): string {
  const res = (err as { response?: { data?: unknown } })?.response?.data
  if (typeof res === 'string' && res.trim()) return res
  if (res && typeof res === 'object' && 'message' in res && typeof (res as { message: string }).message === 'string') {
    return (res as { message: string }).message
  }
  return '요청 처리 중 오류가 발생했습니다.'
}

function stepIndexForStatus(status: PrototypeJobStatus): number {
  if (status === 'FAILED') return 4
  if (status === 'PENDING' || status === 'RUNNING') return 1
  if (status === 'PRD_GENERATED') return 2
  if (status === 'UI_GENERATED') return 2
  if (status === 'CODE_GENERATED') return 3
  if (status === 'GITHUB_PUSHED') return 4
  if (status === 'DEPLOYED') return 5
  return 1
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function pickDeployedUrl(res: PrototypePipelineResponse, fallbackUrl: string): { url: string; usingFallback: boolean } {
  const external = [res.vercelPreviewUrl, res.vercelProductionUrl, res.githubRepoUrl]
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter(Boolean)
  const candidate = external[0] || ''

  // 시뮬레이션/Import 링크는 실제 동작 URL이 아닐 수 있어 결과 페이지를 기본 링크로 사용한다.
  if (
    res.simulated ||
    !candidate ||
    candidate.includes('prototype.example.com') ||
    candidate.includes('vercel.com/new/clone?repository-url=')
  ) {
    return { url: fallbackUrl, usingFallback: true }
  }

  return { url: candidate, usingFallback: false }
}

/** 전체 카드를 한 덩어리로 묶어 백엔드 PRD AI가 통합 요약하도록 본문 구성 */
function buildConsolidatedIdeaBody(cards: TextCard[]): string {
  const blocks = cards
    .map(c => (typeof c.text === 'string' ? c.text.trim() : ''))
    .filter(Boolean)
  const numbered = blocks.map((t, i) => `### 아이디어 카드 ${i + 1}\n${t}`).join('\n\n---\n\n')
  return (
    PRD_PIPELINE_IDEA_PREFIX +
    '\n' +
    '아래는 동일 프로젝트에 모은 여러 아이디어/카드입니다. 전체를 이해한 뒤 하나의 제품·서비스 관점으로 통합·요약하여 PRD를 작성할 입력입니다.\n\n' +
    numbered
  )
}

function prdBundleStorageKey(workspaceId: number | string): string {
  return `prdBundleIdeaId_${workspaceId}`
}

async function createMergedIdea(workspaceId: number | string, body: string): Promise<number> {
  const ws = Number(workspaceId)
  const { data } = await axios.post<{ id: number }>(
    `${API_BASE_URL}/v1/ideas`,
    { workspaceId: ws, content: body },
    { headers: { ...authHeaders(), 'Content-Type': 'application/json' } },
  )
  return data.id
}

/**
 * 워크스페이스당 PRD 통합용 아이디어 1개만 유지: 있으면 PUT으로 본문만 최신화, 없으면 POST 생성.
 * (매번 새 아이디어를 만들면 쌓이고, 두 번째 파이프라인/부하에서 500이 나기 쉬움)
 */
/** PUT 실패 후 새 아이디어 POST로 넘기지 말고 즉시 중단할 오류(인증·권한·검증 등) */
function shouldAbortAfterPutFailure(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  if (status === undefined) return false
  if (status === 404 || status === 409) return false
  if (status >= 500) return false
  return true
}

async function upsertPrdBundleIdea(workspaceId: number | string, body: string): Promise<number> {
  const ws = Number(workspaceId)
  const key = prdBundleStorageKey(workspaceId)
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  const existingId = raw ? parseInt(raw, 10) : NaN

  if (Number.isFinite(existingId) && existingId > 0) {
    try {
      await axios.put(
        `${API_BASE_URL}/v1/ideas/${existingId}`,
        { workspaceId: ws, content: body },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } },
      )
      return existingId
    } catch (err) {
      localStorage.removeItem(key)
      if (shouldAbortAfterPutFailure(err)) {
        throw err
      }
    }
  }

  const id = await createMergedIdea(workspaceId, body)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, String(id))
  }
  return id
}

function hasRenderablePrd(data: PrototypePipelineResponse): boolean {
  return Boolean(data.prdMarkdown && String(data.prdMarkdown).trim().length > 20)
}

async function runPrototypePipeline(
  ideaId: number,
  onStatus?: (status: PrototypeJobStatus) => void,
): Promise<PrototypePipelineResponse> {
  const headers = authHeaders()
  const { data: accepted } = await axios.post<PrototypeJobAcceptedResponse>(
    `${API_BASE_URL}/v1/ideas/${ideaId}/prototype/pipeline`,
    {},
    { ...validateStatus202, headers, params: { sync: false } },
  )
  const jobId = accepted.jobId
  const maxAttempts = 180
  const intervalMs = 2000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data } = await axios.get<PrototypePipelineResponse>(
      `${API_BASE_URL}/v1/ideas/${ideaId}/prototype/jobs/${jobId}`,
      { headers },
    )

    onStatus?.(data.status)

    if (data.status === 'FAILED') {
      throw new Error(data.message || '프로토타입 파이프라인이 실패했습니다.')
    }
    if (data.status === 'DEPLOYED') {
      return data
    }
    // 배포 단계가 길거나 교착일 때: PRD Markdown 이 채워졌으면 여기서 완료 (무한 로딩 방지)
    if (
      hasRenderablePrd(data) &&
      (data.status === 'PRD_GENERATED' ||
        data.status === 'UI_GENERATED' ||
        data.status === 'CODE_GENERATED' ||
        data.status === 'GITHUB_PUSHED')
    ) {
      return data
    }
    await delay(intervalMs)
  }

  throw new Error('프로토타입 생성이 시간 초과되었습니다. 잠시 후 다시 시도해 주세요.')
}

/** axios 기본 validateStatus가 202를 거부하지 않도록 */
const validateStatus202 = { validateStatus: (s: number) => s >= 200 && s < 300 }

export function usePRDGeneration() {
  const [state, setState] = useState<PRDGenerationState>({
    isOpen: false,
    status: 'idle',
    steps: buildSteps(0),
  })

  const close = useCallback(() => {
    setState((prev: PRDGenerationState) => ({ ...prev, isOpen: false }))
  }, [])

  const generateFromTexts = useCallback(
    async (workspaceId: number | string, projectName: string, texts: TextCard[]) => {
      const cards = texts.filter(t => t.text && t.text.trim().length > 0)

      if (cards.length === 0) {
        setState({
          isOpen: true,
          status: 'error',
          steps: buildSteps(0),
          errorMessage: '캔버스에 작성된 카드가 없습니다. 아이디어를 먼저 작성해 주세요.',
        })
        return
      }

      const consolidated = buildConsolidatedIdeaBody(cards)
      await _runWithIdeaResolver(workspaceId, projectName, cards, () =>
        upsertPrdBundleIdea(workspaceId, consolidated),
      )
    },
    [],
  )

  const generateFromWorkspace = useCallback(
    async (workspaceId: number | string, projectName: string) => {
      setState({ isOpen: true, status: 'loading', steps: buildSteps(0) })

      try {
        const accessToken = localStorage.getItem('accessToken')
        const res = await axios.get(`${API_BASE_URL}/v1/ideas/workspaces/${workspaceId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        const cards: TextCard[] = (res.data as any[])
          .filter((idea: any) => {
            const content = idea.content || idea.text || ''
            if (isPrdPipelineIdeaContent(content)) return false
            return content.trim().length > 0
          })
          .map((idea: any) => ({
            id: idea.id,
            text: idea.content || idea.text || '',
          }))

        if (cards.length === 0) {
          setState({
            isOpen: true,
            status: 'error',
            steps: buildSteps(0),
            errorMessage: '이 프로젝트에 작성된 카드가 없습니다. 먼저 캔버스에서 아이디어를 작성해 주세요.',
          })
          return
        }

        const consolidated = buildConsolidatedIdeaBody(cards)
        await _runWithIdeaResolver(workspaceId, projectName, cards, () =>
          upsertPrdBundleIdea(workspaceId, consolidated),
        )
      } catch (err: unknown) {
        setState({
          isOpen: true,
          status: 'error',
          steps: buildSteps(0),
          errorMessage: apiErrorMessage(err),
        })
      }
    },
    [],
  )

  async function _runWithIdeaResolver(
    workspaceId: number | string,
    projectName: string,
    cards: TextCard[],
    resolveIdeaId: () => Promise<number>,
  ) {
    setState({ isOpen: true, status: 'loading', steps: buildSteps(0) })

    try {
      const ideaId = await resolveIdeaId()
      setState((prev: PRDGenerationState) => ({ ...prev, steps: buildSteps(1) }))

      const result = await runPrototypePipeline(ideaId, status => {
        setState((prev: PRDGenerationState) => ({
          ...prev,
          steps: buildSteps(stepIndexForStatus(status)),
        }))
      })

      const resultPageUrl = `${window.location.origin}/prd/result/ws_${workspaceId}`
      const { url: deployedUrl, usingFallback } = pickDeployedUrl(result, resultPageUrl)

      const prdKey = `prd_ws_${workspaceId}`
      sessionStorage.setItem(
        prdKey,
        JSON.stringify({
          projectName,
          workspaceId: String(workspaceId),
          ideaId,
          jobId: result.jobId,
          cards: cards.map(c => c.text),
          generatedAt: new Date().toLocaleDateString('ko-KR'),
          idea: cards
            .slice(0, 3)
            .map(c => c.text)
            .join(' / '),
          targetUsers: '프로젝트 팀',
          features: cards
            .map(c => c.text.split(/[.。\n]/)[0].trim().slice(0, 30))
            .filter(Boolean)
            .slice(0, 8),
          techStack: '',
          timeline: '',
          template: 'standard' as const,
          prdMarkdown: result.prdMarkdown ?? '',
          vercelPreviewUrl: result.vercelPreviewUrl ?? '',
          vercelProductionUrl: result.vercelProductionUrl ?? '',
          githubRepoUrl: result.githubRepoUrl ?? '',
          prototypeMessage: result.message ?? '',
          simulated: Boolean(result.simulated),
        }),
      )

      setState({
        isOpen: true,
        status: 'success',
        steps: buildSteps(5),
        deployedUrl,
        usingFallbackUrl: usingFallback,
      })
    } catch (err: unknown) {
      setState({
        isOpen: true,
        status: 'error',
        steps: buildSteps(4),
        errorMessage: err instanceof Error ? err.message : apiErrorMessage(err),
      })
    }
  }

  return {
    state,
    close,
    generateFromTexts,
    generateFromWorkspace,
  }
}
