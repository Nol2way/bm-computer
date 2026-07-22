import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icons'
import { cx } from '../lib/ui'
import Banner from './Banner'

const INTERVAL = 5000
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// แบนเนอร์ใหญ่หน้าแรก: เลื่อนเอง 5 วิ · หยุดเมื่อชี้เมาส์/โฟกัสคีย์บอร์ด/สลับไปแท็บอื่น
export default function HeroCarousel({ slides }) {
  const [i, setI] = useState(0)
  const timer = useRef(null)
  const n = slides.length

  const stop = useCallback(() => { clearInterval(timer.current); timer.current = null }, [])
  const start = useCallback(() => {
    if (timer.current || n <= 1 || reduceMotion()) return
    timer.current = setInterval(() => setI((x) => (x + 1) % n), INTERVAL)
  }, [n])

  useEffect(() => {
    start()
    // อยู่แท็บอื่นไม่ต้องเสียแรงเครื่องเลื่อนสไลด์ (ผู้ใช้เปิดหลายแท็บพร้อมกันเป็นเรื่องปกติ)
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVis)
    return () => { stop(); document.removeEventListener('visibilitychange', onVis) }
  }, [start, stop])

  // จำนวนสไลด์เปลี่ยน (โหลดเสร็จ/แอดมินลบ) -> index ต้องไม่ค้างเกินขอบ
  useEffect(() => { setI((x) => (n ? x % n : 0)) }, [n])

  const go = (d) => setI((x) => (x + d + n) % n)

  if (!n) return <div className="skeleton h-[210px] rounded-2xl sm:h-[320px] lg:h-[420px] xl:h-[470px]" aria-hidden="true" />

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-line bg-surface2"
      aria-roledescription="carousel" aria-label="โปรโมชันแนะนำ"
      onMouseEnter={stop} onMouseLeave={start} onFocusCapture={stop} onBlurCapture={start}
    >
      {/* ความสูงคงที่ตามขนาดจอ ไม่ใช้ aspect ratio: งานอาร์ตแบนเนอร์เป็นโปสเตอร์ 1.5:1
          ถ้าผูกกับ aspect ที่กว้าง หน้าแรกจะสูงจนเนื้อหาอื่นตกจอไปหมด */}
      <div className="h-[210px] sm:h-[320px] lg:h-[420px] xl:h-[470px]">
        {slides.map((s, idx) => (
          // ซ่อนด้วย visibility ไม่ใช่แค่ opacity: เบราว์เซอร์จะได้ไม่ต้องวาดชั้นที่มองไม่เห็น
          // (ลดอาการกระตุกบนเครื่อง GPU อ่อน) และ inert กันคีย์บอร์ด tab เข้าไปในสไลด์ที่ซ่อนอยู่
          <div key={s.id || idx}
            aria-hidden={idx !== i}
            inert={idx !== i ? '' : undefined}
            className={cx('absolute inset-0 transition-[opacity,visibility] duration-500',
              idx === i ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0')}>
            <Banner slide={s} size="hero" eager={idx === 0} />
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="สไลด์ก่อนหน้า"
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white transition hover:bg-black/60 cursor-pointer"><Icon name="chevronLeft" /></button>
          <button onClick={() => go(1)} aria-label="สไลด์ถัดไป"
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white transition hover:bg-black/60 cursor-pointer"><Icon name="chevronRight" /></button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} aria-label={`ไปสไลด์ที่ ${idx + 1}`} aria-current={idx === i}
                className={cx('h-2 rounded-full transition-all cursor-pointer', idx === i ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80')} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
