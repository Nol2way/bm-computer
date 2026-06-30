import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext(null)
export const useCart = () => useContext(Ctx)
const KEY = 'bm-cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)) }, [items])

  const add = (p, qty = 1) => setItems((it) => {
    const found = it.find((x) => x.slug === p.slug)
    if (found) return it.map((x) => (x.slug === p.slug ? { ...x, qty: x.qty + qty } : x))
    return [...it, {
      slug: p.slug, name: p.name, price: p.price, old: p.old || null,
      image: p.images?.[0] || null, cat: p.cat, brand: p.brand, qty,
    }]
  })
  const setQty = (slug, qty) => setItems((it) => it.map((x) => (x.slug === slug ? { ...x, qty: Math.max(1, qty) } : x)))
  const remove = (slug) => setItems((it) => it.filter((x) => x.slug !== slug))
  const clear = () => setItems([])

  const count = items.reduce((s, x) => s + x.qty, 0)
  const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0)
  const shipping = items.length === 0 ? 0 : subtotal >= 1500 ? 0 : 80
  const total = subtotal + shipping

  return (
    <Ctx.Provider value={{ items, add, setQty, remove, clear, count, subtotal, shipping, total }}>
      {children}
    </Ctx.Provider>
  )
}
