import { supabase, isSupabaseConfigured } from './supabase'

// แปลง row จาก Supabase -> รูปแบบที่คอมโพเนนต์ใช้ (cat = slug ตรงกับ i18n cats.*)
function mapProduct(row) {
  const onSale = row.sale_price && row.sale_price < row.price
  const price = onSale ? row.sale_price : row.price
  const old = onSale ? row.price : row.old_price
  const discount = old && old > price ? Math.round(((old - price) / old) * 100) : 0
  return {
    id: row.slug,
    slug: row.slug,
    sku: 'BM-' + String(row.slug).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
    name: row.name,
    cat: row.categories?.slug,
    brand: row.brands?.name,
    price,
    old,
    discount,
    sale: !!onSale,
    saleEndsAt: row.sale_ends_at,
    rating: row.rating,
    reviews: row.reviews_count,
    stock: row.stock,
    badge: row.badge,
    images: Array.isArray(row.images) ? row.images : [],
    specs: row.specs || {},
    featured: row.is_featured,
  }
}

export async function fetchBrands() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('brands').select('*').order('sort', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchCategories() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('categories').select('*').order('sort', { ascending: true })
  if (error) throw error
  return data || []
}

// สร้างออเดอร์จริง - ดึงราคาจาก DB ใหม่ (กันราคาถูกแก้ฝั่ง client) + RLS บังคับ user_id=ตัวเอง
export async function createOrder({ userId, items, ship }) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured')
  const slugs = items.map((i) => i.slug)
  const { data: prods, error: e1 } = await supabase.from('products').select('id,slug,name,price,sale_price,stock').in('slug', slugs)
  if (e1) throw e1
  const bySlug = Object.fromEntries((prods || []).map((p) => [p.slug, p]))
  const priceOf = (p) => (p.sale_price && p.sale_price < p.price ? p.sale_price : p.price)
  const lines = items.filter((i) => bySlug[i.slug]).map((i) => {
    const p = bySlug[i.slug]
    return { product_id: p.id, name: p.name, price: priceOf(p), qty: i.qty }
  })
  if (!lines.length) throw new Error('ไม่มีสินค้าในตะกร้า')
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const total = subtotal + (subtotal >= 1500 ? 0 : 80)
  const { data: order, error: e2 } = await supabase.from('orders').insert({
    user_id: userId, total, status: 'pending', payment_method: 'promptpay',
    ship_name: ship.name, ship_phone: ship.phone, ship_address: ship.address,
  }).select().single()
  if (e2) throw e2
  const { error: e3 } = await supabase.from('order_items').insert(lines.map((l) => ({ ...l, order_id: order.id })))
  if (e3) throw e3
  return order
}

export async function fetchOrderByCode(code) {
  if (!isSupabaseConfigured || !code) return null
  const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('code', code).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchMyOrders(userId) {
  if (!isSupabaseConfigured || !userId) return []
  const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

const SELECT = '*, categories!inner(slug,name_th,name_en), brands(name,slug)'

export async function fetchProducts({ cat, featured, limit } = {}) {
  if (!isSupabaseConfigured) return []
  let q = supabase.from('products').select(SELECT).eq('is_active', true)
  if (cat) q = q.eq('categories.slug', cat)
  if (featured) q = q.eq('is_featured', true)
  q = q.order('created_at', { ascending: true })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  if (error) throw error
  return (data || []).map(mapProduct)
}

export async function fetchProductBySlug(slug) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.from('products').select(SELECT).eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? mapProduct(data) : null
}

export async function fetchSlides(placement) {
  if (!isSupabaseConfigured) return []
  let q = supabase.from('slides').select('*').eq('is_active', true).order('sort', { ascending: true })
  if (placement) q = q.eq('placement', placement)
  const { data, error } = await q
  if (error) throw error
  // กันสไลด์ซ้ำ (เผื่อ seed ถูกรันหลายรอบ) - ยึดตาม image_url+title
  const seen = new Set()
  return (data || []).filter((s) => {
    const k = `${s.image_url}|${s.title}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
