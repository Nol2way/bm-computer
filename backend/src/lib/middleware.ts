import { createMiddleware } from 'hono/factory'
import type { AppEnv } from './env'
import { getAccessToken } from './cookies'
import { getUserFromToken } from './session'
import { userClient } from './supabase'
import { unauthorized, forbidden } from './http'

// ต้องเข้าสู่ระบบ: อ่าน access cookie -> ตรวจกับ Supabase (เช็คหมดอายุ) -> แนบ user + token
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = getAccessToken(c)
  if (!token) throw unauthorized('เซสชันหมดอายุหรือยังไม่ได้เข้าสู่ระบบ')
  const u = await getUserFromToken(c.env, token)
  if (!u) throw unauthorized('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
  c.set('user', { id: u.id, email: u.email, role: 'customer' })
  c.set('token', token)
  await next()
})

// ต้องเป็นแอดมิน: ผ่าน requireAuth แล้วเช็ค role จากตาราง profiles (อ่านผ่าน RLS ของตัวเอง)
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const token = getAccessToken(c)
  if (!token) throw unauthorized()
  const u = await getUserFromToken(c.env, token)
  if (!u) throw unauthorized('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
  const { data } = await userClient(c.env, token).from('profiles').select('role').eq('id', u.id).maybeSingle()
  const role = data?.role || 'customer'
  if (role !== 'admin') throw forbidden('ต้องเป็นผู้ดูแลระบบ')
  c.set('user', { id: u.id, email: u.email, role })
  c.set('token', token)
  await next()
})
