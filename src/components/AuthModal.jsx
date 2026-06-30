import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import AuthForm from './AuthForm'
import { Icon } from './Icons'

const Ctx = createContext(null)
export const useAuthModal = () => useContext(Ctx)

export function AuthModalProvider({ children }) {
  const [view, setView] = useState(null) // null | 'login' | 'register'
  const open = useCallback((v = 'login') => setView(v), [])
  const close = useCallback(() => setView(null), [])

  // ปิดด้วย Esc + ล็อกการเลื่อนพื้นหลังขณะเปิด modal
  useEffect(() => {
    if (!view) return
    const onKey = (e) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [view, close])

  return (
    <Ctx.Provider value={{ open, close, view }}>
      {children}
      {view && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="relative z-10 w-full max-w-[440px] animate-[pop_.18s_ease-out]">
            <button onClick={close} className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-fg cursor-pointer" aria-label="close">
              <Icon name="x" />
            </button>
            <AuthForm view={view} setView={setView} onClose={close} />
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
