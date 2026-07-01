import { z } from '@hono/zod-openapi'

// ---- schema กลางที่ใช้ซ้ำในหลาย endpoint ----
export const ErrorSchema = z
  .object({ ok: z.literal(false), code: z.string(), error: z.string() })
  .openapi('Error')

export const OkSchema = z.object({ ok: z.literal(true) }).openapi('Ok')

// ห่อ content JSON ให้สั้นลงเวลาเขียน createRoute
export const jsonBody = (schema: any) => ({ content: { 'application/json': { schema } } })

export const jsonRes = (description: string, schema: any) => ({
  description,
  content: { 'application/json': { schema } },
})

// ชุด response error มาตรฐาน (อ้างอิง component เดียวกัน)
export const errRes = (description: string) => jsonRes(description, ErrorSchema)
