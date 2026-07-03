import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../lib/env'
import { anonClient, authedDb } from '../lib/supabase'
import { requireAuth } from '../lib/middleware'
import { badRequest, notFound } from '../lib/http'
import { OkSchema, jsonBody, jsonRes, errRes } from '../lib/openapi'

const TAG = ['Builder']
const MAX_BUILDS_PER_USER = 50

// items: [{slot, id(=product slug), qty}] - slot จำกัดตามที่หน้า builder ใช้
const SLOT_KEYS = ['cpu', 'mainboard', 'ram', 'cooler', 'gpu', 'storage', 'case', 'psu', 'monitor', 'gear'] as const
const ItemSchema = z.object({
  slot: z.enum(SLOT_KEYS),
  id: z.string().min(1).max(120),
  qty: z.number().int().min(1).max(4).default(1),
}).openapi('BuildItem')

const BuildBody = z.object({
  name: z.string().min(1).max(60),
  items: z.array(ItemSchema).max(24),
  budget: z.number().int().positive().max(10_000_000).nullable().optional(),
  is_public: z.boolean().optional(),
}).openapi('BuildBody')

const BuildSchema = z.object({
  id: z.string(), name: z.string(), share_code: z.string(),
  items: z.array(ItemSchema), budget: z.number().nullable(),
  is_public: z.boolean(), created_at: z.string(), updated_at: z.string(),
}).openapi('Build')

const IdParam = z.object({ id: z.string().uuid() })
const SELECT = 'id,name,share_code,items,budget,is_public,created_at,updated_at'

// ตรวจว่า product slug ใน items มีอยู่จริงและยังขายอยู่ (กันบันทึกขยะ/id มั่ว)
async function validateItems(env: AppEnv['Bindings'], items: { slot: string; id: string; qty: number }[]) {
  if (!items.length) return
  const slugs = [...new Set(items.map((i) => i.id))]
  const { data, error } = await anonClient(env).from('products').select('slug').in('slug', slugs).eq('is_active', true)
  if (error) throw badRequest(error.message)
  const found = new Set((data ?? []).map((r: any) => r.slug))
  const missing = slugs.filter((s) => !found.has(s))
  if (missing.length) throw badRequest(`ไม่พบสินค้า: ${missing.join(', ')}`)
}

export function registerBuilder(app: OpenAPIHono<AppEnv>) {
  // ---------- GET /api/builder/builds - สเปคของฉัน ----------
  app.openapi(
    createRoute({
      method: 'get', path: '/api/builder/builds', tags: TAG, summary: 'สเปคที่ฉันบันทึกไว้',
      middleware: [requireAuth] as const,
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), items: z.array(BuildSchema) })), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const { data, error } = await authedDb(c).from('builds').select(SELECT).order('updated_at', { ascending: false })
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, items: data ?? [] })
    }
  )

  // ---------- POST /api/builder/builds - บันทึกสเปคใหม่ ----------
  app.openapi(
    createRoute({
      method: 'post', path: '/api/builder/builds', tags: TAG, summary: 'บันทึกสเปคใหม่',
      middleware: [requireAuth] as const,
      request: { body: jsonBody(BuildBody) },
      responses: { 200: jsonRes('บันทึกแล้ว', z.object({ ok: z.literal(true), build: BuildSchema })), 400: errRes('ข้อมูลไม่ถูกต้อง'), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const b = c.req.valid('json')
      const user = c.get('user')!
      await validateItems(c.env, b.items)
      const db = authedDb(c)
      const { count } = await db.from('builds').select('id', { count: 'exact', head: true })
      if ((count ?? 0) >= MAX_BUILDS_PER_USER) throw badRequest(`บันทึกได้สูงสุด ${MAX_BUILDS_PER_USER} สเปค กรุณาลบสเปคเก่าก่อน`)
      const { data, error } = await db.from('builds')
        .insert({ user_id: user.id, name: b.name, items: b.items, budget: b.budget ?? null, is_public: !!b.is_public })
        .select(SELECT).single()
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, build: data })
    }
  )

  // ---------- PATCH /api/builder/builds/{id} - แก้ชื่อ/ชิ้นส่วน/งบ/เปิดแชร์ ----------
  app.openapi(
    createRoute({
      method: 'patch', path: '/api/builder/builds/{id}', tags: TAG, summary: 'แก้ไขสเปคของตัวเอง',
      middleware: [requireAuth] as const,
      request: { params: IdParam, body: jsonBody(BuildBody.partial()) },
      responses: { 200: jsonRes('บันทึกแล้ว', z.object({ ok: z.literal(true), build: BuildSchema })), 400: errRes('ข้อมูลไม่ถูกต้อง'), 401: errRes('ต้องเข้าสู่ระบบ'), 404: errRes('ไม่พบสเปค') },
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const b = c.req.valid('json')
      if (b.items) await validateItems(c.env, b.items)
      const patch: Record<string, unknown> = {}
      if (b.name !== undefined) patch.name = b.name
      if (b.items !== undefined) patch.items = b.items
      if (b.budget !== undefined) patch.budget = b.budget
      if (b.is_public !== undefined) patch.is_public = b.is_public
      if (!Object.keys(patch).length) throw badRequest('ไม่มีข้อมูลให้แก้ไข')
      const { data, error } = await authedDb(c).from('builds').update(patch).eq('id', id).select(SELECT).maybeSingle()
      if (error) throw badRequest(error.message)
      if (!data) throw notFound('ไม่พบสเปค') // RLS กรอง: ไม่ใช่ของตัวเอง = ไม่เจอ
      return c.json({ ok: true as const, build: data })
    }
  )

  // ---------- DELETE /api/builder/builds/{id} ----------
  app.openapi(
    createRoute({
      method: 'delete', path: '/api/builder/builds/{id}', tags: TAG, summary: 'ลบสเปคของตัวเอง',
      middleware: [requireAuth] as const,
      request: { params: IdParam },
      responses: { 200: jsonRes('ลบแล้ว', OkSchema), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const { error } = await authedDb(c).from('builds').delete().eq('id', c.req.valid('param').id)
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const })
    }
  )

  // ---------- POST /api/builder/builds/{id}/duplicate ----------
  app.openapi(
    createRoute({
      method: 'post', path: '/api/builder/builds/{id}/duplicate', tags: TAG, summary: 'ทำสำเนาสเปค',
      middleware: [requireAuth] as const,
      request: { params: IdParam },
      responses: { 200: jsonRes('สำเนาแล้ว', z.object({ ok: z.literal(true), build: BuildSchema })), 401: errRes('ต้องเข้าสู่ระบบ'), 404: errRes('ไม่พบสเปค') },
    }),
    async (c) => {
      const user = c.get('user')!
      const db = authedDb(c)
      const { data: src, error } = await db.from('builds').select('name,items,budget').eq('id', c.req.valid('param').id).maybeSingle()
      if (error) throw badRequest(error.message)
      if (!src) throw notFound('ไม่พบสเปค')
      const { count } = await db.from('builds').select('id', { count: 'exact', head: true })
      if ((count ?? 0) >= MAX_BUILDS_PER_USER) throw badRequest(`บันทึกได้สูงสุด ${MAX_BUILDS_PER_USER} สเปค กรุณาลบสเปคเก่าก่อน`)
      const copyName = (src.name + ' (สำเนา)').slice(0, 60)
      const { data, error: e2 } = await db.from('builds')
        .insert({ user_id: user.id, name: copyName, items: src.items, budget: src.budget })
        .select(SELECT).single()
      if (e2) throw badRequest(e2.message)
      return c.json({ ok: true as const, build: data })
    }
  )

  // ---------- GET /api/builder/shared/{code} - เปิดสเปคที่แชร์ (public) ----------
  app.openapi(
    createRoute({
      method: 'get', path: '/api/builder/shared/{code}', tags: TAG, summary: 'เปิดสเปคจากลิงก์แชร์',
      request: { params: z.object({ code: z.string().min(6).max(32) }) },
      responses: {
        200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), build: z.object({ name: z.string(), items: z.array(ItemSchema), budget: z.number().nullable(), updated_at: z.string() }) })),
        404: errRes('ไม่พบสเปคที่แชร์'),
      },
    }),
    async (c) => {
      const { code } = c.req.valid('param')
      // anon + RLS: อ่านได้เฉพาะ is_public=true เท่านั้น
      const { data, error } = await anonClient(c.env).from('builds')
        .select('name,items,budget,updated_at').eq('share_code', code).eq('is_public', true).maybeSingle()
      if (error) throw badRequest(error.message)
      if (!data) throw notFound('ไม่พบสเปคที่แชร์ หรือเจ้าของปิดการแชร์แล้ว')
      return c.json({ ok: true as const, build: data })
    }
  )
}
