/**
 * usePRDGeneration
 * PRD 생성 로직을 캡슐화한 공유 훅.
 * MainPage (프로젝트 카드) 와 InfiniteCanvasPage (캔버스 툴바) 양쪽에서 사용.
 */
import { useState, useCallback } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import type { PRDModalStatus, PRDModalStep } from '../components/PRDModal/PRDModal'

const BASE_STEPS: string[] = [
  '카드 아이디어 수집 중...',
  'AI가 내용을 분석하는 중...',
  'PRD 구조를 설계하는 중...',
  '문서를 작성하는 중...',
  '배포 링크를 생성하는 중...',
]

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
  errorMessage?: string
}

export function usePRDGeneration() {
  const [state, setState] = useState<PRDGenerationState>({
    isOpen: false,
    status: 'idle',
    steps: buildSteps(0),
  })

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
  }, [])

  /**
   * 캔버스 안에서 직접 texts 배열을 넘겨 PRD 생성
   */
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

      await _run(workspaceId, projectName, cards)
    },
    [],
  )

  /**
   * 홈(프로젝트 카드)에서 workspaceId로 API 호출 후 PRD 생성
   */
  const generateFromWorkspace = useCallback(
    async (workspaceId: number | string, projectName: string) => {
      // Step 0: fetch ideas
      setState({ isOpen: true, status: 'loading', steps: buildSteps(0) })

      try {
        const accessToken = localStorage.getItem('accessToken')
        const res = await axios.get(`${API_BASE_URL}/v1/ideas/workspaces/${workspaceId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        const cards: TextCard[] = (res.data as any[])
          .filter((idea: any) => {
            const content = idea.content || idea.text || ''
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

        await _run(workspaceId, projectName, cards)
      } catch (err: any) {
        setState({
          isOpen: true,
          status: 'error',
          steps: buildSteps(0),
          errorMessage: err?.response?.data?.message || '카드 데이터를 불러오는데 실패했습니다.',
        })
      }
    },
    [],
  )

  async function _run(
    workspaceId: number | string,
    projectName: string,
    cards: TextCard[],
  ) {
    setState({ isOpen: true, status: 'loading', steps: buildSteps(0) })

    // Step 1 → 4: 시뮬레이션 (실제 구현시 API 응답으로 교체)
    for (let i = 1; i <= 4; i++) {
      await delay(1000 + Math.random() * 600)
      setState(prev => ({ ...prev, steps: buildSteps(i) }))
    }

    try {
      // TODO: 실제 PRD 생성 API 호출로 교체
      // const res = await axios.post(`${API_BASE_URL}/v1/prd/generate`, {
      //   workspaceId,
      //   projectName,
      //   cards: cards.map(c => c.text),
      // }, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      // const deployedUrl = res.data.deployedUrl

      // 카드 데이터를 result 페이지용으로 sessionStorage에 저장
      const prdKey = `prd_ws_${workspaceId}`
      sessionStorage.setItem(prdKey, JSON.stringify({
        projectName,
        workspaceId: String(workspaceId),
        cards: cards.map(c => c.text),
        generatedAt: new Date().toLocaleDateString('ko-KR'),
        // idea 필드 구성 (PRDResultPage의 PRDData 형식 맞춤)
        idea: cards.slice(0, 3).map(c => c.text).join(' / '),
        targetUsers: '프로젝트 팀',
        features: cards.map(c => c.text.split(/[.。\n]/)[0].trim().slice(0, 30)).filter(Boolean).slice(0, 8),
        techStack: '',
        timeline: '',
        template: 'standard' as const,
      }))

      await delay(500)

      const deployedUrl = `${window.location.origin}/prd/result/ws_${workspaceId}`

      setState({
        isOpen: true,
        status: 'success',
        steps: buildSteps(5),
        deployedUrl,
      })
    } catch (err: any) {
      setState({
        isOpen: true,
        status: 'error',
        steps: buildSteps(4),
        errorMessage: err?.response?.data?.message || 'PRD 생성 중 오류가 발생했습니다.',
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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
