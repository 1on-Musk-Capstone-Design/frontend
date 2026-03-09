import { useEffect } from 'react'

/**
 * /capstone_v2 경로 접근 시 캡스톤 랜딩 페이지로 전체 페이지 이동
 * (onit_v2/app 빌드 결과물이 public/capstone_v2/에 배치됨)
 */
function CapstoneV2Redirect() {
  useEffect(() => {
    window.location.replace('/capstone_v2/')
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <p className="font-body">캡스톤 페이지로 이동 중...</p>
    </div>
  )
}

export default CapstoneV2Redirect
