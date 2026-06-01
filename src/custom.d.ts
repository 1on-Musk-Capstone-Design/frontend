/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SOCKET_SERVER_URL?: string
  readonly VITE_DEV_PROXY_TARGET?: string
  readonly VITE_API_PROXY_TARGET?: string
  readonly VITE_WS_PROXY_TARGET?: string
  readonly VITE_PUBLIC_API_BASE_URL?: string
  readonly VITE_PUBLIC_SOCKET_BASE_URL?: string
  readonly VITE_WEBRTC_TURN_URLS?: string
  readonly VITE_WEBRTC_TURN_USERNAME?: string
  readonly VITE_WEBRTC_TURN_CREDENTIAL?: string
  readonly VITE_WEBRTC_ICE_TRANSPORT_POLICY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module 'sockjs-client' {
  class SockJS {
    constructor(url: string, protocols?: string | string[], options?: any)
    send(data: string): void
    close(): void
    onopen: ((event: any) => void) | null
    onmessage: ((event: any) => void) | null
    onclose: ((event: any) => void) | null
    onerror: ((event: any) => void) | null
    readyState: number
    url: string
    protocol: string
    extensions: string
    bufferedAmount: number
  }
  export = SockJS
}

// If your project uses imported images or SVGs in TSX, consider adding:
// declare module '*.svg'
// declare module '*.png'
// declare module '*.jpg'
