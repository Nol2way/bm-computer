import { useEffect, useRef } from 'react'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
export const turnstileEnabled = Boolean(SITE_KEY)

// Cloudflare Turnstile (กันบอท) - โหมด managed จะติ๊กถูกให้เองอัตโนมัติ
export default function Turnstile({ onToken }) {
  const ref = useRef(null)
  const widget = useRef(null)

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false
    let iv

    const render = () => {
      if (cancelled || widget.current != null || !window.turnstile || !ref.current) return
      widget.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: 'auto',
        callback: (token) => onToken(token),
        'error-callback': () => onToken(''),
        'expired-callback': () => onToken(''),
      })
    }

    if (window.turnstile) render()
    else iv = setInterval(() => { if (window.turnstile) { clearInterval(iv); render() } }, 200)

    return () => {
      cancelled = true
      if (iv) clearInterval(iv)
      if (widget.current != null && window.turnstile) { try { window.turnstile.remove(widget.current) } catch { /* noop */ } }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!SITE_KEY) return null
  return <div ref={ref} className="flex min-h-[65px] justify-center" />
}
