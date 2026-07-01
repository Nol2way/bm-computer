import { anonClient } from './supabase'
import type { Bindings } from './env'

export type SessionUser = { id: string; email: string | null }

// ตรวจ access token กับ Supabase (getUser จะ verify signature + exp ให้ที่ฝั่ง Supabase)
// คืน null = token หมดอายุ/ไม่ถูกต้อง -> ต้อง refresh หรือ login ใหม่
export async function getUserFromToken(env: Bindings, token: string): Promise<SessionUser | null> {
  try {
    const { data, error } = await anonClient(env).auth.getUser(token)
    if (error || !data.user) return null
    return { id: data.user.id, email: data.user.email ?? null }
  } catch {
    return null
  }
}
