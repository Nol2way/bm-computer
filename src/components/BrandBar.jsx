import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'
import { fetchBrands, fetchProducts } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { brandLogo } from '../lib/brands'
import { BrandBarSkeleton } from './Skeleton'

// แถบแบรนด์: โลโก้จริง (Clearbit) + แสดงเฉพาะแบรนด์ที่มีสินค้าจริงในร้าน
export default function BrandBar() {
  const { t } = useLang()
  const { data: brands } = useFetch(() => fetchBrands(), [])
  const { data: products } = useFetch(() => fetchProducts({}), [])
  if (!brands || !products) return <BrandBarSkeleton />

  const present = new Set(products.map((p) => p.brand))
  const list = brands.filter((b) => present.has(b.name))
  if (!list.length) return null

  return (
    <section className="mt-10 rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-base font-bold">{t('home.topBrands')}</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {list.map((b) => <BrandChip key={b.id} b={b} />)}
      </div>
    </section>
  )
}

function BrandChip({ b }) {
  const [err, setErr] = useState(false)
  const src = brandLogo(b.slug, b.logo_url)
  return (
    <Link to={`/products?brand=${b.slug}`} title={b.name}
      className="grid h-14 min-w-[120px] flex-1 place-items-center rounded-xl border border-line bg-white px-4 transition hover:border-brand-400 hover:shadow-sm">
      {err || !src
        ? <span className="text-sm font-bold text-zinc-700">{b.name}</span>
        : <img src={src} alt={b.name} loading="lazy" className="max-h-8 max-w-[100px] object-contain" onError={() => setErr(true)} />}
    </Link>
  )
}
