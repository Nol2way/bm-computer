import { useRef } from 'react'
import ProductCard from './ProductCard'
import { Icon } from './Icons'

// แถวสินค้าแบบ carousel: แสดง ~6/แถวบนจอใหญ่ เกินให้ลาก/เลื่อนซ้าย-ขวาได้
export default function ProductRow({ items = [], loading }) {
  const ref = useRef(null)
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false })

  const onDown = (e) => {
    const el = ref.current
    drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false }
  }
  const onMove = (e) => {
    if (!drag.current.down) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 4) drag.current.moved = true
    ref.current.scrollLeft = drag.current.startLeft - dx
  }
  const onUp = () => { drag.current.down = false }
  // กันไม่ให้การลากไปกดลิงก์การ์ด
  const onClickCapture = (e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation() } }
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' })

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
    <div className="group relative">
      <div ref={ref}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onClickCapture={onClickCapture}
        className="flex cursor-grab snap-x gap-3 overflow-x-auto scroll-smooth pb-2 select-none active:cursor-grabbing sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((p) => (
          <div key={p.id} className={card}><ProductCard p={p} /></div>
        ))}
      </div>

      {items.length > 6 && (
        <>
          <button onClick={() => scroll(-1)} aria-label="prev"
            className="absolute -left-3 top-[40%] hidden h-10 w-10 place-items-center rounded-full border border-line bg-surface text-fg shadow-md transition hover:bg-surface2 group-hover:grid lg:flex lg:items-center lg:justify-center cursor-pointer">
            <Icon name="chevronLeft" /></button>
          <button onClick={() => scroll(1)} aria-label="next"
            className="absolute -right-3 top-[40%] hidden h-10 w-10 place-items-center rounded-full border border-line bg-surface text-fg shadow-md transition hover:bg-surface2 group-hover:grid lg:flex lg:items-center lg:justify-center cursor-pointer">
            <Icon name="chevronRight" /></button>
        </>
      )}
    </div>
  )
}
