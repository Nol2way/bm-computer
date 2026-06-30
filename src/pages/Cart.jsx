import { Link } from 'react-router-dom'
import { products, fmt } from '../data/mock'
import { Icon } from '../components/Icons'
import { useLang } from '../i18n/LanguageContext'

const wrap = 'mx-auto max-w-[1200px] px-4'
const cart = [
  { p: products[0], qty: 1 },
  { p: products[3], qty: 2 },
  { p: products[4], qty: 1 },
]

export default function Cart() {
  const { t } = useLang()
  const sub = cart.reduce((s, i) => s + i.p.price * i.qty, 0)
  const ship = sub >= 1500 ? 0 : 80
  const total = sub + ship

  return (
    <div className={`${wrap} py-6`}>
      <nav className="flex gap-1.5 py-3 text-sm text-muted"><Link to="/" className="hover:text-brand-600">{t('list.home')}</Link> / <span className="text-fg">{t('cart.title')}</span></nav>
      <h1 className="mb-5 text-2xl font-bold">{t('cart.title')} ({cart.length})</h1>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {cart.map(({ p, qty }) => (
            <div key={p.id} className="grid grid-cols-[80px_1fr] items-center gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-[90px_1fr_auto]">
              <div className="ph aspect-square rounded-lg" />
              <div>
                <Link to={`/product/${p.id}`} className="font-semibold hover:text-brand-600">{p.name}</Link>
                <div className="text-sm text-muted">{t(`cats.${p.cat}`)} · {p.brand}</div>
                <div className="mt-2 flex items-center gap-4">
                  <div className="inline-flex items-center overflow-hidden rounded-lg border border-line">
                    <button className="grid h-9 w-9 place-items-center hover:bg-surface2 cursor-pointer" aria-label="-"><Icon name="minus" size={14} /></button>
                    <span className="nums w-10 text-center text-sm">{qty}</span>
                    <button className="grid h-9 w-9 place-items-center hover:bg-surface2 cursor-pointer" aria-label="+"><Icon name="plus" size={14} /></button>
                  </div>
                  <button className="flex items-center gap-1 text-sm text-brand-600 hover:underline cursor-pointer"><Icon name="trash" size={15} /> {t('cart.remove')}</button>
                </div>
              </div>
              <div className="col-span-2 text-right sm:col-span-1">
                <div className="nums font-bold text-brand-600">฿{fmt(p.price * qty)}</div>
                {p.old && <div className="nums text-xs text-zinc-400 line-through">฿{fmt(p.old * qty)}</div>}
              </div>
            </div>
          ))}
          <Link to="/products" className="w-fit rounded-lg border border-line px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface2">{t('cart.continue')}</Link>
        </div>

        <aside className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[150px]">
          <h3 className="mb-3 font-bold">{t('cart.summary')}</h3>
          <div className="mb-3 flex gap-2">
            <input className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" placeholder={t('cart.coupon')} />
            <button className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-surface2 cursor-pointer">{t('common.apply')}</button>
          </div>
          <Line l={t('cart.subtotal')} v={`฿${fmt(sub)}`} />
          <Line l={t('cart.shipping')} v={ship === 0 ? <b className="text-emerald-600 dark:text-emerald-400">{t('common.free')}</b> : `฿${fmt(ship)}`} />
          <div className="mt-3 flex justify-between border-t border-line pt-4 text-lg font-bold"><span>{t('cart.total')}</span><b className="nums text-brand-600">฿{fmt(total)}</b></div>
          <Link to="/checkout" className="mt-4 block rounded-xl bg-brand-600 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-700">{t('cart.checkout')}</Link>
          <p className="mt-3 text-center text-xs text-muted">{t('cart.secure')}</p>
        </aside>
      </div>
    </div>
  )
}

function Line({ l, v }) {
  return <div className="flex justify-between py-1.5 text-sm text-muted"><span>{l}</span><span className="nums text-fg">{v}</span></div>
}
