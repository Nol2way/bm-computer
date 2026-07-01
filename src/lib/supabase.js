import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// ถ้ายังไม่ใส่ key เว็บยังรันได้ (ใช้ mock) - เช็คด้วย flag นี้
export const isSupabaseConfigured = Boolean(url && anon)

export const supabase = isSupabaseConfigured
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } })
  : null
