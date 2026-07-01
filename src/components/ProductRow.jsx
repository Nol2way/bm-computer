import { useEffect, useRef } from 'react'
import ProductCard from './ProductCard'
import { Icon } from './Icons'

// แถวสินค้าแบบ carousel: ~6/แถว, ลากลื่น, เลื่อนอัตโนมัติวนทุก 5 วินาที, ปุ่มเลื่อน
export default function ProductRow({ items = [], loading }) {
  const ref = useRef(null)
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false })
  const paused = useRef(false)

  const scrollBy = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' })

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

  const onDown = (e) => {
    paused.current = true
    drag.current = { down: true, startX: e.clientX, startLeft: ref.current.scrollLeft, moved: false }
  }
  const onMove = (e) => {
    if (!drag.current.down) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 3) drag.current.moved = true
    ref.current.scrollLeft = drag.current.startLeft - dx // instant = ลื่นตามนิ้ว
  }
  const onUp = () => { drag.current.down = false }
  const onClickCapture = (e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation() } }

  const card = 'w-[152px] shrink-0 snap-start sm:w-[178px] lg:w-[186px]'

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`${card} aspect-[3/4] animate-pulse rounded-2xl bg-surface2`} />)}
      </div>
    )
  }
  if (!items.length) return null

  return (
    <div className="group/row relative"
      onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      <div ref={ref}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onClickCapture={onClickCapture}
        className="flex cursor-grab snap-x gap-3 overflow-x-auto pb-2 select-none active:cursor-grabbing sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
