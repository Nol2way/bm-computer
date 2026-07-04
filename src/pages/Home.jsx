import { Link } from 'react-router-dom'
import ProductRow from '../components/ProductRow'
import { Icon } from '../components/Icons'
import HeroCarousel from '../components/HeroCarousel'
import Typewriter from '../components/Typewriter'
import BrandBar from '../components/BrandBar'
import FlashSale from '../components/FlashSale'
import { useLang } from '../i18n/LanguageContext'
import { useCatalog } from '../catalog/CatalogContext'
import { fetchProducts, fetchSlides } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { Skeleton } from '../components/Skeleton'
import { usePageMeta } from '../lib/usePageMeta'

const wrap = 'mx-auto max-w-[1200px] px-4'

function SectionHead({ title, to, icon }) {
  const { t } = useLang()
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
        {icon && <Icon name={icon} className="text-brand-600" />}{title}
      </h2>
      <Link to={to} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
        {t('common.viewAll')} <Icon name="arrowRight" size={16} />
      </Link>
    </div>
  )
}

export default function Home() {
  const { t } = useLang()
  const { categories, loading: catsLoading, catName } = useCatalog()
  const { data, loading } = useFetch(() => fetchProducts({}), [])
  const { data: heroSlides } = useFetch(() => fetchSlides('hero'), [])
  usePageMeta(null, t('home.heroDesc'))
  const list = data || []
  const featured = list.filter((p) => p.featured)
  const newArrivals = [...list].reverse().slice(0, 12)
  const flash = list.filter((p) => p.sale)

  return (
    <div className={`${wrap} py-8`}>
      {/* HERO: สโลแกน (ซ้าย, พิมพ์ทีละตัว) + carousel (ขวา) */}
      <section className="grid items-stretch gap-5 lg:grid-cols-[1fr_1.35fr]">
        <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-brand-800 p-7 text-white sm:p-9">
          <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-600/30 blur-3xl" aria-hidden="true" />
          <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-brand-300">{t('home.heroKicker')}</span>
          <div className="mt-4 text-2xl font-extrabold leading-tight sm:text-3xl">
            <span className="block text-zinc-400">{t('home.heroLeadStatic')}</span>
            <Typewriter phrases={t('home.heroSlogans')} className="block min-h-[2.4em] text-brand-400 sm:min-h-[1.8em]" />
          </div>
          <p className="mt-3 text-sm text-zinc-400">{t('home.heroBrandsNote')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/products" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
              <Icon name="cart" size={16} /> {t('home.shopNow')}
            </Link>
            <Link to="/builder" className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              <Icon name="cpu" size={16} /> {t('home.heroBuild')}
            </Link>
          </div>
        </div>
        <HeroCarousel slides={heroSlides || []} />
      </section>

      {/* CATEGORIES */}
      <section className="mt-12">
        <SectionHead title={t('home.byCategory')} to="/products" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {catsLoading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[84px] rounded-xl" />)
            : categories.map((c) => (
                <Link key={c.slug} to={`/products?cat=${c.slug}`}
                  className="card-hover flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-2 py-4 text-center hover:border-brand-500 hover:shadow-md">
                  <Icon name={c.icon || 'box'} size={26} className="text-brand-600" />
                  <span className="text-xs font-semibold leading-tight">{catName(c.slug)}</span>
                </Link>
              ))}
        </div>
      </section>

      {/* FLASH SALE */}
      <FlashSale items={flash} />

      {/* FEATURED */}
      <section className="mt-12">
        <SectionHead title={t('home.featured')} icon="flame" to="/products" />
        <ProductRow items={featured} loading={loading} />
      </section>

      {/* BRAND BAR */}
      <BrandBar />

      {/* NEW ARRIVALS */}
      <section className="mt-12">
        <SectionHead title={t('home.newArrivals')} to="/products" />
        <ProductRow items={newArrivals} loading={loading} />
      </section>

      {/* TRUST BAR */}
      <section className="mt-12 rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap justify-around gap-6">
          {[['shield', t('home.trust1')], ['truck', t('home.trust2')], ['card', t('home.trust3')], ['wrench', t('home.trust4')]].map(([ic, label]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-600/15"><Icon name={ic} /></span>
              <b className="text-sm">{label}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
