import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'
import { fetchBrands } from '../lib/api'
import { useFetch } from '../lib/useFetch'

// แถบโลโก้แบรนด์ (เลื่อนแนวนอนบนมือถือ) - กดเพื่อกรองตามแบรนด์
export default function BrandBar() {
  const { lang } = useLang()
  const { data } = useFetch(() => fetchBrands(), [])
  const brands = data || []
  if (!brands.length) return null

  return (
    <section className="mt-10 rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-base font-bold">{lang === 'th' ? 'แบรนด์ชั้นนำ' : 'Top brands'}</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {brands.map((b) => (
          <Link key={b.id} to={`/products?brand=${b.slug}`} title={b.name}
            className="grid h-14 min-w-[110px] flex-1 place-items-center rounded-xl border border-line bg-white px-3 transition hover:border-brand-400 hover:shadow-sm">
            <img src={b.logo_url} alt={b.name} className="max-h-7 max-w-[90px] object-contain"
              onError={(e) => { e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { className: 'text-sm font-bold text-zinc-700', textContent: b.name })) }} />
          </Link>
        ))}
      </div>
    </section>
  )
}
