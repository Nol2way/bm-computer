import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null))
    return () => data.subscription?.unsubscribe()
  }, [])

  // โหลด profile (มี role) เมื่อ user เปลี่ยน
  useEffect(() => {
    if (!user) { setProfile(null); return }
    let alive = true
    supabase.from('profiles').select('id,full_name,phone,email,role').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (alive) setProfile(data) })
    return () => { alive = false }
  }, [user])

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null) }

  return (
    <Ctx.Provider value={{ user, profile, isAdmin: profile?.role === 'admin', loading, signOut }}>
      {children}
    </Ctx.Provider>
  )
}
