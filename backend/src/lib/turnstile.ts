import type { Bindings } from './env'

// ตรวจ Cloudflare Turnstile ฝั่ง server (กันบอท) - ถ้าไม่ได้ตั้ง secret ไว้ = ข้าม (dev)
export async function verifyTurnstile(env: Bindings, token: string | undefined, ip?: string) {
  if (!env.TURNSTILE_SECRET) return true // ยังไม่เปิดใช้ = ผ่าน (ตั้ง TURNSTILE_SECRET เพื่อบังคับ)
  if (!token) return false
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })
  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}
