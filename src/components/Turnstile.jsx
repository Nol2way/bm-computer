import { useEffect, useRef } from 'react'

// dev (vite dev server): site key จริงผูกกับโดเมน prod - บน localhost widget จะ error ทำให้กด login/register ไม่ได้
// จึงใช้ test key ทางการของ Cloudflare (ผ่านเสมอ ใช้ได้ทุกโดเมน) แทน · ฝั่ง server dev ไม่ตั้ง TURNSTILE_SECRET = ข้ามการตรวจอยู่แล้ว
const RAW_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const SITE_KEY = import.meta.env.DEV && RAW_KEY ? '1x00000000000000000000AA' : RAW_KEY
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
      // ต้อง reset เป็น null - ไม่งั้น StrictMode (dev) ที่ mount ซ้ำจะเจอ widget.current ค้าง
      // แล้วไม่ render widget ใหม่ -> ฟอร์ม login/register กดไม่ได้บน localhost
      widget.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!SITE_KEY) return null
  return <div ref={ref} className="flex min-h-[65px] justify-center" />
}
