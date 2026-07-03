import { cx } from '../lib/ui'

// ชุด skeleton loading กลางของทั้งเว็บ - โครงหน้าตาใกล้เคียงเนื้อหาจริง + shimmer (ดู .skeleton ใน index.css)
// ใช้แทน "กำลังโหลด..." / spinner เพื่อลด layout shift และให้ลูกค้ารู้ว่ากำลังมีอะไรขึ้นมา

export function Skeleton({ className = '' }) {
  return <div className={cx('skeleton', className)} aria-hidden="true" />
}

// การ์ดสินค้า: รูปสี่เหลี่ยม + ชื่อ 2 บรรทัด + เรตติ้ง + ราคา + ปุ่ม (โครงเดียวกับ ProductCard)
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-1 h-5 w-1/2" />
      </div>
      <div className="p-4 pt-0"><Skeleton className="h-10 w-full rounded-lg" /></div>
    </div>
  )
}

// แถวสินค้าแบบ carousel (ใช้ใน ProductRow ตอนโหลด)
export function ProductRowSkeleton({ count = 6, cardClass = 'w-[152px] shrink-0 sm:w-[178px] lg:w-[186px]' }) {
  return (
    <div className="flex gap-3 overflow-hidden sm:gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cardClass}><ProductCardSkeleton /></div>
      ))}
    </div>
  )
}

// กริดสินค้า (หน้า list / wishlist)
export function ProductGridSkeleton({ count = 8, className = 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4' }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  )
}

// บรรทัดข้อความหลายแถว (ฟอร์ม/รายละเอียด)
export function TextLinesSkeleton({ lines = 4, className = '' }) {
  const widths = ['w-2/3', 'w-full', 'w-5/6', 'w-1/2', 'w-3/4', 'w-2/5']
  return (
    <div className={cx('flex flex-col gap-3', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={cx('h-4', widths[i % widths.length])} />)}
    </div>
  )
}

// การ์ดออเดอร์ (ประวัติ/แอดมิน): หัวเรื่อง + รายละเอียด + ยอดขวา
export function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5" aria-hidden="true">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function OrderListSkeleton({ count = 3 }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <OrderCardSkeleton key={i} />)}
    </div>
  )
}

// หน้า "รายละเอียดสินค้า": แกลเลอรี + ข้อมูล + ปุ่ม (โครงเดียวกับ ProductDetail)
export function ProductDetailSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex gap-1.5 py-3"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-40" /></div>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div>
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-2/5" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-11 w-32 rounded-lg" />
            <Skeleton className="h-11 flex-1 rounded-xl" />
          </div>
          <TextLinesSkeleton lines={3} />
        </div>
      </div>
    </div>
  )
}

// แถวตาราง (แอดมิน)
export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line" aria-hidden="true">
      <div className="bg-surface2 p-3"><Skeleton className="h-4 w-1/3" /></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-line bg-surface p-3">
          <Skeleton className="h-9 w-9 shrink-0" />
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <Skeleton key={j} className={cx('h-4', j === 0 ? 'w-1/3' : 'w-1/6')} />
          ))}
        </div>
      ))}
    </div>
  )
}

// การ์ดสไลด์ (แอดมิน): รูปกว้าง + แถบข้อความ
export function SlideCardSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-line bg-surface">
          <Skeleton className="aspect-[1200/440] w-full rounded-none" />
          <div className="flex items-center justify-between gap-2 p-3">
            <div className="flex flex-1 flex-col gap-1.5"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div>
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ฟอร์ม (โปรไฟล์/ตั้งค่า): label + input สลับกัน
export function FormSkeleton({ fields = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}

// แถบโลโก้แบรนด์
export function BrandBarSkeleton() {
  return (
    <section className="mt-10 rounded-2xl border border-line bg-surface p-5" aria-hidden="true">
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="flex gap-3 overflow-hidden pb-1">
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14 min-w-[120px] flex-1 rounded-xl" />)}
      </div>
    </section>
  )
}
