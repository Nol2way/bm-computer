import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { products, fmt } from '../data/mock'
import ProductCard from '../components/ProductCard'
import { Icon } from '../components/Icons'
import { badgeMap, badgeLabel, cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'

const wrap = 'mx-auto max-w-[1200px] px-4'

export default function ProductDetail() {
  const { id } = useParams()
  const { lang, t } = useLang()
  const p = products.find((x) => x.id === id) || products[0]
  const [tab, setTab] = useState('spec')
  const [qty, setQty] = useState(1)
  const related = products.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4)
  const b = p.badge ? badgeMap[p.badge] : null

  return (
    <div className={`${wrap} py-6`}>
      <nav className="flex flex-wrap gap-1.5 py-3 text-sm text-muted">
        <Link to="/" className="hover:text-brand-600">{t('list.home')}</Link> /
        <Link to={`/products?cat=${p.cat}`} className="hover:text-brand-600">{t(`cats.${p.cat}`)}</Link> /
        <span className="text-fg">{p.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* GALLERY */}
        <div>
          <div className="ph grid aspect-square place-items-center rounded-2xl text-sm font-semibold">🖼</div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="ph aspect-square rounded-lg" />)}
          </div>
        </div>

        {/* INFO */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface2 px-2.5 py-1 text-xs font-semibold">{p.brand}</span>
            {b && <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold', b.cls)}>{badgeLabel[lang][p.badge]}</span>}
            <span className={cx('text-xs font-semibold', p.stock <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
              {p.stock <= 5 ? t('common.lowStock', { n: p.stock }) : t('common.inStock')}
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight">{p.name}</h1>
          <div className="flex items-center gap-2 text-sm"><span className="text-amber-500">★ {p.rating}</span><span className="text-muted">{p.reviews} {t('common.reviews')} · {t('pdp.sold')}</span></div>

          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="nums text-3xl font-extrabold text-brand-600">฿{fmt(p.price)}</span>
            {p.old && <><span className="nums text-lg text-zinc-400 line-through">฿{fmt(p.old)}</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t('common.save')} ฿{fmt(p.old - p.price)}</span></>}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-surface2 px-4 py-3 text-sm">
            <span className="text-muted">{t('pdp.installment')}</span><b className="nums">฿{fmt(Math.round(p.price / 10))}{t('common.perMonth')}</b>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-line">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center hover:bg-surface2 cursor-pointer" aria-label="-"><Icon name="minus" size={16} /></button>
              <span className="nums w-12 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center hover:bg-surface2 cursor-pointer" aria-label="+"><Icon name="plus" size={16} /></button>
            </div>
            <Link to="/cart" className="flex items-center gap-2 rounded-xl border border-line px-5 py-3 font-semibold transition-colors hover:bg-surface2"><Icon name="cart" size={18} /> {t('pdp.addToCart')}</Link>
            <Link to="/checkout" className="flex-1 rounded-xl bg-brand-600 px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-700">{t('common.buyNow')}</Link>
          </div>

          <ul className="mt-1 flex flex-col gap-2 text-sm">
            {[t('pdp.b1'), t('pdp.b2'), t('pdp.b3')].map((x) => (
              <li key={x} className="flex items-center gap-2"><Icon name="check" size={16} className="text-emerald-500" /> {x}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* TABS */}
      <section className="mt-12">
        <div className="mb-5 flex gap-1 border-b border-line">
          {[['spec', t('pdp.specs')], ['desc', t('pdp.desc')], ['review', `${t('pdp.reviewsTab')} (${p.reviews})`]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={cx('cursor-pointer border-b-2 px-4 py-3 font-semibold transition-colors',
                tab === k ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-fg')}>{label}</button>
          ))}
        </div>

        {tab === 'spec' && (
          <table className="w-full border-collapse overflow-hidden rounded-xl">
            <tbody>
              {Object.entries(p.specs).map(([k, v]) => (
                <tr key={k} className="border-b border-line">
                  <th className="w-2/5 bg-surface2 p-3 text-left text-sm font-semibold text-muted align-top">{k}</th>
                  <td className="p-3 text-sm">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'desc' && <p className="max-w-[70ch] text-muted">{p.name} — {t('pdp.descBody')}</p>}
        {tab === 'review' && (
          <div>
            {[['สมชาย ก.', 5, 'ของแท้ ส่งไว แพ็คดีมากครับ ใช้งานลื่นไหล'], ['Nattapong', 4, 'คุ้มค่า ราคาดี แต่กล่องบุบนิดหน่อย']].map(([n, r, c]) => (
              <div key={n} className="grid grid-cols-[44px_1fr] gap-3 border-b border-line py-4">
                <div className="ph aspect-square rounded-full" />
                <div><b>{n}</b> <span className="text-amber-500">{'★'.repeat(r)}</span><p className="mt-1 text-sm text-muted">{c}</p></div>
              </div>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold sm:text-2xl">{t('pdp.related')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  )
}
