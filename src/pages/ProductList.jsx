import { useSearchParams, Link } from 'react-router-dom'
import { categories, brands } from '../data/mock'
import ProductCard from '../components/ProductCard'
import { Icon } from '../components/Icons'
import { cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'
import { fetchProducts } from '../lib/api'
import { useFetch } from '../lib/useFetch'

const wrap = 'mx-auto max-w-[1200px] px-4'

export default function ProductList() {
  const { t } = useLang()
  const [params] = useSearchParams()
  const cat = params.get('cat')
  const { data, loading } = useFetch(() => fetchProducts({ cat }), [cat])
  const list = data || []
  const title = cat ? t(`cats.${cat}`) : t('list.title')
  const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

  return (
    <div className={`${wrap} py-6`}>
      <nav className="flex flex-wrap gap-1.5 py-3 text-sm text-muted">
        <Link to="/" className="hover:text-brand-600">{t('list.home')}</Link> / <span>{t('list.products')}</span>
        {cat && <> / <span className="text-fg">{title}</span></>}
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[250px_1fr]">
        {/* FILTERS */}
        <aside className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[150px]">
          <h3 className="mb-2 font-bold">{t('list.filters')}</h3>

          <div className="border-b border-line py-4">
            <h4 className="mb-3 text-sm font-semibold">{t('list.category')}</h4>
            <div className="flex flex-col gap-1">
              {categories.map((c) => (
                <Link key={c.slug} to={`/products?cat=${c.slug}`}
                  className={cx('flex items-center gap-2 rounded-md px-1 py-1 text-sm transition-colors hover:text-brand-600',
                    c.slug === cat ? 'font-bold text-brand-600' : 'text-fg')}>
                  <Icon name={c.icon} size={16} /> {t(`cats.${c.slug}`)}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-b border-line py-4">
            <h4 className="mb-3 text-sm font-semibold">{t('list.brand')}</h4>
            {brands.slice(0, 6).map((b) => (
              <label key={b} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-fg">
                <input type="checkbox" className="h-4 w-4 accent-brand-600" /> {b}
              </label>
            ))}
          </div>

          <div className="border-b border-line py-4">
            <h4 className="mb-3 text-sm font-semibold">{t('list.price')}</h4>
            <div className="flex items-center gap-2">
              <input className={input} placeholder={t('list.min')} inputMode="numeric" />
              <span>–</span>
              <input className={input} placeholder={t('list.max')} inputMode="numeric" />
            </div>
          </div>

          <div className="py-4">
            <h4 className="mb-3 text-sm font-semibold">{t('list.rating')}</h4>
            {[5, 4, 3].map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-brand-600" /> <span className="text-amber-500">{'★'.repeat(r)}</span> {t('list.up')}
              </label>
            ))}
          </div>

          <button className="w-full rounded-lg border border-line py-2 text-sm font-semibold transition-colors hover:bg-surface2 cursor-pointer">{t('common.clear')}</button>
        </aside>

        {/* RESULTS */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
              <span className="text-sm text-muted">{loading ? t('common.loading') : t('list.found', { n: list.length })}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted">{t('list.sortBy')}</label>
              <select className="rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:outline-none cursor-pointer">
                <option>{t('list.sortPopular')}</option>
                <option>{t('list.sortPriceAsc')}</option>
                <option>{t('list.sortPriceDesc')}</option>
                <option>{t('list.sortNew')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-line bg-surface2" />)
              : list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          {!loading && list.length === 0 && (
            <div className="rounded-2xl border border-line bg-surface p-12 text-center text-muted">ไม่พบสินค้าในหมวดนี้</div>
          )}
        </section>
      </div>
    </div>
  )
}
