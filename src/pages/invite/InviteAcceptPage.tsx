import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../../config/api'
import styles from './InviteAcceptPage.module.css'

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState('처리 중...')
  const [isError, setIsError] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const acceptInvite = async () => {
      if (!token) {
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
        
        // 로그인하지 않은 경우 로그인 페이지로 이동
        if (!accessToken) {
          setStatus('초대를 수락하려면 로그인이 필요합니다.')
          setIsError(false)
          setTimeout(() => {
            // 로그인 후 다시 돌아올 수 있도록 토큰을 저장
            localStorage.setItem('pendingInviteToken', token)
            navigate('/auth', { replace: true })
          }, 2000)
          return
        }

        // 초대 수락 API 호출
        await axios.post(
          `${API_BASE_URL}/v1/workspaces/invite/${token}/accept`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

        setStatus('초대를 성공적으로 수락했습니다!')
        setIsError(false)

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
  }, [token, navigate])

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

