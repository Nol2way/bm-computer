import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Context } from 'hono'
import type { Bindings, AppEnv } from './env'

// client แบบ anon: ใช้กับ auth (signIn/signUp/refresh/getUser) และการอ่าน public (RLS public read)
export function anonClient(env: Bindings): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// client แบบ "สวมสิทธิ์ user": แนบ access token -> ทุก query ถูกบังคับด้วย RLS ในนามของ user นั้น
// (ปลอดภัยกว่า service_role เพราะ DB บังคับสิทธิ์ให้เอง ไม่ต้องเชื่อ logic ฝั่ง worker อย่างเดียว)
export function userClient(env: Bindings, accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// client แบบ service_role: ข้าม RLS - ใช้เฉพาะ verify-slip (อัปเดตออเดอร์ของผู้อื่นได้)
export function adminClient(env: Bindings): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ตัวช่วย: สร้าง client ในนาม user ปัจจุบันจาก context (ใช้ใน handler ที่ผ่าน requireAuth/requireAdmin)
export const authedDb = (c: Context<AppEnv>) => userClient(c.env, c.get('token'))
