import { supabase, isSupabaseConfigured } from './supabase'

// แปลง row จาก Supabase -> รูปแบบที่คอมโพเนนต์ใช้ (cat = slug ตรงกับ i18n cats.*)
function mapProduct(row) {
  const onSale = row.sale_price && row.sale_price < row.price
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    cat: row.categories?.slug,
    brand: row.brands?.name,
    price: onSale ? row.sale_price : row.price,
    old: onSale ? row.price : row.old_price,
    rating: row.rating,
    reviews: row.reviews_count,
    stock: row.stock,
    badge: row.badge,
    images: Array.isArray(row.images) ? row.images : [],
    specs: row.specs || {},
    featured: row.is_featured,
  }
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
  return data || []
}
