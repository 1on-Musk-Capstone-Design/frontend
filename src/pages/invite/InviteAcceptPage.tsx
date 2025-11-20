import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../../config/api'
import styles from './InviteAcceptPage.module.css'

export default function InviteAcceptPage() {
  console.log('=== InviteAcceptPage 컴포넌트 렌더링 시작 ===')
  console.log('현재 URL:', window.location.href)
  console.log('현재 경로:', window.location.pathname)
  
  const { token: pathToken } = useParams<{ token?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('처리 중...')
  const [isError, setIsError] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // 토큰 추출: 경로 파라미터 > 쿼리 파라미터 > 경로에서 직접 추출
  const queryToken = searchParams.get('token')
  const urlPath = window.location.pathname
  const extractedPathToken = urlPath.startsWith('/invite/') ? urlPath.split('/invite/')[1] : null
  
  const finalToken = pathToken || queryToken || extractedPathToken
  
  console.log('토큰 파라미터 (useParams):', pathToken)
  console.log('쿼리 파라미터 (token):', queryToken)
  console.log('경로에서 추출한 토큰:', extractedPathToken)
  console.log('최종 사용할 토큰:', finalToken)

  useEffect(() => {
    console.log('=== InviteAcceptPage useEffect 실행 ===')
    console.log('최종 토큰:', finalToken)
    console.log('현재 URL:', window.location.href)
    
    const acceptInvite = async () => {
      const tokenToUse = finalToken
      console.log('초대 수락 페이지 로드됨, 사용할 토큰:', tokenToUse)
      
      if (!tokenToUse) {
        console.warn('초대 토큰이 없습니다.')
        setStatus('초대 토큰이 없습니다.')
        setIsError(true)
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 2000)
        return
      }

      setIsProcessing(true)

      try {
        const accessToken = localStorage.getItem('accessToken')
        console.log('액세스 토큰 확인:', accessToken ? '있음' : '없음')
        
        // 로그인하지 않은 경우 로그인 페이지로 이동
        if (!accessToken) {
          console.log('로그인하지 않음, 로그인 페이지로 이동')
          setStatus('초대를 수락하려면 로그인이 필요합니다.')
          setIsError(false)
          setTimeout(() => {
            // 로그인 후 다시 돌아올 수 있도록 토큰을 저장
            localStorage.setItem('pendingInviteToken', tokenToUse)
            navigate('/auth', { replace: true })
          }, 2000)
          return
        }

        // 초대 수락 API 호출 (초대 수락자는 MEMBER)
        console.log('초대 수락 API 호출 시작:', `${API_BASE_URL}/v1/workspaces/invite/${tokenToUse}/accept`)
        const response = await axios.post(
          `${API_BASE_URL}/v1/workspaces/invite/${tokenToUse}/accept`,
          {
            role: 'MEMBER' // 초대 수락자는 MEMBER
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )
        console.log('초대 수락 API 응답:', response.data)

        setStatus('초대를 성공적으로 수락했습니다!')
        setIsError(false)

        // 초대 수락 성공 플래그 저장 (MainPage에서 목록 새로고침용)
        localStorage.setItem('inviteAccepted', 'true')

        // 메인 페이지로 이동 (페이지 새로고침하여 프로젝트 목록 업데이트)
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      } catch (err: any) {
        console.error('초대 수락 실패', err)
        
        let errorMessage = '초대 수락 중 오류가 발생했습니다.'
        
        if (err?.response) {
          const status = err.response.status
          const data = err.response.data
          
          if (status === 400) {
            errorMessage = '초대 토큰이 유효하지 않거나 만료되었습니다.'
            if (data?.message) {
              errorMessage = data.message
            }
          } else if (status === 401) {
            errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.'
            if (data?.message) {
              errorMessage = `인증 오류: ${data.message}`
            }
          } else if (status === 403) {
            errorMessage = '초대를 수락할 권한이 없습니다.'
            if (data?.message) {
              errorMessage = `권한 오류: ${data.message}`
            }
          } else if (data?.message) {
            errorMessage = data.message
          } else if (data?.error) {
            errorMessage = data.error
          }
        } else if (err?.message) {
          errorMessage = err.message
        }
        
        setStatus(errorMessage)
        setIsError(true)
        
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 3000)
      } finally {
        setIsProcessing(false)
      }
    }

    acceptInvite()
  }, [finalToken, navigate])

  console.log('=== InviteAcceptPage 렌더링 중 ===', { status, isProcessing, isError })

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>초대 수락</h1>
        <div className={styles.statusContainer}>
          {isProcessing ? (
            <div className={styles.spinner}></div>
          ) : (
            <div className={`${styles.statusIcon} ${isError ? styles.error : styles.success}`}>
              {isError ? '✕' : '✓'}
            </div>
          )}
          <p className={`${styles.statusText} ${isError ? styles.errorText : ''}`}>
            {status}
          </p>
        </div>
      </div>
    </div>
  )
}

