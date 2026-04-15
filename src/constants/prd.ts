/** 백엔드 PRD 파이프라인 입력용으로만 쓰는 아이디어 행 — 캔버스 카드·PRD 입력 카드 목록에서 제외 */
export const PRD_PIPELINE_IDEA_PREFIX = '[통합 PRD]'

export function isPrdPipelineIdeaContent(content: string | null | undefined): boolean {
  if (typeof content !== 'string') return false
  return content.trimStart().startsWith(PRD_PIPELINE_IDEA_PREFIX)
}
