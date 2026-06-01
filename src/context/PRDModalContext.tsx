import { createContext, useContext, useState, ReactNode } from 'react'

interface PRDModalContextValue {
  isOpen: boolean
  workspaceId: string | null
  projectName: string
  openPRDModal: (workspaceId?: string | null, projectName?: string) => void
  closePRDModal: () => void
}

const PRDModalContext = createContext<PRDModalContextValue | null>(null)

export function PRDModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('내 프로젝트')

  function openPRDModal(wid?: string | null, name?: string) {
    setWorkspaceId(wid ?? null)
    setProjectName(name || '내 프로젝트')
    setIsOpen(true)
  }

  function closePRDModal() {
    setIsOpen(false)
  }

  return (
    <PRDModalContext.Provider value={{ isOpen, workspaceId, projectName, openPRDModal, closePRDModal }}>
      {children}
    </PRDModalContext.Provider>
  )
}

export function usePRDModal() {
  const ctx = useContext(PRDModalContext)
  if (!ctx) throw new Error('usePRDModal must be used within PRDModalProvider')
  return ctx
}
