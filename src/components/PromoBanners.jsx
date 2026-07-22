import Banner from './Banner'
import { Skeleton } from './Skeleton'

// แถวแบนเนอร์โปรโมชันใต้ hero (แบบร้านค้าออนไลน์ทั่วไป)
// จำนวน/เนื้อหา/ลิงก์ คุมจากหลังบ้านทั้งหมด (slides ที่ placement = 'promo')
// ไม่เพิ่มในหลังบ้าน = ไม่ขึ้นบนเว็บ
export default function PromoBanners({ slides, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[16/9] rounded-2xl" />)}
      </div>
    )
  }
  if (!slides?.length) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {slides.map((s) => (
        <div key={s.id} className="overflow-hidden rounded-2xl border border-line transition-shadow hover:shadow-lg">
          <div className="aspect-[16/9]">
            <Banner slide={s} size="promo" />
          </div>
        </div>
      ))}
    </div>
  )
}
