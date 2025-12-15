import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import packageJson from '../package.json'
import { API_CONSTANTS } from './pages/infinite-canvas/constants'

// 앱/백엔드 버전 콘솔 출력 (CI/CD 확인용)
const FRONT_VERSION = packageJson.version || 'unknown'
const logVersions = async () => {
  console.info(`[VERSION] frontend: ${FRONT_VERSION}`)
  try {
    const res = await fetch(`${API_CONSTANTS.CLUSTERING_API_URL}/health`)
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
