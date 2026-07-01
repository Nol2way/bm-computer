import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { apiEnabled } from '../lib/apiClient'
import { authApi } from '../lib/accountApi'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // โหลดผู้ใช้ปัจจุบันจาก backend (session อยู่ใน HttpOnly cookie - apiClient จะ refresh ให้เองถ้า access หมดอายุ)
  const reload = useCallback(async () => {
    if (!apiEnabled) return
    try {
      const { user: u } = await authApi.me()
      setUser({ id: u.id, email: u.email })
      setProfile(u)
    } catch {
      setUser(null)
      setProfile(null)
    }
  }, [])

  // ===== โหมด backend API (session สั้น + HttpOnly cookie) =====
  useEffect(() => {
    if (!apiEnabled) return
    let alive = true
    ;(async () => {
      // ถ้ากลับมาจาก Google OAuth: supabase-js ฝั่ง client จะจับ session จาก URL
      // -> โอนเข้า HttpOnly cookie ผ่าน backend แล้ว signOut client (เก็บ session ที่ cookie ที่เดียว)
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            await authApi.session({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            })
            await supabase.auth.signOut()
            window.history.replaceState({}, '', window.location.pathname + window.location.search)
          }
        } catch { /* ถ้าโอนไม่สำเร็จ ค่อยให้ผู้ใช้ล็อกอินใหม่ */ }
      }
      await reload()
      if (alive) setLoading(false)
    })()
    return () => { alive = false }
  }, [reload])

  // ===== โหมด Supabase ตรง (fallback เมื่อยังไม่เปิดใช้ backend) =====
  useEffect(() => {
    if (apiEnabled) return
    if (!isSupabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null))
    return () => data.subscription?.unsubscribe()
  }, [])

  // โหลด profile (มี role) เมื่อ user เปลี่ยน - เฉพาะโหมด Supabase ตรง
  useEffect(() => {
    if (apiEnabled) return
    if (!user) { setProfile(null); return }
    let alive = true
    supabase.from('profiles').select('id,full_name,phone,email,role').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (alive) setProfile(data) })
    return () => { alive = false }
  }, [user])

  const signOut = async () => {
    if (apiEnabled) { try { await authApi.logout() } catch { /* ล้าง state ต่อแม้ revoke ไม่สำเร็จ */ } }
    else { await supabase.auth.signOut() }
    setUser(null)
    setProfile(null)
  }

  return (
    <Ctx.Provider value={{ user, profile, isAdmin: profile?.role === 'admin', loading, signOut, reload }}>
      {children}
    </Ctx.Provider>
  )
}
