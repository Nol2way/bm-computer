import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

// error กลาง: โยน HttpError แล้ว handler ตอบเป็น JSON รูปแบบเดียวกันทั้งระบบ
export class HttpError extends HTTPException {
  constructor(status: number, message: string, public code = 'error') {
    super(status as any, { message })
  }
}

export const badRequest = (m: string) => new HttpError(400, m, 'bad_request')
export const unauthorized = (m = 'ต้องเข้าสู่ระบบก่อน') => new HttpError(401, m, 'unauthorized')
export const forbidden = (m = 'ไม่มีสิทธิ์เข้าถึง') => new HttpError(403, m, 'forbidden')
export const notFound = (m = 'ไม่พบข้อมูล') => new HttpError(404, m, 'not_found')
export const serverError = (m = 'เกิดข้อผิดพลาดในระบบ') => new HttpError(500, m, 'server_error')

// handler รวมสำหรับ onError
export function errorHandler(err: Error, c: Context) {
  if (err instanceof HttpError) {
    return c.json({ ok: false, code: err.code, error: err.message }, err.status as any)
  }
  if (err instanceof HTTPException) {
    return c.json({ ok: false, code: 'error', error: err.message }, err.status as any)
  }
  console.error('[unhandled]', err)
  return c.json({ ok: false, code: 'server_error', error: 'เกิดข้อผิดพลาดในระบบ' }, 500)
}
