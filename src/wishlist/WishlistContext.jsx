import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiEnabled } from '../lib/apiClient'
import { accountApi } from '../lib/accountApi'
import { useAuth } from '../auth/AuthContext'

const Ctx = createContext(null)
export const useWishlist = () => useContext(Ctx)

// จัดการรายการสินค้าที่ถูกใจ (เก็บเป็น set ของ slug) - ใช้เมื่อเปิด backend API เท่านั้น
export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [slugs, setSlugs] = useState(() => new Set())

  const reload = useCallback(async () => {
    if (!apiEnabled || !user) { setSlugs(new Set()); return }
    try {
      const { items } = await accountApi.listWishlist()
      setSlugs(new Set((items || []).map((p) => p.slug)))
    } catch { /* เงียบไว้ - ไม่ให้กระทบหน้าอื่น */ }
  }, [user])

  useEffect(() => { reload() }, [reload])

  const has = useCallback((slug) => slugs.has(slug), [slugs])

  // สลับสถานะถูกใจ (optimistic) - คืน false ถ้ายังไม่ล็อกอิน/ปิด API เพื่อให้ผู้เรียกเปิด modal ล็อกอิน
  const toggle = useCallback(async (slug) => {
    if (!apiEnabled || !user) return false
    const willAdd = !slugs.has(slug)
    setSlugs((prev) => {
      const next = new Set(prev)
      if (willAdd) next.add(slug); else next.delete(slug)
      return next
    })
    try {
      if (willAdd) await accountApi.addWishlist(slug)
      else await accountApi.removeWishlist(slug)
    } catch {
      await reload() // ผิดพลาด -> ซิงก์กลับจาก server
    }
    return true
  }, [slugs, user, reload])

  const enabled = apiEnabled

  return (
    <Ctx.Provider value={{ slugs, has, toggle, reload, count: slugs.size, enabled }}>
      {children}
    </Ctx.Provider>
  )
}
