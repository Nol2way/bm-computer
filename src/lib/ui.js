// helper รวม
export const cx = (...a) => a.filter(Boolean).join(' ')

// path asset ใน public (รองรับ base './' บน GitHub Pages subpath)
export const asset = (p) => import.meta.env.BASE_URL + p

// ป้ายสถานะสินค้า: key -> {label key, สี}
export const badgeMap = {
  best: { key: 'best', cls: 'bg-brand-600 text-white' },
  sale: { key: 'sale', cls: 'bg-emerald-600 text-white' },
  low:  { key: 'low',  cls: 'bg-amber-500 text-white' },
}
export const badgeLabel = { th: { best: 'ขายดี', sale: 'ลดราคา', low: 'ใกล้หมด' }, en: { best: 'Best', sale: 'Sale', low: 'Few left' } }

// ป้ายสถานะออเดอร์
export const orderStatusCls = {
  shipping: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  done: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  cancel: 'bg-zinc-500/15 text-zinc-500',
}
