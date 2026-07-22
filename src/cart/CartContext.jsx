import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'

const Ctx = createContext(null)
export const useCart = () => useContext(Ctx)

// ตะกร้าแยกตามบัญชี: คีย์เดิม 'bm-cart' เก็บรวมทั้งเครื่อง ทำให้ล็อกอินอีกบัญชีแล้วเห็นตะกร้าของบัญชีก่อนหน้า
const PREFIX = 'bm-cart:'
const LEGACY_KEY = 'bm-cart'
const keyFor = (uid) => PREFIX + (uid || 'guest')

// localStorage แก้ได้จากฝั่งผู้ใช้ -> อ่านเข้ามาต้องกรองรูปแบบให้ปลอดภัยก่อนใช้เสมอ
// (ราคาที่เก็บไว้เป็นแค่ตัวเลขไว้แสดงผล ตอนสั่งซื้อจริง backend คิดราคาจาก DB ใหม่ทั้งหมด)
function sanitize(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  return raw.reduce((acc, x) => {
    if (!x || typeof x.slug !== 'string' || !x.slug || seen.has(x.slug)) return acc
    const qty = Math.min(99, Math.max(1, Math.trunc(Number(x.qty)) || 1))
    seen.add(x.slug)
    acc.push({
      slug: x.slug,
      name: typeof x.name === 'string' ? x.name : x.slug,
      price: Number(x.price) || 0,
      old: Number(x.old) || null,
      image: typeof x.image === 'string' ? x.image : null,
      cat: typeof x.cat === 'string' ? x.cat : null,
      brand: typeof x.brand === 'string' ? x.brand : null,
      warranty_period_months: Number(x.warranty_period_months) || null,
      qty,
    })
    return acc
  }, [])
}

function read(key) {
  try { return sanitize(JSON.parse(localStorage.getItem(key))) } catch { return [] }
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const uid = user?.id || null
  const [items, setItems] = useState([])
  const [ready, setReady] = useState(false)
  const keyRef = useRef(null)

  // สลับตะกร้าตามบัญชีที่ล็อกอินอยู่ (ล็อกอิน/ออก/สลับบัญชีในอีกแท็บ)
  useEffect(() => {
    if (authLoading) return // ยังไม่รู้ว่าเป็นใคร: อย่าเพิ่งโหลด/เขียนทับ
    // ตะกร้ารุ่นเก่าที่ปนกันทุกบัญชี: ทิ้งทันทีที่เจอ (ต้นเหตุของตะกร้ารั่วข้ามบัญชี)
    try { localStorage.removeItem(LEGACY_KEY) } catch { /* โหมดส่วนตัวบางเบราว์เซอร์เขียนไม่ได้ */ }
    const key = keyFor(uid)
    keyRef.current = key
    setItems(read(key))
    setReady(true)
  }, [uid, authLoading])

  // เขียนกลับ "เฉพาะคีย์ของบัญชีปัจจุบัน" เท่านั้น
  useEffect(() => {
    if (!ready || !keyRef.current) return
    try { localStorage.setItem(keyRef.current, JSON.stringify(items)) } catch { /* เต็ม/ปิดกั้น */ }
  }, [items, ready])

  // อีกแท็บของบัญชีเดียวกันแก้ตะกร้า -> ให้แท็บนี้เห็นตรงกัน
  useEffect(() => {
    if (!ready) return
    const onStorage = (e) => { if (e.key === keyRef.current) setItems(read(keyRef.current)) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [ready])

  const add = (p, qty = 1) => setItems((it) => {
    const n = Math.max(1, Math.trunc(qty) || 1)
    const found = it.find((x) => x.slug === p.slug)
    if (found) return it.map((x) => (x.slug === p.slug ? { ...x, qty: Math.min(99, x.qty + n) } : x))
    return [...it, {
      slug: p.slug, name: p.name, price: p.price, old: p.old || null,
      image: p.images?.[0] || null, cat: p.cat, brand: p.brand,
      warranty_period_months: p.warranty_period_months || null, qty: n,
    }]
  })
  const setQty = (slug, qty) => setItems((it) => it.map((x) => (x.slug === slug ? { ...x, qty: Math.min(99, Math.max(1, qty)) } : x)))
  const remove = (slug) => setItems((it) => it.filter((x) => x.slug !== slug))
  const clear = () => setItems([])

  const count = items.reduce((s, x) => s + x.qty, 0)
  const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0)
  const shipping = items.length === 0 ? 0 : subtotal >= 1500 ? 0 : 80
  const total = subtotal + shipping

  return (
    <Ctx.Provider value={{ items, add, setQty, remove, clear, count, subtotal, shipping, total, ready }}>
      {children}
    </Ctx.Provider>
  )
}
