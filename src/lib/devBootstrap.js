import { API_BASE_URL } from '../config/api'

export function isLocalDevBrowser() {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1'
}

/** 백엔드 기본값 등으로 Google OAuth URL이 유효하지 않은지 */
export function isGoogleOAuthUrlPlaceholder(loginUrl) {
  if (!loginUrl || typeof loginUrl !== 'string') return true
  const u = loginUrl.toLowerCase()
  return (
    u.includes('your-google-client-id') ||
    u.includes('your_client_id') ||
    loginUrl.includes('YOUR_CLIENT_ID')
  )
}

/**
 * POST /v1/auth/dev/bootstrap 성공 시 localStorage에 토큰·사용자 정보 저장.
 * @returns {Promise<boolean>}
 */
export async function fetchAndApplyDevBootstrap() {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/auth/dev/bootstrap`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data?.accessToken && data?.refreshToken) {
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      const name = (data.name && String(data.name).trim()) || '로컬 개발자'
      const email = (data.email && String(data.email).trim()) || 'dev@localhost.local'
      localStorage.setItem('userName', name)
      localStorage.setItem('userEmail', email)
      console.info('[dev] 로그인 완료:', email)
      return true
    }
  } catch {
    /* 백엔드 미기동 또는 부트스트랩 비활성화 */
  }
  return false
}
