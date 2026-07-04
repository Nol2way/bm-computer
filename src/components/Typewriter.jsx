import { useEffect, useRef, useState } from 'react'

// พิมพ์ข้อความทีละตัวอักษรแล้วลบทีละตัว วนไปเรื่อยๆ ตามอาเรย์ที่ส่งมา
// เคารพ prefers-reduced-motion: ถ้าผู้ใช้ปิดอนิเมชัน จะโชว์ข้อความแรกนิ่งๆ
export default function Typewriter({ phrases = [], typeMs = 55, deleteMs = 30, holdMs = 1400, className = '' }) {
  const [text, setText] = useState('')
  const [idx, setIdx] = useState(0)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (!phrases.length) return
    if (reduced.current) { setText(phrases[0]); return }
    const full = phrases[idx % phrases.length]
    let deleting = false
    let i = 0
    let timer

    const tick = () => {
      if (!deleting) {
        i++
        setText(full.slice(0, i))
        if (i >= full.length) { timer = setTimeout(() => { deleting = true; tick() }, holdMs); return }
        timer = setTimeout(tick, typeMs)
      } else {
        i--
        setText(full.slice(0, i))
        if (i <= 0) { setIdx((x) => (x + 1) % phrases.length); return }
        timer = setTimeout(tick, deleteMs)
      }
    }
    timer = setTimeout(tick, typeMs)
    return () => clearTimeout(timer)
  }, [idx, phrases, typeMs, deleteMs, holdMs])

  return (
    <span className={className} aria-live="polite">
      {text}
      <span className="ml-0.5 inline-block w-[2px] animate-[blink_1s_steps(1)_infinite] bg-current align-middle" style={{ height: '1em' }} aria-hidden="true" />
    </span>
  )
}
