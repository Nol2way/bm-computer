import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AppEnv } from '../lib/env'
import { anonClient } from '../lib/supabase'
import { badRequest, notFound } from '../lib/http'
import { jsonRes, errRes } from '../lib/openapi'

const TAG = ['Catalog']

// ---- แปลง row -> รูปแบบที่ frontend ใช้ (พอร์ตจาก src/lib/api.js) ----
export function mapProduct(row: any) {
  const onSale = row.sale_price && row.sale_price < row.price
  const price = onSale ? row.sale_price : row.price
  const old = onSale ? row.price : row.old_price
  const discount = old && old > price ? Math.round(((old - price) / old) * 100) : 0
  return {
    id: row.slug,
    slug: row.slug,
    sku: 'BM-' + String(row.slug).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
    name: row.name,
    cat: row.categories?.slug ?? null,
    brand: row.brands?.name ?? null,
    price,
    old: old ?? null,
    discount,
    sale: !!onSale,
    saleEndsAt: row.sale_ends_at ?? null,
    rating: row.rating ?? null,
    reviews: row.reviews_count ?? 0,
    stock: row.stock ?? 0,
    badge: row.badge ?? null,
    images: Array.isArray(row.images) ? row.images : [],
    specs: row.specs || {},
    featured: !!row.is_featured,
  }
}

export const ProductSchema = z
  .object({
    id: z.string(), slug: z.string(), sku: z.string(), name: z.string(),
    cat: z.string().nullable(), brand: z.string().nullable(),
    price: z.number(), old: z.number().nullable(), discount: z.number(),
    sale: z.boolean(), saleEndsAt: z.string().nullable(),
    rating: z.number().nullable(), reviews: z.number(), stock: z.number(),
    badge: z.string().nullable(), images: z.array(z.string()),
    specs: z.record(z.any()), featured: z.boolean(),
  })
  .openapi('Product')

const SELECT = '*, categories!inner(slug,name_th,name_en), brands!inner(name,slug)'
const CatSchema = z.object({ id: z.string(), slug: z.string(), name_th: z.string(), name_en: z.string(), icon: z.string().nullable(), sort: z.number() }).openapi('Category')
const BrandSchema = z.object({ id: z.string(), slug: z.string(), name: z.string(), logo_url: z.string().nullable(), sort: z.number() }).openapi('Brand')
const SlideSchema = z.object({ id: z.string(), placement: z.string(), title: z.string().nullable(), image_url: z.string().nullable(), link: z.string().nullable(), sort: z.number(), is_active: z.boolean() }).openapi('Slide')

export function registerCatalog(app: OpenAPIHono<AppEnv>) {
  // GET /api/catalog/products
  app.openapi(
    createRoute({
      method: 'get', path: '/api/catalog/products', tags: TAG, summary: 'รายการสินค้า (กรอง cat/brand/featured)',
      request: {
        query: z.object({
          cat: z.string().optional(),
          brand: z.string().optional(),
          featured: z.enum(['true', 'false']).optional(),
          limit: z.coerce.number().int().positive().max(100).optional(),
        }),
      },
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), items: z.array(ProductSchema) })), 400: errRes('error') },
    }),
    async (c) => {
      const { cat, brand, featured, limit } = c.req.valid('query')
      const db = anonClient(c.env)
      let q = db.from('products').select(SELECT).eq('is_active', true)
      if (cat) q = q.eq('categories.slug', cat)
      if (brand) q = q.eq('brands.slug', brand)
      if (featured === 'true') q = q.eq('is_featured', true)
      q = q.order('created_at', { ascending: true })
      if (limit) q = q.limit(limit)
      const { data, error } = await q
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, items: (data ?? []).map(mapProduct) })
    }
  )

  // GET /api/catalog/products/{slug}
  app.openapi(
    createRoute({
      method: 'get', path: '/api/catalog/products/{slug}', tags: TAG, summary: 'รายละเอียดสินค้า',
      request: { params: z.object({ slug: z.string() }) },
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), item: ProductSchema })), 404: errRes('ไม่พบสินค้า') },
    }),
    async (c) => {
      const { slug } = c.req.valid('param')
      const db = anonClient(c.env)
      const { data, error } = await db.from('products').select(SELECT).eq('slug', slug).maybeSingle()
      if (error) throw badRequest(error.message)
      if (!data) throw notFound('ไม่พบสินค้า')
      return c.json({ ok: true as const, item: mapProduct(data) })
    }
  )

  // GET /api/catalog/categories
  app.openapi(
    createRoute({
      method: 'get', path: '/api/catalog/categories', tags: TAG, summary: 'หมวดหมู่',
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), items: z.array(CatSchema) })) },
    }),
    async (c) => {
      const db = anonClient(c.env)
      const { data, error } = await db.from('categories').select('*').order('sort', { ascending: true })
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, items: data ?? [] })
    }
  )

  // GET /api/catalog/brands
  app.openapi(
    createRoute({
      method: 'get', path: '/api/catalog/brands', tags: TAG, summary: 'แบรนด์',
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), items: z.array(BrandSchema) })) },
    }),
    async (c) => {
      const db = anonClient(c.env)
      const { data, error } = await db.from('brands').select('*').order('sort', { ascending: true })
      if (error) throw badRequest(error.message)
      return c.json({ ok: true as const, items: data ?? [] })
    }
  )

  // GET /api/catalog/slides
  app.openapi(
    createRoute({
      method: 'get', path: '/api/catalog/slides', tags: TAG, summary: 'สไลด์/แบนเนอร์',
      request: { query: z.object({ placement: z.string().optional() }) },
      responses: { 200: jsonRes('สำเร็จ', z.object({ ok: z.literal(true), items: z.array(SlideSchema) })) },
    }),
    async (c) => {
      const { placement } = c.req.valid('query')
      const db = anonClient(c.env)
      let q = db.from('slides').select('*').eq('is_active', true).order('sort', { ascending: true })
      if (placement) q = q.eq('placement', placement)
      const { data, error } = await q
      if (error) throw badRequest(error.message)
      const seen = new Set<string>()
      const items = (data ?? []).filter((s: any) => {
        const k = `${s.image_url}|${s.title}`
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      return c.json({ ok: true as const, items })
    }
  )
}
