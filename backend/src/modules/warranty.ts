import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../lib/env'
import { authedDb, anonClient } from '../lib/supabase'
import { requireAuth, requireAdmin } from '../lib/middleware'
import { badRequest, notFound, conflict, serverError } from '../lib/http'
import { jsonRes, errRes } from '../lib/openapi'

const TAG = ['Warranty']
const STATUSES = ['pending', 'approved', 'rejected', 'processed'] as const
// สถานะออเดอร์ที่เคลมประกันได้ (ต้องจ่ายเงินแล้วอย่างน้อย)
const ELIGIBLE_ORDER_STATUS = ['paid', 'packing', 'shipping', 'done']
const EVIDENCE_BUCKET = 'warranty-evidence'
const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024

const ClaimSchema = z
  .object({
    id: z.string(), order_id: z.string(), order_item_id: z.string().nullable(),
    product_id: z.string().nullable(), user_id: z.string(), reason: z.string(),
    evidence_url: z.string().nullable(), status: z.string(), admin_notes: z.string().nullable(),
    created_at: z.string(), updated_at: z.string().optional(),
    product_name: z.string().nullable().optional(), order_code: z.string().nullable().optional(),
    user_email: z.string().nullable().optional(), user_name: z.string().nullable().optional(),
  })
  .openapi('WarrantyClaim')

const ClaimUpdate = z
  .object({
    status: z.enum(STATUSES).optional(),
    admin_notes: z.string().max(500).nullable().optional(),
  })
  .openapi('WarrantyClaimUpdate')

const WarrantyInfoSchema = z
  .object({
    id: z.string(), name: z.string(),
    warranty_period_months: z.number().nullable(),
    warranty_conditions: z.string().nullable(),
    warranty_service_center: z.string().nullable(),
    warranty_service_phone: z.string().nullable(),
    has_warranty: z.boolean(),
  })
  .openapi('ProductWarrantyInfo')

// แถวจาก join products/orders/profiles -> รูปแบบแบนที่ frontend ใช้
function mapClaim(row: any) {
  const { products, orders, profiles, ...rest } = row
  return {
    ...rest,
    product_name: products?.name ?? null,
    order_code: orders?.code ?? null,
    user_email: profiles?.email ?? null,
    user_name: profiles?.full_name ?? null,
  }
}

export function registerWarranty(app: OpenAPIHono<AppEnv>) {
  // ============================================================
  // POST /api/warranty/claims - ยื่นเคลมประกันพร้อมแนบรูปหลักฐาน
  // ============================================================
  app.openapi(
    createRoute({
      method: 'post', path: '/api/warranty/claims', tags: TAG, summary: 'ยื่นเคลมประกันสินค้า',
      middleware: [requireAuth] as const,
      request: {
        body: {
          content: {
            'multipart/form-data': {
              schema: z.object({
                order_id: z.string(),
                order_item_id: z.string().optional(),
                reason: z.string(),
                evidence: z.any().openapi({ type: 'string', format: 'binary' }),
              }),
            },
          },
        },
      },
      responses: {
        200: jsonRes('ยื่นเคลมสำเร็จ', z.object({ ok: z.literal(true), item: ClaimSchema })),
        400: errRes('ข้อมูลไม่ถูกต้อง'), 401: errRes('ต้องเข้าสู่ระบบ'),
        404: errRes('ไม่พบคำสั่งซื้อ'), 409: errRes('เคลมสินค้านี้ไปแล้ว'),
      },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const form = await c.req.formData()
      const orderId = (form.get('order_id') || '').toString().trim()
      const orderItemId = form.get('order_item_id')?.toString().trim() || null
      const reason = (form.get('reason') || '').toString().trim()
      const evidenceRaw = form.get('evidence')

      if (!orderId || !reason) throw badRequest('กรุณากรอกข้อมูลให้ครบ')
      if (reason.length < 10 || reason.length > 500) throw badRequest('เหตุผลต้องมีความยาว 10-500 ตัวอักษร')
      if (!evidenceRaw || typeof evidenceRaw === 'string') throw badRequest('กรุณาแนบรูปหลักฐาน')
      const evidence = evidenceRaw as File
      if (evidence.size > MAX_EVIDENCE_SIZE) throw badRequest('ไฟล์ต้องมีขนาดไม่เกิน 5MB')
      if (!evidence.type.startsWith('image/')) throw badRequest('ไฟล์ต้องเป็นรูปภาพเท่านั้น')

      // RLS ของ orders จำกัดให้เห็นเฉพาะออเดอร์ของตัวเอง (หรือแอดมิน) - หาไม่เจอ = ไม่ใช่เจ้าของ/ไม่มีจริง
      const { data: order } = await db.from('orders').select('id, status').eq('id', orderId).maybeSingle()
      if (!order) throw notFound('ไม่พบคำสั่งซื้อ หรือคำสั่งซื้อนี้ไม่ใช่ของคุณ')
      if (!ELIGIBLE_ORDER_STATUS.includes(order.status)) throw badRequest('คำสั่งซื้อนี้ยังไม่สามารถเคลมประกันได้')

      let productId: string | null = null
      if (orderItemId) {
        const { data: item } = await db.from('order_items').select('product_id').eq('id', orderItemId).eq('order_id', orderId).maybeSingle()
        if (!item) throw badRequest('ไม่พบรายการสินค้านี้ในคำสั่งซื้อ')
        productId = item.product_id
        const { data: dup } = await db.from('warranty_claims').select('id').eq('order_item_id', orderItemId).maybeSingle()
        if (dup) throw conflict('มีการเคลมสินค้านี้ไปแล้ว')
      }

      const buf = await evidence.arrayBuffer()
      const ext = (evidence.type.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg'
      const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: upErr } = await db.storage.from(EVIDENCE_BUCKET).upload(path, buf, { contentType: evidence.type })
      if (upErr) throw serverError('อัปโหลดรูปหลักฐานไม่สำเร็จ: ' + upErr.message)
      const { data: pub } = db.storage.from(EVIDENCE_BUCKET).getPublicUrl(path)

      const { data: claim, error } = await db
        .from('warranty_claims')
        .insert({ order_id: orderId, order_item_id: orderItemId, product_id: productId, user_id: uid, reason, evidence_url: pub.publicUrl, status: 'pending' })
        .select('*, products(name), orders(code)')
        .single()
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, item: mapClaim(claim) })
    }
  )

  // ============================================================
  // GET /api/warranty/claims - รายการเคลมของฉัน
  // ============================================================
  app.openapi(
    createRoute({
      method: 'get', path: '/api/warranty/claims', tags: TAG, summary: 'รายการเคลมประกันของฉัน',
      middleware: [requireAuth] as const,
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), items: z.array(ClaimSchema) })), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const { data, error } = await db
        .from('warranty_claims')
        .select('*, products(name), orders(code)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, items: (data ?? []).map(mapClaim) })
    }
  )

  // ============================================================
  // GET /api/warranty/claims/:id - รายละเอียดเคลม (เจ้าของหรือแอดมิน)
  // ============================================================
  app.openapi(
    createRoute({
      method: 'get', path: '/api/warranty/claims/{id}', tags: TAG, summary: 'รายละเอียดเคลมประกัน',
      middleware: [requireAuth] as const,
      request: { params: z.object({ id: z.string() }) },
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), item: ClaimSchema })), 401: errRes('ต้องเข้าสู่ระบบ'), 404: errRes('ไม่พบข้อมูล') },
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const db = authedDb(c)
      const { data: claim } = await db.from('warranty_claims').select('*, products(name), orders(code)').eq('id', id).maybeSingle()
      if (!claim) throw notFound('ไม่พบเคลมประกัน')
      return c.json({ ok: true as const, item: mapClaim(claim) })
    }
  )

  // ============================================================
  // PATCH /api/warranty/claims/:id - อัปเดตสถานะ (แอดมินเท่านั้น)
  // ============================================================
  app.openapi(
    createRoute({
      method: 'patch', path: '/api/warranty/claims/{id}', tags: TAG, summary: 'อัปเดตสถานะเคลมประกัน (admin)',
      middleware: [requireAdmin] as const,
      request: { params: z.object({ id: z.string() }), body: { content: { 'application/json': { schema: ClaimUpdate } } } },
      responses: { 200: jsonRes('อัปเดตแล้ว', z.object({ ok: z.literal(true), item: ClaimSchema })), 403: errRes('ต้องเป็นแอดมิน'), 404: errRes('ไม่พบข้อมูล') },
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const body = c.req.valid('json')
      const db = authedDb(c)
      const patch: Record<string, unknown> = {}
      if (body.status) patch.status = body.status
      if (body.admin_notes !== undefined) patch.admin_notes = body.admin_notes || null
      const { data: claim, error } = await db.from('warranty_claims').update(patch).eq('id', id).select('*, products(name), orders(code)').maybeSingle()
      if (error) throw badRequest(error.message)
      if (!claim) throw notFound('ไม่พบเคลมประกัน')
      return c.json({ ok: true as const, item: mapClaim(claim) })
    }
  )

  // ============================================================
  // GET /api/admin/warranty-claims - รายการเคลมทั้งหมด (แอดมิน) + สรุปสถานะ
  // ============================================================
  app.openapi(
    createRoute({
      method: 'get', path: '/api/admin/warranty-claims', tags: TAG, summary: 'รายการเคลมประกันทั้งหมด (admin)',
      middleware: [requireAdmin] as const,
      request: {
        query: z.object({
          status: z.string().optional(), product_id: z.string().optional(), user_id: z.string().optional(),
          date_from: z.string().optional(), date_to: z.string().optional(),
        }),
      },
      responses: {
        200: jsonRes('สำเร็จ', z.object({
          ok: z.literal(true), items: z.array(ClaimSchema),
          pending_count: z.number(), approved_count: z.number(), rejected_count: z.number(), processed_count: z.number(),
        })),
        403: errRes('ต้องเป็นแอดมิน'),
      },
    }),
    async (c) => {
      const { status, product_id, user_id, date_from, date_to } = c.req.valid('query')
      const db = authedDb(c)
      let q = db.from('warranty_claims').select('*, products(name), orders(code), profiles(email, full_name)')
      if (status) q = q.eq('status', status)
      if (product_id) q = q.eq('product_id', product_id)
      if (user_id) q = q.eq('user_id', user_id)
      if (date_from) q = q.gte('created_at', date_from)
      if (date_to) q = q.lte('created_at', date_to)
      const { data, error } = await q.order('created_at', { ascending: false })
      if (error) throw badRequest(error.message)
      const items = (data ?? []).map(mapClaim)
      const count = (s: string) => items.filter((i: any) => i.status === s).length
      return c.json({
        ok: true as const, items,
        pending_count: count('pending'), approved_count: count('approved'),
        rejected_count: count('rejected'), processed_count: count('processed'),
      })
    }
  )

  // ============================================================
  // GET /api/products/:id/warranty - ข้อมูลประกันสินค้า (public)
  // ============================================================
  app.openapi(
    createRoute({
      method: 'get', path: '/api/products/{id}/warranty', tags: TAG, summary: 'ข้อมูลประกันสินค้า',
      request: { params: z.object({ id: z.string() }) },
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), item: WarrantyInfoSchema })), 404: errRes('ไม่พบสินค้า') },
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const db = anonClient(c.env)
      const { data: product } = await db
        .from('products')
        .select('id, name, warranty_period_months, warranty_conditions, warranty_service_center, warranty_service_phone')
        .eq('id', id)
        .maybeSingle()
      if (!product) throw notFound('ไม่พบสินค้า')
      return c.json({ ok: true as const, item: { ...product, has_warranty: (product.warranty_period_months ?? 0) > 0 } })
    }
  )
}
