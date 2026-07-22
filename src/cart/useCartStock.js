import { useMemo } from 'react'
import { fetchStock } from '../lib/api'
import { useFetch } from '../lib/useFetch'

// ตรวจตะกร้ากับสต็อกจริงจากหลังบ้าน
// ตะกร้าอยู่ใน localStorage (ค้างข้ามวันได้) จึงเชื่อ qty/ราคาใน snapshot ไม่ได้ ต้องถามของจริงก่อนสั่งซื้อ
// นี่คือด่านของ "UX" เท่านั้น ด่านจริงอยู่ที่ backend (POST /api/orders) และที่ DB (constraint สต็อก)
export function useCartStock(items) {
  const slugKey = useMemo(() => items.map((i) => i.slug).sort().join(','), [items])
  const { data, loading, error, refetch } = useFetch(() => fetchStock(slugKey ? slugKey.split(',') : []), [slugKey])

  return useMemo(() => {
    const bySlug = Object.fromEntries((data || []).map((r) => [r.slug, r]))
    // ยังโหลดไม่เสร็จ หรือถามสต็อกไม่ได้: ไม่บล็อกผู้ใช้ (backend ตรวจซ้ำอยู่แล้ว) แต่ก็ไม่โกหกว่ามีของ
    const known = !loading && !error && !!data
    const lines = items.map((it) => {
      const s = bySlug[it.slug]
      const missing = known && !s
      const inactive = !!s && s.is_active === false
      const stock = s ? s.stock : null
      const out = known && (missing || inactive || stock === 0)
      const short = known && !out && stock !== null && stock < it.qty
      return { ...it, stock, missing, inactive, out, short, priceChanged: !!s && s.price !== it.price, newPrice: s?.price ?? null }
    })
    const problems = lines.filter((l) => l.out || l.short)
    return { loading, known, lines, problems, blocked: problems.length > 0, refetch }
  }, [items, data, loading, error, refetch])
}
