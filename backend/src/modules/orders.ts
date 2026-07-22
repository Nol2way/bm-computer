import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../lib/env'
import { authedDb, userClient, anonClient } from '../lib/supabase'
import { getAccessToken } from '../lib/cookies'
import { requireAuth } from '../lib/middleware'
import { badRequest, notFound } from '../lib/http'
import { jsonBody, jsonRes, errRes } from '../lib/openapi'

const TAG = ['Orders']

const OrderItemSchema = z.object({
  id: z.string(), name: z.string().nullable(), price: z.number(), qty: z.number(), product_id: z.string().nullable(),
})
const OrderSchema = z
  .object({
    id: z.string(), code: z.string(), user_id: z.string().nullable(), total: z.number(), status: z.string(),
    payment_method: z.string().nullable(), ship_name: z.string().nullable(), ship_phone: z.string().nullable(),
    ship_address: z.string().nullable(), created_at: z.string(), order_items: z.array(OrderItemSchema).optional(),
    tracking_no: z.string().nullable().optional(), courier: z.string().nullable().optional(),
    cancel_reason: z.string().nullable().optional(), paid_at: z.string().nullable().optional(),
    tax_invoice: z.record(z.string(), z.string()).nullable().optional(),
    tax_invoice_confirmed_profile_id: z.string().nullable().optional(),
    tax_invoice_confirmed_at: z.string().nullable().optional(),
  })
  .openapi('Order')

const TaxInvoiceSchema = z.object({
  invoiceNo: z.string().optional(), bookNo: z.string().optional(),
  addrNo: z.string().optional(), lane: z.string().optional(), building: z.string().optional(),
  streetNo: z.string().optional(), village: z.string().optional(), villageName: z.string().optional(),
  soi: z.string().optional(), street: z.string().min(1), subDistrict: z.string().min(1),
  district: z.string().min(1), province: z.string().min(1), postalCode: z.string().min(1),
})

// แถวจากตาราง order_tax_invoices (snake_case) -> object ที่ frontend ใช้ (camelCase)
function taxInvoiceFromRow(r: any) {
  if (!r) return null
  return {
    invoiceNo: r.invoice_no ?? '', bookNo: r.book_no ?? '',
    addrNo: r.addr_no ?? '', lane: r.lane ?? '', building: r.building ?? '', streetNo: r.street_no ?? '',
    village: r.village ?? '', villageName: r.village_name ?? '', soi: r.soi ?? '', street: r.street ?? '',
    subDistrict: r.sub_district ?? '', district: r.district ?? '', province: r.province ?? '', postalCode: r.postal_code ?? '',
  }
}
function withTaxInvoice(order: any) {
  if (!order) return order
  const row = Array.isArray(order.order_tax_invoices) ? order.order_tax_invoices[0] : order.order_tax_invoices
  const { order_tax_invoices, ...rest } = order
  return { ...rest, tax_invoice: taxInvoiceFromRow(row) }
}

const CreateOrderBody = z
  .object({
    items: z.array(z.object({ slug: z.string(), qty: z.number().int().positive() })).min(1),
    ship: z.object({ name: z.string().min(1), phone: z.string().min(1), address: z.string().min(1) }),
    taxInvoice: TaxInvoiceSchema.optional(),
  })
  .openapi('CreateOrder')

export function registerOrders(app: OpenAPIHono<AppEnv>) {
  // POST /api/orders - สร้างออเดอร์ (คิดราคาจาก DB ใหม่กันแก้ฝั่ง client)
  app.openapi(
    createRoute({
      method: 'post', path: '/api/orders', tags: TAG, summary: 'สร้างคำสั่งซื้อ',
      middleware: [requireAuth] as const,
      request: { body: jsonBody(CreateOrderBody) },
      responses: { 200: jsonRes('สร้างแล้ว', z.object({ ok: z.literal(true), order: OrderSchema })), 400: errRes('error'), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const { items, ship, taxInvoice } = c.req.valid('json') as z.infer<typeof CreateOrderBody>
      const db = authedDb(c)
      const slugs = items.map((i) => i.slug)
      const { data: prods, error: e1 } = await db.from('products').select('id,slug,name,price,sale_price,stock').in('slug', slugs)
      if (e1) throw badRequest(e1.message)
      const bySlug = Object.fromEntries((prods ?? []).map((p: any) => [p.slug, p]))
      const priceOf = (p: any) => (p.sale_price && p.sale_price < p.price ? p.sale_price : p.price)
      const lines = items
        .filter((i) => bySlug[i.slug])
        .map((i) => { const p = bySlug[i.slug]; return { product_id: p.id, name: p.name, price: priceOf(p), qty: i.qty } })
      if (!lines.length) throw badRequest('ไม่มีสินค้าในตะกร้า')
      const subtotal = lines.reduce((s: number, l) => s + l.price * l.qty, 0)
      const total = subtotal + (subtotal >= 1500 ? 0 : 80)
      const { data: order, error: e2 } = await db.from('orders').insert({
        user_id: uid, total, status: 'pending', payment_method: 'promptpay',
        ship_name: ship.name, ship_phone: ship.phone, ship_address: ship.address,
      }).select().single()
      if (e2) throw badRequest(e2.message)
      const { error: e3 } = await db.from('order_items').insert(lines.map((l) => ({ ...l, order_id: order.id })))
      if (e3) throw badRequest(e3.message)
      // เก็บ snapshot ใบกำกับภาษีแบบ best-effort: ออเดอร์ + order_items ถูกสร้างสำเร็จไปแล้ว
      // ถ้าขั้นนี้ล้มเหลว (เช่น ยังไม่ได้รัน migration) ไม่ควรทำให้ทั้งคำสั่งซื้อดูเหมือนล้มเหลวไปด้วย -
      // หน้าใบกำกับภาษีมี fallback ไปใช้ ship_name/ship_address อยู่แล้วเมื่อไม่มี snapshot นี้
      let savedTaxInvoice = null
      if (taxInvoice) {
        const { error: e4 } = await db.from('order_tax_invoices').insert({
          order_id: order.id, invoice_no: taxInvoice.invoiceNo || null, book_no: taxInvoice.bookNo || null,
          addr_no: taxInvoice.addrNo || null, lane: taxInvoice.lane || null, building: taxInvoice.building || null,
          street_no: taxInvoice.streetNo || null, village: taxInvoice.village || null, village_name: taxInvoice.villageName || null,
          soi: taxInvoice.soi || null, street: taxInvoice.street, sub_district: taxInvoice.subDistrict,
          district: taxInvoice.district, province: taxInvoice.province, postal_code: taxInvoice.postalCode,
        })
        if (e4) console.error('order_tax_invoices insert failed (order still created):', e4.message)
        else savedTaxInvoice = taxInvoice
      }
      return c.json({ ok: true as const, order: { ...order, tax_invoice: savedTaxInvoice } })
    }
  )

  // GET /api/orders - ประวัติของฉัน
  app.openapi(
    createRoute({
      method: 'get', path: '/api/orders', tags: TAG, summary: 'ประวัติคำสั่งซื้อของฉัน',
      middleware: [requireAuth] as const,
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), items: z.array(OrderSchema) })), 401: errRes('ต้องเข้าสู่ระบบ') },
    }),
    async (c) => {
      const uid = c.get('user').id
      const db = authedDb(c)
      const { data, error } = await db.from('orders').select('*, order_items(*), order_tax_invoices(*)').eq('user_id', uid).order('created_at', { ascending: false })
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, items: (data ?? []).map(withTaxInvoice) })
    }
  )

  // POST /api/orders/{id}/cancel - ลูกค้ายกเลิก/ขอยกเลิกคำสั่งซื้อของตัวเอง
  // pending (ยังไม่จ่าย) -> ยกเลิกทันที · paid/packing -> ขอยกเลิก รอแอดมินตรวจ+คืนเงิน
  // shipping/done/cancel* -> ยกเลิกไม่ได้ (ของออกไปแล้ว/จบแล้ว)
  app.openapi(
    createRoute({
      method: 'post', path: '/api/orders/{id}/cancel', tags: TAG, summary: 'ยกเลิก/ขอยกเลิกคำสั่งซื้อของฉัน',
      middleware: [requireAuth] as const,
      request: { params: z.object({ id: z.string().uuid() }), body: jsonBody(z.object({ reason: z.string().max(500).optional() })) },
      responses: {
        200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), status: z.string() })),
        400: errRes('ยกเลิกไม่ได้'), 401: errRes('ต้องเข้าสู่ระบบ'), 404: errRes('ไม่พบคำสั่งซื้อ'),
      },
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const { reason } = c.req.valid('json')
      const db = authedDb(c) // RLS: เห็น/แก้ได้เฉพาะออเดอร์ของตัวเอง
      const { data: order, error } = await db.from('orders').select('id,status').eq('id', id).maybeSingle()
      if (error) throw badRequest(error.message)
      if (!order) throw notFound('ไม่พบคำสั่งซื้อ')
      if (order.status === 'pending') {
        const { error: e } = await db.from('orders')
          .update({ status: 'cancel', cancel_reason: reason || null, canceled_at: new Date().toISOString() }).eq('id', id)
        if (e) throw badRequest(e.message)
        return c.json({ ok: true as const, status: 'cancel' })
      }
      if (order.status === 'paid' || order.status === 'packing') {
        const { error: e } = await db.from('orders')
          .update({ status: 'cancel_requested', cancel_reason: reason || null }).eq('id', id)
        if (e) throw badRequest(e.message)
        return c.json({ ok: true as const, status: 'cancel_requested' })
      }
      throw badRequest('คำสั่งซื้อนี้ยกเลิกไม่ได้ (จัดส่งแล้ว/ยกเลิกแล้ว)')
    }
  )

  // PATCH /api/orders/{id}/tax-invoice-profile - ยืนยันที่อยู่ใบกำกับภาษีของออเดอร์ (ยืนยันได้ครั้งเดียว)
  app.openapi(
    createRoute({
      method: 'patch', path: '/api/orders/{id}/tax-invoice-profile', tags: TAG, summary: 'ยืนยันที่อยู่ใบกำกับภาษี (ล็อกหลังยืนยัน)',
      middleware: [requireAuth] as const,
      request: { params: z.object({ id: z.string().uuid() }), body: jsonBody(z.object({ profile_id: z.string().uuid() })) },
      responses: {
        200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), profile_id: z.string(), confirmed_at: z.string() })),
        400: errRes('ข้อมูลไม่ถูกต้อง'), 401: errRes('ต้องเข้าสู่ระบบ'), 404: errRes('ไม่พบคำสั่งซื้อ/โปรไฟล์'),
      },
    }),
    async (c) => {
      const { id } = c.req.valid('param')
      const { profile_id } = c.req.valid('json')
      const db = authedDb(c) // RLS: เห็น/แก้ได้เฉพาะออเดอร์และโปรไฟล์ของตัวเอง
      const { data: order, error } = await db.from('orders').select('id, tax_invoice_confirmed_profile_id, tax_invoice_confirmed_at').eq('id', id).maybeSingle()
      if (error) throw badRequest(error.message)
      if (!order) throw notFound('ไม่พบคำสั่งซื้อ')
      // ยืนยันไปแล้ว -> คืนค่าที่ยืนยันไว้เดิม (idempotent) ไม่ให้เปลี่ยนโปรไฟล์ทีหลัง
      if (order.tax_invoice_confirmed_profile_id) {
        return c.json({ ok: true as const, profile_id: order.tax_invoice_confirmed_profile_id, confirmed_at: order.tax_invoice_confirmed_at! })
      }
      const { data: profile } = await db.from('tax_profiles').select('id').eq('id', profile_id).maybeSingle()
      if (!profile) throw notFound('ไม่พบที่อยู่ใบกำกับภาษี')
      const confirmedAt = new Date().toISOString()
      // .is(...) กันแข่งกันยืนยันพร้อมกัน (race): ถ้ามีคนอื่นยืนยันไปก่อนแล้วระหว่างนี้ update จะไม่โดนแถวไหนเลย
      const { data: updated, error: e } = await db.from('orders')
        .update({ tax_invoice_confirmed_profile_id: profile_id, tax_invoice_confirmed_at: confirmedAt })
        .eq('id', id).is('tax_invoice_confirmed_profile_id', null)
        .select('tax_invoice_confirmed_profile_id, tax_invoice_confirmed_at').maybeSingle()
      if (e) throw badRequest(e.message)
      if (updated) return c.json({ ok: true as const, profile_id: updated.tax_invoice_confirmed_profile_id, confirmed_at: updated.tax_invoice_confirmed_at })
      // แพ้ race - อ่านค่าที่ถูกยืนยันไปแล้วจริงๆ กลับไป
      const { data: existing } = await db.from('orders').select('tax_invoice_confirmed_profile_id, tax_invoice_confirmed_at').eq('id', id).maybeSingle()
      return c.json({ ok: true as const, profile_id: existing?.tax_invoice_confirmed_profile_id, confirmed_at: existing?.tax_invoice_confirmed_at })
    }
  )

  // GET /api/orders/track/{code} - ติดตามด้วยรหัสออเดอร์ (สาธารณะ)
  app.openapi(
    createRoute({
      method: 'get', path: '/api/orders/track/{code}', tags: TAG, summary: 'ติดตามคำสั่งซื้อด้วยรหัส',
      request: { params: z.object({ code: z.string() }) },
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), order: OrderSchema })), 404: errRes('ไม่พบคำสั่งซื้อ') },
    }),
    async (c) => {
      const { code } = c.req.valid('param')
      // ติดตามด้วยรหัส: ถ้ามี session ใช้สิทธิ์ user (เห็นเฉพาะออเดอร์ตัวเอง/แอดมิน ตาม RLS)
      const token = getAccessToken(c)
      const db = token ? userClient(c.env, token) : anonClient(c.env)
      const { data, error } = await db.from('orders').select('*, order_items(*), order_tax_invoices(*)').eq('code', code).maybeSingle()
      if (error) throw badRequest(error.message)
      if (!data) throw notFound('ไม่พบคำสั่งซื้อ')
      return c.json({ ok: true as const, order: withTaxInvoice(data) })
    }
  )
}
