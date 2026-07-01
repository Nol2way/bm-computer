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

// ===================== ADMIN (เขียนได้เฉพาะ role=admin ผ่าน RLS is_admin()) =====================
export async function adminListProducts() {
  const { data, error } = await supabase.from('products')
    .select('*, categories(slug,name_th), brands(slug,name)').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
export async function saveProduct(p) {
  const row = {
    name: p.name, slug: p.slug, category_id: p.category_id || null, brand_id: p.brand_id || null,
    price: Number(p.price) || 0,
    old_price: p.old_price ? Number(p.old_price) : null,
    sale_price: p.sale_price ? Number(p.sale_price) : null,
    stock: Number(p.stock) || 0, badge: p.badge || null,
    images: p.images || [], specs: p.specs || {}, description: p.description || null,
    is_active: p.is_active !== false, is_featured: !!p.is_featured,
  }
  const res = p.id
    ? await supabase.from('products').update(row).eq('id', p.id)
    : await supabase.from('products').insert(row)
  if (res.error) throw res.error
}
export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function adminListSlides() {
  const { data, error } = await supabase.from('slides').select('*').order('placement').order('sort')
  if (error) throw error
  return data || []
}
export async function saveSlide(s) {
  const row = {
    placement: s.placement, title: s.title || null, image_url: s.image_url || null,
    link: s.link || null, sort: Number(s.sort) || 0, is_active: s.is_active !== false,
  }
  const res = s.id
    ? await supabase.from('slides').update(row).eq('id', s.id)
    : await supabase.from('slides').insert(row)
  if (res.error) throw res.error
}
export async function deleteSlide(id) {
  const { error } = await supabase.from('slides').delete().eq('id', id)
  if (error) throw error
}

export async function adminListOrders() {
  const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
export async function updateOrderStatus(id, status) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw error
}

export async function fetchSetting(key) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle()
  if (error) throw error
  return data?.value || null
}
export async function saveSetting(key, value) {
  const { error } = await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' })
  if (error) throw error
}

export async function adminStats() {
  const [pc, oc, rev] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total'),
  ])
  const revenue = (rev.data || []).reduce((s, o) => s + (o.total || 0), 0)
  return { products: pc.count || 0, orders: oc.count || 0, revenue }
}

const SELECT = '*, categories!inner(slug,name_th,name_en), brands!inner(name,slug)'

export async function fetchProducts({ cat, brand, featured, limit } = {}) {
  if (!isSupabaseConfigured) return []
  let q = supabase.from('products').select(SELECT).eq('is_active', true)
  if (cat) q = q.eq('categories.slug', cat)
  if (brand) q = q.eq('brands.slug', brand)
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
