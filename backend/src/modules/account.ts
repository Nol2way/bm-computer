import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../lib/env'
import { authedDb } from '../lib/supabase'
import { requireAuth } from '../lib/middleware'
import { badRequest, notFound } from '../lib/http'
import { OkSchema, jsonBody, jsonRes, errRes } from '../lib/openapi'
import { mapProduct, ProductSchema } from './catalog'

const TAG = ['Account']
const IdParam = z.object({ id: z.string().uuid() })

// ============================ PROFILE ============================
const ProfileSchema = z
  .object({
    id: z.string(),
    email: z.string().nullable(),
    full_name: z.string().nullable(),
    phone: z.string().nullable(),
    role: z.string(),
    birthdate: z.string().nullable(),
    line_id: z.string().nullable(),
    facebook: z.string().nullable(),
    avatar_url: z.string().nullable(),
  })
  .openapi('Profile')

const ProfileUpdate = z
  .object({
    full_name: z.string().min(1).optional(),
    phone: z.string().optional(),
    birthdate: z.string().date().nullable().optional(),
    line_id: z.string().nullable().optional(),
    facebook: z.string().nullable().optional(),
    avatar_url: z.string().url().nullable().optional(),
  })
  .openapi('ProfileUpdate')

// ============================ ADDRESS ============================
const AddressSchema = z
  .object({
    id: z.string(),
    label: z.string().nullable(),
    recipient: z.string(),
    phone: z.string(),
    line1: z.string(),
    district: z.string().nullable(),
    amphoe: z.string().nullable(),
    province: z.string().nullable(),
    postcode: z.string().nullable(),
    is_default: z.boolean(),
  })
  .openapi('Address')
const AddressCreate = z
  .object({
    label: z.string().optional(),
    recipient: z.string().min(1),
    phone: z.string().min(1),
    line1: z.string().min(1),
    district: z.string().optional(),
    amphoe: z.string().optional(),
    province: z.string().optional(),
    postcode: z.string().optional(),
    is_default: z.boolean().optional(),
  })
  .openapi('AddressCreate')

// ========================= TAX PROFILE ==========================
const TaxSchema = z
  .object({
    id: z.string(),
    entity_type: z.string(),
    name: z.string(),
    tax_id: z.string(),
    branch: z.string().nullable(),
    phone: z.string().nullable(),
    address: z.string(),
    is_default: z.boolean(),
  })
  .openapi('TaxProfile')
const TaxCreate = z
  .object({
    entity_type: z.enum(['personal', 'company']).default('personal'),
    name: z.string().min(1),
    tax_id: z.string().regex(/^\d{13}$/, 'เลขผู้เสียภาษีต้องมี 13 หลัก'),
    branch: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().min(1),
    is_default: z.boolean().optional(),
  })
  .openapi('TaxProfileCreate')

// ======================= PAYMENT METHOD =========================
const PaymentSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    label: z.string().nullable(),
    provider: z.string().nullable(),
    account_name: z.string().nullable(),
    masked: z.string().nullable(),
    is_default: z.boolean(),
  })
  .openapi('PaymentMethod')
const PaymentCreate = z
  .object({
    type: z.enum(['promptpay', 'bank_transfer', 'cod', 'card']),
    label: z.string().optional(),
    provider: z.string().optional(),
    account_name: z.string().optional(),
    masked: z.string().optional(),
    is_default: z.boolean().optional(),
  })
  .openapi('PaymentMethodCreate')

// ตัวช่วย: ถ้าจะตั้งเป็น default ให้ปลด default ของแถวอื่นก่อน + auto-default ถ้ายังไม่มีแถวใด
async function resolveDefault(db: any, table: string, uid: string, wantDefault?: boolean) {
  const { count } = await db.from(table).select('id', { count: 'exact', head: true }).eq('user_id', uid)
  const makeDefault = wantDefault || !count
  if (makeDefault) await db.from(table).update({ is_default: false }).eq('user_id', uid)
  return makeDefault
}

// factory สร้าง CRUD 4 endpoint (list/create/update/delete) ต่อ 1 ตาราง (own-row)
function crud(
  app: OpenAPIHono<AppEnv>,
  o: { base: string; table: string; name: string; row: any; create: any; hasDefault: boolean }
) {
  const single = z.object({ ok: z.literal(true), item: o.row })
  const many = z.object({ ok: z.literal(true), items: z.array(o.row) })

  app.openapi(
    createRoute({
      method: 'get', path: o.base, tags: TAG, summary: `รายการ ${o.name}`,
      middleware: [requireAuth] as const,
      responses: { 200: jsonRes('สำเร็จ', many), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const q = db.from(o.table).select('*').eq('user_id', uid)
      const { data, error } = o.hasDefault
        ? await q.order('is_default', { ascending: false }).order('created_at', { ascending: false })
        : await q.order('created_at', { ascending: false })
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, items: data ?? [] })
    }
  )

  app.openapi(
    createRoute({
      method: 'post', path: o.base, tags: TAG, summary: `เพิ่ม ${o.name}`,
      middleware: [requireAuth] as const,
      request: { body: jsonBody(o.create) },
      responses: { 200: jsonRes('เพิ่มแล้ว', single), 400: errRes('ข้อมูลไม่ถูกต้อง'), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const body = c.req.valid('json') as any
      const is_default = o.hasDefault ? await resolveDefault(db, o.table, uid, body.is_default) : undefined
      const insert = { ...body, user_id: uid, ...(o.hasDefault ? { is_default } : {}) }
      const { data, error } = await db.from(o.table).insert(insert).select().single()
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, item: data })
    }
  )

  app.openapi(
    createRoute({
      method: 'patch', path: `${o.base}/{id}`, tags: TAG, summary: `แก้ไข ${o.name}`,
      middleware: [requireAuth] as const,
      request: { params: IdParam, body: jsonBody(o.create.partial()) },
      responses: { 200: jsonRes('แก้ไขแล้ว', single), 401: errRes('ต้องเข้าสู่ระบบ'), 404: errRes('ไม่พบข้อมูล') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const { id } = c.req.valid('param')
      const db = authedDb(c)
      const body = c.req.valid('json') as any
      if (o.hasDefault && body.is_default === true) await resolveDefault(db, o.table, uid, true)
      const { data, error } = await db.from(o.table).update(body).eq('id', id).eq('user_id', uid).select().maybeSingle()
      if (error) throw badRequest(error.message)
      if (!data) throw notFound()
      return c.json({ ok: true as const, item: data })
    }
  )

  app.openapi(
    createRoute({
      method: 'delete', path: `${o.base}/{id}`, tags: TAG, summary: `ลบ ${o.name}`,
      middleware: [requireAuth] as const,
      request: { params: IdParam },
      responses: { 200: jsonRes('ลบแล้ว', OkSchema), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const { id } = c.req.valid('param')
      const db = authedDb(c)
      const { error } = await db.from(o.table).delete().eq('id', id).eq('user_id', uid)
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const })
    }
  )
}

export function registerAccount(app: OpenAPIHono<AppEnv>) {
  // -------- profile --------
  app.openapi(
    createRoute({
      method: 'get', path: '/api/account/profile', tags: TAG, summary: 'ข้อมูลส่วนตัว',
      middleware: [requireAuth] as const,
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), profile: ProfileSchema })), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const { data } = await db.from('profiles').select('*').eq('id', uid).maybeSingle()
      if (!data) throw notFound('ไม่พบโปรไฟล์')
      return c.json({ ok: true as const, profile: data })
    }
  )

  app.openapi(
    createRoute({
      method: 'patch', path: '/api/account/profile', tags: TAG, summary: 'แก้ไขข้อมูลส่วนตัว',
      middleware: [requireAuth] as const,
      request: { body: jsonBody(ProfileUpdate) },
      responses: { 200: jsonRes('แก้ไขแล้ว', z.object({ ok: z.literal(true), profile: ProfileSchema })), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const body = c.req.valid('json')
      const { data, error } = await db.from('profiles').update(body).eq('id', uid).select().single()
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, profile: data })
    }
  )

  // -------- order summary (การ์ด 4 ใบ) --------
  app.openapi(
    createRoute({
      method: 'get', path: '/api/account/summary', tags: TAG, summary: 'สรุปจำนวนออเดอร์ตามสถานะ',
      middleware: [requireAuth] as const,
      responses: {
        200: jsonRes('สำเร็จ', z.object({
          ok: z.literal(true),
          summary: z.object({ done: z.number(), shipping: z.number(), processing: z.number(), awaitingPayment: z.number() }),
        })),
        401: errRes('ต้องเข้าสู่ระบบ'),
      },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const { data, error } = await db.from('orders').select('status').eq('user_id', uid)
      if (error) throw badRequest(error.message)
      const rows = data ?? []
      const count = (fn: (s: string) => boolean) => rows.filter((r) => fn(r.status)).length
      return c.json({
        ok: true as const,
        summary: {
          done: count((s) => s === 'done'),
          shipping: count((s) => s === 'shipping'),
          processing: count((s) => s === 'paid' || s === 'packing'),
          awaitingPayment: count((s) => s === 'pending'),
        },
      })
    }
  )

  // -------- CRUD ตารางบัญชี --------
  crud(app, { base: '/api/account/addresses', table: 'addresses', name: 'ที่อยู่จัดส่ง', row: AddressSchema, create: AddressCreate, hasDefault: true })
  crud(app, { base: '/api/account/tax-profiles', table: 'tax_profiles', name: 'ที่อยู่ใบกำกับภาษี', row: TaxSchema, create: TaxCreate, hasDefault: true })
  crud(app, { base: '/api/account/payment-methods', table: 'payment_methods', name: 'ช่องทางชำระเงิน', row: PaymentSchema, create: PaymentCreate, hasDefault: true })

  // -------- wishlist (สินค้าที่ถูกใจ) --------
  app.openapi(
    createRoute({
      method: 'get', path: '/api/account/wishlist', tags: TAG, summary: 'สินค้าที่ถูกใจ',
      middleware: [requireAuth] as const,
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), items: z.array(ProductSchema) })), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const { data, error } = await db
        .from('wishlist')
        .select('created_at, products(*, categories(slug,name_th,name_en), brands(name,slug))')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (error) throw badRequest(error.message)
      const items = (data ?? []).map((r: any) => r.products).filter(Boolean).map(mapProduct)
      return c.json({ ok: true as const, items })
    }
  )

  app.openapi(
    createRoute({
      method: 'post', path: '/api/account/wishlist', tags: TAG, summary: 'เพิ่มสินค้าที่ถูกใจ (ด้วย slug)',
      middleware: [requireAuth] as const,
      request: { body: jsonBody(z.object({ slug: z.string().min(1) }).openapi('WishlistAdd')) },
      responses: { 200: jsonRes('เพิ่มแล้ว', OkSchema), 401: errRes('ต้องเข้าสู่ระบบ'), 404: errRes('ไม่พบสินค้า') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const { slug } = c.req.valid('json')
      const { data: p } = await db.from('products').select('id').eq('slug', slug).maybeSingle()
      if (!p) throw notFound('ไม่พบสินค้า')
      const { error } = await db.from('wishlist').upsert({ user_id: uid, product_id: p.id }, { onConflict: 'user_id,product_id' })
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const })
    }
  )

  app.openapi(
    createRoute({
      method: 'delete', path: '/api/account/wishlist/{slug}', tags: TAG, summary: 'ลบสินค้าที่ถูกใจ (ด้วย slug)',
      middleware: [requireAuth] as const,
      request: { params: z.object({ slug: z.string() }) },
      responses: { 200: jsonRes('ลบแล้ว', OkSchema), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const { slug } = c.req.valid('param')
      const { data: p } = await db.from('products').select('id').eq('slug', slug).maybeSingle()
      if (p) await db.from('wishlist').delete().eq('user_id', uid).eq('product_id', p.id)
      return c.json({ ok: true as const })
    }
  )
}
