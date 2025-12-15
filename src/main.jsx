import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import packageJson from '../package.json'
import { API_BASE_URL } from './config/api'

// 앱/백엔드 버전 콘솔 출력 (CI/CD 확인용)
// 빌드 시점에 주입된 버전 또는 package.json 버전 사용
const FRONT_VERSION = import.meta.env.VITE_APP_VERSION || packageJson.version || '0.0.0'
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME || new Date().toISOString()

const logVersions = async () => {
  console.info(`[VERSION] frontend: ${FRONT_VERSION}`)
  console.info(`[BUILD] build time: ${BUILD_TIME}`)
  try {
    const res = await fetch(`${API_BASE_URL}/v1/health`)
    if (res.ok) {
      const data = await res.json()
      console.info(`[VERSION] backend: ${data.version || 'unknown'}`)
    } else {
      console.warn(`[VERSION] backend health fetch failed: ${res.status}`)
    }
  } catch (err) {
    console.warn('[VERSION] backend health fetch error:', err?.message || err)
  }
}

logVersions()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
