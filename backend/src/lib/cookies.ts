import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { AppEnv } from './env'
import { num } from './env'

export const ACCESS_COOKIE = 'bm_at'
export const REFRESH_COOKIE = 'bm_rt'
// refresh cookie จำกัด path ไว้เฉพาะ endpoint auth (ลดพื้นที่เสี่ยงถูกส่งออกโดยไม่จำเป็น)
const REFRESH_PATH = '/api/auth'

type SameSite = 'Strict' | 'Lax' | 'None'

function baseOpts(c: Context<AppEnv>) {
  const sameSite = (c.env.COOKIE_SAMESITE || 'Lax') as SameSite
  const secure = String(c.env.COOKIE_SECURE) === 'true'
  return { httpOnly: true, secure, sameSite, path: '/' as string }
}

// ออกคุกกี้ session ทั้งคู่ (access สั้น / refresh ยาว) - เรียกตอน login และ refresh (rotation)
export function setSessionCookies(c: Context<AppEnv>, accessToken: string, refreshToken: string) {
  const opts = baseOpts(c)
  setCookie(c, ACCESS_COOKIE, accessToken, { ...opts, maxAge: num(c.env.ACCESS_TTL, 900) })
  setCookie(c, REFRESH_COOKIE, refreshToken, {
    ...opts,
    path: REFRESH_PATH,
    maxAge: num(c.env.REFRESH_TTL, 604800),
  })
}

export function clearSessionCookies(c: Context<AppEnv>) {
  const opts = baseOpts(c)
  deleteCookie(c, ACCESS_COOKIE, { ...opts })
  deleteCookie(c, REFRESH_COOKIE, { ...opts, path: REFRESH_PATH })
}

export const getAccessToken = (c: Context<AppEnv>) => getCookie(c, ACCESS_COOKIE)
export const getRefreshToken = (c: Context<AppEnv>) => getCookie(c, REFRESH_COOKIE)
