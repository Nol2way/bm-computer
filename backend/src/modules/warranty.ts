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
// จำกัดชนิดไฟล์เป็นรายการที่อนุญาต (allowlist) แทนการเช็คแค่ขึ้นต้นด้วย image/
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

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

const EligibleItemSchema = z
  .object({
    order_item_id: z.string(), order_id: z.string(), order_code: z.string(),
    product_id: z.string().nullable(), name: z.string(), qty: z.number(),
    warranty_period_months: z.number(), warranty_until: z.string().nullable(),
    days_left: z.number(),
  })
  .openapi('WarrantyEligibleItem')

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
  const { products, orders, profiles, evidence_path, ...rest } = row
  return {
    ...rest,
    product_name: products?.name ?? null,
    order_code: orders?.code ?? null,
    user_email: profiles?.email ?? null,
    user_name: profiles?.full_name ?? null,
  }
}

// รูปหลักฐานอยู่ใน bucket ปิด (เป็นข้อมูลส่วนบุคคล) -> ออก signed URL อายุสั้นให้เฉพาะคนที่ RLS ยอมให้อ่าน
// (เจ้าของเคลม หรือแอดมิน ตาม policy "read own warranty evidence")
const SIGNED_URL_TTL = 60 * 10
async function withSignedEvidence(db: any, rows: any[]) {
  const paths = rows.map((r) => r.evidence_path).filter(Boolean) as string[]
  const signed = new Map<string, string>()
  if (paths.length) {
    const { data } = await db.storage.from(EVIDENCE_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl)
  }
  return rows.map((r) => ({ ...mapClaim(r), evidence_url: r.evidence_path ? signed.get(r.evidence_path) ?? null : r.evidence_url }))
}

// วันหมดประกัน = วันที่ชำระเงิน (ไม่มีก็วันที่สั่ง) + จำนวนเดือนตามที่ตั้งไว้บนสินค้า
function warrantyEnd(order: any, months: number): Date | null {
  if (!months || months <= 0) return null
  const start = new Date(order.paid_at || order.created_at)
  const end = new Date(start)
  end.setMonth(end.getMonth() + months)
  return end
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
                order_item_id: z.string(),
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

      if (!orderId || !orderItemId || !reason) throw badRequest('กรุณากรอกข้อมูลให้ครบ')
      if (reason.length < 10 || reason.length > 500) throw badRequest('เหตุผลต้องมีความยาว 10-500 ตัวอักษร')
      if (!evidenceRaw || typeof evidenceRaw === 'string') throw badRequest('กรุณาแนบรูปหลักฐาน')
      const evidence = evidenceRaw as File
      if (evidence.size > MAX_EVIDENCE_SIZE) throw badRequest('ไฟล์ต้องมีขนาดไม่เกิน 5MB')
      if (!ALLOWED_IMAGE_TYPES.includes(evidence.type)) throw badRequest('รองรับเฉพาะรูปภาพ JPG, PNG, WebP หรือ HEIC')

      // RLS ของ orders จำกัดให้เห็นเฉพาะออเดอร์ของตัวเอง (หรือแอดมิน) - หาไม่เจอ = ไม่ใช่เจ้าของ/ไม่มีจริง
      const { data: order } = await db.from('orders').select('id, status, paid_at, created_at').eq('id', orderId).maybeSingle()
      if (!order) throw notFound('ไม่พบคำสั่งซื้อ หรือคำสั่งซื้อนี้ไม่ใช่ของคุณ')
      if (!ELIGIBLE_ORDER_STATUS.includes(order.status)) throw badRequest('คำสั่งซื้อนี้ยังไม่สามารถเคลมประกันได้ (ต้องชำระเงินแล้ว)')

      const { data: item } = await db.from('order_items')
        .select('product_id, products(name, warranty_period_months)')
        .eq('id', orderItemId).eq('order_id', orderId).maybeSingle()
      if (!item) throw badRequest('ไม่พบรายการสินค้านี้ในคำสั่งซื้อ')
      const productId: string | null = item.product_id

      // ประกันต้องยังไม่หมดอายุจริง (คิดจากวันชำระเงิน + ระยะประกันของสินค้า)
      const months = (item as any).products?.warranty_period_months ?? 0
      const end = warrantyEnd(order, months)
      if (!end) throw badRequest('สินค้านี้ไม่มีประกันจากทางร้าน')
      if (end.getTime() < Date.now()) {
        throw badRequest(`สินค้านี้หมดประกันแล้วเมื่อ ${end.toLocaleDateString('th-TH')} (ประกัน ${months} เดือน)`)
      }

      const { data: dup } = await db.from('warranty_claims').select('id').eq('order_item_id', orderItemId).maybeSingle()
      if (dup) throw conflict('มีการเคลมสินค้าชิ้นนี้ไปแล้ว')

      const buf = await evidence.arrayBuffer()
      const ext = (evidence.type.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg'
      const path = `${uid}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
      const { error: upErr } = await db.storage.from(EVIDENCE_BUCKET).upload(path, buf, { contentType: evidence.type })
      if (upErr) throw serverError('อัปโหลดรูปหลักฐานไม่สำเร็จ: ' + upErr.message)

      const { data: claim, error } = await db
        .from('warranty_claims')
        .insert({ order_id: orderId, order_item_id: orderItemId, product_id: productId, user_id: uid, reason, evidence_path: path, status: 'pending' })
        .select('*, products(name), orders(code)')
        .single()
      if (error) {
        // ลบไฟล์ที่เพิ่งอัปโหลดทิ้ง ไม่ให้เหลือขยะใน storage เมื่อบันทึกเคลมไม่สำเร็จ
        await db.storage.from(EVIDENCE_BUCKET).remove([path]).catch(() => {})
        if ((error as any).code === '23505') throw conflict('มีการเคลมสินค้าชิ้นนี้ไปแล้ว')
        throw badRequest(error.message)
      }
      const [withUrl] = await withSignedEvidence(db, [claim])
      return c.json({ ok: true as const, item: withUrl })
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
      return c.json({ ok: true as const, items: await withSignedEvidence(db, data ?? []) })
    }
  )

  // ============================================================
  // GET /api/warranty/eligible-items - สินค้าที่ "เคลมได้จริง" ของฉัน
  // (ออเดอร์จ่ายแล้ว + สินค้ามีประกัน + ยังไม่หมดอายุ + ยังไม่เคยเคลม)
  // คิดที่ server เพื่อให้ตัวเลือกในหน้าเคลมตรงกับกฎที่ตอนยื่นจริงใช้ตรวจ
  // ============================================================
  app.openapi(
    createRoute({
      method: 'get', path: '/api/warranty/eligible-items', tags: TAG, summary: 'สินค้าที่เคลมประกันได้ของฉัน',
      middleware: [requireAuth] as const,
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), items: z.array(EligibleItemSchema) })), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const [{ data: orders, error }, { data: claims }] = await Promise.all([
        db.from('orders')
          .select('id, code, status, paid_at, created_at, order_items(id, name, qty, product_id, products(name, warranty_period_months))')
          .eq('user_id', uid).in('status', ELIGIBLE_ORDER_STATUS),
        db.from('warranty_claims').select('order_item_id').eq('user_id', uid),
      ])
      if (error) throw badRequest(error.message)
      const claimed = new Set((claims ?? []).map((r: any) => r.order_item_id).filter(Boolean))

      const now = Date.now()
      const items = (orders ?? []).flatMap((o: any) =>
        (o.order_items ?? []).map((it: any) => {
          const months = it.products?.warranty_period_months ?? 0
          const end = warrantyEnd(o, months)
          return {
            order_item_id: it.id, order_id: o.id, order_code: o.code,
            product_id: it.product_id, name: it.products?.name || it.name || '', qty: it.qty ?? 1,
            warranty_period_months: months,
            warranty_until: end ? end.toISOString() : null,
            days_left: end ? Math.ceil((end.getTime() - now) / 86400000) : 0,
          }
        })
      ).filter((it: any) => !claimed.has(it.order_item_id) && it.warranty_until && it.days_left > 0)

      items.sort((a: any, b: any) => a.days_left - b.days_left)
      return c.json({ ok: true as const, items })
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
      const [withUrl] = await withSignedEvidence(db, [claim])
      return c.json({ ok: true as const, item: withUrl })
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
      if (!Object.keys(patch).length) throw badRequest('ไม่มีข้อมูลที่ต้องอัปเดต')
      const { data: claim, error } = await db.from('warranty_claims').update(patch).eq('id', id).select('*, products(name), orders(code)').maybeSingle()
      if (error) throw badRequest(error.message)
      if (!claim) throw notFound('ไม่พบเคลมประกัน')
      const [withUrl] = await withSignedEvidence(db, [claim])
      return c.json({ ok: true as const, item: withUrl })
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
      const items = await withSignedEvidence(db, data ?? [])
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
