import { Link } from 'react-router-dom'
import { categories, products } from '../data/mock'
import ProductCard from '../components/ProductCard'
import { Icon } from '../components/Icons'
import { useLang } from '../i18n/LanguageContext'

const wrap = 'mx-auto max-w-[1200px] px-4'

function SectionHead({ title, to }) {
  const { t } = useLang()
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      <Link to={to} className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
        {t('common.viewAll')} <Icon name="arrowRight" size={16} />
      </Link>
    </div>
  )
}

export default function Home() {
  const { t } = useLang()
  return (
    <div className={`${wrap} py-8`}>
      {/* HERO */}
      <section className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="relative flex flex-col justify-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-8 text-white sm:p-10">
          <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{t('home.heroTag')}</span>
          <h1 className="max-w-[18ch] text-3xl font-extrabold leading-tight sm:text-4xl">{t('home.heroTitle')}</h1>
          <p className="max-w-[44ch] text-brand-100">{t('home.heroDesc')}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link to="/products" className="rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-zinc-100">{t('home.shopNow')}</Link>
            <Link to="/builder" className="flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
              <Icon name="cpu" size={18} /> {t('nav.builder')}
            </Link>
          </div>
          <span className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-white/10" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex flex-col justify-center gap-1 rounded-2xl border border-line bg-surface p-5">
            <span className="w-fit rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-600/15 dark:text-brand-400">{t('home.promoShipTag')}</span>
            <span className="text-2xl font-bold text-brand-600">{t('home.promoShip')}</span>
            <span className="text-sm text-muted">{t('home.promoShipDesc')}</span>
          </div>
          <div className="flex flex-col justify-center gap-1 rounded-2xl bg-zinc-900 p-5 text-white">
            <span className="text-2xl font-bold text-brand-400">{t('home.promoInstall')}</span>
            <span className="text-sm text-zinc-400">{t('home.promoInstallDesc')}</span>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mt-12">
        <SectionHead title={t('home.byCategory')} to="/products" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <Link key={c.slug} to={`/products?cat=${c.slug}`}
              className="card-hover flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-2 py-4 text-center hover:border-brand-500 hover:shadow-md">
              <Icon name={c.icon} size={26} className="text-brand-600" />
              <span className="text-xs font-semibold leading-tight">{t(`cats.${c.slug}`)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mt-12">
        <SectionHead title={`${t('home.featured')} 🔥`} to="/products" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="mt-12">
        <SectionHead title={t('home.newArrivals')} to="/products" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.slice(4, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
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
