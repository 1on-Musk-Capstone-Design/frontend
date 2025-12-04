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
