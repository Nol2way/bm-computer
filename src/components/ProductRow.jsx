import { useEffect, useRef } from 'react'
import ProductCard from './ProductCard'
import { Icon } from './Icons'
import { ProductRowSkeleton } from './Skeleton'

// แถวสินค้าแบบ carousel: ~6/แถว · ลากอิสระลื่น (มี momentum/inertia) · ไม่มี scroll-snap (กันสะดุด) · ปุ่มเลื่อน
export default function ProductRow({ items = [], loading }) {
  const ref = useRef(null)
  // เก็บสถานะการลาก + ความเร็วสำหรับ momentum
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false, lastX: 0, lastT: 0, vx: 0 })
  const inertia = useRef(0)
  const paused = useRef(false)

  const scrollBy = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' })

  const stopInertia = () => { if (inertia.current) { cancelAnimationFrame(inertia.current); inertia.current = 0 } }

  // เลื่อนอัตโนมัติวน (เคารพ prefers-reduced-motion)
  useEffect(() => {
    const el = ref.current
    if (!el || items.length <= 6) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      if (paused.current) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + el.clientWidth * 0.85, behavior: 'smooth' })
    }, 5000)
    return () => clearInterval(id)
  }, [items.length])

  useEffect(() => () => stopInertia(), [])

  const onDown = (e) => {
    stopInertia()
    paused.current = true
    drag.current = { down: true, startX: e.clientX, startLeft: ref.current.scrollLeft, moved: false, lastX: e.clientX, lastT: performance.now(), vx: 0 }
  }
  const onMove = (e) => {
    if (!drag.current.down) return
    const d = drag.current
    const dx = e.clientX - d.startX
    // capture pointer เฉพาะเมื่อเริ่ม "ลาก" จริง - ถ้า capture ตั้งแต่ pointerdown
    // เบราว์เซอร์จะ retarget click ไปที่ container ทำให้กดการ์ด/ปุ่มในแถวไม่ได้เลย
    if (!d.moved && Math.abs(dx) > 3) {
      d.moved = true
      ref.current.setPointerCapture?.(e.pointerId)
    }
    ref.current.scrollLeft = d.startLeft - dx // ตามนิ้วแบบทันที
    const now = performance.now()
    const dt = now - d.lastT
    if (dt > 0) d.vx = (e.clientX - d.lastX) / dt // px ต่อ ms (ทิศตามนิ้ว)
    d.lastX = e.clientX
    d.lastT = now
  }
  const onUp = (e) => {
    const d = drag.current
    if (!d.down) return
    d.down = false
    ref.current.releasePointerCapture?.(e.pointerId)
    // momentum: ปล่อยแล้วไหลต่อด้วยความเร็วตอนปล่อย แล้วค่อยๆ ช้าลง
    let v = -d.vx * 16 // แปลงเป็น px/เฟรม (ทิศ scroll ตรงข้ามการเลื่อนนิ้ว)
    const el = ref.current
    const step = () => {
      if (Math.abs(v) < 0.4) { inertia.current = 0; return }
      el.scrollLeft += v
      v *= 0.94 // แรงเสียดทาน
      inertia.current = requestAnimationFrame(step)
    }
    if (Math.abs(v) > 1) inertia.current = requestAnimationFrame(step)
  }
  const onClickCapture = (e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation() } }

  const card = 'flex w-[152px] shrink-0 sm:w-[178px] lg:w-[186px]'

  if (loading) return <ProductRowSkeleton cardClass={card} />
  if (!items.length) return null

  return (
    <div className="group/row relative"
      onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      <div ref={ref}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onClickCapture={onClickCapture}
        className="flex cursor-grab items-stretch gap-3 overflow-x-auto pb-2 select-none active:cursor-grabbing sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-y]">
        {items.map((p) => (
          <div key={p.id} className={card}><ProductCard p={p} /></div>
        ))}
      </div>

      {items.length > 6 && (
        <>
          <button onClick={() => scrollBy(-1)} aria-label="prev"
            className="absolute -left-3 top-[40%] hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-fg shadow-md transition hover:bg-surface2 group-hover/row:flex cursor-pointer">
            <Icon name="chevronLeft" /></button>
          <button onClick={() => scrollBy(1)} aria-label="next"
            className="absolute -right-3 top-[40%] hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-fg shadow-md transition hover:bg-surface2 group-hover/row:flex cursor-pointer">
            <Icon name="chevronRight" /></button>
        </>
      )}
    </div>
  )
}
